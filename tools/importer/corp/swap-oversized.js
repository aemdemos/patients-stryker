/*
 * Images over 20 MB, which Edge Delivery cannot preview (AEM_BACKEND_DOC_IMAGE_TOO_BIG) → the
 * smaller version the source has (oversized-images.js, from scan-oversized-images.mjs). Used by
 * the page importer (corp-import.js) and the fragment importer (xf-fragments.js).
 */
import OVERSIZED_IMAGES from './oversized-images.js';

/**
 * Swaps the oversized images of a document.
 * @param {Element} root the document's content
 * @returns {string[]} report notes, one per image (a Dynamic Media raw file, an animated GIF,
 *   becomes a still)
 */
export default function swapOversizedImages(root) {
  const notes = [];
  root.querySelectorAll('img[src]').forEach((img) => {
    const smaller = OVERSIZED_IMAGES[img.getAttribute('src')];
    if (!smaller) return;
    img.setAttribute('src', smaller);
    notes.push(`image over 20 MB → smaller version${smaller.includes('/is/image/') ? ' (a still, if it was animated)' : ''}: ${smaller.split('?')[0].split('/').pop()}`);
  });
  return notes;
}
