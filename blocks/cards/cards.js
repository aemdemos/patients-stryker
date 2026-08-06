import { createOptimizedPicture } from '../../scripts/aem.js';
import { isDMSrc } from '../../scripts/dm-support.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * `resources` variant: a PDF brochure card — cover image stacked above a
 * "LEARN MORE" button, no visible title. Cell 1 is the cover, cell 2 the link.
 * The cover comes from (in order) the DAM picker / a DM picture, a DM link
 * pasted into the text cell (converted by dm-support.js), or a legacy link.
 * The cover is wrapped in the PDF link so it shares the button's target.
 * Existing nodes are re-parented (not rebuilt) so UE field instrumentation
 * survives a reload.
 * @param {HTMLLIElement} li the card
 */
function decorateResourceCard(li) {
  const [first, second] = li.children;
  if (!first) return;
  first.className = 'cards-card-image';
  if (second) second.className = 'cards-card-body';

  const pdfLink = second && second.querySelector('a[href]');

  let cover = first.querySelector('picture') || (second && second.querySelector('picture'));
  const legacyLink = !cover && first.querySelector('a[href]');
  if (legacyLink) {
    cover = document.createElement('img');
    cover.src = legacyLink.getAttribute('href');
    cover.alt = legacyLink.textContent.trim();
    cover.loading = 'lazy';
    moveInstrumentation(legacyLink, cover);
  }

  if (cover) {
    // image and button are both PDF links opening in a new tab (matches source)
    if (pdfLink) {
      const imgLink = document.createElement('a');
      imgLink.href = pdfLink.getAttribute('href');
      imgLink.target = '_blank';
      imgLink.rel = 'noopener';
      imgLink.append(cover);
      first.prepend(imgLink);
    } else {
      first.prepend(cover);
    }
    // drop anything left in cell 1 other than the cover (e.g. a legacy link)
    [...first.children].forEach((child) => {
      if (!child.contains(cover)) child.remove();
    });
  }

  if (pdfLink) {
    pdfLink.target = '_blank';
    pdfLink.rel = 'noopener';
    // wrap the CTA link in a <p> (in place) so the global decorateButtons
    // promotes it — leaves the text cell's richtext instrumentation on `second`
    const cta = pdfLink.closest('strong') || pdfLink;
    if (cta.parentElement && cta.parentElement.tagName !== 'P') {
      const p = document.createElement('p');
      cta.replaceWith(p);
      p.append(cta);
    }
  }
}

export default function decorate(block) {
  const isResources = block.classList.contains('resources');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    if (isResources) {
      decorateResourceCard(li);
    } else {
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
        else div.className = 'cards-card-body';
      });
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

  // resources cards expose their own image + button links (handled above); the
  // rest of the card is not clickable. Only default cards make the whole card
  // a link to their single anchor.
  if (!isResources) {
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
}
