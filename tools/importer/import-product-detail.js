/*
 * www.stryker.com product pages (AEM template product-detail, 677 pages) → EDS pages, through
 * the template's own copy of the corp import rules (product-detail/: section builder,
 * handlers, rich text, cleanup; forked 2026-11-03). Changes there affect only this template.
 *
 * Import: run with the product-detail URLs taken from the export file names
 * (.migration/xf-mapping/…/<Page>.json → https://www.stryker.com/…/<Page>.html), together
 * with the template's XFs: its own ones with import-product-detail-fragments.js, the ones
 * other templates show too with import-xf-fragments.js.
 */
import { createCorpImport } from './product-detail/corp-import.js';
import PAGE_FACTS from './data/page-facts/product-detail.js';

export default createCorpImport({
  name: 'product-detail',
  description: 'www.stryker.com product pages: hero slide (Hero Corp image-slide), jump bar (Sticky Nav), column controls (Columns / Cards Corp / flex sections), XFs (Fragment), Marketo form beside the business-unit aside, resources tabs, page disclaimer.',
  urls: [
    'https://www.stryker.com/us/en/acute-care/products/isolibrium.html',
  ],
  facts: PAGE_FACTS,
});
