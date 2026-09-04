import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

// column count from the `cols-N` variant class; default 6 for label, else 4
function readColumns(block) {
  const match = [...block.classList]
    .map((c) => c.match(/^cols-(\d+)$/))
    .find(Boolean);
  if (match) return Number(match[1]);
  return block.classList.contains('label') ? 6 : 4;
}

/**
 * Decorates the icon-list block into a grid of [ picture ][ caption ] items.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.style.setProperty('--icon-list-columns', readColumns(block));

  const list = document.createElement('ul');
  list.className = 'icon-list-items';

  // The authored row is two cells: cell 1 = icon, cell 2 = caption text. Keep
  // both cells by position rather than detecting the icon by its <a>/<picture>.
  // In UE the icon and its alt are two fields on one <a>; while the editor
  // patches that anchor it can briefly carry no href, so a media/href query
  // would fail to find the icon cell and drop it (image vanishes in UE + DA).
  // Positional assignment keeps the cell — and its UE instrumentation — intact.
  // Row→<li> instrumentation is moved by the mutation observer in ue/scripts/ue.js.
  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    item.className = 'icon-list-item';

    const [iconCell, textCell] = [...row.children];
    if (iconCell) {
      iconCell.className = 'icon-list-icon';
      item.append(iconCell);
    }
    if (textCell) {
      textCell.className = 'icon-list-text';
      item.append(textCell);
    }

    list.append(item);
  });

  // re-render non-DM images at 2x (330px) for hi-dpi; DM images left as-is
  list.querySelectorAll('picture > img').forEach((img) => {
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '330' }]),
    );
  });

  block.replaceChildren(list);
}
