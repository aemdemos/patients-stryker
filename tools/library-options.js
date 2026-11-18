/*
 * The choices the authoring panels (Text style, Block options) offer can be extended in the
 * Block Library workbook (/.da/library/blocks), in its own sheet `panel-options` (the `options`
 * sheet stays for the section styles DA offers). One row per group of choices:
 *
 *   panel    text-style, or the block name (e.g. hero-corp); several blocks with commas
 *   group    for text-style: colour, font, size or look; for a block: the group id (e.g. box,
 *            title-colour) or a new one
 *   values   the choices in the order the panel shows them, separated by "|"; each is the marker
 *            word or option name, optionally followed by "=" and its button label:
 *            "blue | gold | light-gray = Light grey". Without a label the panel shows the
 *            name with a capital ("blue" → "Blue").
 *
 * A row replaces the built-in list of its group (so it can also reorder or hide choices); groups
 * without a row keep the built-in list, as do all groups when the sheet can't be read. A new
 * value only adds the choice: what it looks like comes from the site's styles (see the README
 * of each panel).
 */

const SHEET = '/.da/library/blocks.json';
const TAB = 'panel-options';
const NAME = /^[a-z0-9][a-z0-9-]*$/;
const VALUE = /^([a-z0-9][a-z0-9-]*)\s*(?:=\s*(.+))?$/i;

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
    const group = cell(row, 'group').toLowerCase();
    const values = cell(row, 'values').split('|').map((v) => v.trim().match(VALUE)).filter(Boolean)
      .map(([, value, label]) => [value.toLowerCase(), (label || '').trim()])
      .filter(([value], i, list) => list.findIndex(([v]) => v === value) === i);
    if (!NAME.test(group) || !values.length) return;
    cell(row, 'panel').toLowerCase().split(',').map((p) => p.trim())
      .filter((p) => NAME.test(p))
      .forEach((panel) => {
        if (!panels.has(panel)) panels.set(panel, new Map());
        panels.get(panel).set(group, values);
      });
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
