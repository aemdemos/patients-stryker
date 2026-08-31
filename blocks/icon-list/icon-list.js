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
      // Alt text is authored as a separate <p> directly below the icon link/image
      // in the same cell (the link keeps its URL as its display text). Find that
      // <p> — the one that holds no media — and use it as the alt.
      const media = iconCell.querySelector('picture, img, a[href]');
      const mediaPara = media ? media.closest('p') : null;
      const altPara = [...iconCell.querySelectorAll('p')]
        .find((p) => p !== mediaPara && !p.querySelector('picture, img, a[href]'));
      const alt = altPara ? altPara.textContent.trim() : '';
      // Keep the alt <p> in the DOM (visually hidden) rather than removing it: it
      // carries the UE `iconAlt` instrumentation, and deleting it makes the editor
      // drop the whole cell — including the image — when the alt is edited. The
      // text is mirrored onto the image's alt, so hide the <p> from assistive tech
      // to avoid a double announcement.
      if (altPara) {
        altPara.classList.add('icon-list-alt');
        altPara.setAttribute('aria-hidden', 'true');
      }

      // A plain (non-DM) URL link is still an <a> here — convert it to an <img>.
      // DM links were already turned into <picture> by decorateDMAssets page-wide.
      const link = iconCell.querySelector('a[href]');
      if (link && !iconCell.querySelector('picture, img')) {
        const img = document.createElement('img');
        img.src = link.getAttribute('href');
        img.alt = alt;
        const picture = document.createElement('picture');
        picture.append(img);
        link.replaceWith(picture);
      } else {
        // apply the authored alt onto the existing (e.g. DM-converted) image
        const img = iconCell.querySelector('img');
        if (img) img.alt = alt;
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
