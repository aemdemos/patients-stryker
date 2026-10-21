import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';

/**
 * Cards Corp: one row per card — an image cell and a body cell (H3, text, CTA).
 * The image links to the card's last link ("Learn more", else the H3 link), like the
 * source Related Products teasers.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // convert DM links to <picture>; the canvas re-renders fields from source, so re-run here
  decorateDMAssets(block);

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      div.className = div.children.length === 1 && div.querySelector('picture')
        ? 'cards-corp-card-image'
        : 'cards-corp-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // dm-support.js already rendered DM images at native quality
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  ul.querySelectorAll('li').forEach((li) => {
    const cell = li.querySelector('.cards-corp-card-image');
    const picture = cell?.querySelector('picture');
    if (!picture) return;
    let link = picture.closest('a');
    const cta = [...li.querySelectorAll('.cards-corp-card-body a[href]')].pop();
    if (!link && cta) {
      // duplicate of the card's CTA: keep it out of the tab order and the a11y tree
      link = document.createElement('a');
      link.href = cta.getAttribute('href');
      link.tabIndex = -1;
      link.setAttribute('aria-hidden', 'true');
      picture.replaceWith(link);
      link.append(picture);
    }
    // lift the image out of the editor wrapper so the canvas can't re-render over it
    cell.replaceChildren(link || picture);
  });

  block.replaceChildren(ul);
}
