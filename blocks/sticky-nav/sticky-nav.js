/*
 * Sticky Nav Block — in-page anchor bar (patients.stryker.com IVS homepage).
 * Each authored row = one nav item: cell 1 is the label, cell 2 holds a link
 * whose href is the target section id (e.g. `#overview`). Clicking smooth-
 * scrolls; a scroll-spy marks the in-view item `.sticky-nav-item-current`.
 */

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Resolve a nav link's target: `#id`, bare `id`, or URL ending in `#id`.
 * Falls back to a `.section[data-anchor="<id>"]` and promotes it to a real id.
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

    // keep the label field editable in UE
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

  // scroll-spy: track each item's containing section (not the heading itself)
  const targets = items
    .map(({ item, href }) => {
      const anchor = resolveTarget(href);
      const region = anchor?.closest('.section') || anchor;
      return { item, region, anchor };
    })
    .filter((t) => t.region);

  // offset each target so a jump lands just below the sticky bar instead of
  // behind it (otherwise the section's top is hidden under the 70px bar). Set
  // on the section itself so the whole region, not just the heading, clears.
  const applyScrollOffset = () => {
    const bar = block.getBoundingClientRect().height || 70;
    targets.forEach(({ region, anchor }) => {
      region.style.scrollMarginTop = `${bar}px`;
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = `${bar}px`;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', applyScrollOffset, { passive: true });

  if (targets.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
    };

    // active = last section whose top has reached the bottom edge of the
    // sticky bar, matching the source (which switches as a section comes into
    // view just below the bar, not when it scrolls behind it). Nothing is
    // active until the first section reaches that line (activeIndex stays -1).
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = block.getBoundingClientRect().height || 70; // bar bottom edge
      let activeIndex = -1;
      targets.forEach((t, i) => {
        if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
      });
      // force the last item active at page bottom (its section may be too
      // short) — but never while still at the very top (page may be short
      // before lazy content loads)
      const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY
        >= document.documentElement.scrollHeight - 2;
      if (atBottom) activeIndex = targets.length - 1;
      setCurrent(activeIndex >= 0 ? targets[activeIndex].item : null);
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
