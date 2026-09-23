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
      main.innerHTML = await resp.text();

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

/**
 * True when `block` is the sole content of its section — a single block, no
 * default content — so the fragment's sections can be hoisted to `main` rather
 * than nested. Multi-fragment (card-merge) and in-content embeds return false.
 */
function isWholeSectionEmbed(section, block) {
  if (!section || section.querySelector(':scope > .default-content-wrapper')) return false;
  const blocks = section.querySelectorAll(':scope > div > .block');
  return blocks.length === 1 && blocks[0] === block;
}

/**
 * True when rendering inside the DA / Experience Workspace canvas (da.live),
 * either directly or in its preview iframe. The hoist below removes the fragment
 * block, which is what EW anchors its in-context "edit fragment" affordance to —
 * so in the editor we must keep the block (skip the hoist) and only hoist on the
 * delivered page.
 */
function isDaEditor() {
  try {
    const daHost = /(^|\.)da\.live$/;
    if (daHost.test(window.location.hostname)) return true;
    if (window.self !== window.top && document.referrer
      && daHost.test(new URL(document.referrer).hostname)) return true;
  } catch { /* cross-origin referrer — ignore */ }
  return false;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (!fragment) return;

  const section = block.closest('.section');
  const noCta = section?.classList.contains('no-cta');

  // Whole-section fragment: hoist its sections to be direct children of `main`
  // (replacing the host section) so an embedded fragment renders identically to
  // its standalone page — page/theme rules scoped to `main > .section` match.
  // Skipped in the DA/EW editor: the hoist removes the fragment block, and EW
  // needs that block in place to offer in-context fragment editing, so there we
  // keep it nested (the hoist still runs on the delivered page).
  const sections = [...fragment.children].filter((el) => el.classList.contains('section'));
  if (sections.length && isWholeSectionEmbed(section, block) && !isDaEditor()) {
    if (noCta) sections.forEach((s) => removeCtas(s));
    section.replaceWith(...sections);
    return;
  }

  // Otherwise inline the fragment inside the block (nested), preserving card-merge
  // and no-cta behaviour for multi-fragment / in-content embeds. `fragmentLoaded`
  // lets a section with several card fragments merge only once all have loaded.
  block.replaceChildren(...fragment.childNodes);
  block.dataset.fragmentLoaded = 'true';
  if (noCta) removeCtas(block);
  if (section) {
    const loaded = [...section.querySelectorAll('.fragment')]
      .every((f) => f.dataset.fragmentLoaded === 'true');
    if (loaded) mergeSectionCards(section);
  }
}
