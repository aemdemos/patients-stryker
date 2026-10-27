/* global WebImporter */

/*
 * stryker.com Experience Fragments → EDS fragment documents (every XF is its own document).
 *
 * Imports XF variations from their publish URL (https://www.stryker.com/content/experience-
 * fragments/…/<variation>.html) and saves each at its EDS path from the site-wide XF index
 * (tools/importer/xf-fragment-path.js → data/xf-index.js). XFs nested in an XF become
 * Fragment blocks in it (matched against FRAGMENTS[xf].refs).
 *
 * The content is built with the section rules of the templates whose pages use the XF
 * (FRAGMENTS[xf].templates): an XF used by news-detail pages gets the news-detail rules
 * (transformers/news-detail-sections.js: article body copy, asides); every other XF the corp
 * section builder (corp-page.js through transformers/corp-sections.js), the rules of the
 * other corp page importers (import-product-detail.js). Run it with the template's lists:
 *   tools/importer/data/catalog/xf-urls-<template>.txt and xf-urls-slides-<template>.txt
 *   (npm run build:migration-index)
 * The shared news fragments with a styling of their own (import-news-shared-fragments.js)
 * are built by that importer. Contact-directory XFs (rendered content fragments,
 * dl.cmp-contentfragment) get the directory rules whatever the list: group bands and one
 * Fragment block per content fragment (corp-components.js contactDirectorySections; the
 * content-fragment documents come from import-cf-fragments.js).
 */

import heroImageSlideParser from './parsers/hero-image-slide.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
import videoParser from './parsers/video.js';

import newsDetailSectionsTransformer from './transformers/news-detail-sections.js';
import corpSectionsTransformer from './transformers/corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import { CORP_PAGE } from './corp-page.js';
import { markLivePage } from './corp-section-builder.js';

import sharedFragmentsImport, { FRAGMENTS as SHARED } from './import-news-shared-fragments.js';
import { xfKey, xfInfo } from './xf-fragment-path.js';
import { contactDirectorySections } from './corp-components.js';

const PAGE_TEMPLATE = {
  name: 'news-detail',
  description: 'Experience fragments used by news-detail pages, imported as fragment documents with the news-detail section rules (no title, no page metadata).',
  blocks: [
    { name: 'hero-image-slide', instances: ['.c-autocarousel'] },
    { name: 'video', instances: ['.c-standalone-video'] },
    { name: 'cards-corp-teaser', instances: ['.c-customizeable'] },
  ],
};

const parsers = {
  'hero-image-slide': heroImageSlideParser,
  video: videoParser,
  'cards-corp-teaser': cardsCorpTeaserParser,
};

const transformers = [newsDetailSectionsTransformer, cleanupTransformer, dmImagesTransformer];

// XFs of the other corp templates (data/xf-index.js FRAGMENTS[xf].templates): the corp
// section builder, as the page importers (e.g. import-product-detail.js)
const CORP_XF_TEMPLATE = { name: 'corp-xf', site: 'corp' };
const corpTransformers = [corpSectionsTransformer, cleanupTransformer, dmImagesTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

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
    // XFs used by news-detail pages keep the news rules; every other XF is built by the corp
    // section builder (corp-page.js), the rules of the other corp page importers
    const templates = info.templates || [];
    if (templates.length && !templates.includes('news-detail')) {
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
    }

    // the XF's nested XFs are matched against its own references (payload.xf)
    executeTransformers('beforeTransform', main, { ...payload, xf: key });
    PAGE_TEMPLATE.blocks.forEach((def) => def.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (element.parentNode) parsers[def.name](element, { document, url, params });
      });
    }));
    executeTransformers('afterTransform', main, { ...payload, xf: key });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path: info.eds,
      report: {
        title: info.eds,
        template: PAGE_TEMPLATE.name,
        source: key,
        pages: info.pages,
      },
    }];
  },
};
