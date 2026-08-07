import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // `resources` variant: PDF brochure card — a cover image stacked above a
  // "LEARN MORE" button. The image links to the same PDF as the card's bold
  // link (which the global decorateButtons turns into a teal primary button).
  // There is no visible title; the brochure name lives in the picker-authored
  // image alt text.
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
      // Authoring contract: the FIRST cell holds the image chosen via the UE
      // reference picker, which renders as a <picture>; the SECOND cell holds
      // the "LEARN MORE" PDF link. Keep the legacy link-based fallback so older
      // authored content still decorates correctly.
      const [first, second] = li.children;
      if (first) first.className = 'cards-card-image';
      if (second) second.className = 'cards-card-body';
      const picture = first && first.querySelector('picture');
      const srcLink = !picture && first ? first.querySelector('a[href]') : null;
      const pdfLink = second && second.querySelector('a[href]');
      if (picture) {
        first.replaceChildren();
        if (pdfLink) {
          const imgLink = document.createElement('a');
          imgLink.href = pdfLink.getAttribute('href');
          if (pdfLink.getAttribute('target')) imgLink.target = pdfLink.getAttribute('target');
          imgLink.append(picture);
          first.append(imgLink);
        } else {
          first.append(picture);
        }
      } else if (srcLink) {
        const img = document.createElement('img');
        img.src = srcLink.getAttribute('href');
        img.alt = srcLink.textContent.trim();
        img.loading = 'lazy';
        first.textContent = '';
        if (pdfLink) {
          const imgLink = document.createElement('a');
          imgLink.href = pdfLink.getAttribute('href');
          if (pdfLink.getAttribute('target')) imgLink.target = pdfLink.getAttribute('target');
          imgLink.append(img);
          first.append(imgLink);
        } else {
          first.append(img);
        }
      }
    }

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
