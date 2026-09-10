import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';
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
  // convert DM links to <picture> before restructuring — the canvas re-renders
  // fields from source, so re-run here (idempotent), not just in decorateMain
  decorateDMAssets(block);

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

  // lift the icon out of the editor wrapper so the canvas can't re-render the
  // raw link over it (mirrors hero); harmless unwrap on the live site
  list.querySelectorAll('.icon-list-icon').forEach((cell) => {
    const picture = cell.querySelector('picture');
    if (!picture) return;
    const link = picture.closest('a');
    cell.replaceChildren(link || picture);
  });

  block.replaceChildren(list);
}
