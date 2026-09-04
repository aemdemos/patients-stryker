/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/sa-resources/hero.js';
import panelParser from './parsers/sa-resources/panel.js';
import cardsBrochureParser from './parsers/sa-resources/cards-brochure.js';
import fragmentParser from './parsers/sa-resources/fragment.js';

// TRANSFORMER IMPORTS — shared cleanup/dm live at the transformers root; the
// section transformer is template-specific and namespaced under sa-resources/.
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import saResourcesSectionsTransformer from './transformers/sa-resources/sections.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PARSER REGISTRY - keys match block names in page-templates.json
const parsers = {
  hero: heroParser,
  panel: panelParser,
  'cards-brochure': cardsBrochureParser,
  fragment: fragmentParser,
};

// TRANSFORMER REGISTRY - order matters: cleanup -> sections -> dm-images
const transformers = [
  cleanupTransformer,
  saResourcesSectionsTransformer,
  dmImagesTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (sa-resources)
const PAGE_TEMPLATE = {
  name: 'sa-resources',
  description: 'Stroke Awareness Resources landing page: hero banner, a two-column intro (default text + gold button beside a light panel) in a flex/compact section, a 4-up downloads card grid (cards brochure), a social-media card grid (cards brochure with empty heading line), a related-links fragment reference in a gray section, and a small-text disclaimer. Standalone template for future SA resource-style pages.',
  urls: [
    'https://patients.stryker.com/ww/en/stroke-awareness/resources.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: ['.carouselslidegroup'],
    },
    {
      name: 'panel',
      instances: ['.dimensional-box'],
      section: 'light',
    },
    {
      name: 'cards-brochure',
      instances: ['.cols4'],
      section: 'brochure',
    },
    {
      name: 'fragment',
      instances: ['.bg-light-gray .cols3'],
    },
  ],
  sections: [
    {
      id: 'hero',
      name: 'Hero',
      selector: '.carouselslidegroup',
      style: null,
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'intro',
      name: 'Intro (welcome + availability panel)',
      selector: '.cols2 .colctrl',
      style: 'flex',
      blocks: ['panel'],
      defaultContent: ['.col-sm-6:nth-child(1) .c-rich-text-editor', '.curatedcta a'],
    },
    {
      id: 'downloads',
      name: 'Downloads (4-up)',
      selector: '.cols4',
      style: 'divider',
      blocks: ['cards-brochure'],
      defaultContent: [],
    },
    {
      id: 'social',
      name: 'Social media',
      selector: '.cols4',
      style: 'divider',
      blocks: ['cards-brochure'],
      defaultContent: ['h2'],
    },
    {
      id: 'related-links',
      name: 'Related links',
      selector: '.bg-light-gray .cols3',
      style: 'light-gray',
      blocks: ['fragment'],
      defaultContent: [],
    },
    {
      id: 'disclaimer',
      name: 'Disclaimer',
      selector: '.c-disclaimer',
      style: 'compact',
      blocks: [],
      defaultContent: ['.c-disclaimer p'],
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
        // A single element must not be claimed by more than one block (e.g. the
        // two `.cols4` grids are both cards-brochure, but a `.cols3` inside a
        // `.bg-light-gray` must not also be swept up by a broader selector).
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
    // `theme = sa-resources` row. aem.js decorateTemplateAndTheme adds a
    // `sa-resources` class to <body>, and scripts.js lazily loads the single
    // styles/themes.css when a `theme` is present. ALL of this page's styling
    // lives in themes.css scoped under body.sa-resources. A theme (not a
    // per-page template) is used because we don't create templates for
    // singletons — theme names still have single-owner governance so they can't
    // collide across authors, unlike ad-hoc block Style names. NOTE: the key must
    // be lowercase `theme` — getMetadata('theme') matches the meta name
    // case-sensitively.
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'sa-resources';
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
