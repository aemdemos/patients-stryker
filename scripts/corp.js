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
 *                           decorated: builds blocks from section styles (accordion-panel,
 *                           carousel)
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
import decorateSettings, { rewriteSizeValues } from './corp-settings.js';
import decorateTypeTags from './corp-type.js';
import buildCarouselSections from './corp-carousel.js';
import fetchPlainHtml from './plain-html.js';

/**
 * patients blocks reused on corp pages with a `blocks/<name>/<name>-corp.css` overlay.
 * Add a name here in the same PR that adds its overlay file.
 */
const CORP_BLOCK_STYLES = ['accordion', 'cards', 'columns', 'marketo-form', 'statistics', 'sticky-nav', 'table', 'tabs', 'video'];

/**
 * Marks the page as corp and loads the corp global styles before the page appears.
 * @param {Document} doc The document
 */
/**
 * Modal tiles (the stryker.com ProCare tile): an image linked, alone on its line, to a
 * `/modals/` document is the tile: the image opens the modal (blocks/modal), with the image's
 * alt text as the link's name and the gold arrow of the source tile.
 * @param {Element} main The container
 */
function decorateModalTiles(main) {
  main.querySelectorAll('p > a[href*="/modals/"]:only-child').forEach((a) => {
    const picture = a.querySelector(':scope > picture:only-child');
    if (!picture || a.parentElement.textContent.trim()) return;
    const label = (picture.querySelector('img') || {}).alt || '';
    a.parentElement.classList.add('modal-tile');
    a.classList.add('modal-tile-link');
    if (label) {
      a.setAttribute('aria-label', label);
      a.title = label;
    }
    picture.classList.add('modal-tile-image');
    const icon = document.createElement('span');
    icon.className = 'modal-tile-icon';
    icon.setAttribute('aria-hidden', 'true');
    a.append(icon);
  });
}

/**
 * Links to `/modals/` documents open them in a modal (blocks/modal), as on stryker.com.
 * @param {Document} doc The document
 */
function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href*="/modals/"]');
    if (!link) return;
    e.preventDefault();
    const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
    openModal(link.href);
  });
}

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
    window.hlx.heroFragments.set(path, fetchPlainHtml(path)
      .then((resp) => (resp.ok ? resp.text() : null))
      .catch(() => null));
  });
}

export async function loadEager(doc) {
  prefetchHeroFragments(doc);
  doc.body.classList.add('corp');
  autolinkModals(doc);
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
  // readable settings (prototype): size values in bracket tags, before the tags are parsed
  if (getMetadata('style-settings') === 'on') rewriteSizeValues(main);
  decorateModalTiles(main);
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
 * `image-link` section style: a plain link alone on the line right after an image makes
 * the image clickable (a DM image link can't also carry the target address; the same rule
 * as the Columns media-pair variant). The link text becomes the image link's name and the
 * link line goes. Runs before decorateLinkTargets(), so a `#_blank` link still opens in a
 * new tab.
 * @param {Element} main The container element
 */
function decorateImageLinks(main) {
  main.querySelectorAll(':scope > .section.image-link > .default-content-wrapper > p').forEach((p) => {
    const picture = p.querySelector(':scope > picture');
    if (!picture || p.children.length !== 1 || p.textContent.trim()) return;
    const next = p.nextElementSibling;
    const link = next && next.matches('p') && next.querySelector(':scope > a[href]:only-child');
    if (!link || next.textContent.trim() !== link.textContent.trim()) return;
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.setAttribute('aria-label', link.textContent.trim());
    a.append(picture);
    p.append(a);
    next.remove();
  });
}

/**
 * An underlined heading that DA stores with its underline split around a line break or
 * bold words (`<u>Improving safety</u><br><u>Spreading truth…</u>`) gets one `<u>` around
 * the whole heading again, so scripts.js decorateUnderlinedHeadings (which wants a single
 * `<u>`, and runs after decorateSections) still draws the heading rule (e.g. rule-gold).
 * @param {Element} main The container element
 */
function joinSplitHeadingUnderlines(main) {
  const squash = (value) => value.replace(/\s+/g, '');
  main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const us = [...heading.querySelectorAll('u')].filter((u) => !u.parentElement.closest('u'));
    if (us.length < 2) return;
    const text = squash(heading.textContent);
    if (!text || squash(us.map((u) => u.textContent).join('')) !== text) return;
    us.forEach((u) => u.replaceWith(...u.childNodes));
    const u = document.createElement('u');
    u.append(...heading.childNodes);
    heading.append(u);
  });
}

