import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // linked variant navigates within the site, so open in the same tab
  const isLinked = block.classList.contains('linked');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // image cell = one that contains a picture and no heading/body text (the DM
      // alt paragraph, hidden via .dm-alt-text, may sit beside the picture, so
      // don't gate on child count).
      if (div.querySelector('picture') && !div.querySelector('h1, h2, h3, h4, h5, h6')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
      }
    });
    ul.append(li);
  });
  // brochure-cta only: author puts the PDF link on the title; we move it onto the
  // image (image becomes clickable, title renders as plain text). Workaround
  // while images are authored as DM links — a DM link can't also carry the PDF
  // href, so the link rides on the title instead. Works once images move to the
  // picker too (both are just <picture> here — dm-support ran before decoration).
  if (block.classList.contains('brochure-cta')) {
    ul.querySelectorAll('li').forEach((li) => {
      const titleLink = li.querySelector('.cards-card-body :is(h1, h2, h3, h4, h5, h6) a[href]');
      const picture = li.querySelector('.cards-card-image picture');
      if (!titleLink || !picture) return;
      const link = document.createElement('a');
      link.href = titleLink.getAttribute('href');
      picture.replaceWith(link);
      link.append(picture);
      // unlink the title, keeping its text
      titleLink.replaceWith(...titleLink.childNodes);
    });
  }
  ul.querySelectorAll('picture > img').forEach((img) => {
    // dm-support.js already rendered DM images at native quality; re-optimizing
    // them forces width=750 + optimize=medium and would degrade quality.
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);

  ul.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a');
    if (link) {
      const target = isLinked ? '_self' : '_blank';
      li.addEventListener('click', (e) => {
        if (!e.target.closest('a')) window.open(link.href, target, 'noopener');
      });
      link.target = target;
      link.rel = 'noopener';
    }
  });
}
