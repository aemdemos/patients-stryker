/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS — reuse the PROVEN sa-resources block parsers verbatim so the
// fragment body renders identically to the standalone sa-resources page import.
import heroParser from './parsers/sa-resources/hero.js';
import panelParser from './parsers/sa-resources/panel.js';
import cardsBrochureParser from './parsers/sa-resources/cards-brochure.js';
import fragmentParser from './parsers/sa-resources/fragment.js';

// TRANSFORMER IMPORTS — same shared cleanup/dm + the sa-resources section
// transformer. They are all guarded on `payload.template.name === 'sa-resources'`,
// so this fragment config keeps that name (below) to drive them.
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import saResourcesSectionsTransformer from './transformers/sa-resources/sections.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PARSER REGISTRY - keys match block names in the fragment sections below.
const parsers = {
  hero: heroParser,
  panel: panelParser,
  'cards-brochure': cardsBrochureParser,
  fragment: fragmentParser,
};

// TRANSFORMER REGISTRY - order matters: cleanup -> sections -> dm-images.
const transformers = [
  cleanupTransformer,
  saResourcesSectionsTransformer,
  dmImagesTransformer,
];

// FRAGMENT CONFIGURATION
// The shared BODY of the Stroke-Awareness Resources pages, written once to
//   /fragments/sa-resources-body
// and embedded (via a `fragment` block) by BOTH the ww and us resources pages.
// The us and ww source bodies are content-identical (same hero, intro+panel, two
// 4-up card grids, and related-links band); the ONLY per-locale difference is the
// trademark/disclaimer + its AP number, which is therefore NOT part of this
// fragment — each resources page authors its own compact disclaimer below the
// embed (see import-sa-resources.js).
//
// `name` is 'sa-resources' so the shared transformers (all guarded on that name)
// fire exactly as they do for the full-page import. The `sections` list is the
// sa-resources template's sections MINUS the disclaimer — so no disclaimer break
// or Section Metadata is emitted here. The related-links band stays a NESTED
// fragment reference (/fragments/stroke-awareness-related-links, already authored
// and published) rather than being inlined, so it isn't duplicated; the fragment
// block resolves nested fragments recursively at runtime.
const FRAGMENT = {
  name: 'sa-resources',
  // where the fragment document is written (DA path, no .html)
  path: '/fragments/sa-resources-body',
  urls: [
    'https://patients.stryker.com/ww/en/stroke-awareness/resources.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: ['.carouselslidegroup'],
    },
    {
      name: 'panel',
      instances: ['.dimensional-box'],
      section: 'light',
    },
    {
      name: 'cards-brochure',
      instances: ['.cols4'],
      section: 'brochure',
    },
    {
      name: 'fragment',
      instances: ['.bg-light-gray .cols3'],
    },
  ],
  // Same sections as the sa-resources template, WITHOUT the disclaimer (kept
  // per-page). The section transformer keys off this list.
  sections: [
    {
      id: 'hero',
      name: 'Hero',
      selector: '.carouselslidegroup',
      style: null,
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'intro',
      name: 'Intro (welcome + availability panel)',
      selector: '.cols2 .colctrl',
      style: 'flex',
      blocks: ['panel'],
      defaultContent: ['.col-sm-6:nth-child(1) .c-rich-text-editor', '.curatedcta a'],
    },
    {
      id: 'downloads',
      name: 'Downloads (4-up)',
      selector: '.cols4',
      style: 'divider',
      blocks: ['cards-brochure'],
      defaultContent: [],
    },
    {
      id: 'social',
      name: 'Social media',
      selector: '.cols4',
      style: 'divider',
      blocks: ['cards-brochure'],
      defaultContent: ['h2'],
    },
    {
      id: 'related-links',
      name: 'Related links',
      selector: '.bg-light-gray .cols3',
      style: 'light-gray',
      blocks: ['fragment'],
      defaultContent: [],
    },
  ],
};

/**
 * Execute all transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: FRAGMENT };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the fragment configuration. Identical to
 * the sa-resources page finder: a single element is claimed by at most one block.
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

    // 0. Drop the disclaimer up front — it stays per-page (differs by locale), so
    //    it must NOT end up in the shared body fragment. Remove every disclaimer
    //    variant (authored copy, doc code, auto "Last Updated" chrome).
    WebImporter.DOMUtils.remove(main, ['.c-disclaimer']);

    // 1. beforeTransform: cleanup + section break insertion (disclaimer excluded
    //    via FRAGMENT.sections above).
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse each block using the fragment config.
    const pageBlocks = findBlocksOnPage(document, FRAGMENT);
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

    // 3. afterTransform: final cleanup + Section Metadata + DM image anchors.
    executeTransformers('afterTransform', main, payload);

    // 4. DM image URL rules (leave DM links intact; fix relative URLs). NO page
    //    metadata / theme block — this is a fragment, not a page (the theme is set
    //    by the host resources page that embeds this fragment).
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Write to the fragment path (overrides the source URL's derived path).
    return [{
      element: main,
      path: FRAGMENT.path,
      report: {
        title: 'Stroke Awareness Resources body (fragment)',
        template: FRAGMENT.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
