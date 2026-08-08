import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // `resources` variant: PDF brochure card — cover image over a "LEARN MORE"
  // button, no visible title; image and button link to the same PDF.
  const isResources = block.classList.contains('resources');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    if (isResources) {
      // cell 1: image + optional Image Link; cell 2: "LEARN MORE" PDF link.
      // wrap the image in a link (imageLink, else the cell-2 PDF link).
      const [first, second] = li.children;
      if (first) first.className = 'cards-card-image';
      if (second) second.className = 'cards-card-body';
      const picture = first && first.querySelector('picture');
      const imageLink = first && first.querySelector('a[href]');
      const buttonLink = second && second.querySelector('a[href]');
      const wrapHref = (imageLink && imageLink.getAttribute('href'))
        || (buttonLink && buttonLink.getAttribute('href'));

      if (picture) {
        const alreadyWrapped = imageLink && imageLink.contains(picture);
        // wrap in place so the <picture>'s UE instrumentation survives reload
        if (wrapHref && !alreadyWrapped) {
          const imgLink = document.createElement('a');
          imgLink.href = wrapHref;
          imgLink.target = '_blank';
          imgLink.rel = 'noopener';
          picture.replaceWith(imgLink);
          imgLink.append(picture);
        }
        // drop a standalone imageLink anchor (one that isn't wrapping the image)
        if (imageLink && !alreadyWrapped) {
          (imageLink.closest('p') || imageLink).remove();
        }
      } else if (imageLink) {
        // legacy: image authored as a link whose href is the image URL
        const img = document.createElement('img');
        img.src = imageLink.getAttribute('href');
        img.alt = imageLink.textContent.trim();
        img.loading = 'lazy';
        first.textContent = '';
        if (buttonLink) {
          const imgLink = document.createElement('a');
          imgLink.href = buttonLink.getAttribute('href');
          imgLink.target = '_blank';
          imgLink.rel = 'noopener';
          imgLink.append(img);
          first.append(imgLink);
        } else {
          first.append(img);
        }
      }
    }

    ul.append(li);
  });
  if (!isResources) {
    ul.querySelectorAll('picture > img').forEach((img) => {
      // skip DM images — already native quality; re-optimizing would degrade them
      if (isDMSrc(img.src)) return;
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    });
  }
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
