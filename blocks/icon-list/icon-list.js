import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

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

  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    item.className = 'icon-list-item';
    moveInstrumentation(row, item);

    const cells = [...row.children];
    const iconCell = cells.find((c) => c.querySelector('picture, img, a[href]'));
    const textCell = cells.find((c) => c !== iconCell && c.textContent.trim());

    if (iconCell) {
      iconCell.className = 'icon-list-icon';
      // plain URLs become <img> here
      const link = iconCell.querySelector('a[href]');
      if (link && !iconCell.querySelector('picture, img')) {
        const img = document.createElement('img');
        img.src = link.getAttribute('href');
        img.alt = '';
        const picture = document.createElement('picture');
        picture.append(img);
        link.replaceWith(picture);
      }
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
