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

import decorateDMAssets from './dm-support.js';

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
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
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

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

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

  footnoteList.classList.add('footnotes');
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

/**
 * Prepends a decorative `<img class="section-background-image">` to the section
 * (matches the source's inline background image, not a CSS background). Opt-in
 * blocks like icon-list position and layer it; inert for other sections.
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
  // eager, not lazy: when absolutely positioned this box is zero-area until it
  // loads, so Chromium's lazy heuristic reads it as off-screen and never fetches.
  // It's decorative and out of flow, so eager loading is safe (no CLS).
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
      } else if (key === 'background-image') {
        applySectionBackgroundImage(section, Array.isArray(value) ? value[0] : value);
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    // remove the metadata block (and its section wrapper) so it is neither
    // rendered nor picked up by decorateBlocks as a loadable block.
    (meta.closest('.section-metadata-wrapper') || meta).remove();
  });

  // published DA content exposes the value as data-background-image, not a table
  main.querySelectorAll('.section[data-background-image]').forEach((section) => {
    applySectionBackgroundImage(section, section.dataset.backgroundImage);
  });
}

/**
 * Removes CTA links/buttons from sections styled with `no-cta`.
 * Runs after fragment content loads so hidden CTAs are removed from the DOM.
 * @param {Element} scope The container to clean
 */
export function removeCtas(scope) {
  scope.querySelectorAll('.button-wrapper').forEach((wrapper) => {
    const cta = wrapper.querySelector('a.button');
    if (!cta) return;
    const href = cta.getAttribute('href');

    // Move the CTA PDF link onto the card image before removing the button.
    // This keeps brochure cards clickable on `no-cta` sections.
    const card = wrapper.closest('li') || wrapper.closest('.cards-card-image, .cards-card-body')?.parentElement;
    const image = card && card.querySelector('.cards-card-image picture, .cards-card-image img');
    if (href && image && !image.closest('a')) {
      const picture = image.closest('picture') || image;
      const holder = picture.closest('.cards-card-image') || picture.parentElement;
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      picture.replaceWith(a);
      a.append(picture);
      // keep the click target obvious for the whole image cell
      if (holder) holder.style.cursor = 'pointer';
    }

    wrapper.remove();
  });
}

/**
 * Merges multiple `.cards` blocks in a section into one grid.
 * Preserves the first block's variant classes and removes empty extras.
 * @param {Element} section The section to consolidate
 */
export function mergeSectionCards(section) {
  const cardsBlocks = [...section.querySelectorAll('.cards')];
  if (cardsBlocks.length < 2) return;

  const first = cardsBlocks[0];
  const targetList = first.querySelector(':scope > ul');
  if (!targetList) return;

  cardsBlocks.slice(1).forEach((block) => {
    block.querySelectorAll(':scope > ul > li').forEach((li) => targetList.append(li));
    // remove the emptied cards block and its now-empty fragment/section wrappers
    const fragmentRoot = block.closest('.fragment-wrapper') || block.closest('.fragment') || block;
    fragmentRoot.remove();
  });
}

/* Normalizes a pathname for comparison against query-index paths */
function normalizePath(path) {
  const clean = path.replace(/\.html$/, '').replace(/\/+$/, '');
  return clean || '/';
}

/* Appends a "Last Modified" line to the end of the page. */
async function decorateLastModified(main) {
  try {
    const resp = await fetch(`${window.hlx.codeBasePath}/query-index.json`);
    if (!resp.ok) return;
    const { data = [] } = await resp.json();
    const current = normalizePath(window.location.pathname);
    const row = data.find((r) => normalizePath(r.path) === current);
    const ts = row && Number(row.lastModified);
    if (!ts) return;

    const date = new Date(ts * 1000);
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    }).replace(' ', '/');

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
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // convert external Dynamic Media asset links into native <picture>/<video>
  decorateDMAssets(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateFootnotes(main);
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

    document.body.classList.add(`${templateName}-template`);

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

  const templateName = getMetadata('template');

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);

    // Load template if specified in metadata
    if (templateName) {
      await loadTemplate(doc, templateName);
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

  decorateLastModified(main);

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

if (/\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname)) {
  // eslint-disable-next-line import/no-cycle
  await import(`${window.hlx.codeBasePath}/ue/scripts/ue.js`).then(({ default: ue }) => ue());
}
