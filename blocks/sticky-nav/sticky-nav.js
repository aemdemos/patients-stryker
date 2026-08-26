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

  // scroll-spy: track each item's containing section (not the heading itself)
  const targets = items
    .map(({ item, href }) => {
      const anchor = resolveTarget(href);
      const region = anchor?.closest('.section') || anchor;
      return { item, region, anchor };
    })
    .filter((t) => t.region);

  // Offset a target so a jump lands below the sticky bar instead of behind it
  // (otherwise the section's top is hidden under the 70px bar). Aim for ~115px
  // of breathing room so the section reads as a fresh block.
  //
  // But a jump can only leave a gap if there's enough content above the section
  // to scroll behind the bar. If the section sits closer to the bar's pin point
  // than bar+GAP (e.g. the first section, just below the nav), a full gap would
  // stop the scroll early and leave the bar unpinned (floating with content
  // above it). So cap each offset at the distance the section sits below the
  // pin point — the bar then always pins, keeping whatever gap the layout
  // allows (full 115px where there's room, less for a section near the top).
  //
  // Computed per target at click time: layout is settled by then, whereas at
  // decorate time the hero/content above may not have laid out yet (giving a
  // wrong, tiny offset that never gets a chance to grow).
  const GAP = 115;
  const navSection = block.closest('.section') || block;
  const offsetFor = (region) => {
    const bar = block.getBoundingClientRect().height || 70;
    const navTop = navSection.getBoundingClientRect().top + window.scrollY;
    const regionTop = region.getBoundingClientRect().top + window.scrollY;
    const room = regionTop - navTop; // space the section sits below the pin
    return Math.max(bar, Math.min(bar + GAP, room));
  };
  const applyScrollOffset = (region, anchor) => {
    const offset = `${offsetFor(region)}px`;
    region.style.scrollMarginTop = offset;
    if (anchor && anchor !== region) anchor.style.scrollMarginTop = offset;
  };
  // seed offsets so a load-time hash jump lands correctly, then keep fresh
  targets.forEach(({ region, anchor }) => applyScrollOffset(region, anchor));

  // smooth-scroll on click, recomputing the target's offset against the
  // now-settled layout just before scrolling
  items.forEach(({ item, href }) => {
    item.addEventListener('click', (e) => {
      const target = resolveTarget(href);
      if (!target) return;
      e.preventDefault();
      const region = target.closest('.section') || target;
      applyScrollOffset(region, target);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (targets.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
    };

    // active = last section whose top has reached the point where a clicked
    // section settles (bar bottom + GAP). This line must match the scroll
    // offset above, otherwise a click lands a section below the line and the
    // previous item stays highlighted.
    //
    // Crucially, nothing is active until the bar actually pins to the top:
    // before that we're still scrolling through the hero above the first
    // section, and highlighting a section there reads as premature. A small
    // tolerance covers sub-pixel scroll rests.
    let ticking = false;
    const update = () => {
      ticking = false;
      const barRect = block.getBoundingClientRect();
      const barHeight = barRect.height || 70;
      const pinned = barRect.top <= 1; // sticky container has reached the top
      const line = barHeight + GAP + 2;
      let activeIndex = -1;
      if (pinned) {
        targets.forEach((t, i) => {
          if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
        });
      }
      // force the last item active at page bottom (its short section may never
      // reach the line) — but only once the bar is pinned, else on initial
      // load the page can be short enough (before lazy content) that this
      // fires at the very top and wrongly lights the last item.
      const atBottom = pinned && window.scrollY > 0 && window.innerHeight + window.scrollY
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
