/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/ivs-treatment/hero.js';
import panelParser from './parsers/ivs-treatment/panel.js';
import panelCtaParser from './parsers/ivs-treatment/panel-cta.js';
import columns5050Parser from './parsers/ivs-treatment/columns-50-50.js';
import columnsParser from './parsers/ivs-treatment/columns.js';
import cardsBrochureParser from './parsers/ivs-treatment/cards-brochure.js';
import marketoFormParser from './parsers/ivs-treatment/marketo-form.js';

// TRANSFORMER IMPORTS — shared cleanup/dm live at the transformers root; the
// section transformer is template-specific and namespaced under ivs-treatment/.
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import ivsTreatmentSectionsTransformer from './transformers/ivs-treatment/sections.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PARSER REGISTRY - keys match block names in page-templates.json
const parsers = {
  hero: heroParser,
  panel: panelParser,
  'panel-cta': panelCtaParser,
  'columns-50-50': columns5050Parser,
  columns: columnsParser,
  'cards-brochure': cardsBrochureParser,
  'marketo-form': marketoFormParser,
};

// TRANSFORMER REGISTRY - order matters: cleanup -> sections -> dm-images
const transformers = [
  cleanupTransformer,
  ivsTreatmentSectionsTransformer,
  dmImagesTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (ivs-treatment)
const PAGE_TEMPLATE = {
  name: 'ivs-treatment',
  description: 'Interventional Spine (IVS) treatment page (mild® procedure).',
  // Prepend one empty spacer section (Style `spacer, large`, ~60px) above the
  // hero to match the source's ~60px top offset. Uses the .section.spacer.large
  // variant in styles.css — a single empty section, no theme.
  topSpacer: true,
  // Add the same `spacer, large` empty section BELOW the hero (between the hero
  // and the first content section) to match the reference spacing under the hero.
  heroBottomSpacer: true,
  urls: [
    'https://patients.stryker.com/us/en/ivs/treatments/mild.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.pDiv.bg-shadow'], section: 'banner' },
    { name: 'panel', instances: ['.col-xs-12.col-sm-6:has(.dimensional-box)'], section: 'cta wide' },
    { name: 'panel-cta', instances: ['.has-background.bg-gold'], section: 'gold' },
    { name: 'columns-50-50', instances: ['.c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(h3):not(:has(h4))'] },
    {
      name: 'columns',
      instances: [
        '.cols2:has(.standaloneimage):not(.c-full-bleed-panel .cols2)',
        '.c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(h4)',
        '.cols3',
      ],
    },
    { name: 'cards-brochure', instances: ['.cols4'], section: 'resources' },
    { name: 'marketo-form', instances: ['.marketoform'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero banner', selector: '.pDiv.bg-shadow', style: null, blocks: ['hero'], defaultContent: [] },
    {
      id: 'get-back-benefits',
      name: 'Get back on your feet + Benefits panel (side-by-side)',
      selector: '.cols2:has(.dimensional-box)',
      style: 'flex',
      blocks: ['panel'],
      defaultContent: ['.cols2:has(.dimensional-box) .col-xs-12.col-sm-6:not(:has(.dimensional-box)) .c-rich-text-editor'],
    },
    {
      id: 'what-is-lss',
      name: 'What is LSS? (dark)',
      selector: '.c-full-bleed-panel.bg-dark-teal-gradient:not(:has(h4))',
      style: 'dark, full-bleed',
      blocks: ['columns-50-50'],
      defaultContent: [],
    },
    {
      id: 'proven-results',
      name: 'A procedure with proven results',
      selector: '.text.parbase:has(h3):has(+ .cols2)',
      style: null,
      blocks: ['columns'],
      defaultContent: ['.text.parbase:has(h3):has(+ .cols2) .c-rich-text-editor'],
    },
    {
      id: 'before-after',
      name: 'Before / After comparison (dark)',
      selector: '.c-full-bleed-panel.bg-dark-teal-gradient:has(h4)',
      style: 'dark, full-bleed',
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'how-it-works',
      name: 'How it works (3-up text columns)',
      selector: '.text.parbase:has(h3):has(+ .cols3)',
      style: null,
      blocks: ['columns'],
      defaultContent: ['.text.parbase:has(h3):has(+ .cols3) .c-rich-text-editor'],
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
      id: 'resources',
      name: 'Resources',
      selector: '.c-tabs',
      style: null,
      blocks: ['cards-brochure'],
      defaultContent: ['h2.component-subheading'],
    },
    {
      id: 'potential-risks',
      name: 'Potential risks of the procedure',
      selector: '.has-background.bg-lighter-gray',
      style: 'light-gray',
      blocks: [],
      defaultContent: ['.has-background.bg-lighter-gray'],
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

    // 4. Apply WebImporter built-in rules.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // Build the Metadata block from the page's own metadata, then add a
    // `theme = ivs-treatment` row. aem.js decorateTemplateAndTheme adds the
    // `ivs-treatment` class to <body>, and scripts.js eagerly loads the single
    // styles/themes.css (awaited before `appear`) when a `theme` is present.
    // Page-specific styling that can't live in the shared block/section CSS —
    // e.g. matching the benefits panel's typography to this page's reference —
    // lives in themes.css scoped under body.ivs-treatment. Key must be lowercase
    // `theme` (getMetadata matches the meta name case-sensitively).
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'ivs-treatment';
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
