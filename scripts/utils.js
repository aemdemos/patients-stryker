/**
 * Shared utility functions, pulled into scripts/blocks as needed.
 */

import { toClassName, toCamelCase } from './aem.js';

/**
 * Locale folder of the current page (`/<country>/<language>`), where its
 * query-index and placeholders live.
 * @returns {string} e.g. '/gb/en', or '' when the page is not under a locale folder
 */
export function getLocalePrefix() {
  return window.location.pathname.match(/^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/i)?.[0].toLowerCase() || '';
}

/**
 * Loads `{prefix}/placeholders.json` once per prefix, keyed by camelCased `Key`.
 * @param {string} prefix locale folder from getLocalePrefix()
 * @returns {Promise<Object<string,string>>} placeholders, or {} on failure
 */
export function fetchPlaceholders(prefix = '') {
  window.placeholders = window.placeholders || {};
  window.placeholders[prefix] ||= fetch(`${prefix}/placeholders.json`)
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then(({ data = [] }) => Object.fromEntries(data
      .filter((p) => p.Key)
      .map((p) => [toCamelCase(p.Key), p.Text])))
    .catch(() => ({}));
  return window.placeholders[prefix];
}

/**
 * Normalizes a link/href to a query-index path (no host, `.html` or trailing slash).
 * @param {string} href absolute or relative URL
 * @returns {string} path
 */
export const toIndexPath = (href) => new URL(href, window.location.href).pathname
  .replace(/\.html$/, '').replace(/\/+$/, '') || '/';

async function fetchIndexRows(url, offset = 0, rows = []) {
  const resp = await fetch(`${url}?offset=${offset}&limit=1000`);
  if (!resp.ok) return rows;
  const { data = [], total = 0 } = await resp.json();
  rows.push(...data);
  const next = offset + data.length;
  return data.length && next < total ? fetchIndexRows(url, next, rows) : rows;
}

const indexCache = {};
/**
 * Loads every page of `{prefix}/query-index.json` once per prefix.
 * @param {string} prefix locale folder from getLocalePrefix()
 * @returns {Promise<Map<string,Object>>} rows keyed by toIndexPath(path), empty on failure
 */
export function fetchQueryIndex(prefix = '') {
  indexCache[prefix] ||= fetchIndexRows(`${prefix}/query-index.json`)
    .then((rows) => new Map(rows
      .filter((r) => r.path)
      .map((r) => [toIndexPath(r.path), r])))
    .catch(() => {
      // allow a later caller to retry
      delete indexCache[prefix];
      return new Map();
    });
  return indexCache[prefix];
}

/**
 * Builds a colour→option-name map from the DA library `background` block-option
 * (its `name=colour` list in /.da/library/blocks.json).
 * @returns {Promise<Object<string,string>|null>} map keyed by lowercased colour, or null
 */
export async function getSectionBackgroundMap() {
  try {
    const resp = await fetch('/.da/library/blocks.json');
    if (!resp.ok) return null;
    const json = await resp.json();
    const option = json.options?.data?.find((o) => o.key === 'background');
    if (!option?.values) return null;
    const map = {};
    option.values.split('|').forEach((entry) => {
      const [name, color] = entry.split('=').map((s) => s.trim());
      if (name && color) map[color.toLowerCase()] = name;
    });
    return map;
  } catch {
    return null;
  }
}

/**
 * Applies section backgrounds authored via the DA `background` block-option.
 * The block-option stores the colour code on the section as data-background;
 * reverse-map it to its option name and add the name as a class so the existing
 * `.section.<name>` rules apply (keeping blocks.json the single source of truth).
 * Falls back to painting an unmapped colour, or adding an option name authored
 * directly. No-op if the sheet/option is unavailable or no section opts in.
 * @param {Element} main The main container element
 */
export async function applySectionBackgrounds(main) {
  const sections = [...main.querySelectorAll('.section[data-background]')];
  if (!sections.length) return;
  const map = await getSectionBackgroundMap();
  sections.forEach((section) => {
    const value = (section.dataset.background || '').trim();
    if (!value) return;
    const name = map?.[value.toLowerCase()];
    if (name) {
      section.classList.add(name);
    } else if (/^(#|rgb|hsl)/i.test(value)) {
      // colour not in blocks.json → paint it directly, keeping the authored form
      const existing = (section.getAttribute('style') || '').trim().replace(/;$/, '');
      section.setAttribute('style', `${existing ? `${existing}; ` : ''}background-color: ${value}`);
    } else {
      // an option name authored directly
      section.classList.add(toClassName(value));
    }
  });
}
