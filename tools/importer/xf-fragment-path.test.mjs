// Quick check of the XF → fragment lookup: node tools/importer/xf-fragment-path.test.mjs
import xfFragmentPath from './xf-fragment-path.js';

const cases = [
  ['https://www.stryker.com/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master.html', '/us/en/fragments/sage/contact'],
  ['/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master', '/us/en/fragments/acute-care/resources'],
  ['/content/experience-fragments/stryker/corporate/en/about/news/features/some-article/body/master', null],
];
let failed = 0;
cases.forEach(([input, expected]) => {
  const got = xfFragmentPath(input);
  if (got !== expected) failed += 1;
  console.log(`${got === expected ? 'ok  ' : 'FAIL'} ${input} → ${got}`);
});
process.exit(failed ? 1 : 0);
