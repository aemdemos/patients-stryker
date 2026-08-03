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

// read a `prefix-N` variant class (e.g. cols-3) and return N, or null if absent
function readCountVariant(block, prefix) {
  const match = [...block.classList]
    .map((c) => c.match(new RegExp(`^${prefix}-(\\d+)$`)))
    .find(Boolean);
  return match ? Number(match[1]) : null;
}

/**
 * loads and decorates the statistics block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // grid dimensions authored as variant classes (cols-N / rows-N); default 3 cols
  const columns = readCountVariant(block, 'cols') || 3;
  const rows = readCountVariant(block, 'rows');
  block.style.setProperty('--statistics-columns', columns);
  if (rows) block.style.setProperty('--statistics-rows', rows);

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
