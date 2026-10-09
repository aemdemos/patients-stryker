import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  readBlockConfig,
  toClassName,
  toCamelCase,
  getMetadata,
} from './aem.js';

import decorateDMAssets, { liftDefaultContentDMMedia } from './dm-support.js';
import { applySectionBackgrounds } from './utils.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references (tabs load their own panel fragments)
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment, .tabs'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();
    const paragraphText = p.textContent.trim();
    const trailingText = paragraphText.startsWith(text) ? paragraphText.slice(text.length).trim() : '';
    const standaloneLink = paragraphText === text || /^[.!?]$/.test(trailingText);

    // quick structural checks. A bold link that is NOT a standalone CTA (it sits
    // inline within a larger sentence/paragraph) stays inline text — tag it so the
    // global `strong > a` button fallback doesn't paint it as a teal button.
    if (a.querySelector('img') || !standaloneLink) {
      if (a.closest('strong') && !standaloneLink) a.classList.add('link-inline');
      return;
    }

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    const ancestorU = a.closest('u');
    const u = ancestorU || a.querySelector('u');

    // skip sentence-style links: full sentences ending in terminal punctuation are
    // inline text links, except explicit bold + underline CTAs.
    if (/[.!?]$/.test(text) && !(strong && u)) return;
    if (!strong && !em) return;

    // Bold + underline becomes a flat inline CTA (not .button.primary).
    // Handle both nesting forms: <u> around <a> or <u> inside <a>.
    if (strong && u) {
      a.classList.add('link-strong');
      // unwrap the outermost bold/underline ancestor so the anchor sits directly in
      // the <p>, then strip any <u> inside the anchor so no underline is drawn.
      if (ancestorU && ancestorU.contains(strong)) {
        strong.replaceWith(...strong.childNodes);
        ancestorU.replaceWith(...ancestorU.childNodes);
      } else {
        strong.replaceWith(...strong.childNodes);
      }
      const parentNodes = [...a.parentElement.childNodes];
      const trailingNodes = parentNodes.slice(parentNodes.indexOf(a) + 1);
      const punctuationText = trailingNodes.map((node) => node.textContent).join('').trim();
      if (/^[.!?]$/.test(punctuationText)) {
        trailingNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) a.append(node);
          else {
            a.append(...node.childNodes);
            node.remove();
          }
        });
      }
      a.querySelectorAll('u').forEach((inner) => inner.replaceWith(...inner.childNodes));
      return;
    }

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Turns citation superscripts into links to their matching footnotes.
 * Supports multi-number citations like `12,13`.
 * @param {HTMLElement} main The main container element
 */
function decorateFootnotes(main) {
  const sups = [...main.querySelectorAll('sup')].filter((s) => /\d/.test(s.textContent));
  if (!sups.length) return;

  // Highest footnote number referenced anywhere in the superscripts.
  const maxRef = sups.reduce((max, sup) => {
    const nums = (sup.textContent.match(/\d+/g) || []).map(Number);
    return Math.max(max, ...nums);
  }, 0);

  // The footnotes list is the last ordered list on the page that has at least as
  // many items as the highest referenced number (avoids matching content lists).
  const footnoteList = [...main.querySelectorAll('ol')]
    .reverse()
    .find((ol) => ol.children.length >= maxRef);
  if (!footnoteList) return;

  [...footnoteList.children].forEach((li, i) => {
    li.id = li.id || `fn-${i + 1}`;
  });

  sups.forEach((sup) => {
    if (sup.querySelector('a')) return;
    const text = sup.textContent;
    const fragment = document.createDocumentFragment();
    const parts = text.split(/(\d+)/);
    parts.forEach((part) => {
      const num = Number(part);
      if (Number.isInteger(num) && num >= 1 && num <= footnoteList.children.length) {
        const a = document.createElement('a');
        a.href = `#fn-${num}`;
        a.textContent = part;
        fragment.append(a);
      } else {
        fragment.append(document.createTextNode(part));
      }
    });
    sup.replaceChildren(fragment);
  });
}

const SYMBOL_NAMES = {
  '*': 'asterisk',
  '†': 'dagger',
  '‡': 'double-dagger',
  '§': 'section',
};
const SYMBOL_RUN = '(\\*+|†+|‡+|§+)';

/**
 * Returns the footnote id for a symbol run, e.g. `†` → `fn-dagger`, `††` → `fn-dagger-2`.
 * @param {string} run A run of one repeated footnote symbol
 * @returns {string} The footnote id
 */
