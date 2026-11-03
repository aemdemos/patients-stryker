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

/**
 * An XF the export has no published copy of (unpublished, or a redirect page) that a page
 * still renders: its fragment document is built from that page's rendering (import-xf-
 * fragments.js, URL <page>.html?xf=<XF path>), at the path of the XF rule (approved
 * 2026-11-01: every XF a page shows becomes its fragment).
 * @param {string} xf XF path or URL
 * @returns {string|null} EDS fragment path, or null (published, or not an XF)
 */
export function hostedFragmentPath(xf) {
  const status = xfStatus(xf);
  return status === 'unpublished' || status === 'redirect' ? xfToFragmentPath(xfKey(xf)) : null;
}

const resolve = (xf) => {
  const published = xfFragmentPath(xf);
  const hosted = published ? null : hostedFragmentPath(xf);
  return {
    xf, eds: published || hosted, status: xfStatus(xf), hosted: !!hosted,
  };
};

/**
 * A page's XF references in authored order.
 * @param {string} page source page path or URL (/us/en/smart-care or …/smart-care.html)
 * @returns {object[]} fragment refs { kind: 'fragment', xf, eds, status, hosted, text, area,
 *   type } and slide refs { kind: 'slide', desktop: { xf, eds, status, hosted }, mobile: {…},
 *   area, type }; eds is null for references that cannot be imported (not an XF); hosted: the
 *   fragment comes from the page's rendering
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
