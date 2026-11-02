/*
 * www.stryker.com long pages (AEM template long-page-detail, 291 pages: training and
 * education, corporate responsibility, campaign pages) → EDS pages with template
 * long-page-detail-corp (the name long-page-detail is the patients ENT template), through the
 * shared corp import (corp-import.js: section builder, page facts metadata).
 *
 * Import: run with the long-page-detail URLs taken from the export file names, together with
 * the template's XF list (data/catalog/xf-urls-long-page-detail.txt, slides included).
 */
import { createCorpImport } from './corp-import.js';
import PAGE_FACTS from './data/page-facts/long-page-detail.js';

export default createCorpImport({
  name: 'long-page-detail-corp',
  description: 'www.stryker.com long pages: local page navigation (Sticky Nav local), page title (h1-title), XF content, Dynamic Media videos and images, Large Headlines, column controls (Columns / Cards Corp / flex sections), hero slides (Hero Corp), Marketo forms, resources, page disclaimer.',
  urls: [
    'https://www.stryker.com/us/en/about/corporate-responsibility/environment.html',
  ],
  facts: PAGE_FACTS,
});
