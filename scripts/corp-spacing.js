/*
 * Box spacing on www.stryker.com pages (lift and shift of the AEM text / Large Headline
 * padding and margin fields, tools/importer/decisions/property-map.json).
 *
 * AEM sets each box's padding / margin as a % of its column width. Authors carry the
 * values as tokens: p|m + t|b|l|r + the value (pt-4 = padding-top 4%, pl-3-6 = 3.6%,
 * mt-n8 = margin-top -8%, pt-10px = 10px):
 *   - section styles: the section's default content is the box
 *   - Columns options c<N>-<token>: cell N is the box (e.g. c2-pt-4)
 *   - a `[[spacing,pt-4,pl-3-6]]` paragraph: the content after it, up to the next
 *     `[[spacing…]]` paragraph (a bare `[[spacing]]` ends the box), is the box
 * The cells are flex / grid items, so CSS % would resolve against the row: the values
 * are set in px from the box's own width (its column) and updated when it resizes.
 */

const TOKEN = /^(p|m)(t|b|l|r)-(n?)(\d+)(?:-(\d+))?(px)?$/;
const SIDES = {
  t: 'Top', b: 'Bottom', l: 'Left', r: 'Right',
};

/**
 * The spacing of a list of tokens.
 * @param {string[]} tokens Class names, the non-spacing ones ignored
 * @returns {{prop: string, value: number, unit: string}[]} e.g. paddingTop 4 %
 */
export function parseSpacing(tokens) {
  return tokens.map((token) => token.match(TOKEN)).filter(Boolean)
    .map(([, kind, side, neg, int, dec, px]) => ({
      prop: `${kind === 'p' ? 'padding' : 'margin'}${SIDES[side]}`,
      value: (neg ? -1 : 1) * Number(`${int}.${dec || 0}`),
      unit: px ? 'px' : '%',
    }));
}

const boxes = new Map();
let observer = null;

function apply(el) {
  const spacing = boxes.get(el);
  if (!spacing) return;
  const { width } = el.getBoundingClientRect();
  spacing.forEach(({ prop, value, unit }) => {
    el.style[prop] = unit === 'px' ? `${value}px` : `${Math.round((value * width) / 10) / 10}px`;
  });
}

/**
 * Gives an element its box spacing, kept in step with its width.
 * @param {Element} el The box
 * @param {object[]} spacing parseSpacing() result
 */
function setBox(el, spacing) {
  if (!spacing.length) return;
  boxes.set(el, spacing);
  if (!observer && window.ResizeObserver) {
    observer = new ResizeObserver((entries) => entries.forEach((entry) => apply(entry.target)));
  }
  if (observer) observer.observe(el);
  apply(el);
}

/**
 * `[[spacing,…]]` paragraphs in a container: the siblings after each one, up to the next,
 * become a box (div.corp-spacing-box) with that spacing; the marker paragraphs go.
 * @param {Element} container A default-content wrapper or a block cell
 */
function markerBoxes(container) {
  const markers = [...container.querySelectorAll(':scope > p')]
    .filter((p) => p.children.length === 1 && p.firstElementChild.matches('span.spacing') && !p.textContent.trim());
  markers.forEach((marker) => {
    const tokens = [...marker.firstElementChild.classList];
    const run = [];
    let next = marker.nextElementSibling;
    while (next && !markers.includes(next)) {
      run.push(next);
      next = next.nextElementSibling;
    }
    const spacing = parseSpacing(tokens);
    if (spacing.length && run.length) {
      const box = document.createElement('div');
      box.className = 'corp-spacing-box';
      marker.after(box);
      box.append(...run);
      setBox(box, spacing);
    }
    marker.remove();
  });
}

/**
 * Applies the box spacing of the sections, Columns cells and spacing paragraphs of a
 * container (main, or a fragment).
 * @param {Element} main The container
 */
export default function decorateSpacing(main) {
  main.querySelectorAll(':scope > .section').forEach((section) => {
    const spacing = parseSpacing([...section.classList]);
    // AEM boxes stack flush, their own padding / margin is the gap: no section gap on top
    if (spacing.length) section.style.marginBottom = '0px';
    section.querySelectorAll(':scope > .default-content-wrapper').forEach((wrapper) => {
      if (spacing.length) setBox(wrapper, spacing);
      markerBoxes(wrapper);
    });
  });
  main.querySelectorAll('.columns').forEach((columns) => {
    const byCell = {};
    [...columns.classList].forEach((cls) => {
      const m = cls.match(/^c(\d+)-(.+)$/);
      if (m && TOKEN.test(m[2])) (byCell[m[1]] = byCell[m[1]] || []).push(m[2]);
    });
    [...columns.children].forEach((row) => [...row.children].forEach((cell, i) => {
      if (byCell[i + 1]) setBox(cell, parseSpacing(byCell[i + 1]));
      markerBoxes(cell);
    }));
  });
}
