/*
 * www.stryker.com pages of the AEM template tier1-landing-services (1 pages) → EDS pages (template
 * tier1-landing-services), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/tier1-landing-services.js';

export default createCorpImport({
  name: 'tier1-landing-services',
  description: 'www.stryker.com tier1-landing-services pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/services-and-solutions.html',
  ],
  facts: PAGE_FACTS,
});
