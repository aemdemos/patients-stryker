/*
 * stryker.com AEM path → EDS fragment document path (the rule only, no data).
 *
 * Shared by xf-fragment-path.js (bundled into the importers) and the migration-index
 * helper (Node), so both always derive the same paths.
 *
 * Experience Fragment: /content/experience-fragments/<path>.html → /us/en/fragments/<path>
 *   /content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master.html
 *     → /us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master
 * Content fragment:
 *   /content/dam/stryker/content-fragments/<path> → /us/en/fragments/content-fragments/<path>
 *   /content/dam/stryker/content-fragments/eemea/en/contact-information/russia
 *     → /us/en/fragments/content-fragments/eemea/en/contact-information/russia
 * Each folder / name is written the way aem.live serves it: lowercase, "_" and other
 * characters → "-", no leading / trailing "-".
 */

export const XF_ROOT = '/content/experience-fragments/';
export const CF_ROOT = '/content/dam/stryker/content-fragments/';
export const FRAGMENTS_ROOT = '/us/en/fragments/';

/**
 * Normalises an AEM reference to path form: no origin, .html, query or hash.
 * @param {string} ref AEM path or URL
 * @returns {string} AEM path
 */
export function xfKey(ref) {
  return String(ref || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/\.html$/i, '');
}

function edsSegments(rest) {
  return rest.split('/')
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean);
}

/**
 * The fragment document path for any XF, shared or not.
 * @param {string} xf XF path or URL (with or without .html)
 * @returns {string|null} EDS fragment path, or null when it is not an XF path
 */
export function xfToFragmentPath(xf) {
  const key = xfKey(xf);
  if (!key.startsWith(XF_ROOT)) return null;
  const segments = edsSegments(key.slice(XF_ROOT.length));
  return segments.length ? `${FRAGMENTS_ROOT}${segments.join('/')}` : null;
}

/**
 * The fragment document path for a DAM content fragment.
 * @param {string} cf content fragment path
 * @returns {string|null} EDS fragment path, or null when it is not a content fragment path
 */
export function cfToFragmentPath(cf) {
  const key = xfKey(cf);
  if (!key.startsWith(CF_ROOT)) return null;
  const segments = edsSegments(key.slice(CF_ROOT.length));
  return segments.length ? `${FRAGMENTS_ROOT}content-fragments/${segments.join('/')}` : null;
}
