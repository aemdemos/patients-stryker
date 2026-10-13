/* global WebImporter */

// PARSER IMPORTS — the physician-locator form is the same Marketo embed as the
// IVS treatment pages, so the ivs-treatment parser is reused as-is (it reads the
// data-marketo-* attributes, which carry form 4241 on this page).
import marketoFormParser from './parsers/ivs-treatment/marketo-form.js';

// TRANSFORMER IMPORTS — shared site-wide cleanup first, then the page-scoped
// transformer (section break + h1/paragraph rebuild, which must run after the
// cleanup's h1->h2 demotion).
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import doctorRequestContentTransformer from './transformers/doctor-request/doctor-request-content.js';

// PARSER REGISTRY - keys match block names in page-templates.json
const parsers = {
  'marketo-form': marketoFormParser,
};

// TRANSFORMER REGISTRY - order matters: cleanup -> doctor-request content
const transformers = [
  cleanupTransformer,
  doctorRequestContentTransformer,
];

// Page theme (styles/themes.css body.doctor-request — standalone singleton).
const THEME = 'doctor-request';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (doctor-request)
const PAGE_TEMPLATE = {
  name: 'doctor-request',
  description: 'IVS find-a-doctor Doctor Request page — SINGLETON. Default-content h1 + intro paragraphs followed by the marketo-form block (physician locator sign-up). The post-submit thank-you message is dropped.',
  urls: [
    'https://patients.stryker.com/us/en/ivs/find-a-doctor/doctor-request.html',
  ],
  blocks: [
    { name: 'marketo-form', instances: ['.marketoform'] },
  ],
  sections: [
    {
      id: 'intro',
      name: 'Locator intro (heading + text)',
      selector: ['.largeheadline'],
      style: null,
      blocks: [],
      defaultContent: ['.largeheadline'],
    },
    {
      id: 'form',
      name: 'Physician locator form',
      selector: ['.cols:has(.marketoform)'],
      style: null,
      blocks: ['marketo-form'],
      defaultContent: [],
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

    // 1. beforeTransform: chrome cleanup + section break before the form.
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

    // 3. afterTransform: final cleanup, then the h1 + intro paragraphs rebuild.
    executeTransformers('afterTransform', main, payload);
    stripInternalHtmlExtensions(main);

    // 4. Apply WebImporter built-in rules.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // Build the Metadata block from the page's own metadata, then add the
    // `theme = doctor-request` row (aem.js adds it as a <body> class and
    // scripts.js loads styles/themes.css when a theme is present).
    const meta = WebImporter.Blocks.getMetadata(document);
    // The site-wide "| Stryker" title suffix comes from the project metadata
    // (title:suffix), so drop it from the source <title> to avoid doubling it.
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
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
