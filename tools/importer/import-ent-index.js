/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import entHeroParser from './parsers/ent-hero.js';
import entConditionParser from './parsers/ent-condition.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import entSectionsTransformer from './transformers/ent-sections.js';

// PARSER REGISTRY
const parsers = {
  'ent-hero': entHeroParser,
  'ent-condition': entConditionParser,
};

// TRANSFORMER REGISTRY (ent-sections runs last so it anchors on the final,
// post-parser DOM: it removes the Testimonials section and inserts section breaks)
const transformers = [
  cleanupTransformer,
  entSectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'ent-index',
  description: 'ENT homepage: page-hero intro (columns 50-50), a repeating condition pattern (columns 50-50 + blue panel stat box + learn-more link per condition, compact sections), a testimonials section (excluded), and a references/disclaimer list.',
  urls: [
    'https://patients.stryker.com/us/en/ent/index.html',
  ],
  blocks: [
    { name: 'ent-hero', instances: ['.c-page-hero'] },
    { name: 'ent-condition', instances: ['div.cols2:has(.bg-blue)'] },
  ],
};

/**
 * Execute all page transformers for a specific hook.
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
 * Find all block instances on the page based on the embedded template.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. parse blocks (skip elements already replaced by an earlier parser).
    //    Parse the condition rows before the hero is irrelevant here — the
    //    selectors don't overlap (hero = .c-page-hero, conditions = cols2:has(.bg-blue)).
    findBlocksOnPage(document, PAGE_TEMPLATE).forEach((block) => {
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

    // 3. afterTransform cleanup (removes Testimonials, inserts section breaks)
    executeTransformers('afterTransform', main, payload);

    // 4. built-in rules + metadata
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. sanitized path (map root '/' → /index to avoid the bundled importer crash)
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
      },
    }];
  },
};
