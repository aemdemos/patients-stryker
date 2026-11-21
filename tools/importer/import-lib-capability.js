/*
 * www.stryker.com pages of the AEM template capability (48 pages)
 * → EDS pages of the template capability,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/capability.js';

export default createCorpImport({
  name: 'capability',
  description: 'www.stryker.com capability pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/portfolios/medical-surgical-equipment/airway-management.html',
  ],
  facts: PAGE_FACTS,
});