/**
 * Flex sections whose source columns hold several pieces each (`flex-cols-1-2`, readable
 * `Columns | 1 + 2`: text | chart + footnote on surpass-evolve): the section's wrappers in one
 * div per source column, so the flex layout and its widths (flex-33-67 …) see those columns.
 * A `Column break` line ends a column's text where the next column starts with text (the two
 * would be one wrapper): its wrapper is split there, the line removed.
 * After the blocks are decorated (a wrapper moved into a column would read as a block).
 * Left as is when the counts don't match the section's wrappers.
 * @param {Element} main The container element
 */
function groupFlexColumns(main) {
  main.querySelectorAll(':scope > .section.flex').forEach((section) => {
    const cls = [...section.classList].find((c) => /^flex-cols-\d+(-\d+)+$/.test(c));
    if (!cls) return;
    section.querySelectorAll(':scope > .default-content-wrapper > p').forEach((line) => {
      if (!/^column break$/i.test(line.textContent.trim())) return;
      const rest = document.createElement('div');
      rest.className = 'default-content-wrapper';
      while (line.nextSibling) rest.append(line.nextSibling);
      line.parentElement.after(rest);
      line.remove();
    });
    const counts = cls.slice('flex-cols-'.length).split('-').map(Number);
    // (an emptied wrapper, e.g. the section metadata's, is no piece)
    const wrappers = [...section.children].filter((el) => el.tagName === 'DIV' && el.children.length);
    if (counts.reduce((sum, n) => sum + n, 0) !== wrappers.length) return;
    const empty = [...section.children].filter((el) => !wrappers.includes(el));
    let at = 0;
    counts.forEach((n) => {
      const column = document.createElement('div');
      column.className = 'flex-column';
      column.append(...wrappers.slice(at, at + n));
      at += n;
      section.append(column);
    });
    // the columns first: the split widths count them from the start (flex-33-67)
    section.append(...empty);
  });
}

/**
 * Corp layout that needs the decorated blocks. Runs on <main> and on fragments, after
 * decorateBlocks.
 * @param {Element} main The container element
 */
export function decorateBlockLayout(main) {
  groupFlexColumns(main);
}

/**
 * Corp blocks built from section styles. Runs on <main> and on fragments, after the
 * section metadata is applied and before the blocks are decorated.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  // the AEM boxes' padding / margin (section styles, Columns cell-<N>- options, [[spacing]]),
  // before accordion panels take their sections' content; readable settings (prototype,
  // `style-settings: on` pages) first, as the classes they stand for; a page on the standard
  // type scale (`type-scale: standard`, standardise pilot) reads its step names as steps
  if (getMetadata('type-scale') === 'standard') document.body.classList.add('type-standard');
  if (getMetadata('style-settings') === 'on') decorateSettings(main);
  decorateSpacing(main);
  decorateTypeTags(main);
  buildAccordionSections(main);
  decorateImageLinks(main);
  buildCarouselSections(main);
  joinSplitHeadingUnderlines(main);
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
 * `footer` metadata themselves (defaults /nav, /footer). Like aem.js loadHeader /
 * loadFooter, a block already in the landmark is replaced, not added to: the EW canvas
 * loads the chrome again, which showed the header and footer twice.
 * @param {Element} parent The <header> or <footer> landmark
 * @param {string} name The block name
 */
async function loadChrome(parent, name) {
  if (!parent) return null;
  const block = buildBlock(name, '');
  const existing = parent.querySelector(`:scope > .${name}`);
  if (existing) existing.replaceWith(block);
  else parent.append(block);
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
