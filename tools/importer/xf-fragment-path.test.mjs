// Quick check of the XF → fragment lookup: node tools/importer/xf-fragment-path.test.mjs
import { readFileSync } from 'fs';
import xfFragmentPath, { xfToFragmentPath } from './xf-fragment-path.js';
import MAP from './xf-fragment-map.js';

const XF = 'https://www.stryker.com/content/experience-fragments/stryker';
const cases = [
  [xfFragmentPath, `${XF}/acute-care/en/business_unit/footer-links/master.html`, '/us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master'],
  [xfFragmentPath, `${XF}/emergency-care/en/business_unit/footer/master.html`, '/us/en/fragments/stryker/emergency-care/en/business-unit/footer/master'],
  [xfFragmentPath, `${XF}/sage/en/footer/footer/master.html`, '/us/en/fragments/stryker/sage/en/footer/footer/master'],
  [xfFragmentPath, '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master', '/us/en/fragments/stryker/sustainability-solutions/en/contact-information/header/master'],
  [xfFragmentPath, '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master.html', '/us/en/fragments/stryker/sustainability-solutions/en/contact-information/contact/master'],
  [xfFragmentPath, `${XF}/sage/en/business_unit/social-icons/master.html?wcmmode=disabled`, '/us/en/fragments/stryker/sage/en/business-unit/social-icons/master'],
  // "_2022" → "2022": aem.live drops leading dashes from folder names
  [xfFragmentPath, '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop.html', '/us/en/fragments/stryker/corporate/en/about/news/2022/features/advancing-healthcare/join-our-talent-network/join-our-talent-network-v2-desktop'],
  // not a shared XF: imported inline
  [xfFragmentPath, '/content/experience-fragments/stryker/corporate/en/about/news/features/some-article/body/master', null],
  // the rule itself works for any XF
  [xfToFragmentPath, '/content/experience-fragments/stryker/corporate/en/about/news/features/some_article/body/master.html', '/us/en/fragments/stryker/corporate/en/about/news/features/some-article/body/master'],
  [xfToFragmentPath, '/us/en/about.html', null],
];
let failed = 0;
cases.forEach(([fn, input, expected]) => {
  const got = fn(input);
  if (got !== expected) failed += 1;
  console.log(`${got === expected ? 'ok  ' : 'FAIL'} ${input} → ${got}`);
});

// xf-fragment-map.json (the JSON copy) lists the same XFs, names and paths as the JS map
const json = JSON.parse(readFileSync(new URL('./xf-fragment-map.json', import.meta.url), 'utf8')).fragments;
const keys = [...new Set([...Object.keys(MAP), ...Object.keys(json)])];
keys.forEach((xf) => {
  const want = MAP[xf] && { path: xfToFragmentPath(xf), name: MAP[xf].name };
  const ok = !!want && !!json[xf] && json[xf].path === want.path && json[xf].name === want.name;
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} json in sync: ${xf}`);
});
process.exit(failed ? 1 : 0);
