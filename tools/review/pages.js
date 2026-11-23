/*
 * Review tool: the pages of this review (config.js), for the tool, the status page and the
 * results, in path order.
 * - With a migration scope (pages.scope, the client review): from the backend's `pages` action:
 *   the scope table (DA) with each page's source, template and whether it is published (the live
 *   query index). Reviewers get the published pages; the AOE team gets every page of the scope
 *   (published: false for the others) and the scope's facts (scopeFacts: pages published but
 *   not in the table, rows to correct, pages waiting for their first shot, the capture's runs).
 * - Else (or without the backend): the site's query index; else pages.json.
 */
import { REVIEW } from './config.js';
import { call } from './store.js';

let facts = null;
/** the AOE team's facts about the scope from the last load (null for reviewers / no scope) */
export const scopeFacts = () => facts;

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

/** the pages ({ all: true }: also the scope's unpublished ones, for the AOE team's admin pages) */
export default async function loadPages({ all = false } = {}) {
  try {
    if (REVIEW.pages.scope) {
      const { status, body } = await call('pages');
      if (status === 200 && !body.none) {
        facts = body.capture ? {
          notInScope: body.notInScope || [], problems: body.problems || [], capture: body.capture,
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
