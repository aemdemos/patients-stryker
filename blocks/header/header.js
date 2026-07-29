import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width (mobile below this)
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav.getAttribute('aria-expanded') === 'true') {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, false);
      nav.querySelector('.nav-hamburger button').focus();
    }
  }
}

/**
 * Toggles the whole mobile nav
 * @param {Element} nav The nav element
 * @param {Boolean} forceExpanded Optional — force a specific state
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
  if (!expanded && !isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Replaces a `:search:` token paragraph with a real search form.
 * Form controls are built here (not authored in the fragment) per the nav contract.
 * @param {Element} tools The nav-tools section
 */
function buildSearch(tools) {
  const tokenP = [...tools.querySelectorAll('p')]
    .find((p) => p.textContent.trim() === ':search:');
  if (!tokenP) return;
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = 'https://patients.stryker.com/us/en/ent/search.html';
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'nav-search-input';
  input.placeholder = 'Search this site';
  input.setAttribute('aria-label', 'Search this site');

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Search');

  form.append(input, submit);
  tokenP.replaceWith(form);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/content/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Sections: brand (logo), sections (primary links), tools (Stryker.com + search)
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Brand: strip button styling EDS may add to the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.classList.remove('button');
      const container = brandLink.closest('.button-container');
      if (container) container.className = '';
    }
  }

  // Tools: build the search form from the :search: token
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) buildSearch(navTools);

  // Group the gold nav (links + Stryker.com) into one drawer that can slide in
  // from the left on mobile. On desktop `.nav-drawer` uses display:contents so
  // the grid still places .nav-sections and .nav-tools directly.
  const navSections = nav.querySelector('.nav-sections');
  const navDrawer = document.createElement('div');
  navDrawer.className = 'nav-drawer';
  if (navSections) navDrawer.append(navSections);
  if (navTools) navDrawer.append(navTools);
  nav.append(navDrawer);

  // mobile search toggle (magnifier) — mirrors the source's mobile search icon
  const searchToggle = document.createElement('button');
  searchToggle.type = 'button';
  searchToggle.className = 'nav-search-toggle';
  searchToggle.setAttribute('aria-label', 'Toggle search');
  searchToggle.addEventListener('click', () => {
    const open = nav.getAttribute('data-search') === 'open';
    nav.setAttribute('data-search', open ? 'closed' : 'open');
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.append(searchToggle, hamburger);
  // collapsed by default; on desktop the sections are always shown via CSS
  nav.setAttribute('aria-expanded', 'false');
  nav.setAttribute('data-search', 'closed');

  // when returning to desktop, ensure any open mobile menu is reset
  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) toggleMenu(nav, false);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
