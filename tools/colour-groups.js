/*
 * The colours the authoring panels offer, grouped once for both panels: Light · Brand · Dark ·
 * Gradients. Box and background colours (Block options: Cell box, Card box, Box colour, Headline
 * box, Card colours, the section's Background; Text style line boxes) are the 17 stryker.com box
 * colours; text colours (Text style colour, Statistics number colour) the 11 text colours. A
 * swatch takes its colour from the site's own styles in the preview page, never from a copy here.
 */

// colour names as the choices carry them (box-…, stat-…, or the Text style word)
export const COLOUR_GROUPS = [
  {
    id: 'light',
    label: 'Light',
    names: ['white', 'gray', 'light-gray', 'pale-gray', 'palegrey', 'mid-gray', 'midgrey'],
  },
  {
    id: 'brand',
    label: 'Brand',
    names: ['gold', 'dark-gold', 'darkgold', 'blue', 'navy', 'purple', 'teal'],
  },
  { id: 'dark', label: 'Dark', names: ['dark', 'grey', 'black'] },
  // every …-gradient
  { id: 'gradients', label: 'Gradients', names: [] },
];

/** the colour a choice sets: "box-gold-gradient shadow" → gold-gradient, "stat-teal" → teal */
export const colourName = (value) => (value || '').split(/\s+/)[0].replace(/^(box|stat)-/, '');

/** the colour group of a choice ('' when it is not a colour) */
export function colourGroupOf(value) {
  const name = colourName(value);
  if (!name) return '';
  if (/-gradient$/.test(name)) return 'gradients';
  return COLOUR_GROUPS.find((g) => g.names.includes(name))?.id || '';
}

/** whether the choices are a colour list: every one (but none) is a colour */
export const isColourList = (values) => {
  const set = values.filter(Boolean);
  return set.length > 1 && set.every((v) => colourGroupOf(v));
};

// the line-box class of the box colours whose own class styles a cell, card or section only
const BOX_PROBE = {
  'blue-gradient': 'dark-blue-gradient',
  'purple-gradient': 'dark-purple-gradient',
};
// Statistics' colour names → the Text style word of the same colour
const TEXT_WORD = { 'mid-gray': 'midgrey', 'dark-gold': 'darkgold', 'pale-gray': 'palegrey' };

const cache = new Map();

/**
 * The swatch of a colour choice (a CSS colour or gradient), read from the site's styles in the
 * preview page: a box colour as a line box draws it, a text colour as a styled word.
 * @param {Document} doc The preview page's document
 * @param {string} value The choice (box-…, stat-… or a Text style colour word)
 * @returns {string} The colour or gradient ('' when the page doesn't style it)
 */
export function swatchOf(doc, value) {
  if (cache.has(value)) return cache.get(value);
  const main = doc?.querySelector('main');
  if (!main) return '';
  const name = colourName(value);
  const probe = doc.createElement('span');
  const box = /^box-/.test(value);
  const word = TEXT_WORD[name] || name;
  probe.className = box ? `text-marker box-${BOX_PROBE[name] || name}` : `text-marker color-${word} ts-${word}`;
  probe.textContent = 'x';
  main.append(probe);
  const style = doc.defaultView.getComputedStyle(probe);
  let swatch = style.color;
  if (box) swatch = style.backgroundImage !== 'none' ? style.backgroundImage : style.backgroundColor;
  probe.remove();
  cache.set(value, swatch);
  return swatch;
}

/**
 * Paints the swatch dot of every choice in a container that names its colour (data-swatch).
 * @param {Element} container The panel part holding the choices
 * @param {HTMLIFrameElement} frame The preview frame (the site's styles)
 */
export function paintSwatches(container, frame) {
  const doc = frame?.contentDocument;
  if (!doc?.body) return;
  container.querySelectorAll('[data-swatch]').forEach((node) => {
    const swatch = swatchOf(doc, node.dataset.swatch);
    if (swatch) node.style.setProperty('--swatch', swatch);
  });
}

/**
 * Lays colour choices out in their groups, each with its sub-label; choices that aren't colours
 * (none, a gold rule) stay in a first row without a label.
 * @param {Array<[string, Element]>} items [choice value (or its swatch value), button]
 * @param {(el: Element[]) => Element} makeRow Builds one row of buttons
 * @param {(tag: string, attrs: object, ...children) => Element} el The panel's element helper
 * @returns {Element[]} The rows
 */
export function colourRows(items, makeRow, el) {
  const rows = [];
  const plain = items.filter(([v]) => !colourGroupOf(v)).map(([, b]) => b);
  if (plain.length) rows.push(makeRow(plain));
  COLOUR_GROUPS.forEach((group) => {
    const buttons = items.filter(([v]) => colourGroupOf(v) === group.id).map(([, b]) => b);
    if (!buttons.length) return;
    rows.push(el('div', { class: 'tm-swatch-row' }, el('span', { class: 'tm-sub' }, group.label), makeRow(buttons)));
  });
  return rows;
}
