// Sticky Nav Block — in-page anchor bar; row = item (label + target anchor id).
// Sticking and click-scroll are JS-driven (not CSS `position: sticky`, not href
// jumps) so the bar works inside the Universal Editor canvas and overflow/transform
// ancestors, where CSS sticky and native hash navigation fail. Includes scroll-spy.

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/** Resolve a nav target: `.section[data-anchor]` wins over a plain id. @param {string} href */
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

/** Bare anchor id from a string: the part after `#`, else the trimmed string. @param {string} s */
const anchorId = (s) => {
  if (!s) return '';
  const v = s.trim();
  return v.includes('#') ? v.slice(v.indexOf('#') + 1) : v;
};

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * The nearest scrollable ancestor, or `window` when the page itself scrolls.
 * On the live site this is `window`; in the Universal Editor the page renders
 * inside a scrolling canvas element, so scroll must be read/written there.
 * @param {Element} el
 */
function getScroller(el) {
  let node = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

/** Eased scroll on the given scroller, re-sampling the target each frame to absorb shifts. */
function animateScrollTo(scroller, getTargetY, duration = 600) {
  const readPos = () => (scroller === window ? window.scrollY : scroller.scrollTop);
  const writePos = (y) => {
    if (scroller === window) window.scrollTo(0, y);
    else scroller.scrollTop = y;
  };
  const startY = readPos();
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutQuad(t);
    const targetY = getTargetY();
    writePos(startY + (targetY - startY) * eased);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export default function decorate(block) {
  const section = block.closest('.section');
  // Resolve after decoration below; the live site scrolls `window`, the UE canvas
  // scrolls a nested container. All scroll reads/writes/listeners go through this.
  let scroller = window;
  const scrollTarget = () => (scroller === window ? window : scroller);
  const nav = document.createElement('nav');
  nav.className = 'sticky-nav-list';
  nav.setAttribute('aria-label', 'Section navigation');

  const items = [];

  [...block.children].forEach((row) => {
    const [labelCell, targetCell] = row.children;
    // skip blank rows so they don't render as empty nav items
    if (!labelCell || !labelCell.textContent.trim()) return;

    // Target may be a plain `#anchor` string or a link; prefer whichever carries an anchor id.
    const link = targetCell?.querySelector('a');
    const linkHref = link?.getAttribute('href') || '';
    const cellText = targetCell?.textContent.trim() || '';
    const id = anchorId(linkHref.includes('#') ? linkHref : cellText)
      || anchorId(linkHref) || anchorId(cellText);
    const href = `#${id}`;

    // Like the reference site, items are JS-driven (no real href) so the click
    // always runs our scroll handler rather than a native hash jump — which the
    // Universal Editor and some containers intercept or handle inconsistently.
    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    item.setAttribute('role', 'link');
    item.setAttribute('tabindex', '0');
    item.dataset.target = href;

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

  // Now that the block is in its final place, find the element that actually scrolls.
  scroller = getScroller(block);
  // Viewport top of the scroller: 0 for window, else the container's client top.
  const scrollerTop = () => (scroller === window ? 0 : scroller.getBoundingClientRect().top);

  // --- JS-driven sticking -------------------------------------------------
  // CSS `position: sticky` silently fails when any ancestor has `overflow` or a
  // `transform` (e.g. the Universal Editor canvas wrapper), so the bar would not
  // stick there. We pin the section with `position: fixed` toggled on scroll and
  // hold its place in flow with a placeholder, which is robust everywhere.
  const placeholder = document.createElement('div');
  placeholder.className = 'sticky-nav-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  section?.insertAdjacentElement('beforebegin', placeholder);

  // Bar is hidden below 600px (matches the CSS), so sticking only engages above it.
  const canStick = () => window.matchMedia('(min-width: 600px)').matches;

  let fixed = false;
  const updateSticky = () => {
    if (!section) return;
    // Below the breakpoint the bar is display:none; make sure it's fully unpinned.
    if (!canStick()) {
      if (fixed) {
        fixed = false;
        section.classList.remove('sticky-nav-fixed');
        section.style.top = '';
        placeholder.style.display = '';
        placeholder.style.height = '';
      }
      return;
    }
    const top = scrollerTop();
    // Reference the placeholder while fixed (section is out of flow), else the section.
    const ref = fixed ? placeholder : section;
    const refTop = ref.getBoundingClientRect().top - top;
    const shouldFix = refTop <= 0;
    if (shouldFix === fixed) {
      // While fixed on a container scroller, keep the bar aligned to the moving top.
      if (fixed && scroller !== window) section.style.top = `${top}px`;
      return;
    }
    fixed = shouldFix;
    if (fixed) {
      placeholder.style.height = `${section.offsetHeight}px`;
      placeholder.style.display = 'block';
      section.classList.add('sticky-nav-fixed');
      if (scroller !== window) section.style.top = `${top}px`;
    } else {
      section.classList.remove('sticky-nav-fixed');
      section.style.top = '';
      placeholder.style.display = '';
      placeholder.style.height = '';
    }
  };

  // Resolve targets lazily so anchors in async-loaded fragments are picked up.
  const currentTargets = () => items
    .map(({ item, href }) => {
      const anchor = resolveTarget(href);
      const region = anchor?.closest('.section') || anchor;
      return { item, region, anchor };
    })
    .filter((t) => t.region);

  const applyScrollOffset = () => {
    const bar = `${block.getBoundingClientRect().height || 70}px`;
    currentTargets().forEach(({ region, anchor }) => {
      region.style.scrollMarginTop = bar;
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = bar;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', applyScrollOffset, { passive: true });

  const setCurrent = (activeItem) => {
    items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
  };

  // Shared-region items: active state follows the last-clicked item, not the last in the bar.
  let clickedItem = null;

  const goTo = (item, href) => {
    const target = resolveTarget(href);
    if (!target) return;
    clickedItem = item;
    setCurrent(item);
    const region = target.closest('.section') || target;
    const getTargetY = () => {
      const off = block.getBoundingClientRect().height || 70;
      const current = scroller === window ? window.scrollY : scroller.scrollTop;
      // Region top relative to the scroller's own viewport, minus the sticky bar.
      return current + region.getBoundingClientRect().top - scrollerTop() - off;
    };
    animateScrollTo(scroller, getTargetY, 600);
  };

  items.forEach((entry) => {
    const { item, href } = entry;
    item.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(item, href);
    });
    // Keyboard parity with a real link (role="link"): Enter activates.
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goTo(item, href);
      }
    });
  });

  if (items.length) {
    // active = last section past the line below the bar; inactive until the bar pins
    let ticking = false;
    const update = () => {
      ticking = false;
      // Recompute the pinned/fixed state first so measurements below are consistent.
      updateSticky();
      const targets = currentTargets();
      const barRect = block.getBoundingClientRect();
      const barHeight = barRect.height || 70;
      // Everything is measured relative to the scroller's own top edge (0 for window).
      const top = scrollerTop();
      const viewportH = scroller === window ? window.innerHeight : scroller.clientHeight;
      const pinned = fixed;
      section?.classList.toggle('sticky-nav-pinned', pinned);
      const line = top + barHeight + 2;
      // Page-bottom detection, computed up front: trailing sections often can't
      // scroll up to the line (not enough content below them to travel that far),
      // so the bottom of the page is what activates them.
      const scrollPos = scroller === window ? window.scrollY : scroller.scrollTop;
      const scrollSize = scroller === window
        ? document.documentElement.scrollHeight : scroller.scrollHeight;
      const atBottom = pinned && scrollPos > 0 && viewportH + scrollPos >= scrollSize - 2;
      let activeIndex = -1;
      if (pinned) {
        targets.forEach((t, i) => {
          if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
        });
        // At the page bottom, prefer the last section that has entered the viewport:
        // a trailing section stays visible below the line but can never reach it.
        if (atBottom) {
          const bottomEdge = top + viewportH;
          targets.forEach((t, i) => {
            if (t.region.getBoundingClientRect().top <= bottomEdge) activeIndex = i;
          });
        }
        // Rescue a trailing section that can't scroll to the line once it's clearly in view.
        if (activeIndex < 0) {
          const midline = top + viewportH / 2;
          targets.forEach((t, i) => {
            if (t.region.getBoundingClientRect().top <= midline) activeIndex = i;
          });
        }
        // Last resort at the very bottom: fall back to the final item.
        if (atBottom && activeIndex < 0) activeIndex = targets.length - 1;
      }
      // Two nav items can target one section; normalize to the first item for that region.
      if (activeIndex >= 0) {
        const activeRegion = targets[activeIndex].region;
        activeIndex = targets.findIndex((t) => t.region === activeRegion);
      }

      // Keep the clicked item highlighted while the scroll crosses the preceding section.
      const clickedTarget = targets.find((t) => t.item === clickedItem);
      const targetIsNotActive = activeIndex < 0
        || targets[activeIndex].region !== clickedTarget?.region;
      if (clickedTarget && targetIsNotActive) {
        setCurrent(clickedItem);
        return;
      }

      if (activeIndex < 0) { setCurrent(null); return; }
      // Among items sharing the active region, prefer the clicked one over the last in the group.
      const activeRegion = targets[activeIndex].region;
      const group = targets.filter((t) => t.region === activeRegion);
      const clicked = group.find((t) => t.item === clickedItem);
      setCurrent(clicked ? clicked.item : group[0].item);
      // Once the highlight matches the click, drop the lock so later scrolling updates normally.
      if (!clicked || group.length <= 1) clickedItem = null;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Listen on the actual scroller (the UE canvas, or `window` on the live site).
    scrollTarget().addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Re-run when the page height changes, since an early pass may misread a short page as bottom.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(onScroll).observe(document.body);
    }
    window.addEventListener('load', onScroll);
    update();
  }
}
