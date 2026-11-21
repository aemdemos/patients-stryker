/*
 * www.stryker.com pages of the AEM template procedure-detail (42 pages) → EDS pages (template
 * procedure-detail-corp), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/procedure-detail.js';

export default createCorpImport({
  name: 'procedure-detail-corp',
  description: 'www.stryker.com procedure-detail pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/foot-and-ankle/procedures/1st-metatarso-phalangeal--mtp--arthrodesis.html',
  ],
  facts: PAGE_FACTS,
});
