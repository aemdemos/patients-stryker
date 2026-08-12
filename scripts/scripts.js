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
 * Turns citation superscripts into links that navigate to the matching footnote.
 * Source pattern: body text carries `<sup>N</sup>` markers (e.g. "12,13") and the
 * page ends with an ordered list of citations. Each list item N gets an id
 * `fn-N`, and every numeric superscript is rewritten so its number(s) link to the
 * corresponding footnote (multi-number sups like "12,13" become two links).
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
 * Applies section-metadata "Style" values as classes on their section.
 * The core aem.js decorateSections() in this project does not process section
 * metadata into section classes, so we restore that stock EDS behaviour here
 * (in project code, without modifying aem.js). Each `.section-metadata` block's
 * `Style` row (comma-separated) becomes classes on the parent section, and the
 * metadata block itself is removed. This is what makes flags like `highlight`
 * and `no-cta` resolve to real `.section.<flag>` hooks for CSS/JS.
 * @param {Element} main The main element (sections already decorated)
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
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    // remove the metadata block (and its section wrapper) so it is neither
    // rendered nor picked up by decorateBlocks as a loadable block.
    (meta.closest('.section-metadata-wrapper') || meta).remove();
  });
}

/**
 * Removes fragment CTA buttons/links from any section flagged `no-cta`.
 * The shared card fragments (e.g. /fragments/card-*) bake in a "LEARN MORE"
 * CTA because other pages reuse them WITH the button. On pages/sections that
 * must not show it (e.g. the resources.html import), authors add the `no-cta`
 * section style. This removes the decorated CTA from the DOM entirely — not a
 * CSS hide — so it is absent for screen readers and crawlers too. Runs after
 * fragments load (fragment.js appends their decorated content, then the outer
 * page's loadSection triggers this via decorateMain on the host page, and the
 * fragment block re-applies it post-load — see fragment.js).
 * @param {Element} scope The container to clean (a section or the fragment root)
 */
export function removeCtas(scope) {
  scope.querySelectorAll('.button-wrapper').forEach((wrapper) => {
    const cta = wrapper.querySelector('a.button');
    if (!cta) return;
    const href = cta.getAttribute('href');

    // The card fragments carry the brochure's PDF only in this CTA link. The
    // source resources.html has NO button — instead the brochure image itself
    // links to the PDF. So before removing the CTA, move its PDF target onto the
    // card's image (wrap the <picture> in a link) so the brochure stays
    // clickable-to-PDF and no content/link is lost. Fragment content is
    // untouched; this is a render-time transform only.
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
 * Merges the cards of every `.cards` block within a section into a single grid.
 *
 * When a section includes more than one card fragment (each fragment renders its
 * own `.cards > ul`), they would otherwise stack as separate grids. This moves
 * all `<li>`s into the FIRST `.cards` block's `<ul>` — in document order — and
 * removes the now-empty extra fragment wrappers. The result is one real `.cards`
 * grid, so the block's own responsive grid CSS and the standard section
 * container width/padding apply automatically (no special section styling, no
 * display:contents). Variant classes on the first cards block are preserved.
 *
 * This is what lets "2 fragments in the same section" render as one row — the
 * author simply drops both fragment blocks in a section; no flag needed.
 * @param {Element} section the section element to consolidate
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
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
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
