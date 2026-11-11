/*
 * Bulk metadata for pages the backend serves without it: 404.html gets no rows from
 * /metadata.json, so its header, footer, logo link and `site` would fall back to the
 * defaults. This applies the sheet's rules to the requested path, as the backend does
 * for real pages: rows in sheet order, later rows win, empty cells are skipped.
 */

function toRegExp(pattern) {
  const source = pattern
    .split(/(\*\*|\*)/)
    .map((part) => {
      if (part === '**') return '.*';
      if (part === '*') return '[^/]*';
      return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${source}$`);
}

/**
 * Adds a <meta> per allowed bulk metadata value that applies to the path and isn't set yet.
 * Only the listed keys are copied, so a page doesn't pick up e.g. a `template` or `theme`
 * meant for the real pages under the same path.
 * @param {string[]} keys The metadata names to apply (lowercase sheet column names)
 * @param {string} [path] The path to match, defaults to the current page
 */
export default async function applyBulkMetadata(keys, path = window.location.pathname) {
  let rows;
  try {
    const resp = await fetch('/metadata.json');
    if (!resp.ok) return;
    ({ data: rows = [] } = await resp.json());
  } catch {
    return;
  }

  const values = {};
  rows.forEach((row) => {
    const entries = Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]);
    const pattern = entries.find(([key]) => key === 'url')?.[1];
    if (!pattern || !toRegExp(pattern).test(path)) return;
    entries
      .filter(([key, value]) => value && keys.includes(key))
      .forEach(([key, value]) => { values[key] = value; });
  });

  Object.entries(values).forEach(([name, content]) => {
    const attr = name.includes(':') ? 'property' : 'name';
    if (document.head.querySelector(`meta[${attr}="${CSS.escape(name)}"]`)) return;
    const meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    meta.content = content;
    document.head.append(meta);
  });
}
