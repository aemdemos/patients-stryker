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

import { loadSections, toClassName } from '../../scripts/aem.js';
import { decorateMain } from '../../scripts/scripts.js';
import { loadFragment, mergeSectionCards } from '../fragment/fragment.js';

async function decoratePanel(panel) {
  // panels built from a `tabbed` section hold inline sections (text + blocks
  // such as video) — decorate and load them the same way as fragment content.
  // Block decoration wraps the cell's content in a <p>, which is dropped here.
  const inline = [...panel.querySelectorAll('[data-tabs-section]')];
  if (inline.length) {
    const wrapper = inline[0].parentElement;
    const main = document.createElement('main');
    main.append(...inline);
    if (wrapper !== panel && !wrapper.textContent.trim()) wrapper.remove();
    decorateMain(main);
    await loadSections(main);
    panel.prepend(...main.childNodes);
  }

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

  // tabs may contain plain fragment links (not autoblocked into .fragment);
  // resolve those links in-place so tab panels render fragment content reliably.
  const fragmentLinks = [...panel.querySelectorAll('a[href*="/fragments/"]')]
    .filter((a) => !a.closest('.fragment'));
  await Promise.all(fragmentLinks.map(async (link) => {
    const path = link.getAttribute('href');
    const fragment = await loadFragment(path);
    if (!fragment) return;
    const p = link.closest('p');
    const replaceTarget = p
      && p.querySelectorAll('a').length === 1
      && p.textContent.trim() === link.textContent.trim()
      ? p
      : link;
    replaceTarget.replaceWith(...fragment.childNodes);
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

  const tabRail = document.createElement('div');
  tabRail.className = 'tabs-rail';

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
      button.append(...labelCell.childNodes);
      labelCell.replaceWith(button);
    } else {
      row.prepend(button);
    }
    tabRail.append(button);

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

  // horizontal scroll controls — the rail only scrolls when the tabs are too
  // wide for it (narrow viewports); at desktop the rail wraps instead, so these
  // stay hidden. Visibility is driven purely by measured overflow.
  const scroller = document.createElement('div');
  scroller.className = 'tabs-scroller';

  const createScrollButton = (dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tabs-scroll tabs-scroll-${dir}`;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Scroll tabs left' : 'Scroll tabs right');
    btn.hidden = true;
    btn.addEventListener('click', () => {
      const step = Math.max(tabRail.clientWidth * 0.8, 120);
      tabRail.scrollBy({ left: dir === 'prev' ? -step : step, behavior: 'smooth' });
    });
    return btn;
  };

  const prevButton = createScrollButton('prev');
  const nextButton = createScrollButton('next');
  scroller.append(prevButton, tabRail, nextButton);

  // hide each chevron at the end of its travel, and both when there is no
  // overflow at all (i.e. no horizontal scrollbar)
  const updateScrollButtons = () => {
    const maxScroll = tabRail.scrollWidth - tabRail.clientWidth;
    const overflows = maxScroll > 1;
    prevButton.hidden = !overflows || tabRail.scrollLeft <= 1;
    nextButton.hidden = !overflows || tabRail.scrollLeft >= maxScroll - 1;
  };

  tabRail.addEventListener('scroll', updateScrollButtons, { passive: true });
  if ('ResizeObserver' in window) {
    // watch the rail (viewport resizes) and each tab (label reflow / font swap),
    // since content growth changes scrollWidth without resizing the rail itself
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(tabRail);
    buttons.forEach((button) => observer.observe(button));
  } else {
    window.addEventListener('resize', updateScrollButtons);
  }

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

  block.prepend(scroller);
  block.prepend(tablist);

  // load fragment content for every panel
  await Promise.all(panels.map(decoratePanel));

  // measure once the tabs are laid out (and again after webfonts settle, since
  // the Futura labels are wider than the fallback and can create overflow)
  updateScrollButtons();
  if (document.fonts) document.fonts.ready.then(updateScrollButtons);
}
