/*
 * Local Nav Corp block: the www.stryker.com local page navigation.
 * Row 1: the parent page link. Row 2: the links shown in the bar. Row 3 (optional): the
 * links under the "•••" more menu (stryker.com fixes that split per page).
 * From 600px: a bar, the parent link on the left, the links on the right, then the more
 * menu. Below 600px: a button with the current page's name (the page title) that opens the
 * list of the parent and all the links.
 */

import { getMetadata } from '../../scripts/aem.js';

let menuCount = 0;

/**
 * The current page's name: the page title (og:title, else the document title without the
 * site suffix "… | Stryker"), without any bracket tags.
 */
function pageName() {
  const title = getMetadata('og:title') || document.title.split('|')[0];
  return title.replace(/\[\[[^\]]*\]|\]/g, '').replace(/\s+/g, ' ').trim();
}

/** The links of a row. */
function rowLinks(row) {
  return row ? [...row.querySelectorAll('a[href]')] : [];
}

/** A path without a trailing slash or .html, for comparing links with the current page. */
function pagePath(href) {
  return new URL(href, window.location.href).pathname.replace(/(\.html|\/)$/, '');
}

/** A list of links. */
function linkList(links, className) {
  const ul = document.createElement('ul');
  ul.className = className;
  links.forEach((link) => {
    const li = document.createElement('li');
    li.append(link);
    ul.append(li);
  });
  return ul;
}

/**
 * Makes a button open and close a panel (aria-expanded), and closes it on Escape or a click
 * outside the container.
 */
function disclosure(button, panel, container) {
  menuCount += 1;
  panel.id = `local-nav-corp-menu-${menuCount}`;
  panel.hidden = true;
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panel.id);
  const set = (open) => {
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      set(false);
      button.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) set(false);
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [parentRow, barRow, moreRow] = [...block.children];
  const parent = rowLinks(parentRow)[0];
  const bar = rowLinks(barRow);
  const more = rowLinks(moreRow);
  const copy = (link) => link.cloneNode(true);
  // the current page's link (stryker.com: black in the bar)
  const here = pagePath(window.location.href);
  [parent, ...bar, ...more].filter(Boolean).forEach((link) => {
    if (pagePath(link.href) === here) link.setAttribute('aria-current', 'page');
  });

  const nav = document.createElement('nav');
  nav.className = 'local-nav-corp-nav';
  nav.setAttribute('aria-label', parent ? parent.textContent.trim() : 'Section');

  // phones: the page name opens the list of the parent and all the links
  const toggle = document.createElement('button');
  toggle.className = 'local-nav-corp-toggle';
  toggle.textContent = pageName() || (parent ? parent.textContent.trim() : '');
  const list = linkList([parent, ...bar, ...more].filter(Boolean).map(copy), 'local-nav-corp-list');
  disclosure(toggle, list, nav);
  nav.append(toggle, list);

  // from 600px: the bar
  if (parent) {
    parent.className = 'local-nav-corp-parent';
    nav.append(parent);
  }
  nav.append(linkList(bar, 'local-nav-corp-links'));
  if (more.length) {
    const wrapper = document.createElement('div');
    wrapper.className = 'local-nav-corp-more';
    const button = document.createElement('button');
    button.className = 'local-nav-corp-more-button';
    // the "•••" icon is drawn in CSS; the label names the button
    button.setAttribute('aria-label', 'More pages');
    const menu = linkList(more, 'local-nav-corp-more-list');
    disclosure(button, menu, wrapper);
    wrapper.append(button, menu);
    nav.append(wrapper);
  }

  block.replaceChildren(nav);
}
