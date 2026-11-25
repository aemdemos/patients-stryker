/*
 * Inside the real stryker.com page when the review tool shows it (Compare with: Live): tells the
 * tool where its texts and images are (for Scroll Sync, the same anchors as the tool's sync.js)
 * and where it is scrolled to, and scrolls when the tool asks. Does nothing anywhere else: only in
 * a frame whose parent is a review page (aem.page, aem.live, localhost).
 */
(() => {
  if (window.top === window) return;
  const parent = (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) || '';
  if (!/^https:\/\/[a-z0-9-]+(--[a-z0-9-]+)*\.aem\.(page|live)$|^http:\/\/localhost(:\d+)?$/.test(parent)) return;
  // (only the frame the tool shows: not frames inside the page)
  if (window.parent !== window.top) return;

  // the anchors: as in the tool's sync.js (innermost text holders of 12+ characters, images by
  // file name), with their page position
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, li, td, th, dt, dd, figcaption, blockquote';
  const MIN_TEXT = 12;
  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  function leaves() {
    const root = document.querySelector('main') || document.body;
    if (!root) return [];
    const out = [];
    root.querySelectorAll(TEXT).forEach((el) => {
      if (el.querySelector(TEXT)) return;
      const text = norm(el.textContent);
      if (text.length < MIN_TEXT) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      out.push({ key: `t:${text.slice(0, 90)}`, y: r.top + window.scrollY });
    });
    root.querySelectorAll('img').forEach((img) => {
      const file = (img.currentSrc || img.src || '').split('?')[0].split('/').pop();
      const r = img.getBoundingClientRect();
      if (!file || !r.width || !r.height) return;
      out.push({ key: `i:${file}`, y: r.top + window.scrollY });
    });
    return out;
  }

  const send = (msg) => window.parent.postMessage({ reviewLive: true, ...msg }, parent);
  const where = () => send({
    type: 'scroll', y: window.scrollY, h: window.innerHeight, url: window.location.href,
  });
  const describe = () => send({
    type: 'leaves',
    leaves: leaves(),
    y: window.scrollY,
    h: window.innerHeight,
    height: document.documentElement.scrollHeight,
    url: window.location.href,
    title: document.title,
  });

  let quietUntil = 0;
  let timer = 0;
  const later = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(describe, 400);
  };
  window.addEventListener('scroll', () => {
    if (Date.now() < quietUntil) return;
    window.requestAnimationFrame(where);
  }, { passive: true });
  window.addEventListener('message', (e) => {
    if (e.origin !== parent || e.source !== window.parent || !e.data?.reviewLive) return;
    if (e.data.type === 'scrollTo') {
      // (the tool scrolled it: not reported back, or the two would chase each other)
      quietUntil = Date.now() + 250;
      window.scrollTo(0, Math.max(0, Number(e.data.y) || 0));
    } else if (e.data.type === 'hello') describe();
  });
  // the page changes as it loads (fonts, images, its scripts): described again, debounced
  const start = () => {
    describe();
    new ResizeObserver(later).observe(document.documentElement);
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.addEventListener('load', later);
})();
