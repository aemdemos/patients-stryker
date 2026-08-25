/*
 * Sticky Nav Block
 * An in-page anchor navigation bar migrated from the patients.stryker.com IVS
 * homepage. Each authored row is one nav item: the first cell is the visible
 * label, the second cell holds a link whose href is the id (e.g. `#overview`)
 * of the section it jumps to.
 *
 * Behaviour (matching the source):
 *  - the bar sticks to the top of the viewport once scrolled past (CSS
 *    `position: sticky`)
 *  - clicking an item smooth-scrolls to its target section
 *  - a scroll-spy (IntersectionObserver) marks the item whose target is
 *    currently in view as `.sticky-nav-item-current` (gold filled state)
 *
 * Authored labels stay inside their row's instrumented cell, so the label
 * field remains editable in the Universal Editor; the anchor link cell carries
 * the target id.
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Resolve the target element for a nav item link.
 * Accepts `#id`, a bare `id`, or a full/relative URL ending in `#id`.
 * Falls back to a section carrying `data-anchor="<id>"` (the form produced by
 * this project's `anchor` section metadata) and promotes it to a real `id` so
 * hash links and native scrolling work.
 * @param {string} href
 * @returns {Element|null}
 */
function resolveTarget(href) {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href;
  if (!hash) return null;

  const byId = document.getElementById(hash);
  if (byId) return byId;

  const byAnchor = document.querySelector(`.section[data-anchor="${CSS.escape(hash)}"]`);
  if (byAnchor && !byAnchor.id) byAnchor.id = hash;
  return byAnchor;
}

export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'sticky-nav-list';
  nav.setAttribute('aria-label', 'Section navigation');

  const items = [];

  [...block.children].forEach((row) => {
    const [labelCell, targetCell] = row.children;
    if (!labelCell) return;

    const link = targetCell?.querySelector('a');
    const href = link?.getAttribute('href') || targetCell?.textContent.trim();

    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    item.href = href && href.startsWith('#') ? href : `#${(href || '').replace(/^#/, '')}`;

    // carry the label field's UE instrumentation onto the rendered item
    moveInstrumentation(labelCell, item);
    item.append(...labelCell.childNodes);

    items.push({ item, href });
    nav.append(item);
  });

  // replace the authored table rows with the nav
  block.textContent = '';
  block.append(nav);

  // smooth-scroll on click
  items.forEach(({ item, href }) => {
    item.addEventListener('click', (e) => {
      const target = resolveTarget(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // scroll-spy: mark the item whose target section is in view. Observe the
  // section that contains the target id (not the small heading itself) so the
  // whole region registers as it passes the detection band near the top.
  const targets = items
    .map(({ item, href }) => {
      const anchor = resolveTarget(href);
      const region = anchor?.closest('.section') || anchor;
      return { item, region };
    })
    .filter((t) => t.region);

  if (targets.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
    };

    // scroll-position spy: the active section is the last one whose top has
    // scrolled above a line just below the sticky bar. This is robust to very
    // short sections (e.g. the single-line "Find a Doctor" CTA) that a
    // viewport-band IntersectionObserver would skip over.
    let ticking = false;
    const update = () => {
      ticking = false;
      const barHeight = block.getBoundingClientRect().height || 80;
      const line = barHeight + 20; // detection line just below the pinned bar
      let activeIndex = 0;
      targets.forEach((t, i) => {
        if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
      });
      // at the bottom of the page the last section may be too short to reach the
      // detection line — force the final item active so it can still light up.
      const atBottom = window.innerHeight + window.scrollY
        >= document.documentElement.scrollHeight - 2;
      if (atBottom) activeIndex = targets.length - 1;
      setCurrent(targets[activeIndex].item);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }
}
