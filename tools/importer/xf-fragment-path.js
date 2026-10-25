/*
 * stryker.com Experience Fragment → EDS fragment document path.
 *
 * Shared XFs are listed in xf-fragment-map.js, keyed by the XF path exactly as in the
 * customer's "Experience Fragment References" export, with a short EDS path
 * (e.g. …/acute-care/en/business_unit/footer-links/master → /fragments/acute-care/resources).
 * Every importer (any template) resolves XF references through this lookup, so a page that
 * uses a shared XF always points to the same fragment document. An XF that is not in the
 * map is not shared: the importer imports its content inline (and can report it, so the map
 * can be extended when the site-wide export arrives). See #443.
 */
import MAP from './xf-fragment-map.js';

/**
 * Normalises an XF reference to the export's form: path only, no .html, query or hash.
 * @param {string} xf XF path or URL
 * @returns {string} XF path
 */
export function xfKey(xf) {
  return String(xf || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/\.html$/i, '');
}

/**
 * @param {string} xf XF path or URL (with or without .html)
 * @returns {string|null} EDS fragment path, or null when the XF is not a shared fragment
 */
export default function xfFragmentPath(xf) {
  const entry = MAP[xfKey(xf)];
  return entry ? entry.path : null;
}
