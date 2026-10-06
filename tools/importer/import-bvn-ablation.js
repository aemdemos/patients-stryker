/* eslint-disable */
/* global WebImporter */

// Singleton import for the Basivertebral nerve ablation (BVNA) IVS treatment
// page. NOT part of the procedure-detail template: every parser/transformer it
// uses lives under bvn-ablation/ (copied + adapted from procedure-detail) so
// template changes can't alter this page's re-import. Page-specific styling is
// the `bvn-ablation` theme in styles/themes.css.

// PARSER IMPORTS
import heroParser from './parsers/bvn-ablation/hero.js';
import panelCtaParser from './parsers/bvn-ablation/panel-cta.js';
import videoParser from './parsers/bvn-ablation/video.js';
import statisticsParser from './parsers/bvn-ablation/statistics.js';
import panelGrayParser from './parsers/bvn-ablation/panel-gray.js';
import columnsStepsParser from './parsers/bvn-ablation/columns-steps.js';
import columnsTextParser from './parsers/bvn-ablation/columns-text.js';
import panelGoldParser from './parsers/bvn-ablation/panel-gold.js';
import cardsResourcesParser from './parsers/bvn-ablation/cards-resources.js';

// TRANSFORMER IMPORTS
import marketoTransformer from './transformers/bvn-ablation/bvn-ablation-marketo.js';
import cleanupTransformer from './transformers/bvn-ablation/bvn-ablation-cleanup.js';
import sectionsTransformer from './transformers/bvn-ablation/bvn-ablation-sections.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PARSER REGISTRY — keyed by page-templates.json block name
const parsers = {
  hero: heroParser,
  'panel-cta': panelCtaParser,
  video: videoParser,
  statistics: statisticsParser,
  'panel-gray': panelGrayParser,
  'columns-steps': columnsStepsParser,
  'columns-text': columnsTextParser,
  'panel-gold': panelGoldParser,
  'cards-resources': cardsResourcesParser,
};

// TRANSFORMER REGISTRY — order matters (each runs on both hooks in this order):
//  - marketo FIRST: captures the .marketoform identifiers before cleanup strips it.
//  - cleanup: page-specific chrome (before) + global chrome (after).
//  - sections: <hr> breaks (before) + Section Metadata (after).
//  - dm-images LAST: DM <img> → anchors, after parsers lifted images into cells.
const transformers = [
  marketoTransformer,
  cleanupTransformer,
  sectionsTransformer,
  dmImagesTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (bvn-ablation).
const PAGE_TEMPLATE = {
  name: 'bvn-ablation',
  description: 'Basivertebral nerve ablation IVS treatment page (singleton, theme bvn-ablation).',
  urls: [
    'https://patients.stryker.com/us/en/ivs/treatments/basivertebral-nerve-ablation.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.fullWidthImageHero'] },
    { name: 'panel-cta', instances: ['.cols2:has(.dimensional-box) .row > .col-sm-6:has(.dimensional-box)'] },
    { name: 'video', instances: ['.fullbleedpanel .standalonevideo'] },
    { name: 'statistics', instances: ['.cols2:has(.numbercounter)'] },
    { name: 'panel-gray', instances: ['.c-rich-text-editor .bg-light-gray'] },
    { name: 'columns-steps', instances: ['.cols4:not(.tabs .cols4)'] },
    { name: 'columns-text', instances: ['.cols3'] },
    { name: 'panel-gold', instances: ['.c-rich-text-editor .bg-gold'] },
    { name: 'cards-resources', instances: ['.tabs .c-tabs .tabs-content .cols4 .colctrl'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: '.fullWidthImageHero', style: null },
    { id: 'intro-benefits', name: 'Intro + Benefits panel', selector: '.cols2:has(.dimensional-box)', style: 'flex' },
    { id: 'vertebrogenic-lbp', name: 'Understanding vertebrogenic LBP + video (dark)', selector: '.fullbleedpanel', style: 'flex, dark' },
    { id: 'stats-symptoms', name: 'Outcome stats + symptoms panel', selector: '.cols2:has(.numbercounter)', style: 'divider' },
    { id: 'how-it-works', name: 'How it works (4 steps)', selector: '.text.parbase:has(h3):has(+ .cols4)', style: null },
    { id: 'what-to-expect', name: 'What you can expect (3 columns)', selector: '.text.parbase:has(h3):has(+ .cols3)', style: 'divider' },
    { id: 'midpage-cta', name: 'Tired of living in pain? (gold panel)', selector: '.text.parbase:has(.bg-gold)', style: null },
    { id: 'resources', name: 'Resources', selector: '.tabs', style: null },
    { id: 'risks', name: 'Potential risks', selector: '.text.parbase:has(.bg-lighter-gray)', style: 'light-gray' },
    { id: 'footnotes', name: 'Footnotes + references', selector: '.c-disclaimer.page-section:not(.container)', style: 'compact' },
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
 * An element is claimed by at most one block.
 * @param {Document} document
 * @param {Object} template - PAGE_TEMPLATE
 * @returns {Array} block instances found on the page
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
        if (claimed.has(element)) return;
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
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

    // 2. Parse each block instance; skip elements already replaced by an earlier parser.
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

    // 4. Metadata: the page's own metadata plus
    //    - theme = bvn-ablation → body.bvn-ablation + lazy styles/themes.css
    //    - nav = the two-row IVS header, as on the other IVS pages (avoids a
    //      header-height jump when the nav loads).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'bvn-ablation';
    meta.nav = '/us/en/ivs/nav-ivs';
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
