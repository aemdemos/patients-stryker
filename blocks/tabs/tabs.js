/*
 * Tabs Block
 * A tabbed container where each authored row is one tab: the first cell is the
 * tab label, the second is the panel content. Panels typically reference one or
 * more card fragments (each a "cards resources" brochure grid). Decoration
 * lifts the labels into an ARIA tablist, loads any nested fragments (nested
 * blocks are not auto-decorated by the page), and merges a tab's cards into a
 * single grid so the brochures render as one row.
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
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const buttons = [];
  const panels = [];

  [...block.children].forEach((row, i) => {
    const [labelCell, contentCell] = row.children;
    const name = toClassName(labelCell?.textContent || `tab-${i}`);
    const tabId = `tab-${name}`;
    const panelId = `tabpanel-${name}`;

    // panel: reuse the authored row so its UE component instrumentation stays put
    row.className = 'tabs-panel';
    row.id = panelId;
    row.setAttribute('role', 'tabpanel');
    row.setAttribute('aria-labelledby', tabId);
    row.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');

    if (contentCell) contentCell.className = 'tabs-panel-body';

    // remove the now-redundant label cell from the panel
    if (labelCell) labelCell.remove();

    // tab button, carrying the label field's UE instrumentation
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.type = 'button';
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    button.setAttribute('tabindex', i === 0 ? '0' : '-1');
    if (labelCell) {
      moveInstrumentation(labelCell, button);
      button.append(...labelCell.childNodes);
    }

    tablist.append(button);
    buttons.push(button);
    panels.push(row);
  });

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

  // load fragment content for every panel
  await Promise.all(panels.map(decoratePanel));
}
