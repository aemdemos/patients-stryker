/*
 * www.stryker.com pages of the AEM template search (1 pages)
 * → EDS pages of the template search,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/search.js';

export default createCorpImport({
  name: 'search',
  description: 'www.stryker.com search pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/search.html',
  ],
  facts: PAGE_FACTS,
  // the search page reuses the patients search page's theme (AGENTS.md, corp templates)
  metadata: { theme: 'search' },
});
