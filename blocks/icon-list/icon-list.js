import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// column count from the `cols-N` variant class (default 4); rows flow from the
// item count. Mirrors the statistics block.
function readColumns(block) {
  const match = [...block.classList]
    .map((c) => c.match(/^cols-(\d+)$/))
    .find(Boolean);
  return match ? Number(match[1]) : 4;
}

// The stroke-facts icons are authored as bare DM autolinks (visible text is the
// URL), so dm-support.js has no display text to derive alt from and renders
// alt="". Mirror the source site's short labels here, keyed by the DM asset
// name (the URL's last path segment starts with the key). Only applied when the
// image has no alt, so any author-supplied alt still wins.
const ICON_ALT = {
  oneinfour: '1 in 4 people',
  global: 'Global',
  disability: 'Disability',
  leadingcause: 'Leading cause',
};

function altForSrc(src) {
  try {
    const name = new URL(src, window.location.href).pathname.split('/').pop().toLowerCase();
    const key = Object.keys(ICON_ALT).find((k) => name.startsWith(k));
    return key ? ICON_ALT[key] : '';
  } catch {
    return '';
  }
}

/**
 * Decorates the icon-list block: a grid of items, each row one item with two
 * cells — [ picture ] [ caption ]. The section title and world-map background
 * are authored on the section, not the block (see icon-list.css).
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

  // Backfill alt from the source labels when the author gave none (bare DM
  // autolinks render alt=""). Then re-render non-DM images at 2x the 165px icon
  // width for hi-dpi; DM images are left as dm-support.js rendered them (native
  // quality), so set their alt in place.
  list.querySelectorAll('picture > img').forEach((img) => {
    if (!img.alt) img.alt = altForSrc(img.src);
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '330' }]),
    );
  });

  block.replaceChildren(list);
}
