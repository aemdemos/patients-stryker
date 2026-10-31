// Where the sticky header ends and the first hero starts / its text box sits, at given widths,
// on a page (live stryker.com or preview), scrolled to the top and after a 200px scroll.
// usage: node header-hero.mjs <url> <widths>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of process.argv[3].split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2500);
  const probe = () => {
    const header = document.querySelector('.header-corp, header .g-header, header#header, header');
    const fixed = [...document.querySelectorAll('header, header *, .header-wrapper')]
      .filter((e) => ['fixed', 'sticky'].includes(getComputedStyle(e).position) && e.getBoundingClientRect().height > 20)
      .map((e) => `${e.tagName}.${String(e.className).split(' ')[0]} ${getComputedStyle(e).position} ${Math.round(e.getBoundingClientRect().top)}-${Math.round(e.getBoundingClientRect().bottom)}`);
    const hero = document.querySelector('.hero-corp, .c-autocarousel, .carouselslidegroup');
    const box = document.querySelector('.hero-corp > div:last-child, .c-autocarousel .overlayparsys, .carouselslide .xf-content-height');
    const h1 = document.querySelector('.hero-corp h1, .c-autocarousel h1, h1');
    const r = (e) => (e ? `${Math.round(e.getBoundingClientRect().top)}-${Math.round(e.getBoundingClientRect().bottom)}` : '-');
    return `header ${r(header)} | sticky/fixed: ${fixed.slice(0, 3).join(', ')} | hero ${r(hero)} | box ${r(box)} | h1 ${r(h1)}`;
  };
  console.log(`== ${width} top:`, await page.evaluate(probe));
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.waitForTimeout(600);
  console.log(`   ${width} scrolled 200:`, await page.evaluate(probe));
  await page.close();
}
await browser.close();
