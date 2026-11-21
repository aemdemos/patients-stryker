/*
 * www.stryker.com pages of the AEM template tier2-landing-page (289 pages)
 * → EDS pages of the template tier2-landing-page,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/tier2-landing-page.js';

export default createCorpImport({
  name: 'tier2-landing-page',
  description: 'www.stryker.com tier2-landing-page pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/about/awards/awards.html',
  ],
  facts: PAGE_FACTS,
});
