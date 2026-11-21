/*
 * www.stryker.com pages of the AEM template tier1-landing-contact (4 pages) → EDS pages (template
 * tier1-landing-contact), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/tier1-landing-contact.js';

export default createCorpImport({
  name: 'tier1-landing-contact',
  description: 'www.stryker.com tier1-landing-contact pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/about/contact.html',
  ],
  facts: PAGE_FACTS,
});
