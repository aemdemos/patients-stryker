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

    // Assign cells by POSITION, never by querying for the icon's media. In UE the
    // `icon` (a[href]) and `iconAlt` (a) fields share ONE anchor; while UE patches
    // the alt the anchor momentarily has no href, so an `a[href]` query would match
    // nothing and the whole icon cell would be dropped (deleting it in UE + DA).
    // DA selectors are positional too (icon = div:nth-child(1), text = div:nth-child(2)).
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
