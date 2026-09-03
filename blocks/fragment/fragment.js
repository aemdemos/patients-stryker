/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
  removeCtas,
  mergeSectionCards,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      // Parse the fetched markup with DOMParser and adopt its nodes rather than
      // assigning to innerHTML. innerHTML is banned (Hard Rule #1): it destroys
      // UE data-aue-* instrumentation and trips the strict Trusted Types CSP,
      // which was breaking fragment decoration (and every section after it, plus
      // the header/footer that reuse this loader) in the Universal Editor.
      const parsed = new DOMParser().parseFromString(await resp.text(), 'text/html');
      main.append(...parsed.body.childNodes);

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) block.replaceChildren(...fragment.childNodes);

  // mark this fragment block as loaded so we can detect when all fragments in a
  // section are ready before consolidating their cards
  block.dataset.fragmentLoaded = 'true';

  // If this fragment sits in a section flagged `no-cta`, strip the fragment's
  // CTA button/link from the DOM. Fragments load async (after the host page's
  // decorateMain has run), so the removal must happen here — once the fragment
  // content is inlined — rather than in the page-level pass.
  const section = block.closest('.section');
  if (section && section.classList.contains('no-cta')) removeCtas(block);

  // When a section holds multiple fragment blocks (e.g. two card fragments under
  // one heading), merge their cards into a single grid once ALL of them have
  // finished loading — so they render as one row instead of stacked grids.
  if (section) {
    const fragmentBlocks = [...section.querySelectorAll('.fragment')];
    const allLoaded = fragmentBlocks.every((f) => f.dataset.fragmentLoaded === 'true');
    if (allLoaded) mergeSectionCards(section);
  }
}
