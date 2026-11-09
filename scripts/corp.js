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

/**
 * patients blocks reused on corp pages with a `blocks/<name>/<name>-corp.css` overlay.
 * Add a name here in the same PR that adds its overlay file.
 */
const CORP_BLOCK_STYLES = ['accordion', 'columns', 'marketo-form'];

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

/* brand spellings for icon names that title-casing gets wrong */
const ICON_LINK_LABELS = {
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  x: 'X',
};

/**
 * Gives links that hold only `:icon:` images an accessible name (e.g. the Sage contact
 * LinkedIn / Facebook links): the icon images are decorative (empty alt), so the link is
 * labelled from its authored title, else from the icon name (`:linkedin:` → "LinkedIn",
 * `:facebook-logo:` → "Facebook"). Runs before scripts.js decorateLinkTargets(), which
 * appends "(opens in a new tab)" to the label.
 * @param {Element} main The container element
 */
function decorateIconLinks(main) {
  main.querySelectorAll('a:not([aria-label]):has(> .icon)').forEach((a) => {
    if (a.textContent.trim()) return;
    const icon = [...a.querySelector(':scope > .icon').classList]
      .find((c) => c.startsWith('icon-'))?.substring(5);
    const name = icon && icon.replace(/-logo$/, '');
    const label = a.title.trim() || ICON_LINK_LABELS[name]
      || (name && name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()));
    if (label) a.setAttribute('aria-label', label);
  });
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
  decorateIconLinks(main);
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
function linkImage(p) {
  const picture = p.querySelector(':scope > picture');
  if (!picture || p.children.length !== 1 || p.textContent.trim()) return;
  const next = p.nextElementSibling;
  const link = next && next.matches('p') && next.querySelector(':scope > a[href]:only-child');
  if (!link || next.textContent.trim() !== link.textContent.trim()) return;
  const a = document.createElement('a');
  a.href = link.getAttribute('href');
  if (link.target) a.target = link.target;
  if (link.rel) a.rel = link.rel;
  a.setAttribute('aria-label', link.textContent.trim());
  a.append(picture);
  p.append(a);
  next.remove();
}

function decorateImageLinks(main) {
  main.querySelectorAll(':scope > .section.image-link > .default-content-wrapper > p').forEach(linkImage);
}

/**
 * Columns (challenge-cards): a link alone on the line right after a card's image makes the
 * image clickable, as with the `image-link` section style. Runs on each block once it is
 * loaded (aem.js data-block-status="loaded"): columns.js rebuilds the image paragraphs
 * while it decorates, so a link added before that would be lost.
 * @param {Element} main The container element
 */
function decorateChallengeCardLinks(main) {
  const link = (block) => block.querySelectorAll(':scope > div > div > p.columns-img-col').forEach(linkImage);
  main.querySelectorAll('.columns.challenge-cards').forEach((block) => {
    if (block.dataset.blockStatus === 'loaded') {
      link(block);
      return;
    }
    const observer = new MutationObserver(() => {
      if (block.dataset.blockStatus !== 'loaded') return;
      observer.disconnect();
      link(block);
    });
    observer.observe(block, { attributes: true, attributeFilter: ['data-block-status'] });
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
 * A Bold + Italic link alone on its line is the gold button even when its text ends in
 * "!" (stryker.com "Nominate a hero for our Caregiver Stories series!"); scripts.js
 * decorateButtons leaves links ending in punctuation as text links (sentences), so the
 * button is built here, before it runs, the same way it builds the accent button.
 * @param {Element} main The container element
 */
function decorateExclaimButtons(main) {
  main.querySelectorAll('p > em > strong > a[href]:only-child, p > strong > em > a[href]:only-child').forEach((a) => {
    const p = a.parentElement.parentElement.parentElement;
    const text = a.textContent.trim();
    const outer = a.parentElement.parentElement;
    if (!text.endsWith('!') || p.children.length !== 1 || p.textContent.trim() !== text) return;
    if (outer.childNodes.length !== 1 || a.parentElement.childNodes.length !== 1) return;
    a.title = a.title || text;
    p.className = 'button-wrapper';
    a.className = 'button accent';
    outer.replaceWith(a);
  });
}

/**
 * Corp blocks built from section styles. Runs on <main> and on fragments, after the
 * section metadata is applied and before the blocks are decorated.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  buildAccordionSections(main);
  decorateImageLinks(main);
  joinSplitHeadingUnderlines(main);
  decorateExclaimButtons(main);
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
export function loadLazy(doc) {
  emitHomeJsonLd();
  decorateChallengeCardLinks(doc.querySelector('main'));
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
