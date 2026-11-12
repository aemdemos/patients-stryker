// Page Nav — navigation within the page or its page family. One row per item: label | target.
// default — jump links: the page's sections as a row of links in the page (in-page `#id`
//   targets; a cell holding a `#` link also works). Not sticky, no scroll-spy.
// `sticky` — the anchor bar pinned to the top with scroll-spy and the phone menu
// `local` — page family navigation: row 1 = parent page, then one row per child page
// `sticky` and `local` run the Sticky Nav code and styles (blocks/sticky-nav), so the two
// blocks share one implementation and Sticky Nav pages render as before.
import { loadCSS } from '../../scripts/aem.js';
import decorateStickyNav from '../sticky-nav/sticky-nav.js';

/** Bare anchor id from a link or a typed target: the part after `#`, else the text. */
const anchorId = (s) => {
  const v = (s || '').trim();
  return v.includes('#') ? v.slice(v.indexOf('#') + 1) : v;
};

/**
 * The jump-link items of the block: a `label | target` row, or every cell holding a `#` link.
 * @param {Element} block
 * @returns {{label: string, id: string}[]}
 */
function readItems(block) {
  const items = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [labelCell, targetCell] = cells;
    const targetLink = targetCell?.querySelector('a[href]');
    const typedTarget = targetCell && !targetLink && cells.length === 2 ? targetCell.textContent : '';
    if (cells.length === 2 && labelCell && !labelCell.querySelector('a[href]') && (targetLink || typedTarget.trim())) {
      const id = anchorId(targetLink ? targetLink.getAttribute('href') : typedTarget);
      const label = labelCell.textContent.trim();
      if (label && id) items.push({ label, id });
      return;
    }
    cells.forEach((cell) => cell.querySelectorAll('a[href*="#"]').forEach((a) => {
      const id = anchorId(a.getAttribute('href'));
      const label = a.textContent.trim();
      if (label && id) items.push({ label, id });
    }));
  });
  return items;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  if (block.classList.contains('sticky') || block.classList.contains('local')) {
    // a row of one link (the jump-links form) → label | target, the Sticky Nav form
    [...block.children].forEach((row) => {
      const cells = [...row.children];
      const link = cells.length === 1 && cells[0].querySelector('a[href]');
      if (!link || cells[0].textContent.trim() !== link.textContent.trim()) return;
      const label = document.createElement('div');
      label.textContent = link.textContent.trim();
      const target = document.createElement('div');
      target.append(link);
      row.replaceChildren(label, target);
    });
    await loadCSS(`${window.hlx.codeBasePath}/blocks/sticky-nav/sticky-nav.css`);
    block.classList.add('sticky-nav');
    block.closest('.section')?.classList.add('sticky-nav-container');
    decorateStickyNav(block);
    return;
  }

  const items = readItems(block);
  if (!items.length) {
    block.textContent = '';
    return;
  }
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Page sections');
  const list = document.createElement('ul');
  list.className = 'page-nav-links';
  items.forEach(({ label, id }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = label;
    li.append(a);
    list.append(li);
  });
  nav.append(list);
  block.replaceChildren(nav);
}
