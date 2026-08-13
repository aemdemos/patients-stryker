import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// read the authored column count from the `cols-N` variant class (default 4);
// rows flow automatically from the item count. Mirrors the statistics block so
// authors get a familiar layout control across the two grid blocks.
function readColumns(block) {
  const match = [...block.classList]
    .map((c) => c.match(/^cols-(\d+)$/))
    .find(Boolean);
  return match ? Number(match[1]) : 4;
}

/**
 * loads and decorates the icon-list block
 *
 * Source: patients.stryker.com "Stroke facts" widget — a faint world-map
 * background behind a responsive grid of items, each an icon (line-art PNG)
 * above a short centered Futura-bold caption.
 *
 * The block is purely the icon grid; each row is one item, two cells:
 *   [ picture ] [ caption text ]
 * The section title (e.g. "Stroke facts") is authored as a default-content
 * heading above the block — not part of the block — and styled by the section
 * (see icon-list.css `.icon-list-container` heading rule).
 *
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
    const iconCell = cells.find((c) => c.querySelector('picture, img'));
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

  // re-render authored images at an appropriate width (source icons are 165px
  // wide; request 2x for crispness on hi-dpi displays). DM images are already
  // rendered at native quality by dm-support.js — re-optimizing would degrade
  // them, so leave those untouched.
  list.querySelectorAll('picture > img').forEach((img) => {
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '330' }]),
    );
  });

  block.replaceChildren(list);
}
