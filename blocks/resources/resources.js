/*
 * resources — the www.stryker.com c-resourcesanddownload grid: portrait document
 * thumbnails (PDF covers on a 1px rule) over a bold Futura h5 title, both linking
 * to the file; no button (the frozen `cards resources` variant adds LEARN MORE).
 * Reconstructive: one authored row per item. Shared by the product-detail pages
 * (30) and any page carrying a "Resources and downloads" group.
 *
 * Authoring model:
 *   | picture | <h5><a href="…/file.pdf">Title</a></h5> |   one row per item
 *   (cells in either order; the title may also be a <p><a>…</a></p>). The group
 *   heading is default content above the block: <h2><u>Resources and downloads</u></h2>
 *   → .underline (live h2.component-subheading.border-bottom-gold).
 *
 * Decode (EW contract): the authored row <div> is the item and its cells become
 * .resources-thumb / .resources-title (classes only); nodes are moved, never
 * rebuilt. The thumbnail is wrapped in a generated <a> that copies the title
 * link's target so the cover is clickable like the live `.img-container > a`
 * (no text of its own; hidden from the accessibility tree as a duplicate).
 */

const FILE_LINK = /\.(pdf|docx?|pptx?|xlsx?|zip)(\?|#|$)/i;

/**
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell carries an image and no text
 */
function isImageCell(cell) {
  return !!cell.querySelector('picture, img') && !cell.textContent.trim();
}

/**
 * Strips runtime button classes from a title link (never a CTA button).
 * @param {HTMLAnchorElement} link the authored title link
 */
function plainLink(link) {
  link.classList.remove('button', 'primary', 'secondary', 'accent');
  if (!link.className) link.removeAttribute('class');
  const p = link.closest('p');
  if (p) p.classList.remove('button-wrapper', 'button-container');
  if (FILE_LINK.test(link.getAttribute('href') || '')) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
}

/**
 * @param {Element} row an authored item row
 */
function decorateItem(row) {
  row.classList.add('resources-item');
  const cells = [...row.children];
  const thumb = cells.find(isImageCell) || null;
  const text = cells.find((c) => c !== thumb) || null;
  if (thumb) thumb.classList.add('resources-thumb');
  if (text) text.classList.add('resources-title');

  const link = text ? text.querySelector('a[href]') : null;
  if (!link) return;
  plainLink(link);

  const media = thumb ? thumb.querySelector('picture, img') : null;
  if (media && !media.closest('a')) {
    const cover = document.createElement('a');
    cover.href = link.getAttribute('href');
    if (link.target) cover.target = link.target;
    if (link.rel) cover.rel = link.rel;
    cover.className = 'resources-cover';
    cover.tabIndex = -1;
    cover.setAttribute('aria-hidden', 'true');
    media.replaceWith(cover);
    cover.append(media);
  }
}

/**
 * @param {Element} block the resources block
 */
export default function decorate(block) {
  [...block.children].forEach(decorateItem);
}
