/*
 * www.stryker.com pages of the AEM template tier1-landing (4 pages)
 * → EDS pages of the template tier1-landing,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/tier1-landing.js';

export default createCorpImport({
  name: 'tier1-landing',
  description: 'www.stryker.com tier1-landing pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/about.html',
  ],
  facts: PAGE_FACTS,
});
