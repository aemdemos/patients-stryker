// The Marketo form's first label and its ancestors (top, margins, padding) up to the section,
// on a page (scrolled to the form: the block loads Marketo when it comes into view). usage: node form-label.mjs <url> [width]
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
await page.evaluate(() => document.querySelector('.marketo-form, .c-marketo-form')?.scrollIntoView());
await page.waitForTimeout(6000);
console.log(await page.evaluate(() => {
  const form = document.querySelector('form.mktoForm');
  if (!form) return 'no form';
  const out = [];
  for (let e = form.querySelector('label'); e && !e.matches('main, body, .section'); e = e.parentElement) {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    out.push(`${e.tagName}.${String(e.className).slice(0, 30)} top ${Math.round(r.top + window.scrollY)} m ${cs.marginTop}/${cs.marginBottom} p ${cs.paddingTop}`);
    if (out.length > 10) break;
  }
  return out.join('\n');
}));
await browser.close();
