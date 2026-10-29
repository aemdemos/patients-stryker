/*
 * Box spacing on www.stryker.com pages (lift and shift of the AEM text / Large Headline
 * padding and margin fields, tools/importer/decisions/property-map.json).
 *
 * AEM sets each box's padding / margin as a % of its column width. Authors carry the
 * values as tokens: the property + the value (padding-top-4 = 4% of the column,
 * padding-left-3-6 = 3.6%, margin-top-minus-8 = -8%, padding-top-10px = 10px):
 *   - section styles: the section's default content is the box
 *   - Columns options cell-<N>-<token>: cell N is the box (e.g. cell-2-padding-top-4)
 *   - a `[[spacing,padding-top-4,padding-left-3-6]]` paragraph: the content after it, up to
 *     the next `[[spacing…]]` paragraph (a bare `[[spacing]]` ends the box), is the box
 * The cells are flex / grid items, so CSS % would resolve against the row: the values
 * are set in px from the box's own width (its column) and updated when it resizes.
 */

const TOKEN = /^(padding|margin)-(top|bottom|left|right)-(minus-)?(\d+)(?:-(\d+))?(px)?$/;
const SIDES = {
  top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right',
};

/**
 * The spacing of a list of tokens.
 * @param {string[]} tokens Class names, the non-spacing ones ignored
 * @returns {{prop: string, value: number, unit: string}[]} e.g. paddingTop 4 %
 */
export function parseSpacing(tokens) {
  return tokens.map((token) => token.match(TOKEN)).filter(Boolean)
    .map(([, kind, side, neg, int, dec, px]) => ({
      prop: `${kind}${SIDES[side]}`,
      value: (neg ? -1 : 1) * Number(`${int}.${dec || 0}`),
      unit: px ? 'px' : '%',
    }));
}

const boxes = new Map();
let observer = null;

/**
 * Sets the box's spacing in px. AEM resolves the % against the column's inner width (the
 * box without the column gutters), so the reference is the element's width without its own
 * padding; the values add to that padding (the gutter stays). Left / right margins are
 * added as padding: the element keeps its own (auto) margins, and the box has no
 * background of its own in our markup, so the text lands where AEM puts it.
 */
function apply(el) {
  const box = boxes.get(el);
  if (!box) return;
  const { spacing, base } = box;
  const reference = el.getBoundingClientRect().width - base.paddingLeft - base.paddingRight;
  const px = ({ value, unit }) => (unit === 'px' ? value : (value * reference) / 100);
  const extra = {};
  spacing.forEach((s) => {
    const prop = s.prop.replace(/^margin(Left|Right)$/, 'padding$1');
    extra[prop] = (extra[prop] || 0) + px(s);
  });
  Object.entries(extra).forEach(([prop, value]) => {
    el.style[prop] = `${Math.round((base[prop] + value) * 10) / 10}px`;
  });
}

const PROPS = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom'];

/**
 * Gives an element its box spacing, kept in step with its width.
 * @param {Element} el The box
 * @param {object[]} spacing parseSpacing() result
 * @param {boolean} [replace] the element is the box itself (boxed section): the values replace
 *   its own padding instead of adding to it
 */
function setBox(el, spacing, replace = false) {
  if (!spacing.length) return;
  const cs = getComputedStyle(el);
  const base = Object.fromEntries(PROPS.map((p) => [p, parseFloat(cs[p]) || 0]));
  if (replace) {
    spacing.forEach(({ prop }) => {
      if (prop.startsWith('padding')) base[prop] = 0;
    });
  }
  boxes.set(el, { spacing, base });
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
      if (spacing.length) setBox(wrapper, spacing, section.classList.contains('boxed'));
    });
  });
  main.querySelectorAll('.columns').forEach((columns) => {
    const byCell = {};
    [...columns.classList].forEach((cls) => {
      const m = cls.match(/^cell-(\d+)-(.+)$/);
      if (m && TOKEN.test(m[2])) (byCell[m[1]] = byCell[m[1]] || []).push(m[2]);
    });
    [...columns.children].forEach((row) => [...row.children].forEach((cell, i) => {
      if (byCell[i + 1]) setBox(cell, parseSpacing(byCell[i + 1]));
    }));
  });
  // [[spacing]] paragraphs wherever they are (default content, block cells, tab panels)
  const containers = new Set([...main.querySelectorAll('p > span.spacing')].map((span) => span.parentElement.parentElement));
  containers.forEach(markerBoxes);
}

/**
 * The box spacing of a block's own options (spacing tokens among its classes) on one of its
 * elements, for blocks that rebuild their markup (Hero Corp: the text box), called at the end
 * of their decoration.
 * @param {Element} block The block
 * @param {Element} target The element that is the AEM box
 */
export function spaceBlock(block, target) {
  if (!target) return;
  const spacing = parseSpacing([...block.classList]);
  // a box with its own colour (box-*): the values replace its padding, as in AEM
  setBox(target, spacing, [...block.classList].some((c) => c.startsWith('box-')));
}
