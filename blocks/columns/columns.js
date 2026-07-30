import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// matches URLs that point at an image, incl. Scene7/DMS links without a file
// extension (e.g. .../is/image/stryker/foo?params)
const IMAGE_URL = /(\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$)|(\/is\/image\/)/i;

/**
 * Render authored external-image links as <img> elements.
 * Authors add the image as a LINK to its URL (not an image upload) so Edge
 * Delivery keeps the original external src instead of ingesting/rehosting it.
 * @param {Element} block the columns block
 */
function decorateExternalImages(block) {
  block.querySelectorAll('a[href]').forEach((link) => {
    const { href } = link;
    // only convert autolinks (href === text) that resolve to an image URL
    if (!IMAGE_URL.test(href) || link.textContent.trim() !== href) return;

    const img = document.createElement('img');
    img.src = href;
    img.loading = 'lazy';
    const alt = link.getAttribute('title');
    if (alt) img.alt = alt;

    const picture = document.createElement('picture');
    picture.append(img);
    moveInstrumentation(link, picture);
    link.replaceWith(picture);
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  decorateExternalImages(block);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
