// The ProCare tile on a live stryker.com page: the image and each ancestor up to the section,
// with width, x and the classes / max-width that size it. usage: node tile-measure.mjs <url> <widths>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of process.argv[3].split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1000);
  const rows = await page.evaluate(() => {
    const out = [];
    for (let el = document.querySelector('.c-procare-tile-image'); el && !el.matches('.c-tiles'); el = el.parentElement) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push(`${el.tagName}.${String(el.className).replace(/\s+/g, ' ').slice(0, 50)} w${Math.round(r.width)} x${Math.round(r.x)} maxw ${cs.maxWidth} pad ${cs.paddingLeft}/${cs.paddingRight} margin ${cs.marginLeft}/${cs.marginRight} mb ${cs.marginBottom}`);
    }
    const t = document.querySelector('.c-tiles').getBoundingClientRect();
    out.push(`c-tiles w${Math.round(t.width)} x${Math.round(t.x)} h${Math.round(t.height)}`);
    return out;
  });
  console.log(`== ${width}`);
  rows.forEach((r) => console.log('  ', r));
  await page.close();
}
await browser.close();
