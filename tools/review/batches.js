/*
 * Review tool: review batches and the page filters shared by the status page and the tool.
 * The AOE team splits the pages into numbered batches (one per page) and works through them one
 * by one; everyone filters by batch and by area. A batch is organisation data in the review
 * backend (kind `batch` on the page item, the AOE team's, threads.js ORG_KINDS): it is no review
 * activity. The chosen filters are kept in the browser, the same for the status page and the
 * tool.
 */
import { call } from './store.js';
import { storageKey } from './config.js';

const FILTER_KEY = storageKey('filters');
// (a save takes at most this many changes: backend MAX_CHANGES)
const CHUNK = 100;

/** every page's batch (path → number), from the backend's overview */
export async function loadBatches() {
  const { status, body } = await call('overview');
  if (status !== 200) return { batches: new Map(), body, status };
  return {
    batches: new Map((body.pages || []).filter((p) => p.batch).map((p) => [p.page, p.batch])),
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
 * The chosen filters: batches (numbers, and 'none' for pages in no batch; empty = all) and an
 * area ('' = all).
 */
export function getFilters() {
  try {
    const f = JSON.parse(window.localStorage.getItem(FILTER_KEY)) || {};
    return { batches: Array.isArray(f.batches) ? f.batches : [], area: typeof f.area === 'string' ? f.area : '' };
  } catch (e) {
    return { batches: [], area: '' };
  }
}
export function setFilters(filters) {
  window.localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
}

/** does a page pass the filters (its batch from loadBatches) */
export function passes(path, batch, filters = getFilters()) {
  if (filters.area && areaOf(path) !== filters.area) return false;
  if (!filters.batches.length) return true;
  return filters.batches.includes(batch || 'none');
}

/** a segment as the importer names it (lowercase, other characters one '-', none at the ends) */
const clean = (seg) => seg.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Pasted lines (client URLs https://www.stryker.com/us/en/….html, this site's URLs or paths) →
 * the pages they name: { found: [path], missing: [line] }; never guessed.
 */
export function pagesOf(text, paths) {
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
    path = path.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    const eds = `/${path.split('/').filter(Boolean).map(clean).join('/')}`;
    const hit = [eds, `${eds}/`].find((p) => known.has(p));
    if (hit) {
      if (!found.includes(hit)) found.push(hit);
    } else missing.push(line);
  });
  return { found, missing };
}

/** pages → batch (a number, or null to take them out of their batch); the AOE team only */
export async function markBatch(pages, batch) {
  let done = 0;
  const failed = [];
  const chunks = [];
  for (let i = 0; i < pages.length; i += CHUNK) chunks.push(pages.slice(i, i + CHUNK));
  // one save per chunk (the batches of many pages in one request), one chunk after the other
  await chunks.reduce((chain, part) => chain.then(async () => {
    const { status, body } = await call('save', {
      method: 'POST',
      body: JSON.stringify({
        page: part[0],
        changes: part.map((page) => ({
          page, item: 'page', kind: 'batch', value: JSON.stringify(batch), rev: 0,
        })),
      }),
    });
    if (status === 200) {
      body.results.forEach((r) => {
        if (r.ok) done += 1;
        else failed.push(r.page);
      });
    } else failed.push(...part.map((p) => `${p} (${body?.error?.message || status})`));
  }), Promise.resolve());
  return { done, failed };
}
