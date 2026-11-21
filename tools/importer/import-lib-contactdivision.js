/*
 * www.stryker.com pages of the AEM template contactdivision (21 pages) → EDS pages (template
 * contactdivision-engine), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/contactdivision.js';

export default createCorpImport({
  name: 'contactdivision-engine',
  description: 'www.stryker.com contactdivision pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/acute-care/contact.html',
  ],
  facts: PAGE_FACTS,
});
