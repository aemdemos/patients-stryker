/*
 * www.stryker.com (corp) runtime. scripts.js imports this module only on pages whose
 * `site` metadata is `corp` (set once on `**` in the corp bulk metadata sheet), so
 * patients-stryker pages never load it and keep the patients code path unchanged.
 *
 * scripts.js calls in:
 *   loadEager(doc)          before decorateMain: body.corp (+ hcp-banner), styles/corp-base.css,
 *                           styles/corp.css and the <block>-corp.css overlays of reused
 *                           patients blocks
 *   decorateMain(main)      after the DM assets are rendered, before auto blocking
 *   loadTemplate(name)      corp templates are CSS-only
 *   loadFirstSections(main) instead of loading the first section eagerly
 *   loadHeader(doc) / loadFooter(doc) / loadLazy(doc) / decorateLastModified(main)
 */
import {
  buildBlock,
  decorateBlock,
  getMetadata,
  loadBlock,
  loadCSS,
  loadSection,
  waitForFirstImage,
} from './aem.js';
import { previewDMLinkEditors } from './dm-support.js';

/**
 * patients blocks reused on corp pages with a `blocks/<name>/<name>-corp.css` overlay.
 * Add a name here in the same PR that adds its overlay file.
 */
const CORP_BLOCK_STYLES = ['marketo-form', 'tabs'];

/**
 * Marks the page as corp and loads the corp global styles before the page appears.
 * @param {Document} doc The document
 */
export async function loadEager(doc) {
  doc.body.classList.add('corp');
  // HCP notice band: `hcp-banner: true` metadata adds the band to the header-corp and
  // extends the header height reservation (corp.css --nav-height)
  if ((getMetadata('hcp-banner') || '').trim().toLowerCase() === 'true') {
    doc.body.classList.add('hcp-banner');
  }
  const base = window.hlx.codeBasePath;
  // link order is cascade order: the patients rules corp was built on, then corp's own
  await Promise.all([
    loadCSS(`${base}/styles/corp-base.css`),
    loadCSS(`${base}/styles/corp.css`),
    // corp look of the reused patients blocks: all of them up front, so blocks that arrive
    // later (fragments, auto-blocks) are styled too (sdt-stryker#5)
    ...CORP_BLOCK_STYLES.map((name) => loadCSS(`${base}/blocks/${name}/${name}-corp.css`)),
  ]);
}

/**
 * Returns the 11-char YouTube video id for watch / youtu.be / embed / shorts URLs, or ''
 * for anything else (channel and user pages, playlists) — same shapes blocks/video decodes.
 * @param {string} href the link href
 * @returns {string}
 */
function youTubeVideoId(href) {
  try {
    const url = new URL(href, window.location.href);
    if (!/(?:^|\.)(?:youtube(?:-nocookie)?\.com|youtu\.be)$/i.test(url.hostname)) return '';
    const v = url.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = url.pathname.match(/^\/(?:embed|shorts|v)\/([\w-]{11})(?:$|\/)|^\/([\w-]{11})$/);
    return (m && (m[1] || m[2])) || '';
  } catch {
    return '';
  }
}

/**
 * Turns a default-content paragraph whose only child is a YouTube video link into the
 * `video` block (live c-standalone-video): the block decorates a single cell holding the
 * link, so the paragraph is replaced by `buildBlock('video', { elems: [link] })`. Links
 * that already sit inside a block (an accordion body, a columns cell — no nested blocks)
 * or inside an existing `.video` are left alone; channel / user links never match.
 * @param {Element} main The container element
 */
function buildVideoAutoBlocks(main) {
  main.querySelectorAll('p > a[href]').forEach((link) => {
    if (link.closest('.video')) return;
    const p = link.parentElement;
    // default content only: the <p> is a direct child of a section (main > div > p)
    if (!p.parentElement || p.parentElement.parentElement !== main) return;
    // the link is the paragraph's sole content (no bold/italic CTA wrapper, no caption)
    if (p.children.length !== 1 || p.textContent.trim() !== link.textContent.trim()) return;
    if (!youTubeVideoId(link.getAttribute('href'))) return;
    p.replaceWith(buildBlock('video', { elems: [link] }));
  });
}

