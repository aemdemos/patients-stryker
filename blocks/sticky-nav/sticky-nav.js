// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Resolve a nav link's target: `#id`, bare `id`, or URL ending in `#id`.
 * A section explicitly authored with `data-anchor="<id>"` wins over a plain
 * element id, because auto-generated heading ids can collide with an intended
 * section anchor (e.g. a hero <h1>Understanding stroke</h1> auto-ids to
 * `understanding-stroke`, the same anchor the "Understanding stroke" nav item
 * targets on its content section). Preferring the section keeps the jump — and
 * the sticky-nav's injected scroll padding — on the real destination.
 * @param {string} href
 * @returns {Element|null}
 */
function resolveTarget(href) {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href;
  if (!hash) return null;

  const byAnchor = document.querySelector(`.section[data-anchor="${CSS.escape(hash)}"]`);
  if (byAnchor) {
    if (!byAnchor.id) byAnchor.id = hash;
    return byAnchor;
  }

  return document.getElementById(hash);
}

/**
 * Extract a bare anchor id from a candidate string: the part after `#`, or the
 * whole trimmed string when it has no `#`.
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

    // Target may be authored as a plain `#anchor` string OR as a link whose
    // visible text is `#anchor` but whose href is a placeholder (e.g. `/`).
    // Prefer whichever candidate actually carries an anchor id, so a stray
    // `href="/"` never wins over the `#anchor` the author typed.
    const link = targetCell?.querySelector('a');
    const linkHref = link?.getAttribute('href') || '';
    const cellText = targetCell?.textContent.trim() || '';
    const id = anchorId(linkHref.includes('#') ? linkHref : cellText)
      || anchorId(linkHref) || anchorId(cellText);
    const href = `#${id}`;

    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    item.href = href;

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

  // scroll-spy: track each item's containing section (not the heading itself).
  // Targets are resolved LAZILY (not cached once) because some anchors live in a
  // fragment that loads asynchronously after this block decorates — e.g.
  // `#patient-information` is a heading inside the related-links fragment. A
  // one-time build would drop those late-loading targets, so they could never
  // scroll-offset or go active. Re-resolving each pass keeps them in sync.
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

  if (items.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
    };

    // active = last section past the line below the bar; nothing active until the bar pins
    let ticking = false;
    const update = () => {
      ticking = false;
      // re-resolve targets each pass so fragment-hosted anchors are included once loaded
      const targets = currentTargets();
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
