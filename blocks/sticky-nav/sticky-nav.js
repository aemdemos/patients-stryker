// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

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
function claimId(el, id) {
  document.querySelectorAll(`[id="${CSS.escape(id)}"]`).forEach((other) => {
    if (other === el) return;
    let n = 2;
    while (document.getElementById(`${id}-${n}`)) n += 1;
    // eslint-disable-next-line no-console
    console.warn(`[sticky-nav] id "${id}" was also used by <${other.tagName.toLowerCase()}>; renamed it to "${id}-${n}" so the anchored section owns "${id}".`);
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
