/*
 * header-corp — the www.stryker.com chrome rendered from the authored /nav document:
 * white logo row + gold primary-nav bar with fly-outs from 900px (live: 1024px), single row with an
 * off-canvas gold drawer below. Authored sections, in order:
 *   1 brand logo link · 2 utility links <ul> · 3 locale (globe image + link)
 *   4 search link (href = search action, text = input placeholder)
 *   5 primary nav <ul> with nested fly-out <ul> columns (an <li> without a link is a
 *     group label, e.g. "Our Business") · 6 HCP notice band text (shown when the page
 *     metadata `hcp-banner: true` sets body.hcp-banner)
 * EW contract: authored nodes are MOVED (append), never rebuilt; this file adds only
 * wrappers and controls (hamburger, search form, back rows).
 * @ew-exempt search: the search link's text is the input placeholder (text-as-metadata);
 * the authored <p> stays in the DOM, hidden, so it remains the editable source.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DESKTOP = window.matchMedia('(width >= 900px)'); // EDS step; must match header-corp.css

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/** moves every child of `from` into `to` (EW1: move, do not rebuild) */
function moveChildren(from, to) {
  if (!from) return to;
  while (from.firstChild) to.append(from.firstChild);
  return to;
}

/**
 * Wraps a link's authored children in <span class="text"> — the live markup
 * (<a><span class="text">Careers</span></a>) floats the text span inside a zero-width
 * anchor. The nodes are moved, not rebuilt; the list keeps its editable index.
 */
function wrapLinkText(a, className = 'text') {
  if (!a || a.querySelector(':scope > span.text')) return;
  const span = el('span', className);
  while (a.firstChild) span.append(a.firstChild);
  a.append(span);
}

/** the authored content of a fragment section, whatever wrapper decorateMain left */
function contentOf(section) {
  if (!section) return null;
  return section.querySelector(':scope > .default-content-wrapper') || section;
}

/** the real search form (not authored): action + placeholder come from the authored link */
function buildSearchBar(source) {
  const link = source && source.querySelector('a[href]');
  const bar = el('div', 'search-bar');
  const form = el('form', 'search-form', { role: 'search', method: 'get' });
  form.action = link ? link.getAttribute('href') : '/us/en/search';
  const label = link ? link.textContent.trim() : 'Search this site';
  const input = el('input', 'search-control', {
    type: 'text', name: 'q', placeholder: label, 'aria-label': label,
  });
  const submit = el('button', 'search-submit icon-search', { type: 'submit', 'aria-label': 'Search' });
  form.append(input, submit);
  bar.append(form);
  if (source) {
    // keep the authored placeholder text as the (hidden) editable source
    const src = el('div', 'search-source', { hidden: '' });
    bar.append(moveChildren(source, src));
  }
  return bar;
}

function buildMenuButton() {
  const wrap = el('div', 'menu-btn');
  const button = el('button', 'menu-toggle', {
    type: 'button', 'aria-label': 'Open navigation', 'aria-expanded': 'false',
  });
  for (let i = 0; i < 3; i += 1) button.append(el('span', 'icon-bar'));
  wrap.append(button);
  return wrap;
}

function buildSearchToggle() {
  const wrap = el('div', 'search-btn');
  wrap.append(el('button', 'search-toggle icon-search', {
    type: 'button', 'aria-label': 'Toggle search', 'aria-expanded': 'false',
  }));
  return wrap;
}

/**
 * Builds one fly-out panel from a primary item's nested lists. Column weight follows the
 * live site: link-only columns are bold until a group-label column appears, after which
 * the label is bold and the business links are regular (li.nav-unbold).
 */
function buildPanel(li, index) {
  const lists = [...li.querySelectorAll(':scope > ul')];
  if (!lists.length) return null;
  const panel = el('div', 'secondary-nav', { 'data-nav': index });
  const back = el('a', 'back', { href: '#', 'aria-label': 'Back to the main menu' });
  back.textContent = 'back';
  const columns = el('div', 'secondary-nav-columns');
  let labelSeen = false;
  lists.forEach((ul) => {
    [...ul.children].forEach((item) => {
      if (!item.querySelector('a')) {
        item.classList.add('bold', 'label');
        labelSeen = true;
      } else {
        item.classList.add(labelSeen ? 'nav-unbold' : 'bold');
      }
    });
    columns.append(ul);
  });
  panel.append(back, columns);
  return panel;
}

/** the item's own link (the pipeline wraps it in <p> when the item also holds a list) */
function itemLink(li) {
  return li.querySelector(':scope > a, :scope > p > a');
}