/**
 * Corp decoration of <main> (and of fragments, which run decorateMain too).
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  previewDMLinkEditors();
  try {
    buildVideoAutoBlocks(main);
  } catch {
    // a malformed link leaves the paragraph as authored; decoration carries on
  }
}

/**
 * Corp templates (`template` metadata) ship CSS only.
 * @param {string} templateName The template name
 */
export async function loadTemplate(templateName) {
  try {
    await loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`);
  } catch {
    // an unknown template name has no stylesheet: the page renders with corp.css alone
  }
}

/**
 * DA pages often open with an empty `<div></div>` section. It stays in the DOM
 * (main > .section:first-child rules are tuned around it), but the LCP section is the
 * first one with content: load the leading empties, then that one eagerly. Loading only
 * the first (empty) section left the hero waiting for loadLazy (PSI mobile LCP 6.6 s on
 * product-detail).
 * @param {Element} main The main element
 */
export async function loadFirstSections(main) {
  const sections = [...main.querySelectorAll(':scope > .section')];
  if (!sections.length) return;
  const lcpIndex = Math.max(sections.findIndex((section) => section.children.length), 0);
  await sections.slice(0, lcpIndex)
    .reduce((ready, section) => ready.then(() => loadSection(section)), Promise.resolve());
  await loadSection(sections[lcpIndex], waitForFirstImage);
}

/**
 * Builds, decorates and loads a chrome block (header-corp / footer-corp) into its
 * landmark, in place of aem.js loadHeader / loadFooter. The blocks read the `nav` /
 * `footer` metadata themselves (defaults /nav, /footer).
 * @param {Element} parent The <header> or <footer> landmark
 * @param {string} name The block name
 */
async function loadChrome(parent, name) {
  if (!parent) return null;
  const block = buildBlock(name, '');
  parent.append(block);
  decorateBlock(block);
  return loadBlock(block);
}

/**
 * @param {Document} doc The document
 */
export function loadHeader(doc) {
  return loadChrome(doc.querySelector('header'), 'header-corp');
}

/**
 * Back-to-top control (live c-back-to-top, components.min.css L1309-1311): a fixed
 * 40px black disc with the strykericons up-chevron, faded in once scrollY >= 500
 * (motion-observe). Built here, outside <main>, so it is never page content.
 * @param {Document} doc The document
 */
function decorateBackToTop(doc) {
  if (doc.querySelector('.back-to-top')) return;
  const wrap = doc.createElement('div');
  wrap.className = 'back-to-top u-anim-fadeout';
  const cta = doc.createElement('a');
  cta.href = '#';
  cta.className = 'back-to-top-cta';
  cta.setAttribute('aria-label', 'Back to top');
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  wrap.append(cta);
  doc.body.append(wrap);
  const update = () => {
    const on = window.scrollY >= 500;
    wrap.classList.toggle('u-anim-fadein', on);
    wrap.classList.toggle('u-anim-fadeout', !on);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/**
 * @param {Document} doc The document
 */
export function loadFooter(doc) {
  loadChrome(doc.querySelector('footer'), 'footer-corp');
  decorateBackToTop(doc);
}

/**
 * hreflang alternates. The live site emits one <link rel="alternate"> per locale on every
 * page; head.html is shared, so the set is read from the site sheet /hreflang.json (built
 * from the live sets). Pattern rows derive https://www.stryker.com/<cc>/<lang><tail>.html
 * from the locale codes; explicit rows carry "code|href;…".
 */
async function emitHreflang() {
  try {
    if (document.head.querySelector('link[rel="alternate"][hreflang]')) return;
    const resp = await fetch(`${window.hlx.codeBasePath}/hreflang.json`);
    if (!resp.ok) return;
    const { data = [] } = await resp.json();
    const current = window.location.pathname.replace(/\/index$/, '').replace(/\/$/, '') || '/';
    const row = data.find((r) => r.path === current);
    if (!row) return;
    const frag = document.createDocumentFragment();
    const add = (hreflang, href) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = href;
      frag.append(link);
    };
    if (row.alternates) {
      row.alternates.split(';').forEach((pair) => {
        const [code, href] = pair.split('|');
        if (code && href) add(code, href);
      });
    } else if (row.locales) {
      const tail = row.source || current.replace(/^\/us\/en/, '');
      row.locales.split(',').forEach((raw) => {
        const code = raw.trim();
        const [lang, cc] = code.split('-');
        if (lang && cc) add(code, `https://www.stryker.com/${cc.toLowerCase()}/${lang.toLowerCase()}${tail}.html`);
      });
    }
    if (row.xdefault) add('x-default', row.xdefault);
    document.head.append(frag);
  } catch (e) {
    // no alternates sheet: nothing to emit
  }
}

