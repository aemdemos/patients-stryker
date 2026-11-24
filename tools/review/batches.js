/*
 * Review tool: how the AOE team organises the pages, and the page filters shared by the status
 * page and the tool.
 * - Review batches: numbered, one per page; the AOE team works through them one by one.
 * - Groups: the pages of exactly the same structure, numbered, one per page; each group has one
 *   representative page, the only one the customer reviews to approve the whole group.
 * Everyone filters by batch, group, representatives only and area. Organisation data in the
 * review backend (kinds batch, group, representative on the page item, the AOE team's,
 * threads.js ORG_KINDS): no review activity. The chosen filters are kept in the browser, the same
 * for the status page and the tool.
 */
import { call } from './store.js';
import { storageKey } from './config.js';

const FILTER_KEY = storageKey('filters');
// (an organising save takes at most this many changes: backend MAX_ORG_CHANGES)
const CHUNK = 3000;

/**
 * A group without a chosen representative has its first page (path order) as representative
 * (representativeAuto, ☆; the user's rule: the representative is only a suggestion). items:
 * [{ path, group, representative }], marked in place; only these pages count (the pages shown).
 */
export function markFirstRepresentatives(items) {
  const groups = new Map();
  items.filter((i) => i.group).forEach((i) => {
    if (!groups.has(i.group)) groups.set(i.group, []);
    groups.get(i.group).push(i);
  });
  groups.forEach((members) => {
    members.forEach((m) => Object.assign(m, { representativeAuto: false }));
    if (members.some((m) => m.representative)) return;
    const first = [...members].sort((a, b) => (a.path < b.path ? -1 : 1))[0];
    Object.assign(first, { representativeAuto: true });
  });
  return items;
}

/**
 * every page's organisation (path → { batch, group, representative, representativeAuto,
 * groupApproved }), from the overview; paths: the pages shown (the first page of a group is
 * looked for among them)
 */
export async function loadOrganisation(paths = null) {
  const { status, body } = await call('overview');
  if (status !== 200) return { org: new Map(), body, status };
  const shown = paths ? new Set(paths) : null;
  const items = (body.pages || []).filter((p) => p.batch || p.group).map((p) => ({
    path: p.page,
    batch: p.batch || null,
    group: p.group || null,
    representative: !!p.representative,
    groupApproved: p.groupApproved || null,
  }));
  markFirstRepresentatives(items.filter((i) => !shown || shown.has(i.path)));
  return {
    org: new Map(items.map((i) => [i.path, i])),
    body,
    status,
  };
}

/** the area of a page: its first part after /us/en (About, Emergency care, …) */
export const areaOf = (path) => path.split('/')[3] || '';
export const areaLabel = (area) => {
  const words = area.replace(/-/g, ' ');
  return words ? words[0].toUpperCase() + words.slice(1) : '(home)';
};

/**
 * The chosen filters: batches (numbers, and 'none' for pages in no batch; empty = all), a group
 * (a number, 'none' or '' = all), representatives only, an area ('' = all).
 */
export function getFilters() {
  let f = {};
  try {
    f = JSON.parse(window.localStorage.getItem(FILTER_KEY)) || {};
  } catch (e) {
    f = {};
  }
  return {
    batches: Array.isArray(f.batches) ? f.batches : [],
    group: Number.isInteger(f.group) || f.group === 'none' ? f.group : '',
    reps: f.reps === true,
    area: typeof f.area === 'string' ? f.area : '',
  };
}
export function setFilters(filters) {
  window.localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
}

/** does a page pass the filters (its organisation from loadOrganisation, or undefined) */
export function passes(path, info, filters = getFilters()) {
  const o = info || {};
  if (filters.area && areaOf(path) !== filters.area) return false;
  if (filters.batches.length && !filters.batches.includes(o.batch || 'none')) return false;
  if (filters.group !== '' && (o.group || 'none') !== filters.group) return false;
  if (filters.reps && !o.representative && !o.representativeAuto) return false;
  return true;
}

/**
 * a page's organisation as a label: "Batch 2 · Group 5 ★" (★ = the group's chosen
 * representative, ☆ = its first page, the representative while none is chosen)
 */
