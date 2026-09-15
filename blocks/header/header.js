import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width (mobile below this)
const isDesktop = window.matchMedia('(min-width: 900px)');

// single source for the search form target — could later be sourced from nav
// fragment metadata so locale/site changes don't require a code edit
const SEARCH_ACTION = 'https://patients.stryker.com/us/en/ent/search.html';

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

// close the open mobile menu when the user clicks outside the drawer/hamburger
function closeOnClickOutside(e) {
  const nav = document.getElementById('nav');
  if (nav.getAttribute('aria-expanded') !== 'true') return;
  const drawer = nav.querySelector('.nav-drawer');
  const hamburger = nav.querySelector('.nav-hamburger');
  if (drawer && drawer.contains(e.target)) return;
  if (hamburger && hamburger.contains(e.target)) return;
  // eslint-disable-next-line no-use-before-define
  toggleMenu(nav, false);
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
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
  if (!expanded && !isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    document.addEventListener('click', closeOnClickOutside);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    document.removeEventListener('click', closeOnClickOutside);
  }
}

/**
 * Replaces the search placeholder with a real search form.
 * The nav document authors a `:search:` icon token, which EDS decorates into
 * `<span class="icon icon-search">`; we also accept the raw token as a fallback.
 * Form controls are built here (not authored in the fragment) per the nav contract.
 * @param {Element} tools The nav-tools section
 * @returns {boolean} true if a search form was built (a `:search:` token was present)
 */
function buildSearch(tools) {
  // prefer the EDS-decorated search icon; fall back to the raw :search: token
  const iconSpan = tools.querySelector('.icon-search');
  const tokenP = iconSpan
    ? iconSpan.closest('p')
    : [...tools.querySelectorAll('p')].find((p) => p.textContent.trim() === ':search:');
  if (!tokenP) return false;
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = SEARCH_ACTION;
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
  return true;
}

// close any open dropdown when the user clicks outside an open one
function closeDropdownsOnClickOutside(e) {
  const open = document.querySelector('#nav .nav-drop[aria-expanded="true"]');
  if (!open) return;
  if (open.contains(e.target)) return;
  open.setAttribute('aria-expanded', 'false');
}

// close any open dropdown on Escape and return focus to its toggle
function closeDropdownsOnEscape(e) {
  if (e.code !== 'Escape') return;
  const open = document.querySelector('#nav .nav-drop[aria-expanded="true"]');
  if (!open) return;
  open.setAttribute('aria-expanded', 'false');
  const toggle = open.querySelector(':scope > .nav-drop-toggle');
  if (toggle) toggle.focus();
}

/**
 * Wires nav items that author a nested list as click-to-toggle dropdowns.
 * A dropdown parent <li> holds its own link plus a child <ul> of sub-links (the
 * standard EDS nav model). We keep the parent link intact and add a separate
 * caret toggle button so the label stays clickable while the caret opens/closes
 * the submenu. Uses DOM APIs only and preserves the authored link/list nodes.
 * @param {Element} navSections The .nav-sections element
 */
