// Full-page screenshot at a width, scaled down: usage node fullshot.mjs <url> <width> <out.png>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, width, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 0.5 });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('#onetrust-consent-sdk')?.remove());
console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
