// The jump bar (stryker.com .c-navigation-bar / our Sticky Nav) before and after it sticks, at
// given widths: bar box, padding, link box / font / line height, and the header above it.
// usage: node navbar-stuck.mjs <url> <widths>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const measure = () => {
  const bar = document.querySelector('.sticky-nav, .c-navigation-bar');
  if (!bar) return 'no bar';
  const box = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return `${e.tagName}.${String(e.className).replace(/\s+/g, '.').slice(0, 40)} top ${Math.round(r.top)} h ${Math.round(r.height * 10) / 10} p ${cs.paddingTop}/${cs.paddingBottom} m ${cs.marginTop}/${cs.marginBottom} pos ${cs.position} bg ${cs.backgroundColor}`;
  };
  const link = [...bar.querySelectorAll('a')].find((a) => a.offsetParent) || bar.querySelector('button, a') || bar;
  const cs = link && getComputedStyle(link);
  const chain = [];
  for (let e = link; e && e !== bar.parentElement; e = e.parentElement) chain.push(box(e));
  const header = document.querySelector('header');
  return `${chain.join('\n  ')}\n  link font ${cs.fontSize} lh ${cs.lineHeight} | header h ${header ? Math.round(header.getBoundingClientRect().height) : '-'} bottom ${header ? Math.round(header.getBoundingClientRect().bottom) : '-'}`;
};

const browser = await chromium.launch();
for (const width of process.argv[3].split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => document.querySelector('#onetrust-consent-sdk')?.remove());
  console.log(width, 'in flow\n ', await page.evaluate(measure));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await page.waitForTimeout(1500);
  console.log(width, 'stuck\n ', await page.evaluate(measure));
  await page.close();
}
await browser.close();