function symbolFootnoteId(run) {
  return `fn-${SYMBOL_NAMES[run[0]]}${run.length > 1 ? `-${run.length}` : ''}`;
}

/**
 * Links symbol citations (`*`, `†`, `††`, `‡`, `§`) to their footnote definitions.
 * Definitions are lines of a default-content paragraph in a small-print (`.compact`)
 * section, split by `<br>`, that start with the symbol run, e.g.
 * `<p>*Up to 12 months<br>†The use of two…</p>`.
 * References are symbol runs in `<sup>`, in placeholder links (`<a href="/">*</a>`),
 * or trailing a word in body text (`Rapid*`). Only symbols with a definition are linked.
 * @param {HTMLElement} main The main container element
 */
function decorateSymbolFootnotes(main) {
  const startRe = new RegExp(`^\\s*${SYMBOL_RUN}`);
  const defs = new Map();
  const defNodes = new Set();

  // 1. Definitions: anchor each paragraph line that starts with a symbol run.
  main.querySelectorAll('.section.compact p').forEach((p) => {
    if (p.closest('.block')) return;
    let lineStart = true;
    [...p.childNodes].forEach((node) => {
      if (node.nodeName === 'BR') {
        lineStart = true;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('footnote-anchor')) {
        if (!defs.has(node.id)) defs.set(node.id, node);
        return;
      }
      const text = node.textContent;
      if (!text.trim()) return;
      const match = lineStart && text.match(startRe);
      lineStart = false;
      if (!match) return;
      defNodes.add(node);
      const id = symbolFootnoteId(match[1]);
      if (defs.has(id) || document.getElementById(id)) return;
      const anchor = document.createElement('span');
      anchor.className = 'footnote-anchor';
      anchor.id = id;
      node.before(anchor);
      defs.set(id, anchor);
    });
  });
  if (!defs.size) return;

  const createLink = (run) => {
    const a = document.createElement('a');
    a.href = `#${symbolFootnoteId(run)}`;
    a.textContent = run;
    return a;
  };

  // 2. Placeholder links whose text is only a symbol run (import artifacts).
  const onlyRe = new RegExp(`^\\s*${SYMBOL_RUN}\\s*$`);
  main.querySelectorAll('a').forEach((a) => {
    const match = a.textContent.match(onlyRe);
    if (!match || !['/', '', '#'].includes(a.getAttribute('href') ?? '')) return;
    const id = symbolFootnoteId(match[1]);
    if (defs.has(id)) a.href = `#${id}`;
  });

  // 3. Symbol runs in text: inside <sup>, or directly trailing a word/element.
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (/[*†‡§]/.test(node.textContent) && !node.parentElement.closest('a, script, style')
      && ![...defNodes].some((def) => def.contains(node))) {
      textNodes.push(node);
    }
  }
  const refRe = new RegExp(`${SYMBOL_RUN}(?![\\p{L}\\p{N}])`, 'gu');
  textNodes.forEach((node) => {
    const text = node.textContent;
    const inSup = !!node.parentElement.closest('sup');
    const fragment = document.createDocumentFragment();
    let last = 0;
    [...text.matchAll(refRe)].forEach((match) => {
      const { index } = match;
      const run = match[1];
      if (!defs.has(symbolFootnoteId(run))) return;
      if (!inSup) {
        const trailsContent = index > 0
          ? !/\s/.test(text[index - 1])
          : node.previousSibling && node.previousSibling.nodeName !== 'BR';
        if (!trailsContent) return;
      }
      fragment.append(text.slice(last, index), createLink(run));
      last = index + run.length;
    });
    if (!last) return;
    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  });
}

/**
 * Prepends a decorative `<img class="section-background-image">` to the section.
 * @param {Element} section the `.section` element
 * @param {string} url the authored background image URL
 */
function applySectionBackgroundImage(section, url) {
  if (!section || !url || section.querySelector(':scope > .section-background-image')) return;
  const img = document.createElement('img');
  img.className = 'section-background-image';
  img.src = url;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  // eager: absolutely-positioned box is zero-area until loaded, so lazy never fetches
  img.loading = 'eager';
  section.prepend(img);
}

/**
 * Applies section metadata: `Style` → CSS classes, `Background Image` → a
 * decorative <img> layer, other keys → `data-*`. Handles the `.section-metadata`
 * table and the published-DA `data-background-image` form.
 * @param {Element} main The main container element
 */
