import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../fragment/fragment.js';

/**
 * Loads any `/fragments/*` references inside a panel and inlines their content.
 * The auto-block nests fragments too deep for the core `decorateBlocks` scan, so
 * the tabs block resolves them itself. We call `loadFragment` (not the fragment
 * block's decorate) on purpose: the block decorate runs a section-wide card
 * merge that would pull cards out of other, hidden tabs.
 * @param {Element} panel a `.tabs-panel` element
 */
async function loadPanelFragments(panel) {
  const links = [...panel.querySelectorAll('a[href*="/fragments/"]')];
  await Promise.all(links.map(async (link) => {
    const path = new URL(link.href, window.location).pathname;
    const frag = await loadFragment(path);
    if (!frag) return;
    const host = link.closest('.fragment') || link.closest('p') || link;
    host.replaceWith(...frag.childNodes);
  }));
}

/**
 * Tabs block. Authored (or auto-blocked) as one row per panel, each row's first
 * cell holding an <h3> (the tab label) followed by that panel's content.
 * Renders a tab bar from the headings and shows one panel at a time.
 * @param {Element} block the tabs block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const tabs = [];
  const panels = [];

  rows.forEach((row, i) => {
    const cell = row.querySelector(':scope > div') || row;
    const heading = cell.querySelector('h3');
    const label = heading ? heading.textContent.trim() : `Tab ${i + 1}`;
    const id = heading && heading.id ? heading.id : toClassName(label);

    // panel = the row cell, minus the heading (heading becomes the tab)
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    moveInstrumentation(row, panel);
    if (heading) heading.remove();
    while (cell.firstChild) panel.append(cell.firstChild);
    panel.hidden = i !== 0;

    // tab button
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-tab';
    tab.id = `tab-${id}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = label;

    const activate = () => {
      tabs.forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      panels.forEach((p) => { p.hidden = true; });
      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      panel.hidden = false;
    };

    tab.addEventListener('click', activate);
    tab.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = tabs[(tabs.indexOf(tab) + dir + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });

    tabs.push(tab);
    panels.push(panel);
    tablist.append(tab);
  });

  block.replaceChildren(tablist, ...panels);

  // resolve any fragment references authored inside the panels
  panels.forEach((panel) => { loadPanelFragments(panel); });
}
