/*
 * www.stryker.com (corp) runtime. scripts.js imports this module only on pages whose
 * `site` metadata is `corp` (set once on `**` in the corp bulk metadata sheet), so
 * patients-stryker pages never load it and keep the patients code path unchanged.
 *
 * scripts.js calls in:
 *   loadEager(doc)          before decorateMain: body.corp (+ hcp-banner), styles/styles-corp.css
 *                           and the <block>-corp.css overlays of reused patients blocks
 *   decorateMain(main)      after the DM assets are rendered, before auto blocking
 *   decorateSections(main)  after the section metadata is applied, before the blocks are
 *                           decorated: builds blocks from section styles (accordion-panel)
 *   loadTemplate(name)      template CSS + JS (+ <name>-themes.css when `theme` is set)
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
import decorateMapLinks from './map-embed.js';
import decorateSpacing from './corp-spacing.js';
import decorateTypeTags from './corp-type.js';

/**
 * patients blocks reused on corp pages with a `blocks/<name>/<name>-corp.css` overlay.
 * Add a name here in the same PR that adds its overlay file.
 */
const CORP_BLOCK_STYLES = ['accordion', 'cards', 'columns', 'statistics', 'sticky-nav', 'table', 'video'];

/**
 * Marks the page as corp and loads the corp global styles before the page appears.
 * @param {Document} doc The document
 */
/**
 * Starts fetching the slide image fragments of the heroes in the first sections (Hero Corp
 * rows that link to fragment documents) before the block code loads, so the LCP image is
 * known one round trip earlier. The pending responses are kept in window.hlx.heroFragments
 * (path → Promise<string|null>) for blocks/hero-corp to reuse.
 * @param {Document} doc The document
 */
function prefetchHeroFragments(doc) {
  const sections = [...doc.querySelectorAll('main > div')].slice(0, 2);
  const links = sections.flatMap((section) => [...section.querySelectorAll('.hero-corp a[href*="/fragments/"]')]);
  if (!links.length) return;
  window.hlx.heroFragments = window.hlx.heroFragments || new Map();
  links.forEach((link) => {
    const url = new URL(link.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin) return;
    const path = url.pathname.replace(/\/$/, '');
    if (window.hlx.heroFragments.has(path)) return;
    window.hlx.heroFragments.set(path, fetch(`${path}.plain.html`)
      .then((resp) => (resp.ok ? resp.text() : null))
      .catch(() => null));
  });
}

export async function loadEager(doc) {
  prefetchHeroFragments(doc);
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
export function decorateMain(main) {
  previewDMLinkEditors();
  // a lone Google Maps link in default content becomes an embedded map (columns.js does cells)
  decorateMapLinks(main, ':scope > div > p');
  main.querySelectorAll('.hero.image-slide, .hero-corp.image-slide').forEach((block) => {
    block.classList.replace('hero', 'hero-corp');
    block.closest('.section')?.classList.add('hero-container');
  });
}

/**
 * Turns each run of consecutive `accordion-panel` sections into one
 * `accordion with-nested-blocks` block, so panels can hold blocks (columns, cards,
 * tabs, fragments). Each section is one panel: a heading at the top of the section is
 * the panel label, the rest of the section (text, blocks) is the panel body, handed to
 * the accordion as an inline section. The other section styles of the panels stay on
 * the accordion's section.
 * @param {Element} main The container element
 */
function buildAccordionSections(main) {
  const runs = [];
  main.querySelectorAll(':scope > .section.accordion-panel').forEach((section) => {
    const run = runs[runs.length - 1];
    // a Block Library variant (tools/da-library-preview) is always its own accordion
    const joins = run && run[run.length - 1].nextElementSibling === section
      && !section.classList.contains('library-variant-start');
    if (joins) run.push(section);
    else runs.push([section]);
  });

  runs.forEach((run) => {
    const rows = run.map((section) => {
      // unwrap default content and (still undecorated) blocks, in authored order
      const nodes = [...section.children].flatMap((wrapper) => [...wrapper.children]);
      const label = /^H[1-6]$/.test(nodes[0]?.tagName) ? nodes.shift() : null;
      const panel = document.createElement('div');
      panel.dataset.accordionSection = '';
      panel.append(...nodes);
      return [{ elems: label ? [label] : [] }, { elems: [panel] }];
    });

    const block = buildBlock('accordion', rows);
    block.classList.add('with-nested-blocks');
    const wrapper = document.createElement('div');
    wrapper.append(block);

    const [host, ...rest] = run;
    rest.forEach((section) => {
      host.classList.add(...section.classList);
      section.remove();
    });
    host.classList.remove('accordion-panel');
    host.replaceChildren(wrapper);
  });
}

/**
 * Corp blocks built from section styles. Runs on <main> and on fragments, after the
 * section metadata is applied and before the blocks are decorated.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  // the AEM boxes' padding / margin (section styles, Columns cell-<N>- options, [[spacing]]),
  // before accordion panels take their sections' content
  decorateSpacing(main);
  decorateTypeTags(main);
  buildAccordionSections(main);
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
