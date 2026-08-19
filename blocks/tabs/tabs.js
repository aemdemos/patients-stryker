/*
 * Tabs Block
 * A tabbed container where each authored row is one tab: the first cell is the
 * tab label, the second is the panel content. Panels typically reference one or
 * more card fragments (each a "cards resources" brochure grid).
 *
 * Layout note: the tab button and its panel are kept INSIDE their authored row
 * (the row is the tab component's UE resource element). Moving the label out to
 * a separate list would detach the label field from its tab in the Universal
 * Editor content tree. Instead the row uses `display: contents` and the button
 * / panel are positioned with flex `order`, so the visual tab bar is achieved
 * without relocating instrumented nodes across components. A `role="tablist"`
 * element uses `aria-owns` to logically own the tabs for assistive tech.
 */

import { toClassName } from '../../scripts/aem.js';
// eslint-disable-next-line import/no-cycle
import { mergeSectionCards } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

async function decoratePanel(panel) {
  // load any fragment references in this panel (nested blocks don't get
  // decorated by the page's decorateBlocks pass, which only visits top-level
  // section blocks), then flatten each fragment's content into the panel
  const fragments = panel.querySelectorAll('.fragment');
  await Promise.all([...fragments].map(async (block) => {
    const link = block.querySelector('a');
    const path = link ? link.getAttribute('href') : block.textContent.trim();
    const fragment = await loadFragment(path);
    if (fragment) {
      const wrapper = block.closest('.fragment-wrapper') || block;
      wrapper.replaceWith(...fragment.childNodes);
    }
  }));

  // merge the panel's card grids (from one or more fragments) into a single row
  mergeSectionCards(panel);
}

export default async function decorate(block) {
  // logical tablist for assistive tech — owns the tabs via aria-owns rather than
  // containing them, so the buttons can stay inside their tab component subtrees
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const rows = [...block.children];
  const buttons = [];
  const panels = [];

  rows.forEach((row, i) => {
    const [labelCell, contentCell] = row.children;
    const name = toClassName(labelCell?.textContent || `tab-${i}`);
    const tabId = `tab-${name}`;
    const panelId = `tabpanel-${name}`;

    // the row is the tab component's resource element — keep its children in
    // place, just collapse its box so the button/panel become flex items
    row.classList.add('tabs-tab-row');

    // tab button, carrying the label field's UE instrumentation, kept in the row
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    if (i === 0) button.classList.add('tabs-tab-first');
    button.type = 'button';
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    button.setAttribute('tabindex', i === 0 ? '0' : '-1');
    if (labelCell) {
      moveInstrumentation(labelCell, button);
      button.append(...labelCell.childNodes);
      labelCell.replaceWith(button);
    } else {
      row.prepend(button);
    }

    // panel is the content cell — labelled by its tab, hidden unless active
    const panel = contentCell || document.createElement('div');
    panel.classList.add('tabs-panel');
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    if (!contentCell) row.append(panel);

    buttons.push(button);
    panels.push(panel);
  });

  tablist.setAttribute('aria-owns', buttons.map((b) => b.id).join(' '));

  const activate = (index) => {
    buttons.forEach((btn, i) => {
      const selected = i === index;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.setAttribute('tabindex', selected ? '0' : '-1');
      panels[i].setAttribute('aria-hidden', selected ? 'false' : 'true');
    });
  };

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => activate(i));
    button.addEventListener('keydown', (e) => {
      const last = buttons.length - 1;
      let next = null;
      if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
      else if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      if (next === null) return;
      e.preventDefault();
      activate(next);
      buttons[next].focus();
    });
  });

  block.prepend(tablist);

  // Universal Editor: when an author selects a component (or its child) that
  // lives in a hidden tab, reveal that tab so the selection is visible.
  // `aue:ui-select` only fires in the editor, so this is inert on the live site.
  document.addEventListener('aue:ui-select', (e) => {
    const selected = e.detail?.element || e.target;
    const rowEl = selected?.closest?.('.tabs-tab-row');
    const index = rows.indexOf(rowEl);
    if (index >= 0) activate(index);
  });

  // load fragment content for every panel
  await Promise.all(panels.map(decoratePanel));
}
