/*
 * www.stryker.com pages of the AEM template news-landing (11 pages) → EDS pages (template
 * news-landing), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/news-landing.js';

export default createCorpImport({
  name: 'news-landing',
  description: 'www.stryker.com news-landing pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/about/governance/cyber-security/product-security.html',
  ],
  facts: PAGE_FACTS,
});