function decorateSectionMetadata(main) {
  // section metadata `Id` → the section's id, so in-page links (`#find-a-doctor`)
  // can target it. Normalised like a class name; skipped if the id is taken.
  const applySectionId = (section, value) => {
    const id = toClassName(Array.isArray(value) ? value[0] : value);
    if (id && !document.getElementById(id) && !main.querySelector(`[id="${id}"]`)) section.id = id;
  };

  main.querySelectorAll('.section .section-metadata').forEach((meta) => {
    const section = meta.closest('.section');
    if (!section) return;
    const config = readBlockConfig(meta);
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'style') {
        const styles = (Array.isArray(value) ? value : value.split(','))
          .map((s) => toClassName(s.trim()))
          .filter((s) => s);
        styles.forEach((s) => section.classList.add(s));
      } else if (key === 'background-image-url') {
        applySectionBackgroundImage(section, Array.isArray(value) ? value[0] : value);
      } else if (key === 'id') {
        applySectionId(section, value);
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    // remove the metadata block (and its section wrapper) so it is neither
    // rendered nor picked up by decorateBlocks as a loadable block.
    (meta.closest('.section-metadata-wrapper') || meta).remove();
  });

  // published DA form: data-* attributes (legacy data-background-image also honoured)
  main.querySelectorAll('.section[data-id]').forEach((section) => {
    applySectionId(section, section.dataset.id);
  });

  main.querySelectorAll('.section[data-background-image], .section[data-background-image-url]').forEach((section) => {
    applySectionBackgroundImage(section, section.dataset.backgroundImageUrl);
    applySectionBackgroundImage(section, section.dataset.backgroundImage);
  });
}

// section styles that lay out each tab's panel rather than the whole section
const TAB_PANEL_STYLES = ['side-by-side'];

/**
 * Turns `tabbed` sections into a tabs block. Each heading of the section's
 * deepest heading level is a tab title; the content after it (text, blocks)
 * up to the next title is that tab's panel. Content before the first title
 * stays above the tabs. Panels are handed to the tabs block as inline sections
 * carrying the section's panel layout styles (e.g. side-by-side); all other
 * section styles (e.g. backgrounds) stay on the section.
 * @param {Element} main The container element
 */
function buildTabbedSections(main) {
  main.querySelectorAll(':scope > .section.tabbed').forEach((section) => {
    // unwrap default content and (still undecorated) blocks, in authored order
    const nodes = [...section.children].flatMap((wrapper) => [...wrapper.children]);
    const headings = nodes.filter((node) => /^H[1-6]$/.test(node.tagName));
    if (!headings.length) return;
    const level = Math.max(...headings.map((h) => Number(h.tagName[1])));

    const intro = [];
    const tabs = [];
    nodes.forEach((node) => {
      if (node.tagName === `H${level}`) {
        tabs.push({ title: node, content: [] });
      } else if (tabs.length) {
        tabs[tabs.length - 1].content.push(node);
      } else {
        intro.push(node);
      }
    });

    const panelStyles = TAB_PANEL_STYLES.filter((cls) => section.classList.contains(cls));
    section.classList.remove(...panelStyles);

    const rows = tabs.map(({ title, content }) => {
      const label = document.createElement('p');
      label.textContent = title.textContent.trim();
      const panel = document.createElement('div');
      panel.dataset.tabsSection = '';
      panel.classList.add(...panelStyles);
      panel.append(...content);
      return [{ elems: [label] }, { elems: [panel] }];
    });

    const wrappers = [];
    if (intro.length) {
      const introWrapper = document.createElement('div');
      introWrapper.className = 'default-content-wrapper';
      introWrapper.append(...intro);
      wrappers.push(introWrapper);
    }
    const tabsWrapper = document.createElement('div');
    tabsWrapper.append(buildBlock('tabs', rows));
    wrappers.push(tabsWrapper);
    section.replaceChildren(...wrappers);
  });
}

/* Normalizes a pathname for comparison against query-index paths */
function normalizePath(path) {
  const clean = path.replace(/\.html$/, '').replace(/\/+$/, '');
  return clean || '/';
}

/* Resolves the "Last Updated" label from the auto publish timestamp. */
async function getAutoLastModified() {
  const resp = await fetch(`${window.hlx.codeBasePath}/query-index.json`);
  if (!resp.ok) return '';
  const { data = [] } = await resp.json();
  const current = normalizePath(window.location.pathname);
  const row = data.find((r) => normalizePath(r.path) === current);
  const ts = row && Number(row.lastModified);
  if (!ts) return '';

  const date = new Date(ts * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  }).replace(' ', '/');
}

