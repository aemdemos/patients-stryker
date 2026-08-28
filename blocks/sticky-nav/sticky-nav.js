// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// Bar height (px). Mirrors the `min-height` of `.sticky-nav-item` in the CSS and
// is used as the scroll offset so a scrolled-to section clears the pinned bar.
const BAR_HEIGHT = 70;
// Extra breathing room between the pinned bar and a scrolled-to section's top.
const GAP = 70;
const SCROLL_DURATION = 600;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Slugify text the same way EDS does for heading ids, so an auto-derived target
 * matches the id the platform already puts on the heading.
 * @param {string} text
 * @returns {string}
 */
const slug = (text) => (typeof text === 'string' ? text : '')
  .toLowerCase()
  .replace(/[^0-9a-z]/gi, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

/**
 * Make `el` the sole owner of `id`. Any other element already holding that id
 * (e.g. a heading EDS auto-slugged to the same word) is renamed with a numeric
 * suffix so it stays reachable, while the deliberately-anchored section keeps
 * the canonical id. This keeps the id unique, so native deep-linking
 * (`…/page#id` on load) and `getElementById` both resolve to the section — not
 * to an incidental heading earlier in the document.
 * @param {Element} el
 * @param {string} id
 */
// Author-facing warnings are noise on the live site; only surface them on
// preview/local hosts where an author is actually editing.
const isAuthorEnv = () => /(\.aem\.page$|\.hlx\.page$|localhost$|\.local$)/.test(window.location.hostname)
  || window.location.hostname === '127.0.0.1';

function claimId(el, id) {
  document.querySelectorAll(`[id="${CSS.escape(id)}"]`).forEach((other) => {
    if (other === el) return;
    let n = 2;
    while (document.getElementById(`${id}-${n}`)) n += 1;
    if (isAuthorEnv()) {
      // eslint-disable-next-line no-console
      console.warn(`[sticky-nav] id "${id}" was also used by <${other.tagName.toLowerCase()}>; renamed it to "${id}-${n}" so the anchored section owns "${id}".`);
    }
    other.id = `${id}-${n}`;
  });
  el.id = id;
}

/**
 * Resolve a nav link's target: `#id`, bare `id`, or URL ending in `#id`.
 *
 * A deliberate section anchor always wins over an incidental heading that
 * merely happens to contain the same word, so the author's intent is not
 * hijacked by e.g. a mid-page heading that slugifies to "overview". Order:
 *   1. `.section[data-anchor="<id>"]` — the section's explicit Anchor ID field.
 *      The section claims the id exclusively (see claimId), so duplicates from
 *      matching heading text can't steal native hash navigation.
 *   2. a `.section` element that already carries that id;
 *   3. any element with that id (EDS auto-ids headings with the same slug) —
 *      backward-compatible catch-all;
 *   4. auto-slug fallback: the first section heading whose text slugifies to
 *      the target, promoted to a real id so authors who set nothing still work.
 * @param {string} href
 * @returns {Element|null}
 */
function resolveTarget(href) {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href;
  if (!hash) return null;

  // 1. deliberate section-level Anchor ID takes precedence over any heading
  const byAnchor = document.querySelector(`.section[data-anchor="${CSS.escape(hash)}"]`);
  if (byAnchor) {
    if (byAnchor.id !== hash) claimId(byAnchor, hash);
    return byAnchor;
  }

  // 2. a section that already owns the id (e.g. anchor promoted on a prior pass)
  const sectionById = document.querySelector(`.section[id="${CSS.escape(hash)}"]`);
  if (sectionById) return sectionById;

  // 3. any element with the id — usually the heading EDS auto-ids with this slug
  const byId = document.getElementById(hash);
  if (byId) return byId;

  // 4. auto-slug fallback: first section heading whose text slugifies to the
  // target, promoted to a real id so hash navigation and scroll-spy work.
  const heading = [...document.querySelectorAll('main .section :is(h1,h2,h3,h4,h5,h6)')]
    .find((h) => slug(h.textContent) === hash);
  if (heading) {
    if (!heading.id) heading.id = hash;
    return heading;
  }
  return null;
}

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Animate scroll with easing, re-sampling the target each frame so any
 * mid-scroll layout shift (lazy content) is absorbed smoothly instead of
 * causing a second, jarring jump. Honours `prefers-reduced-motion` by jumping
 * straight to the target with no animation.
 * @param {() => number} getTargetY
 * @param {number} duration
 */
function animateScrollTo(getTargetY, duration = SCROLL_DURATION) {
  if (prefersReducedMotion()) {
    window.scrollTo(0, getTargetY());
    return;
  }

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
  // Tear down listeners from a previous decoration (UE re-decorates on edits),
  // then start a fresh scope so this pass's listeners can be aborted next time.
  block.stickyNavCleanup?.abort();
  const controller = new AbortController();
  block.stickyNavCleanup = controller;
  const { signal } = controller;

  const nav = document.createElement('nav');
  nav.className = 'sticky-nav-list';
  nav.setAttribute('aria-label', 'Section navigation');

  const items = [];

  [...block.children].forEach((row) => {
    const [labelCell, targetCell] = row.children;
    // Skip blank rows (e.g. a trailing empty cell left by authoring) — a
    // labelless item would render as an empty, purposeless nav cell.
    if (!labelCell || !labelCell.textContent.trim()) return;

    const link = targetCell?.querySelector('a');
    const raw = link?.getAttribute('href') || targetCell?.textContent.trim() || '';
    const hash = raw.replace(/^.*#/, '').trim();

    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    // Resolve the target once, at decoration time, and cache the region on the
    // item. Items with no resolvable target get no href so they stay inert
    // (a bare `#` would scroll to the top of the page).
    const anchor = hash ? resolveTarget(`#${hash}`) : null;
    const region = anchor?.closest('.section') || anchor;
    if (region) item.href = `#${hash}`;

    // Row = the sticky-nav-item component, so its instrumentation goes on the
    // <a> (keeps the item editable in UE); the label field's goes on the <p>.
    moveInstrumentation(row, item);
    const labelEl = labelCell.querySelector('p') || document.createElement('p');
    moveInstrumentation(labelCell, labelEl);
    if (!labelEl.parentElement) labelEl.append(...labelCell.childNodes);
    item.append(labelEl);

    items.push({ item, region, anchor });
    nav.append(item);
  });

  // replace the authored table rows with the nav
  block.textContent = '';
  block.append(nav);

  // scroll-spy: track each item's containing section (not the heading itself)
  const targets = items.filter((t) => t.region);

  // Offset lives in CSS (see sticky-nav.css) driven by a custom property, so it
  // is overridable and not fighting inline styles. The gap shows even for the
  // first target because it is section padding, not a scroll offset.
  const applyScrollOffset = () => {
    const bar = block.getBoundingClientRect().height || BAR_HEIGHT;
    targets.forEach(({ region, anchor }) => {
      region.classList.add('sticky-nav-target');
      region.style.setProperty('--sticky-nav-offset', `${bar}px`);
      region.style.setProperty('--sticky-nav-gap', `${GAP}px`);
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = `${bar}px`;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', applyScrollOffset, { passive: true, signal });

  // scroll the section (not the heading) so its padded top shows the gap below the bar
  targets.forEach(({ item, region }) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const getTargetY = () => {
        const off = block.getBoundingClientRect().height || BAR_HEIGHT;
        return window.scrollY + region.getBoundingClientRect().top - off;
      };
      animateScrollTo(getTargetY);
    }, { signal });
  });

  if (targets.length) {
    const setCurrent = (activeItem) => {
      items.forEach(({ item }) => {
        const active = item === activeItem;
        item.classList.toggle('sticky-nav-item-current', active);
        if (active) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
    };

    // active = last section past the line below the bar; nothing active until the bar pins
    let ticking = false;
    const update = () => {
      ticking = false;
      const barRect = block.getBoundingClientRect();
      const barHeight = barRect.height || BAR_HEIGHT;
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

    window.addEventListener('scroll', onScroll, { passive: true, signal });
    window.addEventListener('resize', onScroll, { passive: true, signal });
    update();
  }
}
