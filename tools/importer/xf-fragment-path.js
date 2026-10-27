/*
 * stryker.com Experience Fragment → EDS fragment document lookup (bundled into the importers).
 *
 * Every published XF becomes its own fragment document at the path derived from its AEM path
 * (rule in xf-path-rule.js), so a fragment can always be traced back to its XF:
 * /content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master.html
 *   → /us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master
 *
 * Data: data/xf-index.js, generated from the AEM exports in .migration/ by
 * `npm run build:migration-index` (see AGENTS.md "Corp source exports").
 */
import { FRAGMENTS, PAGES, SKIPPED } from './data/xf-index.js';
import { xfKey, xfToFragmentPath } from './xf-path-rule.js';

export { xfKey, xfToFragmentPath, cfToFragmentPath } from './xf-path-rule.js';

/**
 * @param {string} xf XF path or URL
 * @returns {'published'|'unpublished'|'redirect'|'not-an-xf'} what the export knows about it
 */
export function xfStatus(xf) {
  const key = xfKey(xf);
  if (FRAGMENTS[key]) return 'published';
  if (SKIPPED[key]) return SKIPPED[key].status;
  return xfToFragmentPath(key) ? 'unpublished' : 'not-an-xf';
}

/**
 * @param {string} xf XF path or URL
 * @returns {object|null} the index entry of a published XF variation
 */
export function xfInfo(xf) {
  return FRAGMENTS[xfKey(xf)] || null;
}

/**
 * @param {string} xf XF path or URL (with or without .html)
 * @returns {string|null} EDS fragment path, or null when the XF cannot be imported
 *   (redirect, not an XF, or not published)
 */
export default function xfFragmentPath(xf) {
  const info = xfInfo(xf);
  return info ? info.eds : null;
}

const resolve = (xf) => ({ xf, eds: xfFragmentPath(xf), status: xfStatus(xf) });

/**
 * A page's XF references in authored order.
 * @param {string} page source page path or URL (/us/en/smart-care or …/smart-care.html)
 * @returns {object[]} fragment refs { kind: 'fragment', xf, eds, status, text, area, type }
 *   and slide refs { kind: 'slide', desktop: { xf, eds, status }, mobile: {…}, area, type };
 *   eds is null for references that cannot be imported
 */
export function pageXfRefs(page) {
  const refs = PAGES[xfKey(page)] || [];
  return refs.map((r) => {
    if (r.kind === 'slide') {
      return {
        ...r,
        desktop: r.desktop ? resolve(r.desktop) : null,
        mobile: r.mobile ? resolve(r.mobile) : null,
      };
    }
    return { ...r, ...resolve(r.xf) };
  });
}
