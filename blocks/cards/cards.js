import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';

export default function decorate(block) {
  // `cta` variant: no image, each card is a shadowed text box with a
  // "LEARN MORE" call-to-action button rendered below and OUTSIDE the box.
  const isCta = block.classList.contains('cta');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    // CTA cards carry no image; if authored with a 2-column card the empty
    // image cell would render as a blank body box, so drop empty cells here.
    if (isCta) {
      [...li.children].forEach((div) => {
        if (!div.textContent.trim() && !div.querySelector('picture, img')) div.remove();
      });
    }
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    if (isCta) {
      // Lift the CTA (a paragraph whose only content is a link) out of the
      // body box so it sits below the card as a standalone button.
      const body = li.querySelector('.cards-card-body');
      if (body) {
        const ctaP = [...body.querySelectorAll(':scope > p')].reverse().find((p) => {
          const a = p.querySelector('a');
          return a && p.textContent.trim() === a.textContent.trim();
        });
        if (ctaP) {
          // reuse the global gold button styling (a.button.accent from styles.css)
          const a = ctaP.querySelector('a');
          a.className = 'button accent';
          const cta = document.createElement('div');
          cta.className = 'cards-card-cta';
          cta.append(a);
          ctaP.remove();
          li.append(cta);
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
