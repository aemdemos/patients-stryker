/* global WebImporter */

/*
 * stryker.com Experience Fragments → EDS fragment documents (every XF is its own document).
 *
 * Imports XF variations from their publish URL (https://www.stryker.com/content/experience-
 * fragments/…/<variation>.html) and saves each at its EDS path from the site-wide XF index
 * (tools/importer/xf-fragment-path.js → data/xf-index.js). XFs nested in an XF become
 * Fragment blocks in it (matched against FRAGMENTS[xf].refs).
 *
 * The content is built with the section rules of the template whose pages use the XF; this
 * script carries the news-detail rules (transformers/news-detail-sections.js: article body
 * copy, asides), so run it with the news-detail list only:
 *   tools/importer/data/catalog/xf-urls-news-detail.txt (npm run build:migration-index)
 * XFs of other templates get their template's rules when that template's importer is built.
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
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

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
