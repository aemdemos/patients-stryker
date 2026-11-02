// Computed style of the elements holding given texts on a page (the first visible match of
// each): font, size, weight, colour, case, margins and its ancestors' classes.
// usage: node text-style.mjs <url> <width> <text> [text …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, width, ...texts] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await blockAltcha(page);
await page.goto(url, { waitUntil: 'load', timeout: 45000 });
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(3000);
console.log(await page.evaluate((list) => list.map((t) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const e = w.currentNode.parentElement;
    if (w.currentNode.nodeValue.trim().startsWith(t) && e.offsetParent) {
      const cs = getComputedStyle(e);
      const chain = [];
      for (let x = e; x && chain.length < 5; x = x.parentElement) chain.push(`${x.tagName}.${String(x.className).split(' ').slice(0, 2).join('.')}`);
      return `"${t}": ${cs.fontFamily.split(',')[0]} ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ${cs.textTransform} ${cs.color} m ${cs.margin} | ${chain.join(' < ')}`;
    }
  }
  return `"${t}": not found`;
}).join('\n'), texts));
await browser.close();
