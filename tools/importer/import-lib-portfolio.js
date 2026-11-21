/*
 * www.stryker.com pages of the AEM template portfolio (4 pages)
 * → EDS pages of the template portfolio,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/portfolio.js';

export default createCorpImport({
  name: 'portfolio',
  description: 'www.stryker.com portfolio pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/portfolios/medical-surgical-equipment.html',
  ],
  facts: PAGE_FACTS,
});
