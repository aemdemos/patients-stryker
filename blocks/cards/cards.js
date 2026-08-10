import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    // Image Link fallback: if no picker image (<picture>) is in the image cell
    // but an imageLink URL was authored, build the image from that link.
    const imgCell = li.firstElementChild;
    if (imgCell && !imgCell.querySelector('picture')) {
      const link = imgCell.querySelector('a[href]');
      if (link) {
        const img = document.createElement('img');
        img.src = link.getAttribute('href');
        img.alt = link.textContent.trim();
        img.loading = 'lazy';
        link.replaceWith(img);
      }
    }
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture, img')) div.className = 'cards-card-image';
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
