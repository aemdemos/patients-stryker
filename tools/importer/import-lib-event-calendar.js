/*
 * www.stryker.com pages of the AEM template event-calendar (2 pages)
 * → EDS pages of the template event-calendar,
 * through the corp rule library (corp/). First pass: the library's handlers as they are, no
 * template-specific rules yet. This file is the template's profile.
 */
import { createCorpImport } from './corp/corp-import.js';
import PAGE_FACTS from './data/page-facts/event-calendar.js';

export default createCorpImport({
  name: 'event-calendar',
  description: 'www.stryker.com event-calendar pages, first pass with the corp rule library.',
  urls: [
    'https://www.stryker.com/us/en/sports-medicine/calendar.html',
  ],
  facts: PAGE_FACTS,
});
