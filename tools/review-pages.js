/*
 * While the standardisation is reviewed, the new looks (Block options, Text style) render only
 * on review pages: paths under /drafts/, /us/en/drafts/ and /tools/ (body.std-draft, scripts/corp.js). Both
 * authoring panels say so on any other page, so an author doesn't wonder why nothing changes.
 */
export const REVIEW_NOTE = 'These choices show on review pages (/drafts/…) only until the standardisation is approved. On this page they are saved but don’t change the look yet.';

/**
 * The path of the document the panel edits, from the editor's SDK ('' when unknown).
 * @param {object} sdk The DA SDK
 * @returns {string} The path, e.g. /drafts/astha/blocks/columns
 */
export function documentPath(sdk) {
  const ctx = sdk?.context || sdk?.project || {};
  return typeof ctx.path === 'string' ? ctx.path : '';
}

/**
 * Whether the note applies: a known path outside the review pages.
 * @param {string} path The document path
 * @returns {boolean} True when the note should show
 */
export const outsideReview = (path) => !!path && !/^\/(drafts|tools|us\/en\/drafts)\//.test(path);
