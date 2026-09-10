import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateDMAssets, { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // Convert any Dynamic Media links to <picture>/<video> before restructuring.
  // decorateMain already ran this page-wide on first load, but the Universal
  // Editor re-renders this container from source in Layout view (restoring the
  // raw DM links) and re-runs only decorate() — so we re-convert here. Idempotent:
  // already-converted images are skipped. Without this the card images flash in,
  // then revert to plain links on the UE re-render.
  decorateDMAssets(block);

  // linked variant navigates within the site, so open in the same tab
  const isLinked = block.classList.contains('linked');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
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
