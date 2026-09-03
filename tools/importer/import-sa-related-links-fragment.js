/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsRelatedLinksParser from './parsers/sa-resources/columns-related-links.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
];

// PAGE TEMPLATE CONFIGURATION
// This import extracts ONLY the related-links 3-column region from the resources
// page and writes it as a reusable fragment document at
// /fragments/stroke-awareness-related-links. The resources page references this
// fragment via the fragment block. Reuses the sa-resources cleanup branch.
const PAGE_TEMPLATE = {
  name: 'sa-resources',
  description: 'Related-links fragment extracted from the SA resources page.',
  urls: [
    'https://patients.stryker.com/ww/en/stroke-awareness/resources.html',
  ],
  blocks: [
    {
      name: 'columns-related-links',
      // After the region is isolated below, `.cols3` no longer has its
      // `.bg-light-gray` ancestor, so match on `.cols3` directly.
      instances: ['.cols3'],
    },
  ],
};

const parsers = {
  'columns-related-links': columnsRelatedLinksParser,
};

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    // 1. Isolate the related-links region BEFORE cleanup so the rest of the page
    //    (hero, cards, disclaimer, chrome) is discarded — this document is just
    //    the fragment body.
    const region = document.querySelector('.bg-light-gray .cols3');
    const main = document.createElement('div');
    if (region) {
      main.appendChild(region);
    }
    document.body.replaceChildren(main);

    // 2. Parse the columns region into a columns block.
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
      }
    });

    // 3. afterTransform cleanup (strip stray inputs/links, tracking, DM anchors).
    executeTransformers('afterTransform', main, payload);

    // 4. No page metadata block for a fragment.
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Fixed fragment path (this content is shared across future pages).
    const path = WebImporter.FileUtils.sanitizePath('/fragments/stroke-awareness-related-links');

    return [{
      element: main,
      path,
      report: {
        title: 'Stroke Awareness Related Links (fragment)',
        template: 'sa-related-links-fragment',
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
