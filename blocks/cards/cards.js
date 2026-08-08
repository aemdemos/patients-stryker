import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // `resources` variant: PDF brochure card — cover image over a "LEARN MORE"
  // button, no visible title; image and button link to the same PDF.
  const isResources = block.classList.contains('resources');
  // In UE, skip the extra image-link restructuring: it moves the <picture> into
  // a new <a>, which the ue.js observer can't reconcile, collapsing the card
  // child. Styling is CSS-only, so the editor still shows the resources look.
  const isUEAuthoring = window.location.hostname.endsWith('.ue.da.live');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    if (isResources && !isUEAuthoring) {
      // wrap the image in the cell-2 "LEARN MORE" PDF link so it opens the PDF
      const [first, second] = li.children;
      const picture = first && first.querySelector('picture');
      const buttonLink = second && second.querySelector('a[href]');
      if (picture && buttonLink && !picture.closest('a')) {
        const imgLink = document.createElement('a');
        imgLink.href = buttonLink.getAttribute('href');
        imgLink.target = '_blank';
        imgLink.rel = 'noopener';
        picture.replaceWith(imgLink);
        imgLink.append(picture);
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
