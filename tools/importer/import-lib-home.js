/*
 * www.stryker.com pages of the AEM template home (1 pages)
 * → EDS pages of the template home,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/home.js';

export default createCorpImport({
  name: 'home',
  description: 'www.stryker.com home pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/index.html',
  ],
  facts: PAGE_FACTS,
});