function buildDropdowns(navSections) {
  if (!navSections) return;
  // the top-level list may sit inside a .default-content-wrapper, so find the
  // first <ul> and take its direct-child <li>s (not any nested submenu <li>s)
  const topList = navSections.querySelector('ul');
  if (!topList) return;
  const items = topList.querySelectorAll(':scope > li');
  let hasDropdown = false;
  items.forEach((li) => {
    const submenu = li.querySelector(':scope > ul');
    if (!submenu) return;
    hasDropdown = true;
    li.classList.add('nav-drop');
    li.setAttribute('aria-expanded', 'false');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-drop-toggle';
    const label = (li.querySelector(':scope > a') || li).textContent.trim();
    toggle.setAttribute('aria-label', `Toggle ${label} submenu`);
    // place the caret toggle right after the parent link, before the submenu
    submenu.before(toggle);

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = li.getAttribute('aria-expanded') === 'true';
      // close sibling dropdowns before opening this one
      li.parentElement.querySelectorAll(':scope > .nav-drop[aria-expanded="true"]')
        .forEach((other) => { if (other !== li) other.setAttribute('aria-expanded', 'false'); });
      li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  });

  if (hasDropdown) {
    document.addEventListener('click', closeDropdownsOnClickOutside);
    window.addEventListener('keydown', closeDropdownsOnEscape);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // variant marker from the fragment name (e.g. /nav-ivs -> nav-variant-ivs) so
  // header.css can style a specific header variant without affecting the others.
  // The default /nav has no suffix, so no variant class — header.css styles it via
  // the `nav:not([class*="nav-variant"])` selector.
  const variant = navPath.split('/').pop().replace(/^nav-?/, '');
  if (variant) nav.classList.add(`nav-variant-${variant}`);

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
  // search is opt-in per fragment (via the :search: token); when absent, the
  // mobile magnifier/panel below are skipped too, so a search-less nav (e.g. the
  // root header) has no search at any breakpoint
  const hasSearch = navTools ? buildSearch(navTools) : false;

  // Group the gold nav (links + Stryker.com) into one drawer that can slide in
  // from the left on mobile. On desktop `.nav-drawer` uses display:contents so
  // the grid still places .nav-sections and .nav-tools directly.
  const navSections = nav.querySelector('.nav-sections');
  // wire any authored nested lists as click-to-toggle dropdowns (e.g. IVS nav's
  // Conditions / Treatments megamenu items)
  buildDropdowns(navSections);
  const navDrawer = document.createElement('div');
  navDrawer.className = 'nav-drawer';
  if (navSections) navDrawer.append(navSections);
  if (navTools) navDrawer.append(navTools);
  nav.append(navDrawer);

  // mobile search panel + toggle (magnifier) — only when the nav has search.
  // A full-width gray band below the header holding the search input, revealed by
  // the magnifier toggle (overlays content, no push).
  let searchPanel = null;
  let searchToggle = null;
  if (hasSearch) {
    searchPanel = document.createElement('div');
    searchPanel.className = 'nav-search-panel';
    const panelForm = document.createElement('form');
    panelForm.className = 'nav-search-panel-form';
    panelForm.setAttribute('role', 'search');
    panelForm.action = SEARCH_ACTION;
    panelForm.method = 'get';
    const panelInput = document.createElement('input');
    panelInput.type = 'search';
    panelInput.name = 'q';
    panelInput.className = 'nav-search-panel-input';
    panelInput.placeholder = 'Search this site';
    panelInput.setAttribute('aria-label', 'Search this site');
    panelForm.append(panelInput);
    searchPanel.append(panelForm);

    searchToggle = document.createElement('button');
    searchToggle.type = 'button';
    searchToggle.className = 'nav-search-toggle';
    searchToggle.setAttribute('aria-label', 'Toggle search');
    searchToggle.addEventListener('click', () => {
      const open = nav.getAttribute('data-search') === 'open';
      nav.setAttribute('data-search', open ? 'closed' : 'open');
      if (!open) {
        // opening search — collapse the hamburger menu if it is open
        if (nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
        panelInput.focus();
      }
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  const hamburgerIcon = document.createElement('span');
  hamburgerIcon.className = 'nav-hamburger-icon';
  hamburgerButton.append(hamburgerIcon);
  hamburger.append(hamburgerButton);
  hamburger.addEventListener('click', () => {
    toggleMenu(nav);
    // opening the menu closes the search panel
    if (nav.getAttribute('aria-expanded') === 'true') nav.setAttribute('data-search', 'closed');
  });
  // append hamburger before the search toggle so keyboard Tab order matches the
  // visual left-to-right order (hamburger left, magnifier right); the mobile CSS
  // `order` values keep the visual placement regardless of DOM order
  nav.append(hamburger);
  if (searchToggle) nav.append(searchToggle, searchPanel);
  // collapsed by default; on desktop the sections are always shown via CSS
  nav.setAttribute('aria-expanded', 'false');
  if (hasSearch) nav.setAttribute('data-search', 'closed');

  // on breakpoint change, reset any open mobile menu — but suppress the drawer
  // slide animation so it doesn't briefly animate closed while crossing 900px
  isDesktop.addEventListener('change', () => {
    nav.classList.add('nav-no-transition');
    if (isDesktop.matches) {
      toggleMenu(nav, false);
      // the mobile search panel is redundant on desktop (which has its own
      // search box), so close it when crossing the breakpoint
      nav.setAttribute('data-search', 'closed');
    }
    // re-enable the transition after the layout has settled
    requestAnimationFrame(() => {
      requestAnimationFrame(() => nav.classList.remove('nav-no-transition'));
    });
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
