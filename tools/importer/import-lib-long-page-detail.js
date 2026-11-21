/*
 * www.stryker.com pages of the AEM template long-page-detail (291 pages) → EDS pages (template
 * long-page-detail-corp-engine), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/long-page-detail.js';

export default createCorpImport({
  name: 'long-page-detail-corp-engine',
  description: 'www.stryker.com long-page-detail pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/about/corporate-responsibility/cr-hub.html',
  ],
  facts: PAGE_FACTS,
});
