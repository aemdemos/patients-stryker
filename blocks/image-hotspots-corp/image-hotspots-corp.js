/*
 * Image Hotspots Corp block: an image with links placed on it, as the www.stryker.com
 * Dynamic Media interactive image (ASC operating room, pre-operative, post-operative).
 * Row 1: the image (a Dynamic Media image link; scripts/dm-support.js renders it as a
 * picture before the block is decorated).
 * Then one row per hotspot: the label (A, B …) | the hotspot's position, left and top in %
 * of the image ("5.88%, 80.82%") | the link (its text: where it goes, e.g. the product name).
 * Each hotspot becomes a link centred on its point that opens in a new tab, as on
 * stryker.com, named "<label>: <link text>" for screen readers. Rows without a link or a
 * position are left out.
 */

const POSITION = /(-?\d+(?:\.\d+)?)\s*%?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*%?/;

/**
 * One hotspot link from a row, or null when the row has no link or no position.
 * @param {Element} row The hotspot row
 * @returns {HTMLAnchorElement|null}
 */
function hotspot(row) {
  const [labelCell, positionCell, linkCell] = [...row.children];
  const link = (linkCell || row).querySelector('a[href]');
  const position = positionCell && positionCell.textContent.match(POSITION);
  if (!link || !position) return null;
  const label = labelCell ? labelCell.textContent.trim() : '';
  const name = link.textContent.trim();
  const a = document.createElement('a');
  a.className = 'image-hotspots-corp-spot';
  a.href = link.getAttribute('href');
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', [label, name].filter(Boolean).join(': '));
  a.style.setProperty('--image-hotspots-corp-left', `${position[1]}%`);
  a.style.setProperty('--image-hotspots-corp-top', `${position[2]}%`);
  return a;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [imageRow, ...rows] = [...block.children];
  if (!imageRow) return;
  const media = document.createElement('div');
  media.className = 'image-hotspots-corp-media';
  const image = imageRow.querySelector('picture') || imageRow.querySelector('img');
  if (image) {
    media.append(image);
  } else {
    // the image link not rendered (not a Dynamic Media link): keep the row's content
    media.append(...imageRow.querySelectorAll(':scope > div > *'));
  }
  rows.map(hotspot).filter(Boolean).forEach((a) => media.append(a));
  block.replaceChildren(media);
}
