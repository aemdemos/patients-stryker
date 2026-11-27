/*
 * A source page's content fingerprint (the daily change check, pilot on Stage, 24 Nov 2026):
 * what the page says and shows, part by part, without screenshots, made so that the same page
 * gives the same fingerprint on every visit:
 * - text from textContent (hidden tab panels, accordions and every carousel slide included,
 *   whatever is showing; carousel clones left out), whitespace collapsed;
 * - dates, times, "… ago" and the copyright year masked; count-ups by their target value
 *   (data-* attributes) rather than the number showing; video players' clocks left out;
 * - images by asset (Dynamic Media asset name, DAM path, else host + path: no size, quality or
 *   cache-busting parameters; a player's blob: address is not an asset: a video counts by its
 *   poster and asset attributes), links by target (no tracking parameters), embeds by host + path;
 * - Marketo forms by their number (their fields arrive from Marketo late);
 * - the header and the footer apart from the page's own parts (a site-wide menu change is one
 *   change of the site, not one of every page).
 * pageContent runs in the page (self-contained); fingerprintOf hashes its answer in the action.
 */
import crypto from 'crypto';

/** in the page: the content, part by part (no hashing: the action hashes) */
export function pageContent() {
  const DROP = 'script, style, noscript, template, link, meta, svg title, #onetrust-consent-sdk, #onetrust-banner-sdk, '
    + '.slick-cloned, .swiper-slide-duplicate, .vjs-control-bar, .vjs-time-control, [class*="s7controlbar"], '
    + '[class*="s7videotime"], [class*="time-display"], [class*="progress-bar"]';
  const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
  const MASKS = [
    [new RegExp(`\\b(?:${MONTHS})\\.? \\d{1,2},? \\d{4}\\b`, 'gi'), '‹date›'],
    [new RegExp(`\\b\\d{1,2} (?:${MONTHS})\\.? \\d{4}\\b`, 'gi'), '‹date›'],
    [/\b\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, '‹date›'],
    [/\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?\b/gi, '‹time›'],
    [/\b\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\b/gi, '‹ago›'],
    [/(©|copyright)\s*\d{4}(\s*[-–]\s*\d{4})?/gi, '$1 ‹year›'],
  ];
  const norm = (s) => MASKS.reduce((t, [re, to]) => t.replace(re, to), (s || '').replace(/\s+/g, ' ').trim());
  const asset = (raw) => {
    if (!raw) return null;
    let u;
    try {
      u = new URL(raw.trim().split(/\s+/)[0], window.location.href);
    } catch (e) {
      return null;
    }
    // (data: and blob: addresses: inline or made by the player on each visit, not an asset)
    if (u.protocol === 'data:' || u.protocol === 'blob:') return null;
    const dm = u.pathname.match(/\/is\/(?:image|content)\/(.+)$/);
    if (dm) return `dm:${dm[1].replace(/:[^/]*$/, '')}`;
    return `${u.hostname === window.location.hostname ? '' : u.hostname}${u.pathname}`;
  };
  const target = (raw) => {
    try {
      const u = new URL(raw, window.location.href);
      if (!/^https?:$/.test(u.protocol)) return `${u.protocol}${u.pathname}`;
      [...u.searchParams.keys()].filter((k) => /^(utm_|gclid|fbclid|mc_|_ga)/i.test(k)).forEach((k) => u.searchParams.delete(k));
      return `${u.hostname === window.location.hostname ? '' : u.hostname}${u.pathname}${u.search}${u.hash}`;
    } catch (e) {
      return null;
    }
  };
  const COUNT = ['data-count', 'data-to', 'data-target', 'data-number', 'data-end', 'data-value', 'data-countup'];
  const partOf = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll(DROP).forEach((x) => x.remove());
    // Marketo forms: by their number (in the page's markup); their fields come from Marketo,
    // late and not on every visit at the same moment
    c.querySelectorAll('form[id^="mktoForm_"], form.mktoForm, [data-formid]').forEach((x) => {
      const id = (x.id || '').replace('mktoForm_', '') || x.getAttribute('data-formid') || '?';
      x.replaceWith(document.createTextNode(` ‹form:${id}› `));
    });
    // count-ups: their target, not the number showing
    c.querySelectorAll(COUNT.map((a) => `[${a}]`).join(',')).forEach((x) => {
      const a = COUNT.find((k) => x.hasAttribute(k));
      x.textContent = `‹count:${x.getAttribute(a)}›`;
    });
    const images = new Set();
    // (a Dynamic Media video: named by its component's data-asset-path in the page's markup,
    // there from the start; the player copies it onto what it builds only once it's ready)
    c.querySelectorAll('img, source, video, [style*="background"], [data-asset-path], [data-asset]').forEach((x) => {
      ['src', 'data-src', 'srcset', 'data-srcset', 'poster', 'data-poster', 'data-asset', 'data-asset-path', 'data-video'].forEach((a) => {
        const v = x.getAttribute(a);
        if (v) images.add(asset(v.split(',')[0]));
      });
      const bg = (x.getAttribute('style') || '').match(/url\(["']?([^"')]+)/);
      if (bg) images.add(asset(bg[1]));
    });
    const links = new Set();
    c.querySelectorAll('a[href]').forEach((a) => links.add(target(a.getAttribute('href'))));
    const embeds = new Set();
    c.querySelectorAll('iframe[src], iframe[data-src], embed[src], object[data]').forEach((x) => embeds.add(asset(x.getAttribute('src') || x.getAttribute('data-src') || x.getAttribute('data'))));
    const clean = (set) => [...set].filter(Boolean).sort();
    // the text without the video players' own controls and menus (Dynamic Media: s7…), which
    // they build at their own pace (share, embed, sizes); their poster and asset counted above
    c.querySelectorAll('[class^="s7"], [class*=" s7"]').forEach((x) => x.remove());
    return {
      text: norm(c.textContent), images: clean(images), links: clean(links), embeds: clean(embeds),
    };
  };
  const first = (sel) => document.querySelector(sel);
  const header = first('header, #header, .header, [class*="experiencefragment--header"]');
  const footer = first('footer, #footer, .footer, [class*="experiencefragment--footer"]');
  // the page's own content: main, else the body; then down while one child holds nearly all
  let root = first('main, #main, #main-content, [role="main"]') || document.body;
  const size = (el) => (el.textContent || '').length;
  for (;;) {
    const kids = [...root.children].filter((k) => k !== header && k !== footer && !DROP.split(', ').some((s) => k.matches(s)));
    const big = kids.find((k) => size(k) > 0.85 * size(root));
    if (kids.length && big && kids.filter((k) => size(k) > 0).length === 1) root = big;
    else break;
  }
  const parts = [...root.children]
    .filter((k) => k !== header && k !== footer && !(header && header.contains(k)) && !(footer && footer.contains(k)))
    .filter((k) => !DROP.split(', ').some((s) => k.matches(s)))
    .map((k, i) => ({ key: `${i}:${k.tagName.toLowerCase()}${k.classList[0] ? `.${k.classList[0]}` : ''}`, ...partOf(k) }))
    .filter((p) => p.text || p.images.length || p.embeds.length);
  return {
    title: norm(document.title),
    description: norm(first('meta[name="description"]')?.getAttribute('content')),
    header: header ? partOf(header) : null,
    footer: footer ? partOf(footer) : null,
    parts,
  };
}

const sha = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);

/** pageContent's answer → { page: hash of the page's own content, chrome: header + footer, parts: [{ key, hash, size }] } */
export function fingerprintOf(content) {
  const parts = content.parts.map((p) => ({ key: p.key, hash: sha([p.text, p.images, p.links, p.embeds]), size: p.text.length }));
  return {
    page: sha([content.title, content.description, parts.map((p) => p.hash)]),
    chrome: sha([content.header, content.footer]),
    parts,
    textSize: content.parts.reduce((n, p) => n + p.text.length, 0),
  };
}

/** two fingerprints → the parts that differ (by hash: a part moved is not a change) */
export function partsChanged(a, b) {
  const ha = new Set(a.parts.map((p) => p.hash));
  const hb = new Set(b.parts.map((p) => p.hash));
  return {
    gone: a.parts.filter((p) => !hb.has(p.hash)).map((p) => p.key),
    added: b.parts.filter((p) => !ha.has(p.hash)).map((p) => p.key),
    chrome: a.chrome !== b.chrome,
  };
}
