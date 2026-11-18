/*
 * The choices the authoring panels (Text style, Block options) offer can be extended in the
 * Block Library workbook (/.da/library/blocks), sheet `options`, next to the section styles.
 * Each row is one group of choices:
 *
 *   key      the group: for the Text style panel colour, font, size or look; for the Block
 *            options panel the group id (e.g. box, title-colour) or a new one
 *   blocks   who offers it: text-style, or the block name (e.g. hero-corp); several with commas
 *   values   the choices in their order, separated by "|"; a label may follow in brackets,
 *            e.g. "blue | box-orange (Orange)"
 *
 * A row replaces the built-in list of its group (so it can also reorder or hide choices); groups
 * without a row keep the built-in list, as do all groups when the sheet can't be read. A new
 * value only adds the choice: what it looks like comes from the site's styles (see the README
 * of each panel).
 */

const SHEET = '/.da/library/blocks.json';
const VALUE = /^([a-z0-9][a-z0-9-]*)\s*(?:\((.+)\))?$/i;

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
    return json.options?.data || [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Every option group the library sheet sets, per owner.
 * @returns {Promise<Map<string, Map<string, Array<[string, string]>>>>} owner (`text-style` or
 *   a block name) → group key → [value, label] pairs (the label is empty when the row gives none)
 */
export async function allLibraryOptions() {
  if (!rows) rows = readSheet();
  const owners = new Map();
  (await rows).forEach((row) => {
    const key = String(row.key || '').trim().toLowerCase();
    const values = String(row.values || '').split('|').map((v) => v.trim()).filter(Boolean)
      .map((v) => v.match(VALUE))
      .filter(Boolean)
      .map(([, value, label]) => [value.toLowerCase(), (label || '').trim()]);
    if (!key || !values.length) return;
    String(row.blocks || '').split(',').map((b) => b.trim().toLowerCase()).filter(Boolean)
      .forEach((owner) => {
        if (!owners.has(owner)) owners.set(owner, new Map());
        owners.get(owner).set(key, values);
      });
  });
  return owners;
}

/**
 * The option groups the library sheet sets for one panel or block.
 * @param {string} owner `text-style` or a block name
 * @returns {Promise<Map<string, Array<[string, string]>>>} group key → [value, label] pairs
 */
export default async function libraryOptions(owner) {
  return (await allLibraryOptions()).get(owner) || new Map();
}
