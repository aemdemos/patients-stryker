// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

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

/**
 * The nearest scrollable ancestor, or `window` when the page itself scrolls.
 * On the live site this is `window`; in the Universal Editor (html.adobe-ue-edit /
 * .adobe-ue-preview) the page renders inside a scrolling canvas, so all scroll
 * reads/writes/listeners must target that element instead of `window`.
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

export default function decorate(block) {
  const section = block.closest('.section');
  // Resolved after the nav is placed below. Live site → `window`; UE canvas →
  // the nested scrolling container. All scroll math is routed through this.
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

    // No real href: a native `#hash` jump is intercepted/reverted inside the UE
    // canvas (the "scroll a blink then snap back" symptom). We scroll via JS
    // instead, so items are links in role only.
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

  // Now the block is in its final place, find the element that actually scrolls.
  scroller = getScroller(block);
  // Viewport top of the scroller: 0 for window, else the container's client top.
  const scrollerTop = () => (scroller === window ? 0 : scroller.getBoundingClientRect().top);

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
    // active = last section past the line below the bar; inactive until the bar pins
    let ticking = false;
    const update = () => {
      ticking = false;
      const targets = currentTargets();
      const barRect = block.getBoundingClientRect();
      const barHeight = barRect.height || 70;
      // Everything is measured relative to the scroller's own top edge (0 for window).
      const top = scrollerTop();
      const viewportH = scroller === window ? window.innerHeight : scroller.clientHeight;
      const pinned = barRect.top - top <= 1;
      section?.classList.toggle('sticky-nav-pinned', pinned);
      const line = top + barHeight + 2;
      let activeIndex = -1;
      if (pinned) {
        targets.forEach((t, i) => {
          if (t.region.getBoundingClientRect().top <= line) activeIndex = i;
        });
        // Rescue a trailing section that can't scroll to the line once it's clearly in view.
        if (activeIndex < 0) {
          const midline = top + viewportH / 2;
          targets.forEach((t, i) => {
            if (t.region.getBoundingClientRect().top <= midline) activeIndex = i;
          });
        }
      }
      // Two nav items can target one section; normalize to the first item for that region.
      if (activeIndex >= 0) {
        const activeRegion = targets[activeIndex].region;
        activeIndex = targets.findIndex((t) => t.region === activeRegion);
      }
      // Fall back to the final item at page bottom only when no section already qualified.
      const scrollPos = scroller === window ? window.scrollY : scroller.scrollTop;
      const scrollSize = scroller === window
        ? document.documentElement.scrollHeight : scroller.scrollHeight;
      const atBottom = pinned && scrollPos > 0 && viewportH + scrollPos >= scrollSize - 2;
      if (atBottom && activeIndex < 0) activeIndex = targets.length - 1;

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
