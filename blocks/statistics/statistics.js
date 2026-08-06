import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// Per-stat color is authored as a keyword in the row's first cell (real content,
// so it persists through DA → preview → publish, unlike an editor-only class).
// Map each keyword to its CSS class; the cell is consumed during decoration.
const COLOR_CLASSES = {
  teal: 'statistics-teal',
  gold: 'statistics-gold',
  'dark-gold': 'statistics-dark-gold',
  navy: 'statistics-navy',
  sage: 'statistics-sage',
  purple: 'statistics-purple',
};

// default color when the authored keyword is missing or unrecognized (e.g. an
// author typed it wrong in DA); mirrors the model's default option
const DEFAULT_COLOR_CLASS = 'statistics-teal';

// read the authored column count from the `cols-N` variant class (default 3);
// rows are not set — the grid flows them automatically from the item count
function readColumns(block) {
  const match = [...block.classList]
    .map((c) => c.match(/^cols-(\d+)$/))
    .find(Boolean);
  return match ? Number(match[1]) : 3;
}

/**
 * loads and decorates the statistics block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.style.setProperty('--statistics-columns', readColumns(block));

  const list = document.createElement('ul');
  list.className = 'statistics-list';

  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    item.className = 'statistics-item';
    moveInstrumentation(row, item);

    const cells = [...row.children];
    // A full stat row is [color, value, description] (3 cells). The first cell is
    // the color keyword — consume it and apply the matching class, falling back
    // to the default color for a missing/mistyped keyword. Rows with only 2 cells
    // (no color authored) keep the default color and are treated as [value, desc].
    if (cells.length >= 3) {
      const keyword = cells[0].textContent.trim().toLowerCase();
      item.classList.add(COLOR_CLASSES[keyword] || DEFAULT_COLOR_CLASS);
      cells.shift().remove();
    } else {
      item.classList.add(DEFAULT_COLOR_CLASS);
    }

    const [value, desc] = cells;
    if (value) {
      value.className = 'statistics-value';
      item.append(value);
    }
    if (desc) {
      desc.className = 'statistics-desc';
      item.append(desc);
    }

    list.append(item);
  });

  block.replaceChildren(list);
}
