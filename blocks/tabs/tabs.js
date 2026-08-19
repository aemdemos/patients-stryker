import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../fragment/fragment.js';
// eslint-disable-next-line import/no-cycle
import { removeCtas } from '../../scripts/scripts.js';

/**
 * Loads any `/fragments/*` references inside a panel and inlines their content.
 * The block nests fragments too deep for the core `decorateBlocks` scan, so the
 * tabs block resolves them itself. We call `loadFragment` (not the fragment
 * block's decorate) on purpose: the block decorate runs a section-wide card
 * merge that would pull cards out of other, hidden tabs.
 * @param {Element} panel a `.tabs-panel` element
 * @param {boolean} noCta strip CTA links (section flagged `no-cta`)
 */
async function loadPanelFragments(panel, noCta) {
  const links = [...panel.querySelectorAll('a[href*="/fragments/"]')];
  await Promise.all(links.map(async (link) => {
    const path = new URL(link.href, window.location).pathname;
    const frag = await loadFragment(path);
    if (!frag) return;
    const host = link.closest('.fragment') || link.closest('p') || link;
    host.replaceWith(...frag.childNodes);
  }));
  // fragment.js applies no-cta once its content is inlined; do the same here
  // since we bypass the fragment block's own decorate().
  if (noCta) removeCtas(panel);
}

/**
 * Tabs block — a container of tab children, each authored as a row with two
 * cells: the tab label and the panel content (usually a fragment reference).
 * Renders a tab bar from the labels and shows one panel at a time.
 *
 * Works in the Universal Editor because it is a real container component (see
 * ue/models/blocks/tabs.json): the parent takes `tabs-tab` children, and the
 * mutation observer in ue/scripts/ue.js re-applies instrumentation to the
 * decorated panels so authors can select, edit, add and reorder tabs.
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
    const cells = [...row.children];
    // two-cell child: [label, content]. Fall back to single-cell (label = its
    // heading) so heading-driven authored content still works.
    const labelCell = cells[0];
    const contentCell = cells[1] || cells[0];
    const labelText = (labelCell.querySelector('h1,h2,h3,h4,h5,h6') || labelCell)
      .textContent.trim() || `Tab ${i + 1}`;
    const id = toClassName(labelText) || `tab-${i + 1}`;

    // panel = the content cell
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    moveInstrumentation(row, panel);
    while (contentCell.firstChild) panel.append(contentCell.firstChild);
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
    tab.textContent = labelText;

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
  const noCta = block.closest('.section')?.classList.contains('no-cta');
  panels.forEach((panel) => { loadPanelFragments(panel, noCta); });
}