function closeDrawer(block) {
  block.classList.remove('show-main-nav', 'show-secondary-nav');
  block.querySelectorAll('.secondary-nav.active').forEach((p) => p.classList.remove('active'));
  block.querySelectorAll('.main-nav li.open').forEach((p) => p.classList.remove('open'));
  const toggle = block.querySelector('.menu-toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  }
  block.querySelectorAll('.main-nav li.has-sub').forEach((li) => itemLink(li).setAttribute('aria-expanded', 'false'));
}

function closePanels(block) {
  block.classList.remove('show-secondary-nav');
  block.querySelectorAll('.secondary-nav.active').forEach((p) => p.classList.remove('active'));
  block.querySelectorAll('.main-nav li.open').forEach((p) => p.classList.remove('open'));
  block.querySelectorAll('.main-nav li.has-sub').forEach((li) => itemLink(li).setAttribute('aria-expanded', 'false'));
}

function openPanel(block, li) {
  closePanels(block);
  li.classList.add('open');
  const a = itemLink(li);
  if (a) a.setAttribute('aria-expanded', 'true');
  const panel = block.querySelector(`.secondary-nav[data-nav="${li.dataset.nav}"]`);
  if (panel) panel.classList.add('active');
  if (!DESKTOP.matches) block.classList.add('show-secondary-nav');
}

function wireBehaviour(block) {
  const toggle = block.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => {
    block.classList.add('anim');
    const open = block.classList.toggle('show-main-nav');
    if (!open) closePanels(block);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  const searchToggle = block.querySelector('.search-toggle');
  const searchBar = block.querySelector('.search-bar');
  searchToggle.addEventListener('click', () => {
    const shown = searchBar.classList.toggle('is-shown');
    searchToggle.setAttribute('aria-expanded', String(shown));
    if (shown) searchBar.querySelector('input').focus();
  });

  block.querySelectorAll('.main-nav li.has-sub').forEach((li) => {
    const a = itemLink(li);
    if (!a) return;
    a.setAttribute('aria-haspopup', 'true');
    a.setAttribute('aria-expanded', 'false');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (li.classList.contains('open')) closePanels(block);
      else openPanel(block, li);
    });
  });

  block.querySelectorAll('.secondary-nav .back').forEach((back) => {
    back.addEventListener('click', (e) => {
      e.preventDefault();
      closePanels(block);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeDrawer(block);
  });
  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) closePanels(block);
  });
  DESKTOP.addEventListener('change', () => closeDrawer(block));
}

/**
 * loads and decorates the site header
 * @param {Element} block The header-corp block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > .section')].map(contentOf);
  const [brand, utility, locale, search, primary, hcp] = sections;

  // white row
  const global = el('div', 'global-header');
  const container = el('div', 'container');
  global.append(container);
  const logo = moveChildren(brand, el('div', 'logo'));
  const utilityNav = moveChildren(utility, el('nav', 'utility-links', { 'aria-label': 'Utility' }));
  utilityNav.querySelectorAll('li > a, li > p > a').forEach((a) => wrapLinkText(a));
  const localeDiv = moveChildren(locale, el('div', 'language-country-select'));
  localeDiv.querySelectorAll('a').forEach((a) => {
    if (!a.querySelector('img, picture')) wrapLinkText(a, 'text site-language');
  });
  container.append(
    logo,
    buildMenuButton(),
    buildSearchBar(search),
    localeDiv,
    buildSearchToggle(),
    utilityNav,
  );

  // gold primary-nav bar + fly-outs (desktop) / off-canvas drawer (mobile)
  const megamenu = el('div', 'megamenu');
  const navContainer = el('div', 'nav-container');
  const navContent = el('div', 'nav-content');
  const mainNav = el('div', 'main-nav');
  const mainContainer = el('div', 'container');
  const nav = el('nav', '', { 'aria-label': 'Main' });
  const mainList = primary && primary.querySelector('ul');
  if (mainList) {
    mainList.classList.add('main');
    [...mainList.children].forEach((li, i) => {
      li.dataset.nav = i;
      const panel = buildPanel(li, i);
      if (panel) {
        li.classList.add('has-sub');
        navContent.append(panel);
      } else {
        li.classList.add('leaf');
      }
    });
    nav.append(mainList);
  }
  mainContainer.append(nav);
  mainNav.append(mainContainer);
  navContent.prepend(mainNav);
  navContainer.append(navContent);
  megamenu.append(navContainer);

  block.append(global, megamenu);

  // HCP notice band (visible only on body.hcp-banner pages)
  if (hcp && hcp.textContent.trim()) {
    const band = el('div', 'hcp-band');
    band.append(moveChildren(hcp, el('div', 'container')));
    block.append(band);
  }

  wireBehaviour(block);
}
