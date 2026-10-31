// Screenshot of the region around a text on a page: from 150px above the text, 700px tall.
// usage: node shot.mjs <url> <text> <width> <out.png>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, text, width, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(3000);
await page.evaluate(() => document.querySelector('#onetrust-consent-sdk')?.remove());
const top = await page.evaluate((t) => {
  const el = [...document.querySelectorAll('p, b, strong, h2, h3')].find((e) => e.innerText && e.innerText.trim() === t);
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
}, text);
await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 150)), top);
await page.waitForTimeout(800);
await page.screenshot({ path: out });
await browser.close();
