/*
 * www.stryker.com pages of the AEM template event-detail (44 pages) → EDS pages (template
 * event-detail-engine), through the corp rule library (corp/), first pass: the library's handlers as they
 * are, no template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/event-detail.js';

export default createCorpImport({
  name: 'event-detail-engine',
  description: 'www.stryker.com event-detail pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/global-events/acute-care/training/ed-prevention-is-in-reducing-falls-and-saving-skin-pro.html',
  ],
  facts: PAGE_FACTS,
});
