/*
 * Standardise pilot: the top-level sections of a document's source text, so a converter can
 * re-serialise only the sections it changed (every other byte stays as it was).
 */

/**
 * @param {string} html a .plain.html document
 * @returns {{parts: {before: string, html: string}[], tail: string}} each section's source and
 *   the text before it; the text after the last one
 */
export default function splitSections(html) {
  const parts = [];
  let depth = 0;
  let start = 0;
  let last = 0;
  [...html.matchAll(/<(\/?)div\b[^>]*>/g)].forEach((m) => {
    if (!m[1]) {
      if (!depth) start = m.index;
      depth += 1;
    } else {
      depth -= 1;
      if (!depth) {
        const end = m.index + m[0].length;
        parts.push({ before: html.slice(last, start), html: html.slice(start, end) });
        last = end;
      }
    }
  });
  return { parts, tail: html.slice(last) };
}
