/*
 * www.stryker.com (corp) runtime. scripts.js imports this module only on pages whose
 * `site` metadata is `corp` (set once on `**` in the corp bulk metadata sheet), so
 * patients-stryker pages never load it and keep the patients code path unchanged.
 *
 * scripts.js calls in:
 *   loadEager(doc)          before decorateMain: body.corp (+ hcp-banner), styles/styles-corp.css
 *                           and the <block>-corp.css overlays of reused patients blocks
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
const CORP_BLOCK_STYLES = ['hero'];

/**
 * Marks the page as corp and loads the corp global styles before the page appears.
 * @param {Document} doc The document
 */
export async function loadEager(doc) {
  doc.body.classList.add('corp');
  // HCP notice band: `hcp-banner: true` metadata adds the band to the header-corp and
  // extends the header height reservation (styles-corp.css --nav-height)
  if ((getMetadata('hcp-banner') || '').trim().toLowerCase() === 'true') {
    doc.body.classList.add('hcp-banner');
  }
  const base = window.hlx.codeBasePath;
  await Promise.all([
    loadCSS(`${base}/styles/styles-corp.css`),
    // all overlays up front, so blocks that arrive later (fragments, auto-blocks) are styled too
    ...CORP_BLOCK_STYLES.map((name) => loadCSS(`${base}/blocks/${name}/${name}-corp.css`)),
  ]);
}

/**
 * Corp decoration of <main> (and of fragments, which run decorateMain too).
 */
export function decorateMain() {
  previewDMLinkEditors();
}

/**
 * Corp templates (`template` metadata) ship CSS only.
 * @param {string} templateName The template name
 */
export async function loadTemplate(templateName) {
  try {
    await loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`);
  } catch {
    // an unknown template name has no stylesheet: the page renders with styles-corp.css alone
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
 * Back-to-top control: a fixed round button, shown once the page is scrolled 500px.
 * Built outside <main>, so it is never page content.
 * @param {Document} doc The document
 */
function decorateBackToTop(doc) {
  if (doc.querySelector('.back-to-top')) return;
  const wrap = doc.createElement('div');
  wrap.className = 'back-to-top';
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
  const update = () => wrap.classList.toggle('visible', window.scrollY >= 500);
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
 * After LCP: head additions.
 */
export function loadLazy() {
  emitHomeJsonLd();
}

/*
 * The authored `published` metadata (e.g. "2026-02", "2026-02-14" or any Date-parsable
 * string) as "<Month>/<Year>"; '' when absent/invalid.
 */
function getPublishedDate() {
  const raw = (getMetadata('published') || '').trim();
  if (!raw) return '';
  const ym = raw.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  const date = ym
    ? new Date(Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 1))
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' }).replace(' ', '/');
}

/*
 * The "Last Updated <Month>/<Year>" line, shown when the `last-updated` metadata is `show`
 * and the page has a valid `published` date.
 * @param {Element} main The main element
 */
export function decorateLastModified(main) {
  const setting = (getMetadata('last-updated') || '').trim().toLowerCase();
  if (setting !== 'show') return;

  const formatted = getPublishedDate();
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
}
