// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Resolve a nav target from an id. A `.section[data-anchor]` wins over a plain
 * element id (auto-generated heading ids can collide). `data-anchor` may be a
 * comma-separated list, so several items can share one section.
 * @param {string} href
 * @returns {Element|null}
 */
function resolveTarget(href) {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href;
  if (!hash) return null;

  const byAnchor = [...document.querySelectorAll('.section[data-anchor]')].find((s) => s.dataset.anchor
    .split(',')
    .some((a) => a.trim() === hash));
  if (byAnchor) return byAnchor;

  return document.getElementById(hash);
}

/**
 * Bare anchor id from a string: the part after `#`, else the trimmed string.
 * @param {string} s
 * @returns {string}
 */
const anchorId = (s) => {
  if (!s) return '';
  const v = s.trim();
  return v.includes('#') ? v.slice(v.indexOf('#') + 1) : v;
};

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Eased scroll, re-sampling the target each frame so lazy-content shifts are
 * absorbed smoothly.
 * @param {() => number} getTargetY
 * @param {number} duration
 */
function animateScrollTo(getTargetY, duration = 600) {
  const startY = window.scrollY;
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutQuad(t);
    const targetY = getTargetY();
    window.scrollTo(0, startY + (targetY - startY) * eased);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'sticky-nav-list';
  nav.setAttribute('aria-label', 'Section navigation');

  const items = [];

  [...block.children].forEach((row) => {
    const [labelCell, targetCell] = row.children;
    // skip blank rows so they don't render as empty nav items
    if (!labelCell || !labelCell.textContent.trim()) return;

    // Target may be a plain `#anchor` string or a link with placeholder href
    // (e.g. `/`). Prefer whichever candidate carries an anchor id.
    const link = targetCell?.querySelector('a');
    const linkHref = link?.getAttribute('href') || '';
    const cellText = targetCell?.textContent.trim() || '';
    const id = anchorId(linkHref.includes('#') ? linkHref : cellText)
      || anchorId(linkHref) || anchorId(cellText);
    const href = `#${id}`;

    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    item.href = href;

    // move UE instrumentation: row → <a> (selectable item), label → <p> (editable)
    moveInstrumentation(row, item);
    const labelEl = labelCell.querySelector('p') || document.createElement('p');
    moveInstrumentation(labelCell, labelEl);
    if (!labelEl.parentElement) labelEl.append(...labelCell.childNodes);
    item.append(labelEl);

    items.push({ item, href });
    nav.append(item);
  });

  // replace the authored table rows with the nav
  block.textContent = '';
  block.append(nav);

  // Resolve targets lazily (not once) so anchors inside async-loaded fragments
  // are picked up. Region = the item's containing section, not the heading.
  const currentTargets = () => items
    .map(({ item, href }) => {
      const anchor = resolveTarget(href);
      const region = anchor?.closest('.section') || anchor;
      return { item, region, anchor };
    })
    .filter((t) => t.region);

  // gap lives as section padding-top (not scroll offset) so it shows even for the first section
  const GAP = 70;
  const applyScrollOffset = () => {
    const bar = `${block.getBoundingClientRect().height || 70}px`;
    currentTargets().forEach(({ region, anchor }) => {
      region.style.paddingTop = `${GAP}px`;
      region.style.scrollMarginTop = bar;
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = bar;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', applyScrollOffset, { passive: true });

  const setCurrent = (activeItem) => {
    items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
  };

  // For items sharing one region (comma-separated `data-anchor`), active state
  // follows the last-clicked item rather than the last in the bar.
  let clickedItem = null;

  items.forEach((entry) => {
    const { item, href } = entry;
    item.addEventListener('click', (e) => {
      const target = resolveTarget(href);
      if (!target) return;
      e.preventDefault();
      clickedItem = item;
      setCurrent(item);
      const region = target.closest('.section') || target;
      const getTargetY = () => {
        const off = block.getBoundingClientRect().height || 70;
        return window.scrollY + region.getBoundingClientRect().top - off;
      };
      animateScrollTo(getTargetY, 600);
    });
  });

  if (items.length) {
    // active = last section past the line below the bar; inactive until the bar pins
    let ticking = false;
    const update = () => {
      ticking = false;
      const targets = currentTargets();
      const barRect = block.getBoundingClientRect();
      const barHeight = barRect.height || 70;
      const pinned = barRect.top <= 1;
      const line = barHeight + GAP + 2;
      let activeIndex = -1;
      if (pinned) {
        targets.forEach((t, i) => {
          if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
        });
      }
      // pin the last item at page bottom (a short final section may never reach the line)
      const atBottom = pinned && window.scrollY > 0 && window.innerHeight + window.scrollY
        >= document.documentElement.scrollHeight - 2;
      if (atBottom) activeIndex = targets.length - 1;

      if (activeIndex < 0) { setCurrent(null); return; }
      // among items sharing the active region, prefer the clicked one
      const activeRegion = targets[activeIndex].region;
      const group = targets.filter((t) => t.region === activeRegion);
      const clicked = group.find((t) => t.item === clickedItem);
      setCurrent(clicked ? clicked.item : group[0].item);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Re-run when the page height changes (fragment/images loading in). The first
    // pass runs before that content settles, when a briefly-short page can wrongly
    // read as "scrolled to bottom" and activate the last item; recompute after.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(onScroll).observe(document.body);
    }
    window.addEventListener('load', onScroll);
    update();
  }
}
