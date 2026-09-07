// Sticky Nav Block — in-page anchor bar (label + target section) with scroll-spy.
//
// Works in BOTH scroll environments:
//  - Published/preview page: the browser window scrolls.
//  - Universal Editor canvas: the page scrolls inside a nested container, so the
//    window never scrolls. Therefore sticking is JS-driven (not CSS position:sticky,
//    which sticks to the wrong ancestor here) and click navigation uses native
//    scrollIntoView (which scrolls whatever container(s) are needed automatically).

import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Resolve a nav link's target: `#id`, bare `id`, or URL ending in `#id`.
 * A `.section[data-anchor="<id>"]` wins over a plain element id, because an id
 * can collide with unrelated content (e.g. the hero <h1 id="understanding-stroke">
 * duplicates the video section's data-anchor). `data-anchor` is the authored,
 * intended nav target, so prefer it; fall back to id for fragment-only anchors
 * like #patient-information that have no data-anchor section.
 * @param {string} href
 * @returns {Element|null}
 */
function resolveTarget(href) {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href;
  if (!hash) return null;

  const byAnchor = document.querySelector(`.section[data-anchor="${CSS.escape(hash)}"]`);
  if (byAnchor) return byAnchor;

  return document.getElementById(hash);
}

/**
 * The nearest scrollable ancestor, or `window` when the page itself scrolls.
 * On the live/preview page this is `window`; in the Universal Editor the page
 * renders inside a scrolling canvas element, so scroll must be read there.
 * @param {Element} el
 * @returns {Element|Window}
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

export default function decorate(block) {
  const section = block.closest('.section');
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
    const rawHref = link?.getAttribute('href') || targetCell?.textContent.trim() || '';
    const href = rawHref.startsWith('#') ? rawHref : `#${rawHref.replace(/^#/, '')}`;

    // No real href: a native `#hash` jump is intercepted/reverted inside the UE
    // canvas (the "scroll a blink then snap back" symptom). We scroll via JS
    // instead, so items are links in role only.
    const item = document.createElement('a');
    item.className = 'sticky-nav-item';
    item.setAttribute('role', 'link');
    item.setAttribute('tabindex', '0');
    item.dataset.target = href;

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

  // Find the element that actually scrolls (window on the page, a container in UE).
  const scroller = getScroller(block);
  const isWindow = scroller === window;
  // Viewport-relative top of the scroller (0 for window, else its client top edge).
  const scrollerTop = () => (isWindow ? 0 : scroller.getBoundingClientRect().top);

  // scroll-spy: track each item's containing section (not the heading itself).
  // Resolved LAZILY every pass because #resources / #patient-information live in an
  // async-loaded fragment and may not exist yet when the block first decorates.
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

  // --- JS-driven sticking (UE canvas ONLY) --------------------------------
  // On the normal page (window scroll) native CSS `position: sticky` handles this
  // and works reliably, so we do nothing there. In the Universal Editor the page
  // scrolls a nested container, where CSS sticky pins to the wrong ancestor and
  // never sticks — so ONLY there we pin the section with `position: fixed` toggled
  // on scroll, holding its place in flow with a placeholder.
  const needsJsSticky = !isWindow;
  const placeholder = document.createElement('div');
  placeholder.className = 'sticky-nav-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  if (needsJsSticky) section?.insertAdjacentElement('beforebegin', placeholder);

  // Bar is hidden below 600px (matches the CSS), so sticking only engages above it.
  const canStick = () => window.matchMedia('(min-width: 600px)').matches;

  let fixed = false;
  const unfix = () => {
    fixed = false;
    section.classList.remove('sticky-nav-fixed');
    section.style.top = '';
    placeholder.style.display = '';
    placeholder.style.height = '';
  };
  const updateSticky = () => {
    // Native CSS sticky owns the window-scroll page; only intervene in the UE canvas.
    if (!section || !needsJsSticky) return;
    if (!canStick()) {
      if (fixed) unfix();
      return;
    }
    const top = scrollerTop();
    // Reference the placeholder while fixed (section is out of flow), else the section.
    const ref = fixed ? placeholder : section;
    const shouldFix = ref.getBoundingClientRect().top - top <= 0;
    if (shouldFix === fixed) {
      // While fixed on the container scroller, keep the bar aligned to the moving top.
      if (fixed) section.style.top = `${top}px`;
      return;
    }
    if (shouldFix) {
      placeholder.style.height = `${section.offsetHeight}px`;
      placeholder.style.display = 'block';
      section.classList.add('sticky-nav-fixed');
      section.style.top = `${top}px`;
      fixed = true;
    } else {
      unfix();
    }
  };

  const setCurrent = (activeItem) => {
    items.forEach(({ item }) => item.classList.toggle('sticky-nav-item-current', item === activeItem));
  };

  // While a click-initiated smooth scroll is in flight, the clicked item stays
  // highlighted and the scroll-spy is suppressed — otherwise the spy recomputes
  // the active item mid-scroll and overwrites the click. Cleared once the scroll
  // settles (or the user scrolls manually).
  let clickedItem = null;

  // Click / keyboard: scroll to the section via native scrollIntoView, which
  // scrolls the correct container automatically in any environment. The bar-height
  // offset comes from the `scroll-margin-top` set in applyScrollOffset().
  const goTo = (item, href) => {
    const target = resolveTarget(href);
    if (!target) return;
    const region = target.closest('.section') || target;
    clickedItem = item;
    setCurrent(item);
    region.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  items.forEach(({ item, href }) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(item, href);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goTo(item, href);
      }
    });
  });

  if (items.length) {
    // active = last section past the line below the bar; nothing active until the bar pins
    let ticking = false;
    const update = () => {
      ticking = false;
      updateSticky();
      const targets = currentTargets(); // re-resolve: fragment sections load async
      const barRect = block.getBoundingClientRect();
      const barHeight = barRect.height || 70;
      const top = scrollerTop();
      const viewportH = isWindow ? window.innerHeight : scroller.clientHeight;
      // Pinned = the bar has reached the scroller's top. Works for BOTH native CSS
      // sticky (.page) and the JS fixed fallback (UE) since both hold the bar at top.
      const pinned = barRect.top - top <= 1;
      // Expose pinned state for CSS: the outer left/right borders and the full-bleed
      // reset apply only while pinned (matches the source's framed-when-stuck look).
      section?.classList.toggle('sticky-nav-pinned', pinned);
      const line = top + barHeight + GAP + 2;
      let activeIndex = -1;
      if (pinned) {
        targets.forEach((t, i) => {
          if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
        });
      }
      // force the last item active at page bottom (short final section may never reach the line)
      const scrollPos = isWindow ? window.scrollY : scroller.scrollTop;
      const scrollSize = isWindow
        ? document.documentElement.scrollHeight : scroller.scrollHeight;
      const atBottom = pinned && scrollPos > 0 && viewportH + scrollPos >= scrollSize - 2;
      if (atBottom && targets.length) activeIndex = targets.length - 1;

      // Honor a click lock: keep the clicked item active until the scroll actually
      // reaches its region, so the smooth scroll doesn't flicker the highlight.
      // The clicked item's OWN region is what counts — several nav items can share
      // one region (e.g. #resources and #patient-information both live in the
      // resources fragment section), so compare regions, and once we've reached
      // that region keep the clicked item (not the first item that shares it).
      if (clickedItem) {
        const clickedTarget = targets.find((t) => t.item === clickedItem);
        const activeRegion = activeIndex >= 0 ? targets[activeIndex].region : null;
        if (clickedTarget && activeRegion === clickedTarget.region) {
          clickedItem = null; // arrived at the clicked region
          setCurrent(clickedTarget.item);
          return;
        }
        setCurrent(clickedItem); // still travelling — hold the clicked highlight
        return;
      }

      // Among items sharing the active region, prefer the last (its heading is
      // furthest down, so it's the one actually in view at that scroll depth).
      if (activeIndex >= 0) {
        const activeRegion = targets[activeIndex].region;
        const lastInRegion = targets.map((t, i) => ({ t, i }))
          .filter(({ t }) => t.region === activeRegion)
          .pop();
        if (lastInRegion) activeIndex = lastInRegion.i;
      }
      setCurrent(activeIndex >= 0 ? targets[activeIndex].item : null);
    };

    // Safety valve: if the clicked region can never scroll far enough to satisfy
    // the geometry test (e.g. the final short section at page bottom), the scroll
    // still stops. Once it settles, KEEP the clicked item active (honor the click)
    // and release the lock so later manual scrolling updates normally.
    let settleTimer = 0;
    const armSettle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const held = clickedItem;
        clickedItem = null;
        if (held) setCurrent(held);
        else update();
      }, 200);
    };

    const onScroll = () => {
      if (clickedItem) armSettle();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Listen on the actual scroller (the UE canvas, or window on the page), plus
    // window as a fallback so resize/window scroll also refresh the state.
    (isWindow ? window : scroller).addEventListener('scroll', onScroll, { passive: true });
    if (!isWindow) window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Re-run when the page height changes (async content) so an early pass isn't stale.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(onScroll).observe(document.body);
    }
    update();
  }
}