export const orgLabel = (o) => {
  let mark = '';
  if (o?.representative) mark = ' ★';
  else if (o?.representativeAuto) mark = ' ☆';
  return [
    o?.batch ? `Batch ${o.batch}` : '',
    o?.group ? `Group ${o.group}${mark}` : '',
  ].filter(Boolean).join(' · ');
};

/** a segment as the importer names it (lowercase, other characters one '-', none at the ends) */
const clean = (seg) => seg.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Pasted lines (client URLs https://www.stryker.com/us/en/….html, this site's URLs or paths) →
 * the pages they name: { found: [path], missing: [line] }; never guessed. bySource: the scope
 * table's pairs (source path → EDS path), used first (renamed pages too).
 */
export function pagesOf(text, paths, bySource = new Map()) {
  const known = new Set(paths);
  const found = [];
  const missing = [];
  text.split(/[\s,]+/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
    let path = line;
    try {
      path = new URL(line, 'https://www.stryker.com').pathname;
    } catch (e) {
      path = line;
    }
    const paired = bySource.get(path);
    if (paired && known.has(paired)) {
      if (!found.includes(paired)) found.push(paired);
      return;
    }
    path = path.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    const eds = `/${path.split('/').filter(Boolean).map(clean).join('/')}`;
    const hit = [eds, `${eds}/`].find((p) => known.has(p));
    if (hit) {
      if (!found.includes(hit)) found.push(hit);
    } else missing.push(line);
  });
  return { found, missing };
}

/** organisation changes ({ page, kind, value }) saved in chunks; the AOE team only */
async function saveOrg(changes) {
  const failed = [];
  const okPages = new Set();
  const chunks = [];
  for (let i = 0; i < changes.length; i += CHUNK) chunks.push(changes.slice(i, i + CHUNK));
  // one save per chunk (many pages in one request), one chunk after the other
  await chunks.reduce((chain, part) => chain.then(async () => {
    const { status, body } = await call('save', {
      method: 'POST',
      body: JSON.stringify({
        page: part[0].page,
        changes: part.map((c) => ({
          page: c.page, item: 'page', kind: c.kind, value: JSON.stringify(c.value), rev: 0,
        })),
      }),
    });
    if (status === 200) {
      body.results.forEach((r) => {
        if (r.ok) okPages.add(r.page);
        else failed.push(r.page);
      });
    } else failed.push(...part.map((c) => `${c.page} (${body?.error?.message || status})`));
  }), Promise.resolve());
  return { done: okPages.size, failed: [...new Set(failed)] };
}

/**
 * pages → a batch or a group (kind, a number, or null to take them out); a page moved to another
 * group (or out of it) is no representative any more
 */
export async function markOrg(pages, kind, value) {
  const changes = pages.map((page) => ({ page, kind, value }));
  if (kind === 'group') changes.push(...pages.map((page) => ({ page, kind: 'representative', value: false })));
  return saveOrg(changes);
}
export const markBatch = (pages, batch) => markOrg(pages, 'batch', batch);

/** pages → no longer their group's chosen representative (its first page stands in) */
export const clearRepresentatives = (pages) => saveOrg(pages.map((page) => ({ page, kind: 'representative', value: false })));

/**
 * pages → the representatives of their groups (one per group: the group's earlier one is one no
 * more). Pages in no group, or two pages of one group, are refused: { done, failed, refused }.
 */
export async function makeRepresentatives(pages, org) {
  const refused = [];
  const byGroup = new Map();
  pages.forEach((page) => {
    const group = org.get(page)?.group;
    if (!group) refused.push(`${page} (in no group)`);
    else if (byGroup.has(group)) refused.push(`${page} (group ${group} has ${byGroup.get(group)} already in this list)`);
    else byGroup.set(group, page);
  });
  const changes = [];
  byGroup.forEach((page, group) => {
    [...org].filter(([p, o]) => o.group === group && o.representative && p !== page)
      .forEach(([p]) => changes.push({ page: p, kind: 'representative', value: false }));
    changes.push({ page, kind: 'representative', value: true });
  });
  const { failed } = changes.length ? await saveOrg(changes) : { failed: [] };
  const chosen = [...byGroup.values()];
  return { done: chosen.length - failed.filter((f) => chosen.includes(f)).length, failed, refused };
}
