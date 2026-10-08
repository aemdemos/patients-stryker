/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS — same IVS source skin as the mild page, so the ivs-treatment
// parsers are reused as-is (only the blocks present on this page are wired).
import heroParser from './parsers/ivs-treatment/hero.js';
import panelParser from './parsers/ivs-treatment/panel.js';
import panelCtaParser from './parsers/ivs-treatment/panel-cta.js';
import columns5050Parser from './parsers/ivs-treatment/columns-50-50.js';
import marketoFormParser from './parsers/ivs-treatment/marketo-form.js';

// TRANSFORMER IMPORTS — shared cleanup/dm live at the transformers root; the IVS
// section transformer reads this template's own `sections` list.
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import ivsSectionsTransformer from './transformers/ivs-treatment/sections.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PARSER REGISTRY - keys match block names in page-templates.json
const parsers = {
  hero: heroParser,
  panel: panelParser,
  'panel-cta': panelCtaParser,
  'columns-50-50': columns5050Parser,
  'marketo-form': marketoFormParser,
};

// TRANSFORMER REGISTRY - order matters: cleanup -> sections -> dm-images
const transformers = [
  cleanupTransformer,
  ivsSectionsTransformer,
  dmImagesTransformer,
];

// Page theme (styles/themes.css body.ivs-get-the-facts — standalone, not layered).
const THEME = 'ivs-get-the-facts';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (ivs-get-the-facts)
const PAGE_TEMPLATE = {
  name: 'ivs-get-the-facts',
  description: 'Interventional Spine (IVS) "Get the facts" page (vertebral compression fractures).',
  // Same `spacer, large` empty sections above and below the hero as the mild page.
  topSpacer: true,
  heroBottomSpacer: true,
  urls: [
    'https://patients.stryker.com/us/en/ivs/get-the-facts.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.pDiv.bg-shadow'], section: 'banner' },
    { name: 'panel', instances: ['.col-xs-12.col-sm-6:has(.dimensional-box)'], section: 'cta wide' },
    { name: 'panel-cta', instances: ['.has-background.bg-gold'], section: 'gold' },
    // "Why is treatment important?": h2 heading + standalone image (no h3)
    { name: 'columns-50-50', instances: ['.c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(.standaloneimage):not(:has(h4))'] },
    { name: 'marketo-form', instances: ['.marketoform'] },
  ],
  sections: [
    // `hero-facts` → hero.css Futura headline (7vw → 3.5vw, capped 49px).
    { id: 'hero', name: 'Hero banner', selector: '.pDiv.bg-shadow', style: 'hero-facts', blocks: ['hero'], defaultContent: [] },
    {
      id: 'what-is-vcf',
      name: 'What is a VCF? + More about VCFs panel (side-by-side)',
      selector: '.cols2:has(.dimensional-box)',
      style: 'flex',
      blocks: ['panel'],
      defaultContent: ['.cols2:has(.dimensional-box) .col-xs-12.col-sm-6:not(:has(.dimensional-box)) .c-rich-text-editor'],
    },
    {
      id: 'why-treatment',
      name: 'Why is treatment important? (dark)',
      selector: '.c-full-bleed-panel.bg-dark-teal-gradient:not(:has(h4))',
      style: 'dark, full-bleed',
      blocks: ['columns-50-50'],
      defaultContent: [],
    },
    {
      // h1 + paragraph + gold LEARN MORE button right after the dark panel. Needs
      // its own break or it would fall into the dark section. The source opens it
      // with a full-width ".sectionseparator > hr" rule (#b2b4ae, 50px below) —
      // the project's `divider` section style.
      id: 'restore',
      name: 'Don\'t just manage the pain (text + button)',
      selector: '.text.parbase:has(h1):has(+ .buttonset)',
      style: 'divider',
      blocks: [],
      defaultContent: ['.text.parbase:has(h1):has(+ .buttonset)', '.buttonset'],
    },
    {
      id: 'tired-of-pain',
      name: 'Tired of living in pain? (CTA panel)',
      selector: '.has-background.bg-gold',
      style: null,
      blocks: ['panel-cta'],
      defaultContent: [],
    },
    {
      id: 'contact-form',
      name: 'Physician contact form',
      selector: '.marketoform',
      style: null,
      blocks: ['marketo-form'],
      defaultContent: [],
    },
    {
      id: 'disclaimer',
      name: 'Disclaimer + footnotes',
      selector: '.c-disclaimer',
      style: 'compact',
      blocks: [],
      defaultContent: ['.c-disclaimer'],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Strip the `.html` extension from root-relative links (EDS pages are
 * extensionless), keeping any query/hash: /a/b.html#x → /a/b#x.
 * @param {Element} main - The content root
 */
function stripInternalHtmlExtensions(main) {
  main.querySelectorAll('a[href^="/"]:not([href^="//"])').forEach((a) => {
    const match = a.getAttribute('href').match(/^([^?#]*)\.html?([?#].*)?$/);
    if (match) a.setAttribute('href', match[1] + (match[2] || ''));
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // A single element must not be claimed by more than one block.
        if (claimed.has(element)) return;
        claimed.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform: cleanup + section anchor resolution / break insertion.
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse each block using the embedded template.
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 3. afterTransform: final cleanup + Section Metadata block insertion + DM image anchors.
    executeTransformers('afterTransform', main, payload);
    stripInternalHtmlExtensions(main);

    // 4. Apply WebImporter built-in rules.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // Build the Metadata block from the page's own metadata, then add the
    // `theme = ivs-get-the-facts` row. aem.js decorateTemplateAndTheme adds the
    // class to <body>, and scripts.js eagerly loads the single styles/themes.css
    // (awaited before `appear`) when a `theme` is present. Key must be lowercase
    // `theme` (getMetadata matches the meta name case-sensitively).
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = THEME;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path (localized path without extension).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
