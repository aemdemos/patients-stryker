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
 * Words (any order, joined by "-"):
 *   colour   blue, gold, purple, teal, navy, grey / gray, white, light-gray (the color-* classes)
 *   font     serif (Egyptienne), sans (Futura), body (Humanist), upper (capitals)
 *   size     s, l, xl, xxl: 0.8 / 1.25 / 1.5 / 1.75 times the surrounding text
 *   spacing  p, pt, pr, pb, pl, px, py (padding) or m, mt, mr, mb, ml, mx, my (margin),
 *            each followed by a step: xs, s, m, l, xl (the spacing tokens)
 * Bold and italic stay plain editor formatting (authoring conventions), not marker words.
 * When the markers hold the whole line, the spacing goes on the line itself (the paragraph
 * or heading), so top / bottom spacing takes effect; inside a line only left / right spacing
 * shows. Unknown words are ignored; a marker without its partner is removed.
 */

// formatting a marker pair may run through (and may itself sit in)
const INLINE_TAGS = new Set(['A', 'B', 'BR', 'DEL', 'EM', 'I', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U']);

// the marker words (also read by the authoring panel, tools/text-markers)
export const COLOURS = ['blue', 'gold', 'purple', 'teal', 'navy', 'grey', 'white', 'light-gray'];
const COLOUR_ALIASES = { gray: 'grey' };
export const FONTS = ['serif', 'sans', 'body', 'upper'];
export const SIZES = ['s', 'l', 'xl', 'xxl'];

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
    if (COLOURS.includes(pair)) {
      classes.push(`color-${pair}`);
      i += 1;
    } else if (SPACING[word] && STEPS[words[i + 1]]) {
      SPACING[word].forEach((prop) => spacing.push([prop, STEPS[words[i + 1]]]));
      i += 1;
    } else if (COLOURS.includes(COLOUR_ALIASES[word] || word)) {
      classes.push(`color-${COLOUR_ALIASES[word] || word}`);
    } else if (FONTS.includes(word) || SIZES.includes(word)) {
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
  });
}
