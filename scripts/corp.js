/*
 * www.stryker.com (corp) runtime. scripts.js imports this module only on pages whose
 * `site` metadata is `corp` (set once on `**` in the corp bulk metadata sheet), so
 * patients-stryker pages never load it and keep the patients code path unchanged.
 *
 * scripts.js calls in:
 *   loadEager(doc)          before decorateMain: body.corp (+ hcp-banner), styles/styles-corp.css
 *                           and the <block>-corp.css overlays of reused patients blocks
 *   decorateMain(main)      after the DM assets are rendered, before auto blocking
 *   loadTemplate(name)      template CSS + JS (+ <name>-themes.css when `theme` is set)
 *   loadFirstSections(main) instead of loading the first section eagerly
 *   loadHeader(doc) / loadFooter(doc) / loadLazy(doc) / decorateLastModified(main)
 */
import {
  buildBlock,
  decorateBlock,
  getMetadata,
  loadCSS,
  loadSection,
  waitForFirstImage,
} from './aem.js';
import { previewDMLinkEditors } from './dm-support.js';

/**
 * patients blocks reused on corp pages with a `blocks/<name>/<name>-corp.css` overlay.
 * Add a name here in the same PR that adds its overlay file.
 */
const CORP_BLOCK_STYLES = [];

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
 * Loads a corp template (`template` metadata): `templates/<name>/<name>.css` and
 * `<name>.js` (its default export, if any, is called with the document). Themes of a
 * corp template live in the same folder (`<name>-themes.css`, scoped `body.<theme>`) and
 * load only on pages that set `theme` metadata.
 * @param {string} templateName The template name
 */
export async function loadTemplate(templateName) {
  const dir = `${window.hlx.codeBasePath}/templates/${templateName}`;
  const files = [`${dir}/${templateName}.css`];
  if (getMetadata('theme')) files.push(`${dir}/${templateName}-themes.css`);
  const styles = files.map(async (href) => {
    try {
      await loadCSS(href);
    } catch {
      // a missing stylesheet: the page renders with styles-corp.css alone
    }
  });
  const decoration = (async () => {
    try {
      const mod = await import(`../templates/${templateName}/${templateName}.js`);
      if (mod.default) await mod.default(document);
    } catch {
      // no template script: the template is CSS-only
    }
  })();
  await Promise.all([...styles, decoration]);
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
 * Builds, decorates and loads a corp chrome block into its landmark, in place of aem.js
 * loadHeader / loadFooter. The corp code sits next to the patients block it replaces
 * (`blocks/header/header-corp.js|css`, `blocks/footer/footer-corp.js|css`), so it is
 * loaded from that folder; the block keeps the `<name>-corp` class its CSS is scoped to.
 * The blocks read the `nav` / `footer` metadata themselves (defaults /nav, /footer).
 * @param {Element} parent The <header> or <footer> landmark
 * @param {string} name The patients block name (header / footer)
 */
async function loadChrome(parent, name) {
  if (!parent) return;
  const corpName = `${name}-corp`;
  const block = buildBlock(corpName, '');
  parent.append(block);
  decorateBlock(block);
  block.dataset.blockStatus = 'loading';
  try {
    await Promise.all([
      loadCSS(`${window.hlx.codeBasePath}/blocks/${name}/${corpName}.css`),
      import(`../blocks/${name}/${corpName}.js`).then((mod) => mod.default?.(block)),
    ]);
  } catch {
    // a failed chrome load leaves the landmark empty; the page itself still renders
  }
  block.dataset.blockStatus = 'loaded';
}

/**
 * @param {Document} doc The document
 */
export function loadHeader(doc) {
  return loadChrome(doc.querySelector('header'), 'header');
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
  loadChrome(doc.querySelector('footer'), 'footer');
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
