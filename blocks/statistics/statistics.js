import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// stat-number color classes an author may set on an item (mirrors the UE model)
const COLOR_CLASSES = [
  'statistics-teal',
  'statistics-gold',
  'statistics-dark-gold',
  'statistics-navy',
  'statistics-sage',
  'statistics-purple',
];

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

    // carry any author-selected color class from the item row onto the <li>
    COLOR_CLASSES.forEach((c) => {
      if (row.classList.contains(c)) item.classList.add(c);
    });

    const [value, desc] = row.children;
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
