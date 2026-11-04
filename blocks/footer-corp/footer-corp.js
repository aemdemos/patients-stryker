/*
 * footer-corp — the www.stryker.com footer rendered from the authored /footer document.
 * Authored sections, in order:
 *   1 copyright line + legal links <ul> · 2 social icons <ul> (each item: DM icon link +
 *   destination link) · 3 secondary links <ul>
 * EW contract: authored nodes are MOVED (append); this file adds only wrappers and the
 * " | " separator the live footer paints between the copyright and the legal links.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function moveChildren(from, to) {
  if (!from) return to;
  while (from.firstChild) to.append(from.firstChild);
  return to;
}

function contentOf(section) {
  if (!section) return null;
  return section.querySelector(':scope > .default-content-wrapper') || section;
}

/**
 * Social items are authored as the DM icon link followed by the destination link
 * (`[YouTube](<icon url>) [YouTube](https://www.youtube.com/...)`). The icon renders as
 * a <picture>; move it into the destination link, which opens in a new tab (live).
 * @param {Element} social The social icons wrapper
 */
function linkSocialIcons(social) {
  social.querySelectorAll('li').forEach((li) => {
    const picture = li.querySelector('picture');
    const link = li.querySelector('a');
    if (!picture || !link) return;
    const name = picture.querySelector('img')?.alt || link.textContent.trim();
    link.textContent = '';
    link.append(picture);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (name) link.setAttribute('aria-label', `${name} (opens in a new tab)`);
    li.replaceChildren(link);
  });
}

/**
 * loads and decorates the site footer
 * @param {Element} block The footer-corp block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  block.textContent = '';
  if (!fragment || !fragment.textContent.trim()) {
    const footerEl = block.closest('footer');
    if (footerEl) footerEl.remove();
    return;
  }

  const [legal, social, secondary] = [...fragment.querySelectorAll(':scope > .section')]
    .map(contentOf);

  const container = el('div', 'container');

  // row 1: copyright + legal links (left), social icons (right column from 900px)
  const row1 = el('div', 'footer-row footer-row-social');
  const legalCol = el('div', 'footer-col footer-col-main');
  const legalWrap = moveChildren(legal, el('div', 'footer-legal'));
  const copyright = legalWrap.querySelector(':scope > p');
  if (copyright && legalWrap.querySelector('ul')) {
    const sep = el('span', 'footer-sep');
    sep.textContent = '|';
    copyright.after(sep);
  }
  legalCol.append(legalWrap);
  const socialCol = el('div', 'footer-col footer-col-side');
  const socialWrap = moveChildren(social, el('div', 'footer-social'));
  linkSocialIcons(socialWrap);
  socialCol.append(socialWrap);
  row1.append(legalCol, socialCol);

  // row 2: secondary (recall) links stacked
  const row2 = el('div', 'footer-row');
  const secondaryCol = el('div', 'footer-col footer-col-full');
  secondaryCol.append(moveChildren(secondary, el('div', 'footer-secondary')));
  row2.append(secondaryCol);

  container.append(row1, row2);
  block.append(container);
}
