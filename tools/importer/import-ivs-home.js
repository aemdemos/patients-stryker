/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/ivs-home/hero.js';
import stickyNavParser from './parsers/ivs-home/sticky-nav.js';
import columnsParser from './parsers/ivs-home/columns.js';
import panelGoldParser from './parsers/ivs-home/panel-gold.js';
import panelGoldCtaParser from './parsers/ivs-home/panel-gold-cta.js';
import cardsParser from './parsers/ivs-home/cards.js';
import statisticsParser from './parsers/ivs-home/statistics.js';
import panelCtaParser from './parsers/ivs-home/panel-cta.js';

// TRANSFORMER IMPORTS
// NOTE: the legal-page's transformers/patients-stryker-cleanup.js is intentionally
// NOT reused here — it is legal-specific and destructive on this template (it
// demotes the hero <h1> and removes the authored footnotes/references). The safe
// subset of global-chrome removal is inlined in ivs-home-cleanup.js.
import marketoTransformer from './transformers/ivs-home/ivs-home-marketo.js';
import cleanupTransformer from './transformers/ivs-home/ivs-home-cleanup.js';
import sectionsTransformer from './transformers/ivs-home/ivs-home-sections.js';
import dmTransformer from './transformers/ivs-home/ivs-home-dm.js';

// PARSER REGISTRY — keyed by page-templates.json block name
const parsers = {
  hero: heroParser,
  'sticky-nav': stickyNavParser,
  columns: columnsParser,
  'panel-gold': panelGoldParser,
  'panel-gold-cta': panelGoldCtaParser,
  cards: cardsParser,
  statistics: statisticsParser,
  'panel-cta': panelCtaParser,
};

