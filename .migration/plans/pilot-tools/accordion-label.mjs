// The first two accordion labels on a page (stryker.com .panel-title a / our
// .accordion-item-label), closed and with the first one opened: box, padding, margin, border,
// font / line height, and the panel body under it. usage: node accordion-label.mjs <url> [width]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, width = '1200'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(3000);
await page.evaluate(() => document.querySelector('#onetrust-consent-sdk')?.remove());
const measure = () => {
  const labels = [...document.querySelectorAll('.accordion .panel-title > a, .accordion-item-label')].slice(0, 2);
  const box = (e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return `${e.tagName}.${String(e.className).slice(0, 28)} ${Math.round(r.top + window.scrollY)}-${Math.round(r.bottom + window.scrollY)} p ${cs.padding} m ${cs.margin} bb ${cs.borderBottomWidth} ${cs.borderBottomColor} font ${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`;
  };
  return labels.map((l) => {
    const item = l.closest('.panel, .accordion-item');
    const body = item && item.querySelector('.panel-collapse, .accordion-item-body');
    return `${box(l)}\n    body ${body ? box(body) : '-'}`;
  }).join('\n  ');
};
console.log('closed\n ', await page.evaluate(measure));
await page.locator('.accordion .panel-title > a, .accordion-item-label').first().click();
await page.waitForTimeout(1200);
console.log('first open\n ', await page.evaluate(measure));
await browser.close();
