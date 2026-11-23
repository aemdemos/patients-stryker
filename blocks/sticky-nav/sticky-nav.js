// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.

/**
 * Resolve a nav target: `.section[data-anchor]` wins over a plain id.
 * @param {string} href
 * @param {Element[]} [anchored] pre-collected `.section[data-anchor]` elements, so
 * callers resolving several hrefs at once query the DOM only once
 */
function resolveTarget(href, anchored) {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href;
  if (!hash) return null;

  const sections = anchored || [...document.querySelectorAll('.section[data-anchor]')];
  const byAnchor = sections.find((s) => s.dataset.anchor
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

    const labelEl = labelCell.querySelector('p') || document.createElement('p');
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

  // Resolve targets lazily so anchors in async-loaded fragments are picked up,
  // then cache the result: `update()` runs on every scroll frame and re-resolving
  // meant a `querySelectorAll` per nav item per frame. The cache is dropped
  // whenever the page can have gained/moved anchors (resize, late content).
  let cachedTargets = null;
  const invalidateTargets = () => { cachedTargets = null; };
  const currentTargets = () => {
    if (!cachedTargets) {
      const anchored = [...document.querySelectorAll('.section[data-anchor]')];
      cachedTargets = items
        .map(({ item, href }) => {
          const anchor = resolveTarget(href, anchored);
          const region = anchor?.closest('.section') || anchor;
          return { item, region, anchor };
        })
        .filter((t) => t.region);
    }
    return cachedTargets;
  };

  // jumps stop below the bar; on phones the bar is hidden, so sections land at the top
  const applyScrollOffset = () => {
    const hidden = section && getComputedStyle(section).display === 'none';
    const bar = hidden ? '0px' : `${block.getBoundingClientRect().height || 70}px`;
    currentTargets().forEach(({ region, anchor }) => {
      region.style.scrollMarginTop = bar;
      if (anchor && anchor !== region) anchor.style.scrollMarginTop = bar;
    });
  };
  applyScrollOffset();
  window.addEventListener('resize', () => {
    invalidateTargets();
    applyScrollOffset();
  }, { passive: true });

  // Phones: the bar is hidden, so (as on the source) a floating "⋮" button opens the same
  // sections in a slide-in panel. Built at the end of <body> because the block's section
  // is display:none on phones; CSS shows it below 600px only. Wired to goTo() below.
  const mobile = document.createElement('div');
  mobile.className = 'sticky-nav-mobile';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sticky-nav-mobile-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Page sections');
  const dots = document.createElement('span');
  dots.className = 'sticky-nav-mobile-dots';
  const close = document.createElement('span');
  close.className = 'sticky-nav-mobile-close';
  close.textContent = 'X';
  [dots, close].forEach((s) => s.setAttribute('aria-hidden', 'true'));
  toggle.append(dots, close);
  const panel = document.createElement('nav');
  panel.className = 'sticky-nav-mobile-panel';
  panel.id = `sticky-nav-mobile-${Math.random().toString(36).slice(2, 8)}`;
  panel.setAttribute('aria-label', 'Page sections');
  panel.hidden = true;
  toggle.setAttribute('aria-controls', panel.id);
  const mobileItems = new Map();
  items.forEach(({ item, href }) => {
    const entry = document.createElement('a');
    entry.className = 'sticky-nav-mobile-item';
    entry.setAttribute('role', 'link');
    entry.setAttribute('tabindex', '0');
    entry.dataset.target = href;
    entry.textContent = item.textContent.trim();
    panel.append(entry);
    mobileItems.set(item, entry);
  });
  mobile.append(panel, toggle);
  if (items.length) document.body.append(mobile);

  const setMenuOpen = (open, { focus = true } = {}) => {
    mobile.classList.toggle('sticky-nav-mobile-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close page sections' : 'Page sections');
    panel.hidden = !open;
    if (!focus) return;
    if (open) panel.querySelector('.sticky-nav-mobile-item')?.focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  // close on Escape, and on a tap outside the panel (the uncovered strip on the left)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenuOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (toggle.getAttribute('aria-expanded') === 'true' && !mobile.contains(e.target)) setMenuOpen(false, { focus: false });
  });

  const setCurrent = (activeItem) => {
    items.forEach(({ item }) => {
      item.classList.toggle('sticky-nav-item-current', item === activeItem);
      mobileItems.get(item)?.classList.toggle('sticky-nav-mobile-item-current', item === activeItem);
    });
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
    // phone menu entry: jump to the same section, then close the panel (as on the source)
    const entry = mobileItems.get(item);
    const pick = (e) => {
      e.preventDefault();
      setMenuOpen(false, { focus: false });
      goTo(item, href);
    };
    entry.addEventListener('click', pick);
    entry.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') pick(e);
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

    // Scroll/resize listeners cost nothing until they fire, so wire them now —
    // scrolling before the deferred setup below still updates the active item.
    // Listen on the actual scroller (the UE canvas, or `window` on the live site).
    scrollTarget().addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // The re-sync wiring and its extra pass cost a forced layout per nav item,
    // so keep them off the critical path and let the page reach LCP first.
    const startScrollSpy = () => {
      // Anchors from lazily loaded fragments may have arrived since the first
      // pass cached the targets (and `load` has often fired by now), so re-resolve.
      invalidateTargets();
      // Re-run when the page height changes, since an early pass may misread a
      // short page as bottom. `update()` toggles a class on the section, which
      // resizes `body` and would re-trigger the observer synchronously — an
      // endless feedback loop. The timeout breaks that cycle and also coalesces
      // the burst of resizes from lazily loaded fragments/images into one pass.
      if (typeof ResizeObserver === 'function') {
        let resizeTimer;
        let lastHeight = document.body.offsetHeight;
        const observer = new ResizeObserver(() => {
          if (document.body.offsetHeight === lastHeight) return;
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            lastHeight = document.body.offsetHeight;
            invalidateTargets();
            onScroll();
          }, 200);
        });
        observer.observe(document.body);
      }
      window.addEventListener('load', () => {
        invalidateTargets();
        onScroll();
      });
      update();
    };

    // One immediate pass so a deep-linked load paints the correct active item.
    update();
    if ('requestIdleCallback' in window) window.requestIdleCallback(startScrollSpy, { timeout: 3000 });
    else window.setTimeout(startScrollSpy, 500);
  }
}
