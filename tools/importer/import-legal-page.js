/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
// All legal pages share ONE template so they render identically: the first heading
// is promoted to <h1> (page title) and every gold sub-section label becomes an <h2>,
// with consistent paragraph spacing. All default content, no blocks.
const PAGE_TEMPLATE = {
  name: 'legal-page',
  description: 'Legal long-form text page: an <h1> title, gold sub-section labels promoted to <h2>, plus paragraphs and bulleted lists in a narrow reading column. All default content, no blocks. Shared by every /legal/ page across all site roots (us, ww, ent, stroke-awareness, zip-skin-closure).',
  urls: [
    'https://patients.stryker.com/us/en/ent/legal/website-accessibility.html',
    'https://patients.stryker.com/us/en/ent/legal/privacy/privacy-notice-for-california-residents.html',
    'https://patients.stryker.com/us/en/ent/legal/privacy.html',
    'https://patients.stryker.com/us/en/ent/legal/consumer-health-privacy.html',
    'https://patients.stryker.com/us/en/ent/legal/cookie-disclaimer.html',
    'https://patients.stryker.com/us/en/ent/legal/surgeon-disclaimer.html',
    'https://patients.stryker.com/us/en/ent/legal/ent-risk-and-safety-information-for-patients.html',
    'https://patients.stryker.com/us/en/ent/legal/terms-of-use.html',
    'https://patients.stryker.com/us/en/legal/consumer-health-privacy.html',
    'https://patients.stryker.com/us/en/legal/privacy/privacy-notice-for-california-residents.html',
    'https://patients.stryker.com/us/en/legal/privacy.html',
    'https://patients.stryker.com/us/en/legal/cookie-disclaimer.html',
    'https://patients.stryker.com/us/en/legal/website-accessibility.html',
    'https://patients.stryker.com/us/en/legal/terms-of-use.html',
    'https://patients.stryker.com/ww/en/legal/website-accessibility.html',
    'https://patients.stryker.com/ww/en/legal/privacy/privacy-notice-for-california-residents.html',
    'https://patients.stryker.com/ww/en/legal/privacy.html',
    'https://patients.stryker.com/ww/en/legal/consumer-health-privacy.html',
    'https://patients.stryker.com/ww/en/legal/cookie-disclaimer.html',
    'https://patients.stryker.com/ww/en/legal/terms-of-use.html',
    'https://patients.stryker.com/ww/en/stroke-awareness/legal/website-accessibility.html',
    'https://patients.stryker.com/ww/en/stroke-awareness/legal/privacy/privacy-notice-for-california-residents.html',
    'https://patients.stryker.com/ww/en/stroke-awareness/legal/privacy.html',
    'https://patients.stryker.com/ww/en/stroke-awareness/legal/consumer-health-privacy.html',
    'https://patients.stryker.com/ww/en/stroke-awareness/legal/cookie-disclaimer.html',
    'https://patients.stryker.com/ww/en/stroke-awareness/legal/terms-of-use.html',
    'https://patients.stryker.com/us/en/zip-skin-closure/legal/website-accessibility.html',
    'https://patients.stryker.com/us/en/zip-skin-closure/legal/privacy.html',
    'https://patients.stryker.com/us/en/zip-skin-closure/legal/terms-of-use.html',
    'https://patients.stryker.com/us/en/zip-skin-closure/legal/consumer-health-privacy.html',
    'https://patients.stryker.com/us/en/zip-skin-closure/legal/cookie-disclaimer.html',
    'https://patients.stryker.com/us/en/stroke-awareness/legal/website-accessibility.html',
    'https://patients.stryker.com/us/en/stroke-awareness/legal/privacy.html',
    'https://patients.stryker.com/us/en/stroke-awareness/legal/consumer-health-privacy.html',
    'https://patients.stryker.com/us/en/stroke-awareness/legal/cookie-disclaimer.html',
    'https://patients.stryker.com/us/en/stroke-awareness/legal/terms-of-use.html',
    'https://patients.stryker.com/us/en/stroke-awareness/legal/privacy/privacy-notice-for-california-residents.html',
    'https://patients.stryker.com/us/en/zip-skin-closure/legal/privacy/privacy-notice-for-california-residents.html',
  ],
  blocks: [],
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

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. No blocks on this template — all default content.

    // 3. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 4. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // Build the Metadata block from the page's own metadata, then add a
    // `theme = legal` row so aem.js decorateTemplateAndTheme adds a `legal` class
    // to <body>. Legal-only styling is scoped to body.legal so it never leaks onto
    // other pages. NOTE: the key must be lowercase `theme` — getMetadata('theme')
    // matches the meta name case-sensitively.
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'legal';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [],
      },
    }];
  },
};
