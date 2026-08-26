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

  // A jump must clear the sticky bar (otherwise the section's top hides behind
  // the 70px bar) AND leave a bit of breathing room so the section reads as a
  // fresh block. Rather than fold the gap into the scroll offset — which needs
  // extra scroll room above the section and fails for the first section right
  // below the nav — the gap lives INSIDE each section as padding-top. The
  // scroll offset is then just the bar height: a jump lands the section's top
  // flush under the bar (which always pins, since it only needs to clear the
  // bar) and the intrinsic padding shows the gap. Same feel for every section,
  // first included.
  const GAP = 70;
  const applyScrollOffset = () => {
    const bar = `${block.getBoundingClientRect().height || 70}px`;
    targets.forEach(({ region, anchor }) => {
      region.style.paddingTop = `${GAP}px`;
      region.style.scrollMarginTop = bar;
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = bar;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', applyScrollOffset, { passive: true });

  // smooth-scroll on click — scroll the whole section (not just the heading)
  // so its padded top aligns below the bar and the padding shows as the gap.
  // Scrolling the heading instead would tuck that padding up behind the bar.
  items.forEach(({ item, href }) => {
    item.addEventListener('click', (e) => {
      const target = resolveTarget(href);
      if (!target) return;
      e.preventDefault();
      const region = target.closest('.section') || target;
      region.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (targets.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
    };

    // active = last section whose top has crossed the line just below the bar.
    // A clicked section settles with its top flush under the bar (its GAP now
    // lives as internal padding, not scroll offset), so the line sits a little
    // below the bar + gap to comfortably catch it.
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
