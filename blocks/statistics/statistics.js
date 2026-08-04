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
    // first cell holds the color keyword (authored content); consume it and
    // apply the matching class. Rows without a recognized keyword keep the
    // default color.
    const keyword = cells[0] ? cells[0].textContent.trim().toLowerCase() : '';
    if (COLOR_CLASSES[keyword]) {
      item.classList.add(COLOR_CLASSES[keyword]);
      cells.shift().remove();
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
