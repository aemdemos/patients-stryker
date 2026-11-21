/*
 * www.stryker.com pages of the AEM template base (226 pages) → EDS pages (template
 * base), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/base.js';

export default createCorpImport({
  name: 'base',
  description: 'www.stryker.com base pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/about/annual-review/2024.html',
  ],
  facts: PAGE_FACTS,
});
