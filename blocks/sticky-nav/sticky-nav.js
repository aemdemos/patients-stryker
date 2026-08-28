// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

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

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Animate scroll with easing, re-sampling the target each frame so any
 * mid-scroll layout shift (lazy content) is absorbed smoothly instead of
 * causing a second, jarring jump.
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
    // skip blank rows (e.g. a trailing empty cell left by authoring) so they
    // don't render as an empty, purposeless nav item
    if (!labelCell || !labelCell.textContent.trim()) return;

    const link = targetCell?.querySelector('a');
    const href = link?.getAttribute('href') || targetCell?.textContent.trim();

    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    item.href = href && href.startsWith('#') ? href : `#${(href || '').replace(/^#/, '')}`;

    // Row = the sticky-nav-item component, so its instrumentation goes on the
    // <a> (keeps the item selectable/reorderable in UE); the label field's
    // instrumentation goes on the <p> so the label stays inline-editable.
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

  // scroll-spy: track each item's containing section (not the heading itself)
  const targets = items
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
    targets.forEach(({ region, anchor }) => {
      region.style.paddingTop = `${GAP}px`;
      region.style.scrollMarginTop = bar;
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = bar;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', applyScrollOffset, { passive: true });

  // scroll the section (not the heading) so its padded top shows the gap below the bar
  items.forEach(({ item, href }) => {
    item.addEventListener('click', (e) => {
      const target = resolveTarget(href);
      if (!target) return;
      e.preventDefault();
      const region = target.closest('.section') || target;
      const getTargetY = () => {
        const off = block.getBoundingClientRect().height || 70;
        return window.scrollY + region.getBoundingClientRect().top - off;
      };
      animateScrollTo(getTargetY, 600);
    });
  });

  if (targets.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
    };

    // active = last section past the line below the bar; nothing active until the bar pins
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
      // force the last item active at page bottom (short final section may never reach the line)
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
