/**
 * In-page helpers for the keyboard tests. Installed in every frame with
 * context.addInitScript(installPageHelpers), so the function must be
 * self-contained (it is serialised and run before the page's own scripts).
 *
 * It also installs a guard that keeps the tests read-only:
 * - clicks on links to other pages are cancelled (Enter on a link fires a click)
 * - form submission (submit buttons, implicit Enter submission) is cancelled
 */
export default function installPageHelpers() {
  if (window.kbdHelpers) return;

  let nextId = 0;
  const byId = new Map();
  const blocked = [];
  let frameKey = 'main';
  try {
    if (window !== window.top) frameKey = `frame:${window.location.host}${window.location.pathname}`;
  } catch (e) {
    frameKey = 'frame';
  }

  // ---------- read-only guard ----------
  const isSameDocumentLink = (a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return true;
    try {
      const u = new URL(a.href, window.location.href);
      const here = window.location;
      return u.origin === here.origin && u.pathname === here.pathname && u.search === here.search;
    } catch (e) {
      return true;
    }
  };
  const isSubmitControl = (el) => !!el && !!el.form
    && el.matches('button:not([type]), button[type="submit"], input[type="submit"], input[type="image"]');

  window.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const control = t.closest('button, input[type="submit"], input[type="image"]');
    if (isSubmitControl(control)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      blocked.push({ type: 'submit-click' });
      return;
    }
    const a = t.closest('a[href], area[href]');
    if (a && !isSameDocumentLink(a)) {
      e.preventDefault();
      blocked.push({ type: 'link', href: a.href });
    }
  }, true);
  window.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    blocked.push({ type: 'submit' });
  }, true);

  // ---------- element description ----------
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const short = (s, n = 80) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  const mark = (el) => {
    if (!el.kbdId) {
      nextId += 1;
      // an expando property, so the page's markup (and its styles/selectors) is untouched
      el.kbdId = String(nextId);
      byId.set(el.kbdId, el);
    }
    return el.kbdId;
  };

  const implicitRole = (el) => {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit.split(/\s+/)[0];
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'area') return el.hasAttribute('href') ? 'link' : 'generic';
    if (tag === 'button' || tag === 'summary') return 'button';
    if (tag === 'select') return el.multiple ? 'listbox' : 'combobox';
    if (tag === 'textarea') return 'textbox';
    if (tag === 'iframe') return 'iframe';
    if (tag === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      if (['checkbox', 'radio'].includes(type)) return type;
      if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button';
      if (type === 'search') return 'searchbox';
      if (type === 'range') return 'slider';
      if (type === 'number') return 'spinbutton';
      return 'textbox';
    }
    return tag;
  };

  const labelText = (el) => {
    const texts = [];
    if (el.labels) [...el.labels].forEach((l) => texts.push(l.textContent));
    return clean(texts.join(' '));
  };

  // approximate accessible name (aria-labelledby > aria-label > label > content > title)
  const accName = (el, { withPlaceholder = true } = {}) => {
    const ids = el.getAttribute('aria-labelledby');
    if (ids) {
      const t = clean(ids.split(/\s+/).map((id) => {
        const ref = document.getElementById(id);
        return ref ? ref.textContent : '';
      }).join(' '));
      if (t) return t;
    }
    const aria = clean(el.getAttribute('aria-label'));
    if (aria) return aria;
    const tag = el.tagName.toLowerCase();
    if (['input', 'select', 'textarea'].includes(tag)) {
      const lt = labelText(el);
      if (lt) return lt;
      if (tag === 'input' && ['submit', 'button', 'reset'].includes(el.type) && el.value) return clean(el.value);
      if (tag === 'input' && el.type === 'image' && el.alt) return clean(el.alt);
      const title = clean(el.getAttribute('title'));
      if (title) return title;
      return withPlaceholder ? clean(el.getAttribute('placeholder')) : '';
    }
    if (tag === 'iframe') return clean(el.getAttribute('title'));
    let text = clean(el.innerText || el.textContent);
    if (!text) {
      const img = el.querySelector('img[alt], svg[aria-label], [aria-label]');
      if (img) text = clean(img.getAttribute('alt') || img.getAttribute('aria-label'));
    }
    if (!text) text = clean(el.getAttribute('title'));
    return text;
  };

  const viewportRect = (el) => {
    let r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) {
      // inline wrappers (e.g. <a> around a block image) can report an empty box
      let left = Infinity; let top = Infinity; let right = -Infinity; let bottom = -Infinity;
      el.querySelectorAll('*').forEach((c) => {
        const cr = c.getBoundingClientRect();
        if (cr.width >= 1 && cr.height >= 1) {
          left = Math.min(left, cr.left); top = Math.min(top, cr.top);
          right = Math.max(right, cr.right); bottom = Math.max(bottom, cr.bottom);
        }
      });
      if (right > left) r = { left, top, width: right - left, height: bottom - top };
    }
    return {
      x: r.left, y: r.top, w: r.width, h: r.height,
    };
  };

  const isFixed = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  };

  const hiddenReasons = (el, vr) => {
    const reasons = [];
    const docW = document.documentElement.scrollWidth;
    const docH = document.documentElement.scrollHeight;
    const x = vr.x + window.scrollX;
    const y = vr.y + window.scrollY;
    if (vr.w <= 1 || vr.h <= 1) reasons.push('zero-size');
    else if (x + vr.w <= 0 || y + vr.h <= 0 || x >= docW || y >= docH) reasons.push('off-screen');
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') reasons.push('visibility-hidden');
    let opacity = 1;
    let ariaHidden = false;
    let clipped = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const ns = getComputedStyle(n);
      opacity *= parseFloat(ns.opacity);
      if (n.getAttribute('aria-hidden') === 'true') ariaHidden = true;
      if (n !== el && (ns.overflowX !== 'visible' || ns.overflowY !== 'visible') && vr.w > 1 && vr.h > 1) {
        const ar = n.getBoundingClientRect();
        const overlaps = vr.x < ar.right && vr.x + vr.w > ar.left
          && vr.y < ar.bottom && vr.y + vr.h > ar.top;
        if (!overlaps && ar.width > 0) clipped = true;
      }
      if (ns.clipPath && /inset\(\s*(50|100)%/.test(ns.clipPath)) clipped = true;
    }
    if (opacity < 0.05) reasons.push('transparent');
    if (ariaHidden) reasons.push('aria-hidden');
    if (clipped && !reasons.includes('off-screen')) reasons.push('clipped');
    return reasons;
  };

  const container = (el) => {
    const c = el.closest('header, nav, main, footer, aside, form, [role="dialog"], [role="navigation"], [role="banner"], [role="contentinfo"]');
    if (!c) return 'body';
    const cls = typeof c.className === 'string' ? c.className.trim().split(/\s+/)[0] : '';
    return `${c.tagName.toLowerCase()}${c.id ? `#${c.id}` : ''}${cls ? `.${cls}` : ''}`;
  };

  const describe = (el) => {
    const id = mark(el);
    const vr = viewportRect(el);
    const tag = el.tagName.toLowerCase();
    return {
      key: `${frameKey}|${id}`,
      id,
      frame: frameKey,
      tag,
      role: implicitRole(el),
      name: short(accName(el)),
      href: el.getAttribute('href') || null,
      tabindex: el.hasAttribute('tabindex') ? el.tabIndex : null,
      isIframe: tag === 'iframe',
      rect: {
        x: Math.round(vr.x + window.scrollX),
        y: Math.round(vr.y + window.scrollY),
        w: Math.round(vr.w),
        h: Math.round(vr.h),
      },
      fixed: isFixed(el),
      hidden: hiddenReasons(el, vr),
      container: container(el),
    };
  };

  const deepActive = () => {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  };

  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    if (el.closest('[inert]')) return false;
    const vr = viewportRect(el);
    if (vr.w < 1 || vr.h < 1) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const ns = getComputedStyle(n);
      if (parseFloat(ns.opacity) < 0.05 || ns.display === 'none') return false;
      if (n.getAttribute('aria-hidden') === 'true') return false;
    }
    return true;
  };

  const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  const styleSnapshot = (el) => {
    const cs = getComputedStyle(el);
    return [
      cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset, cs.boxShadow,
      cs.borderTopColor, cs.borderBottomColor, cs.borderTopWidth, cs.borderBottomWidth,
      cs.backgroundColor, cs.color, cs.textDecorationLine,
    ].join('|');
  };

  window.kbdHelpers = {
    frameKey,
    blocked,
    byId,
    mark,
    describe,
    accName,
    isVisible,
    isFixed,
    viewportRect,
    styleSnapshot,
    FOCUSABLE,
    deepActive,
    get: (id) => byId.get(String(id)) || null,
    activeInfo() {
      const a = deepActive();
      if (!a || a === document.body || a === document.documentElement) return { isBody: true };
      return describe(a);
    },
    // is the element fully covered by another one (e.g. a sticky header) where the
    // browser scrolled it on focus? Sampled at three points inside the viewport.
    obscured(el) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const points = [0.2, 0.5, 0.8]
        .map((f) => [r.left + r.width * f, r.top + r.height / 2])
        .filter(([x, y]) => x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight);
      if (!points.length) return false;
      return points.every(([x, y]) => {
        const top = document.elementFromPoint(x, y);
        return top && top !== el && !el.contains(top) && !top.contains(el);
      });
    },
    // scroll an element to the middle of the viewport and return its viewport box
    prepareCapture(id, { checkObscured = false } = {}) {
      const el = byId.get(String(id));
      if (!el || !el.isConnected) return null;
      const obscured = checkObscured ? window.kbdHelpers.obscured(el) : false;
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      const vr = viewportRect(el);
      return { rect: vr, style: styleSnapshot(el), obscured };
    },
    blurActive() {
      const a = deepActive();
      if (a && a !== document.body && typeof a.blur === 'function') a.blur();
    },
    focus(id) {
      const el = byId.get(String(id));
      if (!el) return false;
      el.focus();
      return deepActive() === el;
    },
    isActive(id) {
      return deepActive() === byId.get(String(id));
    },
    activeWithin(id) {
      const el = byId.get(String(id));
      const a = deepActive();
      return !!(el && a && (el === a || el.contains(a)));
    },
  };
}
