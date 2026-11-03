/*
 * long-page-detail-corp: where each XF sits on the pages that have two or more XFs.
 *
 * From the "Path" column of the customer's long-page-detail-paired.csv export (2026-10-28,
 * #469): "<row>:<column>" of the innermost AEM column row around the XF (e.g.
 * "cols2_2_3_1_3:2" = the right column of a 2/3 + 1/3 row), "" when the XF is not in a
 * column row. long-page-detail-corp-sections.js matches the page's XF slots by it.
 */
export default {
  '/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html': {
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master': 'cols:1',
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/endoscopy/en/systems/connected_or/surgical-workflow/master': '',
  },
  '/us/en/communications/systems/-isuite-experience/procare-services.html': {
    '/content/experience-fragments/stryker/communications/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/communications/en/contact_information/header/master': 'cols:1',
  },
  '/us/en/communications/systems/-isuite-experience/room-design.html': {
    '/content/experience-fragments/stryker/communications/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/communications/en/contact_information/header/master': 'cols:1',
  },
  '/us/en/endoscopy/products/1788-platform/general-surgery.html': {
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master': 'cols:1',
  },
  '/us/en/endoscopy/products/1788-platform/thoracic.html': {
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master': 'cols:1',
  },
  '/us/en/endoscopy/products/1788-platform/urology.html': {
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master': 'cols:1',
  },
  '/us/en/endoscopy/products/thermaclear.html': {
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/contact/master': 'cols2_2_3_1_3:2',
    '/content/experience-fragments/stryker/endoscopy/en/contact_information/header/master': 'cols:1',
  },
  '/us/en/joint-replacement/systems/Mako_SmartRobotics_Overview.html': {
    '/content/experience-fragments/stryker/joint-replacement/en/systems/mako_smartrobotics_o/global-statistics/master': '',
    '/content/experience-fragments/stryker/joint-replacement/en/training_and_educati/stryker_training_aca/sta-callout-and-signup-invite/master': '',
  },
};
