/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import entHeroParser from './parsers/ent-hero.js';
import columnsParser from './parsers/columns.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import rhinitisSectionsTransformer from './transformers/rhinitis-sections.js';

// PARSER REGISTRY
const parsers = {
  'ent-hero': entHeroParser,
  columns: columnsParser,
  accordion: accordionParser,
};

// TRANSFORMER REGISTRY (sections runs last so it anchors on the final,
// post-parser DOM structure)
const transformers = [
  cleanupTransformer,
  rhinitisSectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'rhinitis',
  description: 'ENT condition page (Chronic rhinitis shape): a columns-50-50 hero (title/text + anatomy image), columns (cols2/cols3) body sections styled compact with columns-50-50 on SYMPTOMS + TREATMENT OPTIONS, an accordion FAQ, and a references/disclaimer list. Section labels are gold text (bold+italic), not headings.',
  urls: [
    'https://patients.stryker.com/us/en/ent/rhinitis.html',
  ],
  blocks: [
    { name: 'ent-hero', instances: ['.c-page-hero'] },
    // body grids; the hero is a .c-page-hero (handled above) so its inner grid
    // is not matched here
    { name: 'columns', instances: ['div[class^="cols2"]', 'div[class^="cols3"]'] },
    { name: 'accordion', instances: ['div.c-accordion .panel-group'] },
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

    // 2. parse blocks. Parse the hero FIRST so its .c-page-hero subtree is
    //    replaced before the columns parser runs (the hero's inner grid would
    //    otherwise also be matched by the cols selector). Elements already
    //    replaced by an earlier parser are detached and skipped.
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

    // 3. afterTransform cleanup + section handling
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
