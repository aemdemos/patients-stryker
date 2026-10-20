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
 * Adds a <meta> per bulk metadata value that applies to the path and isn't already set.
 * @param {string} [path] The path to match, defaults to the current page
 */
export default async function applyBulkMetadata(path = window.location.pathname) {
  let rows;
  try {
    const resp = await fetch('/metadata.json');
    if (!resp.ok) return;
    ({ data: rows = [] } = await resp.json());
  } catch {
    return;
  }

  const values = {};
  rows
    .filter(({ URL: pattern }) => pattern && toRegExp(pattern).test(path))
    .forEach(({ URL: pattern, ...row }) => {
      Object.entries(row).forEach(([key, value]) => {
        if (value) values[key.toLowerCase()] = value;
      });
    });

  Object.entries(values).forEach(([name, content]) => {
    const attr = name.includes(':') ? 'property' : 'name';
    if (document.head.querySelector(`meta[${attr}="${name}"]`)) return;
    const meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    meta.content = content;
    document.head.append(meta);
  });
}
