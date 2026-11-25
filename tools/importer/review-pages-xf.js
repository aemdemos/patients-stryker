/*
 * The Experience Fragments (XFs) that pages of other templates place, for a review run of
 * those pages (esbuild --define:STD_REVIEW_PAGES=true, corp-text-markers.js STD_REVIEW_IMPORT),
 * in page order, from the customer's AEM export (xf-mapping/<page>.json, 2026-11). Same shape
 * as product-detail-xf.js; read only in a review run, so no other build changes.
 */
export default {
  '/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html': [
    '/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/global-statistics/master',
    '/content/experience-fragments/stryker/joint-replacement/en/training_and_educati/stryker_training_aca/sta-callout-and-signup-invite/master',
  ],
  '/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html': [],
  '/us/en/portfolios/medical-surgical-equipment/integration-and-connectivity/or-integration/rise.html': [
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master',
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master',
  ],
};
