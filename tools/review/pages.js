/*
 * Review tool: the pages of this review (config.js), for the tool, the status page and the
 * results, in path order.
 * - With a migration scope (pages.scope, the client review): from the backend's `pages` action:
 *   the scope table (DA) with each page's source, template and whether it is published (the live
 *   query index). Reviewers get the published pages; the AOE team gets every page of the scope
 *   (published: false for the others) and the scope's facts (scopeFacts: pages published but
 *   not in the table, rows to correct, pages waiting for their first shot, the capture's runs).
 * - Else (or without the backend): the site's query index; else pages.json.
 * Kept in the browser (25 Nov 2026): the scope's list from the last visit is used at once (up to a
 * day old, per invitation and backend) while the backend is asked again; the answer is kept for
 * the next time. { fresh: true } (the status page's Refresh) waits for the backend, which reads
 * the scope and the live index again.
 */
import { REVIEW } from './config.js';
import { call, inviteToken, CONFIG } from './store.js';

let facts = null;
/** the AOE team's facts about the scope from the last load (null for reviewers / no scope) */
export const scopeFacts = () => facts;

/** the table's rows as the backend's copy keeps them (backend lib/scope.mjs scopeRows) */
const scopeRows = (data) => (Array.isArray(data) ? data : []).map((r) => ({
  source: String(r?.source || '').trim(), eds: String(r?.eds || '').trim(), template: String(r?.template || '').trim(),
})).filter((r) => r.source || r.eds);

/**
 * The AOE team (27 Nov 2026): the scope table behind the site login, which the backend can't
 * read; this browser can (the site login comes with it), reads it and hands it to the backend
 * when the backend's copy differs → { at, rows } handed over, { same: true }, or null (not read)
 */
export async function handOverScope() {
  const copy = facts?.scopeCopy;
  if (!copy || !REVIEW.pages.scopeTable) return null;
  try {
    const resp = await fetch(`${REVIEW.pages.scopeTable}?limit=20000`, { cache: 'no-store' });
    if (!resp.ok) return null;
    const rows = scopeRows((await resp.json()).data);
    if (!rows.length) return null;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(rows)));
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hash === copy.hash) return { same: true };
    const { status, body } = await call('pages', { method: 'POST', body: JSON.stringify({ op: 'scope-copy', data: rows }) });
    return status === 200 ? body : null;
  } catch (e) {
    return null;
  }
}

async function fromIndex() {
  const resp = await fetch(`${REVIEW.pages.index}?limit=5000`);
  if (!resp.ok) return [];
  const { data = [] } = await resp.json();
  return data.filter((r) => r.path && !r.path.includes('/fragments/'))
    .map((r) => ({
      path: r.path,
      title: r.title || r.path,
      // (the business unit: the path's first part after /us/en; the index has no template)
      unit: r.path.split('/')[3] || '',
      published: true,
    }))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}

const KEPT = 'review-data-v1';
const KEPT_FOR = 24 * 3600 * 1000;
/** where this invitation's list is kept (a hash: no token in the cache's names) */
async function keptKey() {
  const raw = new TextEncoder().encode(`${CONFIG.backend}|${inviteToken() || ''}`);
  const hash = [...new Uint8Array(await window.crypto.subtle.digest('SHA-256', raw))].slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return new URL(`./__kept/pages-${hash}`, window.location.href).href;
}

/** the backend's answer: the one kept from the last visit at once (and asked again), else asked */
async function scopeAnswer(fresh) {
  const key = window.caches ? await keptKey().catch(() => null) : null;
  const cache = key ? await window.caches.open(KEPT).catch(() => null) : null;
  const asking = call(fresh ? 'pages?fresh=1' : 'pages').then(async ({ status, body }) => {
    if (status !== 200 || !body) return null;
    if (!body.none) {
      const kept = new Response(JSON.stringify({ at: Date.now(), body }), { headers: { 'content-type': 'application/json' } });
      await cache?.put(key, kept).catch(() => null);
    }
    return body;
  }).catch(() => null);
  if (!fresh && cache) {
    const kept = await cache.match(key).then((r) => r && r.json()).catch(() => null);
    if (kept?.body && Date.now() - kept.at < KEPT_FOR) return kept.body;
  }
  return asking;
}

/**
 * the pages ({ all: true }: also the scope's unpublished ones, for the AOE team's admin pages;
 * { fresh: true }: not the kept list)
 */
export default async function loadPages({ all = false, fresh = false } = {}) {
  try {
    if (REVIEW.pages.scope) {
      const body = await scopeAnswer(fresh);
      if (body && !body.none) {
        facts = body.capture ? {
          notInScope: body.notInScope || [],
          problems: body.problems || [],
          capture: body.capture,
          changes: body.changes,
          scopeCopy: body.scopeCopy || null,
        } : null;
        return body.pages.filter((p) => all || p.published);
      }
    }
    if (REVIEW.pages.index) return await fromIndex();
    const resp = await fetch('./pages.json');
    return resp.ok ? (await resp.json()).pages : [];
  } catch (e) {
    return [];
  }
}

/** a page's document in Document Authoring (config edit; a folder's page is its index) */
export const editUrl = (path) => (REVIEW.edit
  ? `${REVIEW.edit}${REVIEW.base.prefix}${path.endsWith('/') ? `${path}index` : path}`
  : '');
