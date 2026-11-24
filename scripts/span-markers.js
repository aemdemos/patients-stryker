/*
 * Text markers: authors style part of a line by typing `:start-<words>:` before the text and
 * `:end:` after it, in a heading, paragraph, list item or block cell. EDS turns each
 * `:name:` into an empty `<span class="icon icon-name">` on the server, so the delivered
 * text stays clean (no codes in the HTML that search engines and link previews read). This
 * runs before decorateIcons: each start / end pair becomes one styled span, and the
 * markers are removed, so no icon is ever requested for them.
 *
 *   :start-blue-serif-l:Our mission:end:
 *   → <span class="text-marker color-blue ts-serif ts-l">Our mission</span>
 *
 * Words (any order, joined by "-"; a word with digits, e.g. hl15, goes last: EDS turns
 * `:name:` into a marker only when its digits end the name):
 *   colour   blue, gold, purple, teal, navy, grey / gray, white, light-gray (the color-* classes)
 *   font     serif (Egyptienne), sans (Futura), body (Humanist), upper (capitals)
 *   size     s, l, xl, xxl: 0.8 / 1.25 / 1.5 / 1.75 times the surrounding text (the sheet adds
 *            xxxl 2×, xxxxl 2.5× and the large headline sizes S hl15, M hl2, L hl3, XL hl45)
 *   look     rule-gold (gold rule of an underlined heading); a line box in a box colour:
 *            box-white, box-gray, box-gold, box-blue, box-purple, box-teal, box-dark,
 *            box-dark-blue-gradient, box-dark-purple-gradient (around the whole line, the box
 *            is the line's: .text-marker-box)
 *   spacing  p, pt, pr, pb, pl, px, py (padding) or m, mt, mr, mb, ml, mx, my (margin),
 *            each followed by a step: xs, s, m, l, xl (the spacing tokens)
 *   added    words added in the Block Library sheet panel-options (tools/library-options.js) get
 *            the class ts-<word>; their look is a ts-<word> rule in styles/styles-corp.css
 * Bold and italic stay plain editor formatting (authoring conventions), not marker words.
 * When the markers hold the whole line, the spacing goes on the line itself (the paragraph
 * or heading), so top / bottom spacing takes effect; inside a line only left / right spacing
 * shows. Words without a style change nothing; a marker without its partner is removed.
 * Markers stacked directly around each other (`:start-gold::start-purple:text:end::end:`)
 * keep only the inner, newer style.
 */

