/**
 * Shared utility functions, pulled into scripts/blocks as needed.
 */

import { toClassName } from './aem.js';

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
