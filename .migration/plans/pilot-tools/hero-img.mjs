// The first hero's image box (live slide image / Hero Corp picture) at given widths.
// usage: node hero-img.mjs <url> <widths>
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
  console.log(width, await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.hero-corp img, .c-autocarousel img, .carouselslide img')]
      .filter((i) => i.getBoundingClientRect().width > 50).slice(0, 2);
    return imgs.map((i) => { const r = i.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} natural ${i.naturalWidth}x${i.naturalHeight} ${i.currentSrc.split('/').pop().slice(0, 50)}`; }).join(' || ');
  }));
  await page.close();
}
await browser.close();