// formatting a marker pair may run through (and may itself sit in)
const INLINE_TAGS = new Set(['A', 'B', 'BR', 'DEL', 'EM', 'I', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U']);

// the marker words (also read by the authoring panel, tools/text-markers)
export const COLOURS = ['blue', 'gold', 'purple', 'teal', 'navy', 'grey', 'white', 'light-gray'];
const COLOUR_ALIASES = { gray: 'grey' };
export const FONTS = ['serif', 'sans', 'body', 'upper'];
export const SIZES = ['s', 'l', 'xl', 'xxl'];
// looks the corp styles define for a class of the same name: rule-gold (the gold rule of an
// underlined heading) and the line boxes in the stryker.com box colours (the same names as the
// Columns cell boxes; box-dark is also the dark quote box of news articles)
export const BOXES = ['box-white', 'box-gray', 'box-gold', 'box-blue', 'box-purple', 'box-teal',
  'box-dark', 'box-dark-blue-gradient', 'box-dark-purple-gradient'];
export const DECORATIONS = ['rule-gold', ...BOXES];

// spacing word → CSS properties; step → spacing token
export const SPACING = {
  p: ['padding'],
  pt: ['paddingTop'],
  pr: ['paddingRight'],
  pb: ['paddingBottom'],
  pl: ['paddingLeft'],
  px: ['paddingLeft', 'paddingRight'],
  py: ['paddingTop', 'paddingBottom'],
  m: ['margin'],
  mt: ['marginTop'],
  mr: ['marginRight'],
  mb: ['marginBottom'],
  ml: ['marginLeft'],
  mx: ['marginLeft', 'marginRight'],
  my: ['marginTop', 'marginBottom'],
};
export const STEPS = {
  xs: 'var(--space-block-xs)',
  s: 'var(--space-block-s)',
  m: 'var(--space-block)',
  l: 'var(--space-block-l)',
  xl: 'var(--space-section)',
};

const START = 'icon-start-';
const END = 'icon-end';

/**
 * Reads the words of a start marker.
 * @param {string} name The marker name after `start-`, e.g. `blue-serif-l-pl-m`
 * @returns {{classes: string[], spacing: Array<[string, string]>}} The classes to set and
 *   the spacing as [style property, value] pairs
 */
export function parseMarker(name) {
  const words = name.toLowerCase().split('-').filter(Boolean);
  const classes = [];
  const spacing = [];
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const pair = `${word}-${words[i + 1]}`;
    // the longest look the words spell from here (box-dark-purple-gradient before box-dark)
    const look = [4, 3, 2].map((n) => words.slice(i, i + n).join('-'))
      .find((joined) => DECORATIONS.includes(joined));
    if (look) {
      classes.push(look);
      i += look.split('-').length - 1;
    } else if (COLOURS.includes(pair)) {
      classes.push(`color-${pair}`);
      i += 1;
    } else if (SPACING[word] && STEPS[words[i + 1]]) {
      SPACING[word].forEach((prop) => spacing.push([prop, STEPS[words[i + 1]]]));
      i += 1;
    } else if (COLOURS.includes(COLOUR_ALIASES[word] || word)) {
      classes.push(`color-${COLOUR_ALIASES[word] || word}`);
    } else if (/^[a-z0-9]+$/.test(word)) {
      // fonts, sizes, and words added in the Block Library sheet panel-options (ts-<word>)
      classes.push(`ts-${word}`);
    }
  }
  return { classes, spacing };
}

/**
 * The element that holds a marker: its nearest ancestor that is not inline formatting
 * (a heading, paragraph, list item or block cell).
 * @param {Element} marker A marker span
 * @returns {Element} The container
 */
function getContainer(marker) {
  let el = marker.parentElement;
  while (INLINE_TAGS.has(el.tagName) && el.parentElement) el = el.parentElement;
  return el;
}

/**
 * Removes a marker and the formatting elements it leaves empty (below the container).
 * @param {Element} marker A marker span
 * @param {Element} container Its container
 */
function removeMarker(marker, container) {
  let current = marker;
  while (current !== container) {
    const parent = current.parentNode;
    current.remove();
    if (parent === container || parent.textContent || parent.querySelector('br, img, picture')) break;
    current = parent;
  }
}

/**
 * Wraps the content between a start and an end marker into a styled span.
 * @param {Element} start The start marker
 * @param {Element} end The end marker
 * @param {Element} container Their container
 */
function wrapPair(start, end, container) {
  const name = [...start.classList].find((c) => c.startsWith(START)).slice(START.length);
  const { classes, spacing } = parseMarker(name);
  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);

  // a pair holding nothing but another styled run (`:start-a::start-b:text:end::end:`, a
  // restyle that wrapped the old markers): the inner, newer style wins, the outer is dropped
  const inside = range.cloneContents();
  const only = [...inside.childNodes]
    .filter((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
  if (only.length === 1 && only[0].matches?.('span.text-marker')) {
    removeMarker(start, container);
    removeMarker(end, container);
    return;
  }

  const span = document.createElement('span');
  span.className = ['text-marker', ...classes].join(' ');
  // the extracted copy keeps formatting the markers cut through (e.g. a partly marked <strong>)
  span.append(range.extractContents());
  range.insertNode(span);
  removeMarker(start, container);
  removeMarker(end, container);

  // the whole line marked: its spacing goes on the line, so top / bottom spacing applies
  const wholeLine = container.textContent.trim() === span.textContent.trim()
    && /^(P|H[1-6]|LI)$/.test(container.tagName);
  const target = wholeLine ? container : span;
  spacing.forEach(([prop, value]) => { target.style[prop] = value; });
  if (wholeLine && spacing.length) container.classList.add('text-marker-line');
  // a line box around the whole line is the line's own box (its gap below goes inside it)
  const box = classes.find((c) => BOXES.includes(c));
  if (wholeLine && box) {
    span.classList.remove(box);
    container.classList.add('text-marker-box', box);
  }
}

/**
 * A heading's id is made from its text when the page is rendered, so a heading holding
 * markers gets the marker words in its id (`start-xl-serifour-teamend`). Once the markers
 * are gone, the id is made again from the text that shows, the same way (lowercase words
 * joined by hyphens), keeping it unique on the page.
 * @param {Element} container The element whose markers were removed
 */
function fixHeadingId(container) {
  if (!/^H[1-6]$/.test(container.tagName) || !/start-|end$/.test(container.id)) return;
  const base = container.textContent.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
  if (!base) return;
  let id = base;
  const taken = (value) => {
    const other = document.getElementById(value);
    return other && other !== container;
  };
  for (let n = 1; taken(id); n += 1) id = `${base}-${n}`;
  container.id = id;
}

/**
 * Turns `:start-…:` / `:end:` marker pairs into styled spans and removes the markers.
 * @param {Element} main The container element
 */
export default function decorateSpanMarkers(main) {
  const markers = [...main.querySelectorAll(`span.icon[class*="${START}"], span.icon.${END}`)]
    .filter((marker) => !marker.closest('code, pre'));
  const byContainer = new Map();
  markers.forEach((marker) => {
    const container = getContainer(marker);
    if (!byContainer.has(container)) byContainer.set(container, []);
    byContainer.get(container).push(marker);
  });

  byContainer.forEach((list, container) => {
    // pairs close innermost first: an end closes the nearest open start
    const open = [];
    list.forEach((marker) => {
      if (!marker.classList.contains(END)) {
        open.push(marker);
        return;
      }
      const start = open.pop();
      if (start) wrapPair(start, marker, container);
      else removeMarker(marker, container);
    });
    open.forEach((marker) => removeMarker(marker, container));
    fixHeadingId(container);
  });
}
