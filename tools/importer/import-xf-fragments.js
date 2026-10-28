/* global WebImporter */

/*
 * stryker.com Experience Fragments → EDS fragment documents (every XF is its own document).
 *
 * Imports XF variations from their publish URL (https://www.stryker.com/content/experience-
 * fragments/…/<variation>.html) and saves each at its EDS path from the site-wide XF index
 * (tools/importer/xf-fragment-path.js → data/xf-index.js). XFs nested in an XF become
 * Fragment blocks in it (matched against FRAGMENTS[xf].refs).
 *
 * The content is built by the corp section builder (corp-page.js through
 * transformers/corp-sections.js), the rules of the corp page importers (corp-import.js).
 * Run it with the template's lists:
 *   tools/importer/data/catalog/xf-urls-<template>.txt and xf-urls-slides-<template>.txt
 *   (npm run build:migration-index)
 * The shared news fragments with a styling of their own (import-news-shared-fragments.js)
 * are built by that importer. Contact-directory XFs (rendered content fragments,
 * dl.cmp-contentfragment) get the directory rules whatever the list: group bands and one
 * Fragment block per content fragment (corp-components.js contactDirectorySections; the
 * content-fragment documents come from import-cf-fragments.js).
 */

import corpSectionsTransformer from './transformers/corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import { CORP_PAGE } from './corp-page.js';
import { markLivePage } from './corp-section-builder.js';

import sharedFragmentsImport, { FRAGMENTS as SHARED } from './import-news-shared-fragments.js';
import { xfKey, xfInfo } from './xf-fragment-path.js';
import { contactDirectorySections } from './corp-components.js';

// every XF: the corp section builder, as the page importers (corp-import.js)
const CORP_XF_TEMPLATE = { name: 'corp-xf', site: 'corp' };
const corpTransformers = [corpSectionsTransformer, cleanupTransformer, dmImagesTransformer];

export default {
  // on the live XF page: what it hides and what its forms load (used by the corp builder)
  onLoad: ({ document }) => markLivePage(document),

  transform: (payload) => {
    const { document, url, params } = payload;
    const key = xfKey(params.originalURL || url);
    if (SHARED[key]) return sharedFragmentsImport.transform(payload);
    const info = xfInfo(key);
    if (!info) throw new Error(`Not a published XF in data/xf-index.js: ${key}`);

    const main = document.body;
    if (main.querySelector('dl.cmp-contentfragment[data-path]')) {
      const { sections, unknown } = contactDirectorySections(main, document);
      if (unknown.length) console.warn(`[import-xf-fragments] ${key}: ${unknown.join(' | ')}`);
      const out = [];
      sections.forEach((section, i) => {
        if (i) out.push(document.createElement('hr'));
        out.push(...section.nodes);
        if (section.style) {
          out.push(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: section.style } }));
        }
      });
      main.replaceChildren(...out);
      return [{
        element: main,
        path: info.eds,
        report: {
          title: info.eds, template: 'contact-directory', source: key, pages: info.pages,
        },
      }];
    }
    const templates = info.templates || [];
    const corpPayload = {
      ...payload,
      template: CORP_XF_TEMPLATE,
      corp: CORP_PAGE,
      xf: key,
      // an XF shown next to a Marketo form: the contact-aside style (component-map)
      sectionStyles: info.aside ? ['contact-aside'] : [],
    };
    corpTransformers.forEach((fn) => {
      try {
        fn.call(null, 'beforeTransform', main, corpPayload);
      } catch (e) {
        console.error('Transformer failed at beforeTransform:', e);
      }
    });
    const corpReport = JSON.parse(main.getAttribute('data-corp-report') || '{}');
    main.removeAttribute('data-corp-report');
    corpTransformers.forEach((fn) => {
      try {
        fn.call(null, 'afterTransform', main, corpPayload);
      } catch (e) {
        console.error('Transformer failed at afterTransform:', e);
      }
    });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    return [{
      element: main,
      path: info.eds,
      report: {
        title: info.eds,
        template: `corp (${templates.join(', ')})`,
        source: key,
        pages: info.pages,
        unhandled: (corpReport.unhandled || []).join(' | '),
        notes: (corpReport.notes || []).join(' | '),
      },
    }];
  },
};
