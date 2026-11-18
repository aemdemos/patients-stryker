/*
 * The choices the authoring panels (Text style, Block options) offer can be extended in the
 * Block Library workbook (/.da/library/blocks), in its own sheet `panel-options` (the `options`
 * sheet stays for the section styles DA offers). One row per choice, in the order the panel
 * shows them:
 *
 *   panel    text-style, or the block name (e.g. hero-corp)
 *   group    for text-style: colour, font, size or look; for a block: the group id (e.g. box,
 *            title-colour) or a new one
 *   value    the marker word or option name (e.g. blue, box-gold)
 *   label    what the button says (optional; without it the panel's own label or the value)
 *
 * The rows of a group replace its built-in list (so they can also reorder or hide choices);
 * groups without rows keep the built-in list, as do all groups when the sheet can't be read. A
 * new value only adds the choice: what it looks like comes from the site's styles (see the
 * README of each panel).
 */

const SHEET = '/.da/library/blocks.json';
const TAB = 'panel-options';
const NAME = /^[a-z0-9][a-z0-9-]*$/;

let rows;

/** "box-orange" → "Box orange" (the label of a choice that has none) */
export const labelOf = (value) => {
  const text = value.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

async function readSheet() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const resp = await fetch(SHEET, { signal: controller.signal, cache: 'no-store' });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json[TAB]?.data || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

const cell = (row, name) => String(row[name] || '').trim();

/**
 * Every choice the library sheet sets, per panel and group.
 * @returns {Promise<Map<string, Map<string, Array<[string, string]>>>>} panel (`text-style` or
 *   a block name) → group → [value, label] pairs in sheet order (label empty when not given)
 */
export async function allLibraryOptions() {
  if (!rows) rows = readSheet();
  const panels = new Map();
  (await rows).forEach((row) => {
    const panel = cell(row, 'panel').toLowerCase();
    const group = cell(row, 'group').toLowerCase();
    const value = cell(row, 'value').toLowerCase();
    if (![panel, group, value].every((v) => NAME.test(v))) return;
    if (!panels.has(panel)) panels.set(panel, new Map());
    const groups = panels.get(panel);
    if (!groups.has(group)) groups.set(group, []);
    if (!groups.get(group).some(([v]) => v === value)) groups.get(group).push([value, cell(row, 'label')]);
  });
  return panels;
}

/**
 * The choices the library sheet sets for one panel or block.
 * @param {string} panel `text-style` or a block name
 * @returns {Promise<Map<string, Array<[string, string]>>>} group → [value, label] pairs
 */
export default async function libraryOptions(panel) {
  return (await allLibraryOptions()).get(panel) || new Map();
}
