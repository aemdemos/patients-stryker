/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import { decorateMain } from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Removes CTA links/buttons from sections styled with `no-cta`.
 * Runs after fragment content loads so hidden CTAs are removed from the DOM.
 * @param {Element} scope The container to clean
 */
export function removeCtas(scope) {
  scope.querySelectorAll('.button-wrapper').forEach((wrapper) => {
    const cta = wrapper.querySelector('a.button');
    if (!cta) return;
    const href = cta.getAttribute('href');

    // Move the CTA PDF link onto the card image before removing the button.
    // This keeps brochure cards clickable on `no-cta` sections.
    const card = wrapper.closest('li') || wrapper.closest('.cards-card-image, .cards-card-body')?.parentElement;
    const image = card && card.querySelector('.cards-card-image picture, .cards-card-image img');
    if (href && image && !image.closest('a')) {
      const picture = image.closest('picture') || image;
      const holder = picture.closest('.cards-card-image') || picture.parentElement;
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      picture.replaceWith(a);
      a.append(picture);
      // keep the click target obvious for the whole image cell
      if (holder) holder.style.cursor = 'pointer';
    }

    wrapper.remove();
  });
}

/**
 * Merges multiple `.cards` blocks in a section into one grid.
 * Preserves the first block's variant classes and removes empty extras.
 *
 * Only merges grids that live in distinct fragment wrappers (or none) — e.g.
 * several `/fragments/card-*` embeds under one heading. Cards blocks that share
 * one `.fragment` wrapper (one body fragment inlining two grids) are left alone,
 * since removing that shared wrapper would delete the whole fragment.
 * @param {Element} section The section to consolidate
 */
export function mergeSectionCards(section) {
  const cardsBlocks = [...section.querySelectorAll('.cards')];
  if (cardsBlocks.length < 2) return;

  // skip any block that shares its fragment wrapper with another cards block
  const fragmentOf = (block) => block.closest('.fragment-wrapper') || block.closest('.fragment');
  const mergeable = cardsBlocks.filter((block) => {
    const frag = fragmentOf(block);
    if (!frag) return true; // no fragment wrapper — safe to merge/remove the block itself
    return cardsBlocks.filter((b) => fragmentOf(b) === frag).length === 1;
  });
  if (mergeable.length < 2) return;

  const first = mergeable[0];
  const targetList = first.querySelector(':scope > ul');
  if (!targetList) return;

  mergeable.slice(1).forEach((block) => {
    block.querySelectorAll(':scope > ul > li').forEach((li) => targetList.append(li));
    // remove the emptied cards block and its now-empty fragment/section wrappers
    const fragmentRoot = fragmentOf(block) || block;
    fragmentRoot.remove();
  });
}

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
  const sections = [...fragment.children].filter((el) => el.classList.contains('section'));
  if (sections.length && isWholeSectionEmbed(section, block)) {
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
