/*
 * stryker.com shared Experience Fragments → EDS fragment documents (#443).
 *
 * Key: the XF path exactly as in the customer's "Experience Fragment References" export
 * (no .html). Every importer resolves XF references through this map (xf-fragment-path.js);
 * an XF that is not listed is not a shared fragment and is imported inline. Add an entry
 * when a new shared XF is found (e.g. from the site-wide export).
 *
 * Source: Experience Fragment References export (news-detail pages), received 2026-10-25.
 */
export default {
  '/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master': {
    path: '/us/en/fragments/acute-care/resources',
    name: 'Acute Care "Resources" links',
  },
  '/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master': {
    path: '/us/en/fragments/emergency-care/resources',
    name: 'Emergency Care "Resources" links',
  },
  '/content/experience-fragments/stryker/sage/en/footer/footer/master': {
    path: '/us/en/fragments/sage/resources',
    name: 'Sage "Resources" links',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master': {
    path: '/us/en/fragments/sustainability/connect-with-us',
    name: 'Sustainability "Connect with us" band (above the form)',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master': {
    path: '/us/en/fragments/sustainability/contact',
    name: 'Sustainability contact aside (next to the form)',
  },
  '/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master': {
    path: '/us/en/fragments/sage/contact',
    name: 'Sage contact aside (LinkedIn / Facebook icons)',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop': {
    path: '/us/en/fragments/careers/talent-network-banner',
    name: '"Join our talent network" banner (carousel slide; mobile slide: …/join-our-talent-network-v2-mobile1)',
  },
};
