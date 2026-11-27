// www.stryker.com ProCare tile (a product-detail template part, procare-tile.js) → the business
// unit's shared ProCare tile fragment, imported from a product page that shows the tile:
//   /us/en/fragments/stryker/<unit>/en/procare-tile (review build: under
//   /drafts/astha/pages/fragments/, next to the review pages)
// Product pages name the unit in their page metadata (`procare: <unit>`,
// import-long-page-detail-corp.js); templates/product-detail shows the tile from it.
// Usage: one product page URL per business unit (e.g. Isolibrium for acute-care).

import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import { edsLinkPaths, STD_REVIEW_FRAGMENTS } from './transformers/long-page-detail-corp-sections.js';
import { STD_DRAFT_IMPORT } from './transformers/corp-text-markers.js';
import { procareUnit, procareTile, procareTilePath } from './procare-tile.js';

const PAGE_TEMPLATE = {
  name: 'procare-tile',
  description: 'The ProCare tile of a business unit, from one of its product pages, as a shared fragment.',
  urls: [],
  blocks: [],
};

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const unit = procareUnit(document);
    if (!unit) throw new Error(`No ProCare tile on ${params.originalURL || url}`);
    const nodes = procareTile(document);
    main.replaceChildren(...nodes);
    // links to site pages: their EDS paths (the shared cleanup's .html rewrite first)
    cleanupTransformer('afterTransform', main, { ...payload, template: PAGE_TEMPLATE });
    edsLinkPaths(main);
    const path = procareTilePath(unit, STD_DRAFT_IMPORT ? STD_REVIEW_FRAGMENTS : '/us/en/fragments/');
    return [{
      element: main,
      path,
      report: { title: path, template: PAGE_TEMPLATE.name, unit },
    }];
  },
};
