/*
 * www.stryker.com landing pages (AEM template tier2-landing-page, 289 pages: business-unit
 * landing pages, campaign pages, video pages, education hubs) → EDS pages with template
 * tier2-landing-page, through the shared corp import (corp-import.js: section builder, page
 * facts metadata).
 *
 * Import: run with the tier2-landing-page URLs taken from the export file names, together
 * with the template's XF list (data/catalog/xf-urls-tier2-landing-page.txt, slides included).
 */
import { createCorpImport } from './corp-import.js';
import PAGE_FACTS from './data/page-facts/tier2-landing-page.js';

export default createCorpImport({
  name: 'tier2-landing-page',
  description: 'www.stryker.com landing pages: page hero (Columns page-intro), hero slides (Hero Corp), local page navigation and jump bar (Sticky Nav), column controls (Columns / Cards Corp / flex sections), Large Headlines, full-bleed panels, card lists, videos, Marketo forms, XFs (Fragment), page disclaimer.',
  urls: [
    'https://www.stryker.com/us/en/emergency-care/emergency-medical-services.html',
  ],
  facts: PAGE_FACTS,
});
