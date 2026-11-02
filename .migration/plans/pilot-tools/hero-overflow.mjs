// Hero Corp text boxes that spill out of their hero (the box ends below the block)
// on preview pages, per width: the block's classes and the overflow in px.
// usage: node hero-overflow.mjs <widths> <url> [url …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [list, ...urls] = process.argv.slice(2);
const widths = list.split(',').map(Number);
const browser = await chromium.launch();
const total = {};
for (const url of urls) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await blockAltcha(page);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(1500);
      const rows = await page.evaluate(() => [...document.querySelectorAll('.hero-corp.image-slide')].map((b) => {
        const media = b.querySelector(':scope > div:first-child');
        const box = b.querySelector(':scope > div:last-child');
        if (!media || !box || getComputedStyle(box).position !== 'absolute') return null;
        const over = Math.round(box.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom);
        return over > 2 ? `${b.className.replace(/\s*(block|image-slide|hero-corp)\b/g, '').trim()} +${over}px` : null;
      }).filter(Boolean));
      rows.forEach((r) => {
        total[width] = (total[width] || 0) + 1;
        console.log(`${width} ${url.split('/').pop()}: ${r}`);
      });
    } catch (e) {
      console.log(width, url, 'error', e.message);
    }
    await page.close();
  }
}
console.log('overflowing heroes per width:', JSON.stringify(total));
await browser.close();