/**
 * Home JSON-LD: the source home page's only schema is WebSite + SearchAction, emitted here
 * for the home path only. Host-relative via location.origin (repoless-safe).
 */
function emitHomeJsonLd() {
  const current = window.location.pathname.replace(/\/index$/, '').replace(/\/$/, '');
  if (current !== '/us/en' || document.querySelector('script[type="application/ld+json"]')) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: `${window.location.origin}/us/en/`,
    name: 'Stryker',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${window.location.origin}/us/en/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
  document.head.append(script);
}

/**
 * After LCP: head additions (the 16 KB hreflang sheet competed with the hero image when
 * fetched from loadEager).
 */
export function loadLazy() {
  emitHreflang();
  emitHomeJsonLd();
}

/* Normalizes a pathname for comparison against query-index paths */
function normalizePath(path) {
  const clean = path.replace(/\.html$/, '').replace(/\/+$/, '');
  return clean || '/';
}

const MONTH_YEAR = { year: 'numeric', month: 'long' };

/* The query-index publish timestamp as "<Month>/<Year>"; '' when the page is not indexed. */
async function getAutoLastModified() {
  const resp = await fetch(`${window.hlx.codeBasePath}/query-index.json`);
  if (!resp.ok) return '';
  const { data = [] } = await resp.json();
  const current = normalizePath(window.location.pathname);
  const row = data.find((r) => normalizePath(r.path) === current);
  const ts = row && Number(row.lastModified);
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('en-US', MONTH_YEAR).replace(' ', '/');
}

/*
 * The authored `published` metadata (live #publishedDate, e.g. "2026-02", "2026-02-14" or
 * any Date-parsable string) as "<Month>/<Year>"; '' when absent/invalid.
 */
function getPublishedLastModified() {
  const raw = (getMetadata('published') || '').trim();
  if (!raw) return '';
  const ym = raw.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  const date = ym
    ? new Date(Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 1))
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { ...MONTH_YEAR, timeZone: 'UTC' }).replace(' ', '/');
}

/*
 * The "Last Updated" line, as scripts.js decorateLastModified (same `last-updated`
 * bulk-metadata switch and markup), dated from the page's `published` metadata (live
 * "Last Updated <Month>/<Year>") with the query-index timestamp as the fallback.
 * @param {Element} main The main element
 */
export async function decorateLastModified(main) {
  try {
    const setting = (getMetadata('last-updated') || '').trim().toLowerCase();
    if (setting !== 'show') return;

    const formatted = getPublishedLastModified() || await getAutoLastModified();
    if (!formatted) return;

    const section = document.createElement('div');
    section.className = 'section last-modified-section';
    const wrapper = document.createElement('div');
    const p = document.createElement('p');
    p.className = 'last-modified';
    p.textContent = `Last Updated ${formatted}`;
    wrapper.append(p);
    section.append(wrapper);
    main.append(section);
  } catch (e) {
    // do nothing — the last-modified line is non-critical
  }
}
