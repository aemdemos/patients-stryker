/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS — only the shared cleanup is needed now: this page is a
// thin shell (one fragment embed + a per-locale disclaimer), so the block parsers
// and the section transformer live in the BODY-fragment importer
// (import-sa-resources-body-fragment.js), not here.
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// PAGE CONFIGURATION
// The Stroke-Awareness Resources pages (ww + us). Both source bodies are
// content-identical, so the entire body is authored ONCE as a shared fragment
//   /fragments/sa-resources-body
// (see import-sa-resources-body-fragment.js) and embedded here via a `fragment`
// block. The ONLY per-locale difference is the trademark/disclaimer + its AP
// number, so that is built per page from each source's own `.c-disclaimer`.
// Styling ships via the existing `sa-resources` theme (styles/themes.css, scoped
// body.sa-resources) — set as meta.theme below.
const PAGE = {
  name: 'sa-resources',
  description: 'Stroke Awareness Resources page (ww + us): a single embed of the shared /fragments/sa-resources-body (hero, welcome intro + availability panel, downloads + social card grids, related-links band) followed by a per-locale trademark/disclaimer. Styled via the sa-resources theme.',
  fragmentPath: '/fragments/sa-resources-body',
  urls: [
    'https://patients.stryker.com/ww/en/stroke-awareness/resources.html',
    'https://patients.stryker.com/us/en/stroke-awareness/resources.html',
  ],
  blocks: ['fragment'],
};

/** Execute all transformers for a specific hook. */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/** A plain link (href = text = the given path/url). */
function plainLink(doc, href, text) {
  const a = doc.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text || href;
  return a;
}

/** A `Fragment` block table referencing the fragment path (href = text = path).
 * The fragment block fetches `${path}.plain.html` and inlines its decorated
 * content — the fragment carries its own section styling, so nothing else is
 * needed here. */
function fragmentBlock(doc, path) {
  return WebImporter.DOMUtils.createTable([
    ['Fragment'],
    [plainLink(doc, path, path)],
  ], doc);
}

/** A `Section Metadata` block table applying the given Style value. */
function sectionMetadata(doc, style) {
  return WebImporter.DOMUtils.createTable([
    ['Section Metadata'],
    ['Style', style],
  ], doc);
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = document.body;

    // 1. Cleanup: strip chrome + tracking (keeps the disclaimer copy intact).
    executeTransformers('beforeTransform', source, payload);
    executeTransformers('afterTransform', source, payload);

    // 2. Build a clean main: the shared body fragment, then the per-locale
    //    disclaimer.
    const main = document.createElement('div');

    // --- Section 1: the shared resources body (embedded as a FRAGMENT) --------
    main.append(fragmentBlock(document, PAGE.fragmentPath));
    main.append(document.createElement('hr'));

    // --- Section 2: trademark / disclaimer (compact, per-locale) --------------
    // Authored trademark/disclaimer paragraphs + AP number in a `compact` section.
    // NOTE: the auto "Last Updated <month>/<year>" line (#publishedDate) is a
    // separate independent component and is EXCLUDED, matching the sibling
    // patient-information import.
    const disclaimerParas = [...source.querySelectorAll('.c-disclaimer p')]
      .filter((node) => node.id !== 'publishedDate' && node.textContent.trim());
    disclaimerParas.forEach((node) => {
      const p = document.createElement('p');
      p.append(document.createTextNode(node.textContent.trim()));
      main.append(p);
    });
    if (disclaimerParas.length) {
      main.append(sectionMetadata(document, 'compact'));
    }

    // 3. Metadata block from the page's own <head> metadata, plus the theme row.
    //    aem.js decorateTemplateAndTheme adds body.sa-resources and scripts.js
    //    lazily loads styles/themes.css (where the sa-resources theme lives).
    //    Key must be lowercase `theme` — getMetadata('theme') is case-sensitive.
    const meta = WebImporter.Blocks.getMetadata(document);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.getAttribute('href')) {
      meta.canonical = canonical.getAttribute('href');
    }
    meta.theme = 'sa-resources';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    // 4. Normalise DM asset URLs (fix any relative URLs; DM links left intact).
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized output path (localized path without extension).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE.name,
        blocks: PAGE.blocks,
      },
    }];
  },
};
