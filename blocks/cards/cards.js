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
      const imageDiv = li.querySelector('.cards-card-image');
      const body = li.querySelector('.cards-card-body');
      const link = body && body.querySelector('a[href]');
      const pic = imageDiv && imageDiv.querySelector('picture, img');
      if (link && pic) {
        const imgLink = document.createElement('a');
        imgLink.href = link.getAttribute('href');
        if (link.getAttribute('target')) imgLink.target = link.getAttribute('target');
        pic.replaceWith(imgLink);
        imgLink.append(pic);
      }
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only run the EDS image optimizer on same-origin/DAM images. External
    // hosts (e.g. Scene7 media-assets.stryker.com, which carry their own query
    // params like ?$max_width_1410$) break when the optimizer rewrites their
    // src, so leave those untouched.
    let external = false;
    try {
      external = new URL(img.src, window.location.href).origin !== window.location.origin;
    } catch { /* treat unparseable as local */ }
    if (external) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
