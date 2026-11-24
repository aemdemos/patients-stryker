/*
 * The review's summary: every page's state (threads.js pageState) in one file of the space
 * (Files <space>/summary/overview.json), so the overview reads one file instead of every entry
 * (State has no queries: one call per key, ~35 ms each, a review has thousands of entries).
 * - Saves keep it current: organisation changes (batch, group, representative) are set on the
 *   page's summary directly; other changes have their page computed again from its entries.
 * - Built from every entry when missing, after admin operations that change entries (they drop
 *   it), on request (the status page's Refresh), and every 15 minutes by the capture's schedule
 *   (a safety net for anything missed).
 * - Every page's summary carries the time it was computed (_at); writers merge by keeping the
 *   newer one per page, so a save and a rebuild at the same time don't undo each other.
 * { built, pages: { <page>: { page, state, …, _at } } }
 */
import { readAll } from './core.mjs';
import { pageRows } from './dbstate.mjs';
import { pageState, pageStates } from './states.mjs';
import { ORG_KINDS } from '../../threads.js';

const pre = (space) => (!space || space === 'std' ? '' : `${space}/`);
export const summaryFile = (space) => `${pre(space)}summary/overview.json`;
// older than this: built again before it is used (the schedule builds it every 15 minutes)
const MAX_AGE = 2 * 3600 * 1000;

export async function readSummary(files, space) {
  try {
    const s = JSON.parse((await files.read(summaryFile(space))).toString());
    return s && s.pages ? s : null;
  } catch (e) {
    return null;
  }
}

/** writes pages into the summary, keeping per page the newer of the file's and these */
async function merge(files, space, pages, built) {
  const now = await readSummary(files, space);
  const out = { built: built || now?.built || new Date().toISOString(), pages: { ...(now?.pages || {}) } };
  Object.entries(pages).forEach(([page, s]) => {
    const had = out.pages[page];
    if (s === null) delete out.pages[page];
    else if (!had || (had._at || 0) <= s._at) out.pages[page] = s;
  });
  await files.write(summaryFile(space), JSON.stringify(out));
  return out;
}

/** the summary from every entry of the space */
export async function rebuildSummary({ state, files }, space) {
  const started = Date.now();
  const rows = (await readAll(state, space)).filter((r) => r.page !== '*');
  const pages = Object.fromEntries(pageStates(rows).map((s) => [s.page, { ...s, _at: started }]));
  // (pages with no entries any more: out, unless a save changed them while this ran)
  const now = await readSummary(files, space);
  Object.keys(now?.pages || {}).forEach((p) => {
    if (!pages[p] && (now.pages[p]._at || 0) < started) pages[p] = null;
  });
  return merge(files, space, pages, new Date(started).toISOString());
}

/** the summary to answer with: built when missing, too old, or asked for */
export async function summaryFor(stores, space, { rebuild = false } = {}) {
  const s = rebuild ? null : await readSummary(stores.files, space);
  if (s && Date.now() - Date.parse(s.built) < MAX_AGE) return s;
  return rebuildSummary(stores, space);
}

/** after admin operations that change entries: built again on its next use */
export const dropSummary = (files, space) => files.delete(summaryFile(space)).catch(() => null);

const json = (v) => {
  try {
    return JSON.parse(v);
  } catch (e) {
    return null;
  }
};

/**
 * after a save: the saved changes ({ page, kind, value }) into the summary. Organisation on the
 * page's summary directly; any other change: its page computed again from its entries.
 */
export async function updateSummary({ state, files }, space, changes) {
  const current = await readSummary(files, space);
  // (no summary yet: the next overview builds it, with these changes)
  if (!current) return;
  const at = Date.now();
  const pages = {};
  const recompute = new Set();
  changes.forEach((c) => {
    if (c.page === '*') return;
    if (!ORG_KINDS.includes(c.kind)) {
      recompute.add(c.page);
      return;
    }
    const s = pages[c.page] || { ...(current.pages[c.page] || { page: c.page, ...pageState([]) }) };
    const v = json(c.value);
    if (c.kind === 'batch') s.batch = Number.isInteger(v) ? v : null;
    if (c.kind === 'group') {
      s.group = Number.isInteger(v) ? v : null;
      if (!s.group) s.representative = false;
    }
    if (c.kind === 'representative') s.representative = v === true && Number.isInteger(s.group);
    s._at = at;
    pages[c.page] = s;
  });
  // the other changes' pages, from their own entries (a few at a time)
  const list = [...recompute];
  for (let i = 0; i < list.length; i += 10) {
    const part = list.slice(i, i + 10);
    // (the store allows a limited number of parallel requests)
    const got = await Promise.all(part.map(async (page) => {
      const rows = await pageRows(state.client, space, page);
      return [page, rows.length ? { page, ...pageState(rows), _at: at } : null];
    }));
    got.forEach(([page, s]) => { pages[page] = s; });
  }
  if (Object.keys(pages).length) await merge(files, space, pages);
}
