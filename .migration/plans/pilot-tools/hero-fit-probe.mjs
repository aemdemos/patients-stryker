// Debug a Hero Corp text box that spills out: block min-height, client height, box offset,
// height, margins and rect bottoms. usage: node hero-fit-probe.mjs <url> <width>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, width] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(3000);
console.log(await page.evaluate(() => [...document.querySelectorAll('.hero-corp.image-slide')].map((b) => {
  const box = b.lastElementChild;
  const cs = getComputedStyle(box);
  const last = box.lastElementChild;
  return {
    minHeight: b.style.minHeight,
    client: b.clientHeight,
    blockBottom: Math.round(b.getBoundingClientRect().bottom),
    boxTop: box.offsetTop,
    boxHeight: box.offsetHeight,
    boxMargin: `${cs.marginTop} / ${cs.marginBottom}`,
    boxPadding: `${cs.paddingTop} / ${cs.paddingBottom}`,
    boxBottom: Math.round(box.getBoundingClientRect().bottom),
    lastChild: last && `${last.tagName}.${last.className} mb ${getComputedStyle(last).marginBottom} bottom ${Math.round(last.getBoundingClientRect().bottom)}`,
  };
})));
await browser.close();
