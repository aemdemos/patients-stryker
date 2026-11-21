/*
 * www.stryker.com pages of the AEM template packagedetail (21 pages)
 * → EDS pages of the template packagedetail,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/packagedetail.js';

export default createCorpImport({
  name: 'packagedetail',
  description: 'www.stryker.com packagedetail pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/acute-care/services/procare.html',
  ],
  facts: PAGE_FACTS,
});
