/*
 * www.stryker.com pages of the AEM template specialty (135 pages) → EDS pages (template
 * specialty), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/specialty.js';

export default createCorpImport({
  name: 'specialty',
  description: 'www.stryker.com specialty pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/bedframes/icu-critical-care-beds.html',
  ],
  facts: PAGE_FACTS,
});
