// Quick check of the XF → fragment lookup: node tools/importer/xf-fragment-path.test.mjs
import { readFileSync } from 'fs';
import xfFragmentPath, {
  xfToFragmentPath, cfToFragmentPath, xfStatus, pageXfRefs,
} from './xf-fragment-path.js';

const XF = 'https://www.stryker.com/content/experience-fragments/stryker';
const cases = [
  // the shared news-detail fragments keep the paths they had in the old map (#443)
  [xfFragmentPath, `${XF}/acute-care/en/business_unit/footer-links/master.html`, '/us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master'],
  [xfFragmentPath, `${XF}/emergency-care/en/business_unit/footer/master.html`, '/us/en/fragments/stryker/emergency-care/en/business-unit/footer/master'],
  [xfFragmentPath, `${XF}/sage/en/footer/footer/master.html`, '/us/en/fragments/stryker/sage/en/footer/footer/master'],
  [xfFragmentPath, '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master', '/us/en/fragments/stryker/sustainability-solutions/en/contact-information/header/master'],
  [xfFragmentPath, '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master.html', '/us/en/fragments/stryker/sustainability-solutions/en/contact-information/contact/master'],
  [xfFragmentPath, `${XF}/sage/en/business_unit/social-icons/master.html?wcmmode=disabled`, '/us/en/fragments/stryker/sage/en/business-unit/social-icons/master'],
  // "_2022" → "2022": aem.live drops leading dashes from folder names
  [xfFragmentPath, '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop.html', '/us/en/fragments/stryker/corporate/en/about/news/2022/features/advancing-healthcare/join-our-talent-network/join-our-talent-network-v2-desktop'],
  // any published XF has a fragment path, not only shared ones
  [xfFragmentPath, '/content/experience-fragments/stryker/smart_care/en/business_unit/landing-page-hero/hero-mobile', '/us/en/fragments/stryker/smart-care/en/business-unit/landing-page-hero/hero-mobile'],
  // references that cannot be imported: redirect to the home page, unpublished variation, not an XF
  [xfFragmentPath, '/content/experience-fragments/stryker/neurosurgical/en/products/copilot/copilot-carousel/master', null],
  [xfStatus, '/content/experience-fragments/stryker/neurosurgical/en/products/copilot/copilot-carousel/master', 'redirect'],
  [xfStatus, '/content/experience-fragments/stryker/endoscopy/en/products/_1788_platform/hero-image/mobile', 'unpublished'],
  [xfStatus, '/content/experience-fragments/stryker', 'not-an-xf'],
  [xfFragmentPath, '/content/experience-fragments/stryker', null],
  // the rules themselves
  [xfToFragmentPath, '/content/experience-fragments/stryker/corporate/en/about/news/features/some_article/body/master.html', '/us/en/fragments/stryker/corporate/en/about/news/features/some-article/body/master'],
  [xfToFragmentPath, '/us/en/about.html', null],
  [cfToFragmentPath, '/content/dam/stryker/content-fragments/eemea/en/contact-information/russia', '/us/en/fragments/content-fragments/eemea/en/contact-information/russia'],
  [cfToFragmentPath, '/content/dam/stryker/smart-care/images/x.jpg', null],
];
let failed = 0;
const check = (ok, label) => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
};
cases.forEach(([fn, input, expected]) => {
  const got = fn(input);
  check(got === expected, `${input} → ${got}`);
});

// a page's references, in authored order: Smart Care = hero slide (desktop + mobile), 2 XFs
const refs = pageXfRefs('https://www.stryker.com/us/en/smart-care.html');
check(refs.length === 3 && refs[0].kind === 'slide' && !!refs[0].mobile.eds
  && refs[1].eds === '/us/en/fragments/stryker/smart-care/en/business-unit/form-sidebar/social-links/master'
  && refs[2].eds === '/us/en/fragments/stryker/smart-care/en/business-unit/footer-links/master', 'pageXfRefs(/us/en/smart-care)');

// every EDS path in the export manifest follows the rule, and the index agrees with it
const manifestUrl = new URL('../../.migration/xf-content/_manifest.json', import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));
const variations = manifest.fragments.flatMap((f) => f.variations);
const wrong = variations.filter((v) => v.edsPath !== xfToFragmentPath(v.path)
  || xfFragmentPath(v.path) !== v.edsPath);
check(!wrong.length, `${variations.length} manifest variations match the rule and the index (${wrong.length} wrong)`);
const eds = new Set(variations.map((v) => v.edsPath));
check(eds.size === variations.length, `no two variations share an EDS path (${variations.length - eds.size} collisions)`);
const redirects = (manifest.redirects || []).filter((r) => xfFragmentPath(r.from) !== null);
check(!redirects.length, `redirected references have no fragment path (${redirects.length} wrong)`);

process.exit(failed ? 1 : 0);
