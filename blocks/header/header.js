import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width (mobile below this)
const isDesktop = window.matchMedia('(min-width: 900px)');

// single source for the search form target — could later be sourced from nav
// fragment metadata so locale/site changes don't require a code edit
const SEARCH_ACTION = 'https://patients.stryker.com/us/en/ivs/search.html';

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
  // collapsing the menu also returns any open sub-panel to the main list
  if (expanded) {
    nav.removeAttribute('data-panel');
    nav.querySelectorAll('.nav-subpanel-open').forEach((p) => p.classList.remove('nav-subpanel-open'));
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
 */
function buildSearch(tools) {
  // prefer the EDS-decorated search icon; fall back to the raw :search: token
  const iconSpan = tools.querySelector('.icon-search');
  const tokenP = iconSpan
    ? iconSpan.closest('p')
    : [...tools.querySelectorAll('p')].find((p) => p.textContent.trim() === ':search:');
  if (!tokenP) return;
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
}

/**
 * Wires up the mobile slide-in sub-panels. Any top-level nav item that authored
 * a nested `<ul>` (e.g. Conditions, Treatments) becomes a sub-panel trigger: on
 * mobile the item's text expands the child list in a panel that slides in from
 * the right, with a BACK bar to return. On desktop the nested `<ul>` stays
 * hidden (CSS) and the top-level link simply navigates. All content comes from
 * the nav fragment — nothing is hardcoded here.
 * @param {Element} navSections The `.nav-sections` element
 * @param {Element} nav The nav element (holds the open/panel state)
 */
function buildSubPanels(navSections, nav) {
  const topItems = navSections.querySelectorAll(':scope ul > li');
  topItems.forEach((li) => {
    const childUl = li.querySelector(':scope > ul');
    if (!childUl) return;
    const link = li.querySelector(':scope > a');
    if (!link) return;
    li.classList.add('nav-has-children');
    childUl.classList.add('nav-subpanel');

    // BACK bar at the top of the sub-panel — closes it, returning to main list
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'nav-subpanel-back';
    back.textContent = 'Back';
    back.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      childUl.classList.remove('nav-subpanel-open');
      nav.removeAttribute('data-panel');
    });
    childUl.prepend(back);

    // On mobile the text opens the sub-panel instead of navigating; on desktop
    // (where sub-panels are hidden) the default link navigation is preserved.
    link.addEventListener('click', (e) => {
      if (isDesktop.matches) return;
      e.preventDefault();
      childUl.classList.add('nav-subpanel-open');
      nav.setAttribute('data-panel', 'open');
    });
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment — dual path: local `content/` preview (aem up serves
  // authored files under /content) first, then the metadata/`/nav` path used in
  // DA/EDS production. loadFragment returns null when the path does not resolve.
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment('/content/nav') || await loadFragment(navPath);

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
  if (navSections) buildSubPanels(navSections, nav);
  const navDrawer = document.createElement('div');
  navDrawer.className = 'nav-drawer';
  if (navSections) navDrawer.append(navSections);
  if (navTools) navDrawer.append(navTools);
  nav.append(navDrawer);

  // mobile search panel — a full-width gray band below the header holding the
  // search input, revealed by the magnifier toggle (overlays content, no push).
  const searchPanel = document.createElement('div');
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

  // mobile search toggle (magnifier) — mirrors the source's mobile search icon
  const searchToggle = document.createElement('button');
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
  nav.append(hamburger, searchToggle, searchPanel);
  // collapsed by default; on desktop the sections are always shown via CSS
  nav.setAttribute('aria-expanded', 'false');
  nav.setAttribute('data-search', 'closed');

  // on breakpoint change, reset any open mobile menu — but suppress the drawer
  // slide animation so it doesn't briefly animate closed while crossing 900px
  isDesktop.addEventListener('change', () => {
    nav.classList.add('nav-no-transition');
    if (isDesktop.matches) {
      toggleMenu(nav, false);
      // the mobile search panel is redundant on desktop (which has its own
      // search box), so close it when crossing the breakpoint
      nav.setAttribute('data-search', 'closed');
      // return any open mobile sub-panel to the main list on desktop
      nav.removeAttribute('data-panel');
      nav.querySelectorAll('.nav-subpanel-open').forEach((p) => p.classList.remove('nav-subpanel-open'));
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
