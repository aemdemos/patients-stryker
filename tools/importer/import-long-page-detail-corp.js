/* global WebImporter */
// www.stryker.com long-page-detail pages → template long-page-detail-corp (#469).
// Plan: .migration/plans/long-page-detail.md. Groups 1–3: Virtual Learning Center
// videos, other video detail pages, text articles.

// PARSER IMPORTS
import videoParser from './parsers/video.js';
import cardsCorpResourcesParser from './parsers/cards-corp-resources.js';
// TRANSFORMER IMPORTS
import longPageDetailSectionsTransformer from './transformers/long-page-detail-corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'long-page-detail-corp',
  description: 'www.stryker.com long-page-detail pages, groups 1–3 (#469): H1 title; Virtual Learning Center video section (underlined H2 title, Video block, H3 description, Cards Corp (resources) downloads) or a shared Experience Fragment as a Fragment block; video detail pages (Video + caption); text articles; small print and document code as a `disclaimer` section; `published` + `last-updated: show` drive the corp Last Updated line, `page-back: show` the back link.',
  urls: [
    'https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--dr--brent-morris.html',
    'https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/emergency-care/emergency-care/video/lifepak-cr2-aed.html',
    'https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical/learn/smoke-evacuation--a-review-of-the-standards131.html',
  ],
  blocks: [
    { name: 'video', instances: ['.c-standalone-video'] },
    { name: 'cards-corp-resources', instances: ['.c-resourcesanddownload'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  video: videoParser,
  'cards-corp-resources': cardsCorpResourcesParser,
};

// TRANSFORMER REGISTRY — the sections transformer rebuilds the body first; the shared
// cleanup (link rewrite) and DM image rewrite run after it.
const transformers = [
  longPageDetailSectionsTransformer,
  cleanupTransformer,
  dmImagesTransformer,
];

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

/**
 * The page date as `published` (YYYY-MM-DD): the source's hidden published date
 * (#hiddenPublishedDate, MM/DD/YYYY), which also drives its "Last Updated" line;
 * otherwise the month of the "Last Updated" line (YYYY-MM).
 */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  const updated = document.body.textContent.match(/Last Updated\s+([A-Za-z]+)\/(\d{4})/);
  if (!updated) return '';
  const month = new Date(`${updated[1]} 1, 2000`).getMonth() + 1;
  return `${updated[2]}-${String(month).padStart(2, '0')}`;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    // read before the cleanup removes the header: the "Information for healthcare
    // professionals" band (.g-hcpbanner) and the page date
    const hcp = !!document.querySelector('.g-hcpbanner');
    const published = publishedDate(document);

    // 1. beforeTransform: rebuild the page content, strip chrome
    executeTransformers('beforeTransform', main, payload);

    // 2. block parsers
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    // 3. afterTransform: links, DM images, final cleanup
    executeTransformers('afterTransform', main, payload);

    // 4. metadata. `site: corp` and the " | Stryker" title suffix come from the corp bulk
    // metadata; site + template are repeated on the page so it renders the same anywhere.
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    if (hcp) meta['hcp-banner'] = 'true';
    if (published) {
      meta.published = published;
      meta['last-updated'] = 'show';
    }
    if (main.getAttribute('data-page-back')) {
      meta['page-back'] = main.getAttribute('data-page-back');
      main.removeAttribute('data-page-back');
    }
    const unresolvedXfs = main.getAttribute('data-xf-unresolved');
    main.removeAttribute('data-xf-unresolved');
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
        ...(unresolvedXfs ? { 'xf-unresolved': unresolvedXfs } : {}),
      },
    }];
  },
};
