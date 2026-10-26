/*
 * stryker.com Experience Fragment → EDS fragment document path.
 *
 * The EDS path keeps the XF's own path, so a fragment can always be traced back to its XF:
 * /content/experience-fragments/<path>.html → /us/en/fragments/<path>, each folder / name
 * written the way aem.live serves it (lowercase, "_" and other characters → "-", no
 * leading / trailing "-"). e.g.
 * /content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master.html
 *   → /us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master
 *
 * Shared XFs are listed in xf-fragment-map.js. Every importer (any template) resolves XF
 * references through xfFragmentPath, so a page that uses a shared XF always points to the
 * same fragment document. An XF that is not in the map is not shared: the importer imports
 * its content inline (and can report it, so the map can be extended when the site-wide
 * export arrives). See #443.
 */
import MAP from './xf-fragment-map.js';

const XF_ROOT = '/content/experience-fragments/';
const FRAGMENTS_ROOT = '/us/en/fragments/';

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
 * The fragment document path for any XF (the rule above), shared or not.
 * @param {string} xf XF path or URL (with or without .html)
 * @returns {string|null} EDS fragment path, or null when it is not an XF path
 */
export function xfToFragmentPath(xf) {
  const key = xfKey(xf);
  if (!key.startsWith(XF_ROOT)) return null;
  const segments = key.slice(XF_ROOT.length).split('/')
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean);
  return segments.length ? `${FRAGMENTS_ROOT}${segments.join('/')}` : null;
}

/**
 * @param {string} xf XF path or URL (with or without .html)
 * @returns {string|null} EDS fragment path, or null when the XF is not a shared fragment
 */
export default function xfFragmentPath(xf) {
  return MAP[xfKey(xf)] ? xfToFragmentPath(xf) : null;
}
