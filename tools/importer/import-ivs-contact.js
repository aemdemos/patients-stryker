/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS — the IVS contact form is the same Marketo setup as the IVS
// treatment pages; the parser reads data-marketo-* ids from the source (form 4893).
import marketoFormParser from './parsers/ivs-treatment/marketo-form.js';

// TRANSFORMER IMPORTS — shared cleanup at the transformers root; the section /
// formatting transformer is template-specific and namespaced under ivs-contact/.
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import ivsContactSectionsTransformer from './transformers/ivs-contact/sections.js';

// PARSER REGISTRY - keys match block names in page-templates.json
const parsers = {
  'marketo-form': marketoFormParser,
};

// TRANSFORMER REGISTRY - order matters: cleanup -> sections
const transformers = [
  cleanupTransformer,
  ivsContactSectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (ivs-contact)
// Standalone page. nav / footer come from the site metadata sheet for /us/en/ivs/**
// (same as every migrated IVS page), so no nav/footer rows are added here.
const PAGE_TEMPLATE = {
  name: 'ivs-contact',
  description: 'IVS Contact us page (standalone): page title, intro, Marketo contact form, Find a doctor CTA, compact disclaimer.',
  urls: [
    'https://patients.stryker.com/us/en/ivs/contact.html',
  ],
  blocks: [
    { name: 'marketo-form', instances: ['.marketoform'] },
  ],
  sections: [
    { id: '1', name: 'intro', selector: ['.main.content .text.parbase'], style: null, blocks: [], defaultContent: ['h1', 'h2', 'p', '.buttonset a.btn-gold'] },
    { id: '2', name: 'contact-form', selector: ['.main.content .sectionseparator', '.marketoform'], style: 'divider', blocks: ['marketo-form'], defaultContent: [] },
    { id: '3', name: 'disclaimer', selector: ['.c-disclaimer.page-section'], style: 'compact', blocks: [], defaultContent: ['.c-disclaimer p'] },
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

    // 1. beforeTransform: cleanup + heading formatting + section break markers.
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse each block using the embedded template.
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

    // 3. afterTransform: final cleanup + Section Metadata (divider, compact).
    executeTransformers('afterTransform', main, payload);

    // 4. Page Metadata (Title / Description / og:title from the source page) plus
    //    `theme = ivs-contact`: page-only type overrides (42px title, light-serif
    //    subheading, 21px intro) live in styles/themes.css under body.ivs-contact.
    //    Key must be lowercase `theme` (getMetadata matches case-sensitively).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'ivs-contact';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path (localized path without extension).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath);

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
