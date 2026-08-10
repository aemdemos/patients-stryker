import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  const isBrochure = block.classList.contains('brochure');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // dm-support.js already rendered DM images at native quality; re-optimizing
    // them forces width=750 + optimize=medium and would degrade quality.
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);

  // brochure: lift the (optional) heading above the image so the card reads
  // title -> image -> download links, matching the reference.
  if (isBrochure) {
    ul.querySelectorAll('li').forEach((li) => {
      const heading = li.querySelector('.cards-card-body :is(h1, h2, h3, h4, h5, h6)');
      if (heading) li.prepend(heading);
    });
  }

  ul.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a');
    if (link) {
      li.addEventListener('click', (e) => {
        if (!e.target.closest('a')) window.open(link.href, '_blank', 'noopener');
      });
      link.target = '_blank';
      link.rel = 'noopener';
    }
  });
}