/*
 * Appends a "Last Updated" line to the end of the page. Visibility is controlled
 * centrally via the `last-updated` bulk-metadata setting (not per page):
 *   - "show"           -> shown on all matching pages, using the automatic publish date
 *   - "hide" / empty   -> hidden on all matching pages (default)
 */
async function decorateLastModified(main) {
  try {
    const setting = (getMetadata('last-updated') || '').trim().toLowerCase();
    if (setting !== 'show') return;

    const formatted = await getAutoLastModified();
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

/**
 * If a heading is fully wrapped in `<u>`, add `.underline` for the divider style
 * and unwrap `<u>` to avoid text underlining. Partial underline is unchanged.
 * @param {HTMLElement} main The main container element
 */
function decorateUnderlinedHeadings(main) {
  main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const text = heading.textContent.trim();
    if (!text) return;
    // the whole heading must be underlined: a single <u> whose text is the heading's
    const us = heading.querySelectorAll('u');
    if (us.length !== 1) return;
    const u = us[0];
    if (u.textContent.trim() !== text) return;
    heading.classList.add('underline');
    u.replaceWith(...u.childNodes); // strip the <u>, keep inner markup (e.g. gold marker)
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // convert external Dynamic Media asset links into native <picture>/<video>
  decorateDMAssets(main);
  liftDefaultContentDMMedia(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  buildTabbedSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateUnderlinedHeadings(main);
  decorateFootnotes(main);
  decorateSymbolFootnotes(main);
}

/**
 * Decorates the template.
 * Loads template-specific CSS and JavaScript modules.
 * @param {Document} doc The document
 * @param {string} templateName The template name
 */
export async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(
        `${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`,
      )
        .then(resolve)
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(
            `failed to load css module for ${templateName}`,
            err.target.href,
          );
          resolve();
        });
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(
            `../templates/${templateName}/${templateName}.js`
          );
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateName}`, error);
        }
        resolve();
      })();
    });

    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load template ${templateName}`, error);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  // Reserve the correct header height before the nav fragment loads (CLS): the
  // default (/nav) and /nav-legal navs render a single row, while /nav-ent and
  // /nav-ivs add a second (gold bar) row. The nav variant isn't in the DOM until
  // the header loads lazily, so mark single-row navs from metadata here.
  const navName = (getMetadata('nav') || '/nav').split('/').pop();
  if (navName === 'nav' || navName === 'nav-legal') {
    document.body.classList.add('nav-single-row');
  }

  const templateName = getMetadata('template');
  const themeName = getMetadata('theme');

  const main = doc.querySelector('main');
  if (main) {
    // DA/EW block library preview tweaks (tools/da-library-preview) — remove
    // this block to opt out.
    if (window.location.pathname.startsWith('/.da/library/')) {
      const { default: decorateLibraryPreview } = await import('../tools/da-library-preview/da-library-preview.js');
      decorateLibraryPreview(main);
    }

    decorateMain(main);

    // Load template if specified in metadata
    if (templateName) {
      await loadTemplate(doc, templateName);
    }

    // Load themes.css if the page opts into a theme via metadata. Themed pages
    // add `body.<theme>` (decorateTemplateAndTheme); all theme rules live in the
    // single styles/themes.css, scoped under their body.<theme> selector, and it
    // ships only to pages that actually declare a theme. Loaded eagerly (awaited
    // before `appear`) so above-the-fold themed typography doesn't reflow.
    if (themeName) {
      await loadCSS(`${window.hlx.codeBasePath}/styles/themes.css`);
    }

    // Internal authoring-guide pages opt in via `author-guide` metadata.
    // Add `body.<slug>` and load shared `author-guides.css` (scoped per guide).
    const authorGuide = getMetadata('author-guide');
    if (authorGuide) {
      document.body.classList.add(toClassName(authorGuide));
      await loadCSS(`${window.hlx.codeBasePath}/styles/author-guides.css`);
    }

    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  // Some block decorators reconstruct citation superscripts from authored text
  // during lazy loading; run footnote linking again so those new <sup> nodes
  // are converted to #fn-N links as well.
  decorateFootnotes(main);
  decorateSymbolFootnotes(main);

  decorateLastModified(main);
  applySectionBackgrounds(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
