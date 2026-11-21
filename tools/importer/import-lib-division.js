/*
 * www.stryker.com pages of the AEM template division (20 pages) → EDS pages (template
 * division), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/division.js';

export default createCorpImport({
  name: 'division',
  description: 'www.stryker.com division pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/acute-care.html',
  ],
  facts: PAGE_FACTS,
});
