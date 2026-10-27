// Sticky Nav Block — in-page anchor bar; row = item (label + `#id` link) with scroll-spy.
// `local` variant — page navigation of a page family (www.stryker.com local page nav):
// row 1 = parent page link, then one row per child page (label | page link); no scroll-spy.

/**
 * A page path in comparable form: no `.html`, no `/index`, no trailing slash.
 * @param {string} path
 */
const normalizePath = (path) => path
  .replace(/\.html$/, '')
  .replace(/\/index$/, '/')
  .replace(/\/+$/, '') || '/';

/**
 * Builds the `local` variant: parent link + child page links, the current page marked
 * active; below 600px a disclosure button (current page title) opens the full list.
 * @param {Element} block The block element
 */
function decorateLocal(block) {
  const current = normalizePath(window.location.pathname);

  // row 1: parent (one cell holding a link); other rows: label | page link
  const entries = [...block.children].map((row) => {
    const [labelCell, linkCell] = row.children;
    const link = linkCell?.querySelector('a') || labelCell?.querySelector('a');
    const href = link?.getAttribute('href') || linkCell?.textContent.trim() || '';
    const label = labelCell?.textContent.trim() || link?.textContent.trim() || '';
    return { label, href };
  }).filter(({ label, href }) => label && href);
  if (!entries.length) {
    block.textContent = '';
    return;
  }

  const makeLink = ({ label, href }) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (normalizePath(new URL(a.href, window.location.href).pathname) === current) {
      a.setAttribute('aria-current', 'page');
    }
    return a;
  };

  const [parent, ...children] = entries;
  const nav = document.createElement('nav');
  nav.className = 'sticky-nav-local';
  nav.setAttribute('aria-label', parent.label);

  // ≥600px: the parent title on the left
  const parentLink = makeLink(parent);
  parentLink.className = 'sticky-nav-local-parent';

  // the page list: children inline from 600px; below 600px the disclosure list,
  // headed by the parent (that item is hidden from 600px, where the title shows it)
  const list = document.createElement('ul');
  list.className = 'sticky-nav-local-links';
  list.id = `sticky-nav-local-${document.querySelectorAll('.sticky-nav-local').length}`;
  const parentItem = document.createElement('li');
  parentItem.className = 'sticky-nav-local-parent-item';
  parentItem.append(makeLink(parent));
  list.append(parentItem);
  // the spaces match the source inline list: a space before each "|" divider and between items
  children.forEach((entry) => {
    const li = document.createElement('li');
    li.append(makeLink(entry), ' ');
    list.append(' ', li);
  });

  // below 600px: the current page title as the toggle (source .page-title + .mobile-btn);
  // a page outside the list shows its own title, as the source does
  const activeLabel = list.querySelector('[aria-current="page"]')?.textContent
    || document.title.split(' | ')[0].trim() || parent.label;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sticky-nav-local-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', list.id);
  const title = document.createElement('span');
  title.className = 'sticky-nav-local-title';
  title.textContent = activeLabel;
  const icon = document.createElement('span');
  icon.className = 'sticky-nav-local-icon';
  icon.setAttribute('aria-hidden', 'true');
  toggle.append(title, icon);

  const setExpanded = (expanded) => {
    toggle.setAttribute('aria-expanded', String(expanded));
    nav.classList.toggle('sticky-nav-local-expanded', expanded);
  };
  toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
    setExpanded(false);
    toggle.focus();
  });

  nav.append(toggle, parentLink, list);
  block.replaceChildren(nav);

  // not an anchor bar: opt the section out of the bar's sticky/hidden section rules
  block.closest('.section')?.classList.replace('sticky-nav-container', 'sticky-nav-local-container');
}

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
  if (block.classList.contains('local')) {
    decorateLocal(block);
    return;
  }
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

  const applyScrollOffset = () => {
    const bar = `${block.getBoundingClientRect().height || 70}px`;
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
