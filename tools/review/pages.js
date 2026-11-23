/*
 * Review tool: the pages of this review (config.js), for the tool, the status page and the
 * results: the site's query index (every published page, read on each visit, so new pages are
 * there at once; fragments left out), in path order; else pages.json (title, business unit,
 * template).
 */
import { REVIEW } from './config.js';

export default async function loadPages() {
  try {
    if (REVIEW.pages.index) {
      const resp = await fetch(`${REVIEW.pages.index}?limit=5000`);
      if (!resp.ok) return [];
      const { data = [] } = await resp.json();
      return data.filter((r) => r.path && !r.path.includes('/fragments/'))
        .map((r) => ({
          path: r.path,
          title: r.title || r.path,
          // (the business unit: the path's first part after /us/en; the index has no template)
          unit: r.path.split('/')[3] || '',
        }))
        .sort((a, b) => (a.path < b.path ? -1 : 1));
    }
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
