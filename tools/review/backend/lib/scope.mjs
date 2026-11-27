/*
 * The migration scope (a DA sheet, previewed, read here) and the published pages (the live
 * query index), for the pages action and the capture action. Spaces without a scope (std) have
 * none: their pages come from elsewhere.
 * scope row: { source: https://www.stryker.com/….html, eds: /us/en/…, template }
 */
import crypto from 'crypto';
import { SPACES } from './core.mjs';

/*
 * The backend's copy of the scope table (27 Nov 2026: the site login on the previews answers the
 * backend's read with 401): <space>/scope-copy.json { at, by, hash, data: [{ source, eds,
 * template }] }, written by the admin op scope-copy and by the AOE team's Status page (it reads
 * the table through the site login and hands it over when it differs); used when the table
 * itself can't be read.
 */
const copyFile = (space) => `${space === 'std' ? '' : `${space}/`}scope-copy.json`;
/** the table's rows as the copy keeps them, and their hash (the Status page hashes the same way) */
export function scopeRows(data) {
  return (Array.isArray(data) ? data : []).map((r) => ({
    source: String(r?.source || '').trim(), eds: String(r?.eds || '').trim(), template: String(r?.template || '').trim(),
  })).filter((r) => r.source || r.eds);
}
export const scopeHash = (rows) => crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
export async function readScopeCopy(files, space) {
  try {
    return JSON.parse((await files.read(copyFile(space))).toString());
  } catch (e) {
    return null;
  }
}
/** keeps a copy of the table → { at, rows, hash } (rows: up to 20000) */
export async function writeScopeCopy(files, space, data, by) {
  const rows = scopeRows(data).slice(0, 20000);
  const copy = {
    at: new Date().toISOString(), by, hash: scopeHash(rows), data: rows,
  };
  await files.write(copyFile(space), JSON.stringify(copy));
  return { at: copy.at, rows: rows.length, hash: copy.hash };
}

const clean = (seg) => seg.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** the importer's EDS path of a source URL (renamed pages differ from it: shown, allowed) */
export function edsOf(source) {
  const path = new URL(source).pathname.replace(/\.html$/, '');
  const segs = path.split('/').filter(Boolean).map(clean);
  return segs[segs.length - 1] === 'index' ? `/${segs.slice(0, -1).join('/')}/` : `/${segs.join('/')}`;
}
const SOURCE = /^https:\/\/www\.stryker\.com\/[^?#]+\.html$/;

async function json(url) {
  const resp = await fetch(`${url}?limit=20000`, { headers: { 'cache-control': 'no-cache' } });
  if (!resp.ok) throw new Error(`${url}: ${resp.status}`);
  return resp.json();
}

/**
 * the scope: { rows, problems: [{ kind, eds?, source?, detail }], copy? } (copy: { at } when the
 * table couldn't be read and the backend's copy stood in; with files only)
 */
export async function loadScope(space, files = null) {
  const url = SPACES[space]?.scope;
  if (!url) return { rows: [], problems: [], none: true };
  let data;
  let copy = null;
  try {
    data = (await json(url)).data || [];
  } catch (e) {
    const kept = files ? await readScopeCopy(files, space) : null;
    if (!kept?.data?.length) throw e;
    data = kept.data;
    copy = { at: kept.at, why: String(e.message || e).slice(0, 160) };
  }
  const rows = [];
  const problems = [];
  const byEds = new Map();
  const bySource = new Map();
  data.forEach((r, i) => {
    const source = String(r.source || '').trim();
    const eds = String(r.eds || '').trim();
    const template = String(r.template || '').trim();
    if (!source && !eds) return;
    if (!SOURCE.test(source)) {
      problems.push({
        kind: 'bad-source', row: i + 2, eds, source, detail: 'the source is not a https://www.stryker.com/….html address',
      });
      return;
    }
    if (!eds.startsWith('/')) {
      problems.push({
        kind: 'bad-eds', row: i + 2, eds, source, detail: 'the EDS path does not start with /',
      });
      return;
    }
    if (byEds.has(eds)) {
      problems.push({
        kind: 'eds-twice', row: i + 2, eds, source, detail: `the EDS page is also in row ${byEds.get(eds)}`,
      });
    }
    if (bySource.has(source)) {
      problems.push({
        kind: 'source-twice', row: i + 2, eds, source, detail: `the source is also in row ${bySource.get(source)}`,
      });
    }
    byEds.set(eds, i + 2);
    bySource.set(source, i + 2);
    rows.push({
      source, eds, template, row: i + 2, renamed: edsOf(source) !== eds,
    });
  });
  return { rows, problems, ...(copy ? { copy } : {}) };
}

/** the published pages: Map path → { title, lastModified } (fragments left out) */
export async function loadLive(space) {
  const url = SPACES[space]?.live;
  if (!url) return new Map();
  const data = (await json(url)).data || [];
  return new Map(data.filter((r) => r.path && !r.path.includes('/fragments/'))
    .map((r) => [r.path, { title: r.title || r.path, lastModified: r.lastModified || null }]));
}

/**
 * the scope's pages with what the review needs: { pages: [{ path, source, template, title,
 * published, unit, renamed }], notInScope: [{ path, title }], problems }
 * (a page in two rows is listed once: the first row)
 */
// (kept a minute in a warm container: every page load of every reviewer asks for the list, the
// scope sheet and the live index change rarely; a change shows within a minute)
const KEEP_MS = 60 * 1000;
const kept = new Map();

export async function pageList(space, { fresh = false, files = null } = {}) {
  const k = kept.get(space);
  if (!fresh && k && Date.now() - k.at < KEEP_MS) return k.list;
  const list = buildPageList(space, files);
  kept.set(space, { at: Date.now(), list });
  list.catch(() => kept.delete(space));
  return list;
}

async function buildPageList(space, files) {
  const [{
    rows, problems, none, copy,
  }, live] = await Promise.all([loadScope(space, files), loadLive(space)]);
  const seen = new Set();
  const pages = [];
  rows.forEach((r) => {
    if (seen.has(r.eds)) return;
    seen.add(r.eds);
    const l = live.get(r.eds);
    pages.push({
      path: r.eds,
      source: r.source,
      template: r.template,
      title: l?.title || r.eds,
      published: !!l,
      unit: r.eds.split('/')[3] || '',
      renamed: r.renamed,
    });
  });
  const notInScope = [...live].filter(([p]) => !seen.has(p)).map(([path, l]) => ({ path, title: l.title }));
  return {
    pages: pages.sort((a, b) => (a.path < b.path ? -1 : 1)), notInScope, problems, none: !!none, ...(copy ? { copy } : {}),
  };
}
