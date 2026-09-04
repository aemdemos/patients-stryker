/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/procedure-detail/hero.js';
import panelCtaParser from './parsers/procedure-detail/panel-cta.js';
import panelDarkParser from './parsers/procedure-detail/panel-dark.js';
import panelGoldParser from './parsers/procedure-detail/panel-gold.js';
import cardsParser from './parsers/procedure-detail/cards.js';
import cardsResourcesParser from './parsers/procedure-detail/cards-resources.js';

// TRANSFORMER IMPORTS
// NOTE: the legal-page's transformers/patients-stryker-cleanup.js is intentionally
// NOT reused here — it is legal-specific and destructive on this template (it
// demotes the hero <h1> and removes the authored footnotes/references
// `.c-disclaimer`). procedure-detail-cleanup.js is self-sufficient for the safe
// global-chrome removal plus this template's page-specific chrome.
import cleanupTransformer from './transformers/procedure-detail/procedure-detail-cleanup.js';
import sectionsTransformer from './transformers/procedure-detail/procedure-detail-sections.js';
import marketoTransformer from './transformers/procedure-detail/procedure-detail-marketo.js';
import dmTransformer from './transformers/procedure-detail/procedure-detail-dm.js';

// PARSER REGISTRY — keyed by page-templates.json block name
const parsers = {
  hero: heroParser,
  'panel-cta': panelCtaParser,
  'panel-dark': panelDarkParser,
  'panel-gold': panelGoldParser,
  cards: cardsParser,
  'cards-resources': cardsResourcesParser,
};

// TRANSFORMER REGISTRY
// Order matters, and each transformer runs on BOTH hooks in this array order:
//  - marketo FIRST: its beforeTransform must capture the .marketoform identifiers
//    BEFORE cleanup's beforeTransform strips that scaffold. Its afterTransform
//    injects the block anchored to the Resources section break — which sections
//    inserts during ITS beforeTransform, so the break already exists by then.
//  - cleanup: removes page-specific chrome (beforeTransform) + global chrome
//    (afterTransform).
//  - sections: inserts <hr> section breaks (beforeTransform) + Section Metadata
//    (afterTransform).
//  - dm LAST: rewrites DM <img> to anchors in afterTransform, after the block
//    parsers have lifted image references into block cells.
const transformers = [
  marketoTransformer,
  cleanupTransformer,
  sectionsTransformer,
  dmTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (procedure-detail).
// Kept in sync with tools/importer/page-templates.json.
const PAGE_TEMPLATE = {
  name: 'procedure-detail',
  description: 'IVS treatment/procedure detail page. Zones: hero (banner) + Find a doctor CTA; a flex section with default-content intro left + panel (cta) benefits right; a full-bleed dark panel (dark wide) evidence band; an h3 + cards "How it works"; a panel (gold) mid-page CTA; an h2 + cards (resources) brochure grid; a compact section of risks + references. Header/footer and the Marketo doctor-locator form are stripped on import.',
  urls: [
    'https://patients.stryker.com/us/en/ivs/treatments/balloon-kyphoplasty.html',
  ],
  blocks: [
    { name: 'hero', section: 'hero', instances: ['.fullWidthImageHero'] },
    { name: 'panel-cta', section: 'flex', instances: ['.cols2 > .colctrl .row > .col-sm-6:nth-child(2)'] },
    { name: 'panel-dark', section: 'dark', instances: ['.fullbleedpanel .c-full-bleed-panel'] },
    { name: 'cards', instances: ['.cols3 > .colctrl'] },
    { name: 'panel-gold', instances: ['.text.parbase .c-rich-text-editor .bg-gold'] },
    { name: 'cards-resources', section: 'resources', instances: ['.tabs .c-tabs .tabs-content .cols4 .colctrl'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero / title', selector: '.fullWidthImageHero', style: null, blocks: ['hero'], defaultContent: [] },
    { id: 'intro-benefits', name: 'Intro hook + Benefits', selector: '.cols2 > .colctrl', style: 'flex', blocks: ['panel-cta'], defaultContent: ['.cols2 > .colctrl .row > .col-sm-6:nth-child(1)'] },
    { id: 'evidence', name: 'Clinical-evidence callout', selector: '.fullbleedpanel .c-full-bleed-panel', style: 'dark', blocks: ['panel-dark'], defaultContent: [] },
    { id: 'how-it-works', name: 'How it works (3 steps)', selector: '.sectionseparator', style: null, blocks: ['cards'], defaultContent: ['.cols:has(h3) .c-rich-text-editor'] },
    { id: 'midpage-cta', name: 'Mid-page CTA', selector: '.text.parbase .c-rich-text-editor .bg-gold', style: null, blocks: ['panel-gold'], defaultContent: [] },
    { id: 'resources', name: 'Resources', selector: '.tabs', style: null, blocks: ['cards-resources'], defaultContent: ['.tabs .c-tabs h2.component-subheading'] },
    { id: 'risks', name: 'Potential risks', selector: '.text.parbase .c-rich-text-editor .bg-light-gray', style: 'light-gray', blocks: [], defaultContent: ['.text.parbase .c-rich-text-editor .bg-light-gray'] },
    { id: 'footnotes', name: 'Footnotes + references', selector: '.c-disclaimer.page-section:not(.container)', style: 'compact', blocks: [], defaultContent: ['.c-disclaimer.page-section:not(.container)'] },
  ],
};

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * @param {Document} document
 * @param {Object} template - PAGE_TEMPLATE
 * @returns {Array} block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
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

    // 1. beforeTransform: page-specific chrome removal + section-break markers.
    executeTransformers('beforeTransform', main, payload);

    // 2. Parse each block instance using its registered parser. Skip elements
    //    already replaced by an earlier parser (detached from the DOM).
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
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

    // 3. afterTransform: global chrome removal, Section Metadata blocks, DM anchors.
    executeTransformers('afterTransform', main, payload);

    // 4. Built-in rules. Add an <hr> to separate the Metadata block, then build
    //    it from the page's own metadata and stamp `template = procedure-detail`
    //    so aem.js decorateTemplateAndTheme loads the procedure-detail template
    //    (templates/procedure-detail/) and adds the `procedure-detail` body class.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.template = 'procedure-detail';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized path (localized path without extension).
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

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