// TRANSFORMER REGISTRY
// Order matters, and each transformer runs on BOTH hooks in this array order:
//  - sections FIRST: its beforeTransform inserts the <hr> section-break markers
//    while every source section element still exists — crucially BEFORE the
//    marketo transformer replaces the `.marketoform` scaffold. This is how the
//    marketo section's break + `anchor: resources` Section Metadata gets anchored
//    to a marker <hr> (WebImporter.Blocks.createBlock emits a <table>, not a
//    `.marketoform`, so the selector must be matched before the replacement).
//    sections' afterTransform then attaches each Section Metadata to its marker.
//  - marketo: reads the `.marketoform` identifiers and replaces the scaffold in
//    place with an authored `marketo-form` block (beforeTransform), between the
//    section-break marker and the disclaimer break already placed by sections.
//  - cleanup: removes the deferred Resources tabs, nav chrome, empty anchor
//    markers, and gray spacer (beforeTransform) + global chrome (afterTransform).
//  - dm LAST: rewrites DM <img> to anchors in afterTransform, after the block
//    parsers have lifted image references into block cells.
const transformers = [
  sectionsTransformer,
  marketoTransformer,
  cleanupTransformer,
  dmTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (ivs-home).
// Kept in sync with tools/importer/page-templates.json.
const PAGE_TEMPLATE = {
  name: 'ivs-home',
  description: 'IVS patient homepage (standalone singleton, theme ivs-home). Zones: hero (banner) + Find a doctor CTA; sticky-nav anchor bar; a flex intro (text left + video right); a gold panel "There\'s hope ahead"; a 4-up cards (linked) pain grid; a statistics dashboard (6 metrics); a flex pair of panel (cta) spotlights; two testimonial columns (text + video) on a dark-teal band; a gold panel "Tired of living in pain?"; a marketo-form doctor finder; a compact disclaimer/references section. Resources tabs (zone 11) DEFERRED. Header/footer + Scene7 video chrome stripped on import.',
  urls: [
    'https://patients.stryker.com/us/en/ivs/index.html',
  ],
  blocks: [
    { name: 'hero', section: 'hero', instances: ['.fullWidthImageHero'] },
    { name: 'sticky-nav', section: 'anchor-nav', instances: ['.c-navigation-bar .nav-wrap'] },
    { name: 'columns', instances: ['.cols2:has(.standalonevideo)'] },
    { name: 'panel-gold', section: 'hope', instances: [".c-rich-text-editor .bg-gold:has(.fontsize-1-25em)"] },
    { name: 'cards', section: 'pain-cards', instances: ['.cols4 > .colctrl'] },
    { name: 'statistics', section: 'statistics', instances: ['.cols3 > .colctrl'] },
    { name: 'panel-cta', section: 'spotlights', instances: [".cols2 > .colctrl:has(.dimensional-box) > .row > [class*='col-sm-6']"] },
    { name: 'panel-gold-cta', section: 'find-doctor', instances: [".c-rich-text-editor .bg-gold:has(a[href*='physicianlocator'])"] },
  ],
  sections: [
    { id: 'hero', name: 'Hero banner', selector: '.fullWidthImageHero', style: null, anchor: null, blocks: ['hero'], defaultContent: [] },
    { id: 'anchor-nav', name: 'Sticky anchor bar', selector: '.c-navigation-bar', style: null, anchor: null, blocks: ['sticky-nav'], defaultContent: [] },
    { id: 'intro-video', name: 'Intro: text + video', selector: '.cols2:has(.standalonevideo):not(.fullbleedpanel *)', style: 'flex', anchor: 'overview', blocks: ['columns'], defaultContent: [] },
    { id: 'hope', name: "There's hope ahead (gold)", selector: '.text.parbase:has(.bg-gold .fontsize-1-25em)', style: null, anchor: null, blocks: ['panel-gold'], defaultContent: [] },
    { id: 'pain-cards', name: 'Pain-type cards', selector: '.cols4', style: null, anchor: null, blocks: ['cards'], defaultContent: [] },
    { id: 'statistics', name: 'Statistics dashboard', selector: '.cols3', style: 'divider', anchor: null, spacerBefore: true, blocks: ['statistics'], defaultContent: [] },
    { id: 'spotlights', name: 'Condition/treatment spotlights', selector: '.cols2:has(.dimensional-box)', style: 'flex', anchor: null, blocks: ['panel-cta'], defaultContent: [] },
    { id: 'testimonials', name: 'Patient testimonials (dark teal)', selector: '.fullbleedpanel:has(.bg-dark-teal-gradient)', style: 'dark', anchor: 'testimonials', blocks: ['columns'], defaultContent: [] },
    { id: 'find-doctor', name: 'Find a doctor (gold)', selector: ".text.parbase:has(.bg-gold a[href*='physicianlocator'])", style: null, anchor: 'find-a-doctor', blocks: ['panel-gold-cta'], defaultContent: [] },
    { id: 'marketo', name: 'Doctor-finder form', selector: '.marketoform', style: null, anchor: 'resources', blocks: ['marketo-form'], defaultContent: [] },
    { id: 'disclaimer', name: 'Disclaimer + references', selector: '.c-disclaimer.page-section:not(.container)', style: 'compact', anchor: 'disclaimer', blocks: [], defaultContent: ['.c-disclaimer.page-section:not(.container)'] },
  ],
};

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
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

    // 1. beforeTransform: marketo block injection, page-specific chrome removal,
    //    and section-break markers.
    executeTransformers('beforeTransform', main, payload);

    // 2. Parse each block instance using its registered parser. Skip elements
    //    already replaced by an earlier parser (detached from the DOM).
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

    // 3. afterTransform: global chrome removal, Section Metadata blocks, DM anchors.
    executeTransformers('afterTransform', main, payload);

    // NOTE (deferred Resources): the Resources brochure tabs (zone 11) are
    // intentionally NOT imported this pass — an incoming block will handle them.
    // ivs-home-cleanup.js strips the `.tabs` widget so it produces no content. To
    // add it later: (a) stop removing `.tabs`/`.c-tabs` in ivs-home-cleanup.js,
    // (b) add a parser + a `blocks[]`/`sections[]` entry (anchor `resources`
    // already exists on the marketo section) here and in page-templates.json.

    // 4. Built-in rules. Add an <hr> to separate the Metadata block, then build
    //    it from the page's own metadata and stamp `theme = ivs-home` so aem.js
    //    decorateTemplateAndTheme adds the `ivs-home` body class (styles/themes.css).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'ivs-home';
    // IVS pages use the taller two-row `nav-ivs` header in production. Declare it
    // in page metadata so the preview renders the SAME nav (matching production)
    // and aem.js reserves the correct two-row height eagerly (avoids a header CLS
    // jump + wrong nav→hero spacing when the real nav loads live).
    meta.nav = '/us/en/ivs/nav-ivs';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized path (localized path without extension).
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

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
