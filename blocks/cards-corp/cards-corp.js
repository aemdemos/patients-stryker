/*
 * cards-corp — www.stryker.com card grids, forked from the patients `cards` block (the
 * patients block is never edited). Variants:
 *   (default) / linked / image-link   the patients cards tiles (corp keeps block flow)
 *   resources        c-resourcesanddownload: portrait document thumbnails over a bold
 *                    Futura title, both linking to the file; no button. One row per item:
 *                    | picture | <h5><a href="…/file.pdf">Title</a></h5> | (either order)
 *   curated-teasers  c-customizeable news teasers: image, h3, copy and a plain
 *                    uppercase "Learn more" link; 4-up when four are authored
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';

const FILE_LINK = /\.(pdf|docx?|pptx?|xlsx?|zip)(\?|#|$)/i;

/**
 * Strips runtime button classes from a link that must render as plain text.
 * @param {HTMLAnchorElement} link the authored link
 */
function plainLink(link) {
  link.classList.remove('button', 'primary', 'secondary', 'accent');
  if (!link.className) link.removeAttribute('class');
  const p = link.closest('p');
  if (p) p.classList.remove('button-wrapper', 'button-container');
}

/**
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell carries an image and no text
 */
function isImageCell(cell) {
  return !!cell.querySelector('picture, img') && !cell.textContent.trim();
}

/**
 * resources: the authored row is the item and its cells become thumb / title (classes
 * only, nodes are moved, never rebuilt). The thumbnail is wrapped in a generated <a> that
 * copies the title link so the cover is clickable like the live `.img-container > a`
 * (no text of its own; hidden from the accessibility tree as a duplicate).
 * @param {Element} row an authored item row
 */
function decorateResourcesItem(row) {
  row.classList.add('cards-corp-item');
  const cells = [...row.children];
  const thumb = cells.find(isImageCell) || null;
  const text = cells.find((c) => c !== thumb) || null;
  if (thumb) thumb.classList.add('cards-corp-thumb');
  if (text) text.classList.add('cards-corp-title');

  const link = text ? text.querySelector('a[href]') : null;
  if (!link) return;
  plainLink(link);
  if (FILE_LINK.test(link.getAttribute('href') || '')) {
    link.target = '_blank';
    link.rel = 'noopener';
  }

  const media = thumb ? thumb.querySelector('picture, img') : null;
  if (media && !media.closest('a')) {
    const cover = document.createElement('a');
    cover.href = link.getAttribute('href');
    if (link.target) cover.target = link.target;
    if (link.rel) cover.rel = link.rel;
    cover.className = 'cards-corp-cover';
    cover.tabIndex = -1;
    cover.setAttribute('aria-hidden', 'true');
    media.replaceWith(cover);
    cover.append(media);
  }
}

export default function decorate(block) {
  // convert DM links to <picture> before restructuring — the canvas re-renders
  // fields from source, so re-run here (idempotent), not just in decorateMain
  decorateDMAssets(block);

  if (block.classList.contains('resources')) {
    [...block.children].forEach(decorateResourcesItem);
    return;
  }

  // linked variant navigates within the site, so open in the same tab
  const isLinked = block.classList.contains('linked');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-corp-card-image';
      else div.className = 'cards-corp-card-body';
    });
    ul.append(li);
  });
  // image-link only: the image links to the card's CTA ("Learn more") target. Needed
  // while images are authored as DM links, which can't also carry the page href.
  const isImageLink = block.classList.contains('image-link');
  if (isImageLink) {
    ul.querySelectorAll('li').forEach((li) => {
      const cta = [...li.querySelectorAll('.cards-corp-card-body a[href]')].pop();
      const picture = li.querySelector('.cards-corp-card-image picture');
      if (!cta || !picture || picture.closest('a')) return;
      const link = document.createElement('a');
      link.href = cta.getAttribute('href');
      picture.replaceWith(link);
      link.append(picture);
    });
  }
  // curated-teasers: the "Learn more" link is a plain uppercase link, never a button
  if (block.classList.contains('curated-teasers')) {
    ul.querySelectorAll('.cards-corp-card-body p > a:only-child').forEach(plainLink);
  }
  ul.querySelectorAll('picture > img').forEach((img) => {
    // dm-support.js already rendered DM images at native quality; re-optimizing
    // them forces width=750 + optimize=medium and would degrade quality.
    if (isDMSrc(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  // lift the image out of the editor wrapper so the canvas can't re-render the
  // raw link over it (mirrors hero); harmless unwrap on the live site
  ul.querySelectorAll('.cards-corp-card-image').forEach((cell) => {
    const picture = cell.querySelector('picture');
    if (!picture) return;
    const link = picture.closest('a');
    cell.replaceChildren(link || picture);
  });

  block.replaceChildren(ul);

  ul.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a');
    if (link) {
      const target = isLinked ? '_self' : '_blank';
      // Only the `linked` variant makes the whole card clickable (it links to a page).
      if (isLinked) {
        li.addEventListener('click', (e) => {
          if (!e.target.closest('a')) window.open(link.href, target, 'noopener');
        });
      }
      // image-link: image and CTA lead to the same page, so both open the same way
      (isImageLink ? li.querySelectorAll('a') : [link]).forEach((a) => {
        a.target = target;
        a.rel = 'noopener';
      });
    }
  });
}
