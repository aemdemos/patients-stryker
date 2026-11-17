/* global WebImporter */
// www.stryker.com long-page-detail pages → template long-page-detail-corp (#469).
// Plan: .migration/plans/long-page-detail.md. All 5 groups: Virtual Learning Center
// videos, video detail pages, text articles, medical-education pages, landing pages.

// PARSER IMPORTS
import videoParser from './parsers/video.js';
import cardsCorpResourcesParser from './parsers/cards-corp-resources.js';
import cardsCorpTeaserParser from './parsers/cards-corp-teaser.js';
// TRANSFORMER IMPORTS
import longPageDetailSectionsTransformer, {
  keepHeadlineBlankLines, blankLineSpacers, edsLinkPaths, markBlankBeforeButtons,
} from './transformers/long-page-detail-corp-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';
import semanticTransformer from './transformers/long-page-detail-corp-semantic.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'long-page-detail-corp',
  description: 'www.stryker.com long-page-detail pages (#469): H1 title; Virtual Learning Center video section (underlined H2 title, Video block, H3 description, Cards Corp (resources) downloads) or a shared Experience Fragment as a Fragment block; video detail pages (Video + caption); text articles; medical-education and landing pages (source column rows as Columns, local navigation as Local Nav Corp, single-slide carousel as Hero Corp (the slide), .pDiv / full-width image hero as Hero Corp (banner), their layout as Section Metadata properties, Marketo Form with the contact-aside Fragment); small print and document code as a `disclaimer` section; `published` with `last-updated: false` (the corp Last Updated line is not shown for now).',
  urls: [
    'https://www.stryker.com/us/en/training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities/shoulder-arthroplasty/clinical-corner-series--dr--brent-morris.html',
    'https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/emergency-care/emergency-care/video/lifepak-cr2-aed.html',
    'https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical/learn/smoke-evacuation--a-review-of-the-standards131.html',
  ],
  blocks: [
    { name: 'video', instances: ['.c-standalone-video'] },
    { name: 'cards-corp-resources', instances: ['.c-resourcesanddownload'] },
    { name: 'cards-corp-teaser', instances: ['.c-customizeable'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  video: videoParser,
  'cards-corp-resources': cardsCorpResourcesParser,
  'cards-corp-teaser': cardsCorpTeaserParser,
};

// TRANSFORMER REGISTRY — the sections transformer rebuilds the body first; the shared
// cleanup (link rewrite) and DM image rewrite run after it; the semantic transformer last
// turns the structure transformers' intermediate size / font / colour tags into semantic
// markup (no bracket syntax in the output).
const transformers = [
  longPageDetailSectionsTransformer,
  cleanupTransformer,
  dmImagesTransformer,
  semanticTransformer,
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
  // before the importer's own cleanup, which drops empty paragraphs
  preprocess: ({ document, params }) => {
    keepHeadlineBlankLines(document);
    // (the button marker first: the blank-line spacers rebuild the texts it reads)
    markBlankBeforeButtons(document);
    blankLineSpacers(document, params.originalURL);
  },

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
    // links to site pages: their EDS paths (after the cleanup's .html rewrite)
    edsLinkPaths(main);

    // 4. metadata. `site: corp` and the " | Stryker" title suffix come from the corp bulk
    // metadata; site + template are repeated on the page so it renders the same anywhere.
    // a page theme the semantic transformer chose (e.g. `thank-you-large`)
    const semanticTheme = main.getAttribute('data-semantic-theme');
    main.removeAttribute('data-semantic-theme');
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    // no source description: EDS writes one from the first paragraph of 10+ words; when that is
    // a link alone (a video / asset link named after its file, e.g. endoscopy plastic surgery
    // "Dr_David_Weintritt_The_Ergonomics_and_Utility_of_SPY-PHI"), the description is the first
    // text paragraph of 10+ words instead, as EDS gives the sibling pages
    if (!meta.Description) {
      const wordCount = (t) => (t.match(/[A-Za-z0-9]+/g) || []).length;
      const linkOnly = (p) => {
        const a = p.querySelector('a');
        return !!a && p.textContent.trim() === a.textContent.trim();
      };
      // a link alone whose text is one file-name-like word (no spaces, not a web address)
      const fileName = (p) => linkOnly(p) && /^\S+$/.test(p.textContent.trim())
        && !/^https?:/i.test(p.textContent.trim());
      const long = [...main.querySelectorAll('p')].filter((p) => wordCount(p.textContent) >= 10);
      if (long[0] && fileName(long[0])) {
        const first = long.find((p) => !linkOnly(p));
        if (first) meta.Description = first.textContent.replace(/\s+/g, ' ').trim();
      }
    }
    if (semanticTheme) meta.theme = semanticTheme;
    if (hcp) meta['hcp-banner'] = 'true';
    // the Last Updated line is not shown for now (`show` turns it on, scripts/corp.js)
    if (published) {
      meta.published = published;
      meta['last-updated'] = 'false';
    }
    const unresolvedXfs = main.getAttribute('data-xf-unresolved');
    main.removeAttribute('data-xf-unresolved');
    const semanticWarnings = main.getAttribute('data-semantic-warn');
    main.removeAttribute('data-semantic-warn');
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
        ...(semanticWarnings ? { 'semantic-warnings': semanticWarnings } : {}),
      },
    }];
  },
};
