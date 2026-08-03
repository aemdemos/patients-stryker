import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // `resources` variant: PDF brochure card — a cover image stacked above a
  // "LEARN MORE" button. The image links to the same PDF as the card's bold
  // link (which the global decorateButtons turns into a teal primary button).
  // There is no visible title; the brochure name lives in the image alt text.
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
      // Authoring contract: the FIRST cell holds a LINK whose href is the
      // (external) image URL and whose text is the alt; the SECOND cell holds
      // the "LEARN MORE" PDF link. Authoring the image as a link (not an
      // <img>) keeps the external Scene7 URL intact through DA/preview/publish/UE
      // — DA rewrites an external <img src> to about:error, but leaves link hrefs
      // alone. Here we build the <img> from that link and wrap it in an anchor to
      // the PDF so clicking the image opens the same target as the button.
      const [first, second] = li.children;
      if (first) first.className = 'cards-card-image';
      if (second) second.className = 'cards-card-body';
      const srcLink = first && first.querySelector('a[href]');
      const pdfLink = second && second.querySelector('a[href]');
      if (srcLink) {
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
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
