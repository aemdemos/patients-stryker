// The element chain from a text's deepest element up to its block (h1-h6, p), with display,
// font size, line height, vertical align and font family, on a page.
// usage: node chain.mjs <url> <text start> [width]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, needle, width = '1440'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(2500);
console.log(await page.evaluate((t) => {
  const el = [...document.querySelectorAll('body *')]
    .filter((e) => e.offsetParent !== null && (e.innerText || '').replace(/\s+/g, ' ').trim().startsWith(t))
    .sort((a, b) => a.getElementsByTagName('*').length - b.getElementsByTagName('*').length)[0];
  const out = [];
  for (let e = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    out.push(`${e.tagName}.${String(e.className).slice(0, 30)} ${cs.display} top ${Math.round(r.top + window.scrollY)} h ${Math.round(r.height)} m ${cs.marginTop}/${cs.marginBottom} p ${cs.paddingTop}/${cs.paddingBottom} fs ${cs.fontSize} lh ${cs.lineHeight}`);
    if (e.matches('main, #aem-specific-data, .main.content') || out.length > 14) break;
  }
  return out.join('\n');
}, needle));
await browser.close();
