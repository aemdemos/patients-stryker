import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // Convert authored DM links (<a href>) to <picture> on the block itself, so
  // rendering works independent of page-level decoration. Skipped in the UE
  // editor canvas: converting the <a> destroys the anchor UE binds the image/alt
  // fields to, which makes the image vanish and edits fail to persist. On the
  // live site page-level decorateMain handles this. Idempotent (see dm-support.js).
  const inUE = /\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname);
  if (!inUE) decorateDMAssets(block);

  // linked variant navigates within the site, so open in the same tab
  const isLinked = block.classList.contains('linked');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // Image cell = a cell holding just a <picture> (live/preview, where
      // decorateDMAssets already converted the DM link) OR a DM image link (the
      // UE canvas, where the anchor is kept and the picture is nested inside it —
      // see previewDMImageLinks). Matching the DM link too keeps the image cell
      // correctly styled in the editor regardless of preview timing.
      const dmLink = div.querySelector(':scope > p > a[href], :scope > a[href]');
      const isImageCell = (div.children.length === 1 && div.querySelector('picture'))
        || (dmLink && isDMSrc(dmLink.getAttribute('href')));
      div.className = isImageCell ? 'cards-card-image' : 'cards-card-body';
    });
    ul.append(li);
  });
  // brochure-cta only: author puts the PDF link on the title; we move it onto the
  // image (image becomes clickable, title renders as plain text). Workaround
  // while images are authored as DM links — a DM link can't also carry the PDF
  // href, so the link rides on the title instead. Works once images move to the
  // picker too (both are just <picture> here — dm-support ran before decoration).
  if (block.classList.contains('brochure-cta')) {
    ul.querySelectorAll('li').forEach((li) => {
      const titleLink = li.querySelector('.cards-card-body :is(h1, h2, h3, h4, h5, h6) a[href]');
      const picture = li.querySelector('.cards-card-image picture');
      if (!titleLink || !picture) return;
      const link = document.createElement('a');
      link.href = titleLink.getAttribute('href');
      picture.replaceWith(link);
      link.append(picture);
      // unlink the title, keeping its text
      titleLink.replaceWith(...titleLink.childNodes);
    });
  }
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
      const target = isLinked ? '_self' : '_blank';
      li.addEventListener('click', (e) => {
        if (!e.target.closest('a')) window.open(link.href, target, 'noopener');
      });
      link.target = target;
      link.rel = 'noopener';
    }
  });
}
