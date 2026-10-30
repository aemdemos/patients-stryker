// Lists the gold bars / stripes on live stryker.com pages (elements with a gold background or
// gradient, 5-80px high, wider than 300px): tag, classes, size, position under the carousel.
// usage: node gold-bars.mjs <url> [url …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const url of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await blockAltcha(page);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2000);
    const bars = await page.evaluate(() => [...document.querySelectorAll('main *, #aem-specific-data *, body *')]
      .filter((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const gold = /255, 181, 0|255,181,0|ffb500/i.test(cs.backgroundColor + cs.backgroundImage);
        return gold && r.height >= 5 && r.height <= 80 && r.width > 300;
      })
      .slice(0, 5)
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${el.tagName}.${String(el.className).slice(0, 60)} ${Math.round(r.width)}x${Math.round(r.height)} at y${Math.round(r.top + window.scrollY)} bg ${cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 80) : cs.backgroundColor}`;
      }));
    console.log(url);
    bars.forEach((b) => console.log('  ', b));
  } catch (e) {
    console.log(url, 'error', e.message);
  }
  await page.close();
}
await browser.close();
