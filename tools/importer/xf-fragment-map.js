/*
 * stryker.com shared Experience Fragments → EDS fragment documents (#443).
 *
 * Key: the XF path exactly as in the customer's "Experience Fragment References" export
 * (no .html). Every importer resolves XF references through this map (xf-fragment-path.js):
 * a listed XF is a shared fragment, and its EDS document path follows from the XF path
 * (rule in xf-fragment-path.js); an XF that is not listed is imported inline. Add an entry
 * when a new shared XF is found (e.g. from the site-wide export).
 *
 * Source: Experience Fragment References export (news-detail pages), received 2026-10-25.
 */
export default {
  '/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master': {
    name: 'Acute Care "Resources" links',
  },
  '/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master': {
    name: 'Emergency Care "Resources" links',
  },
  '/content/experience-fragments/stryker/sage/en/footer/footer/master': {
    name: 'Sage "Resources" links',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master': {
    name: 'Sustainability "Connect with us" band (above the form)',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master': {
    name: 'Sustainability contact aside (next to the form)',
  },
  '/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master': {
    name: 'Sage contact aside (LinkedIn / Facebook icons)',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop': {
    name: '"Join our talent network" banner (carousel slide; mobile slide: …/join-our-talent-network-v2-mobile1)',
  },
};
