// where a text is on the rendered live page: node find-live.mjs <live url> <text> [width]
// prints whether it is visible and the classes of its ancestors (innermost first)
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [url, needle, width = '1440'] = process.argv.slice(2);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3000);
  const out = await page.evaluate((n) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (t.textContent.toLowerCase().includes(n.toLowerCase())) {
        const el = t.parentElement;
        const r = el.getBoundingClientRect();
        const chain = [];
        for (let e = el; e && e !== document.body && chain.length < 12; e = e.parentElement) {
          chain.push(`${e.tagName.toLowerCase()}${e.className ? `.${String(e.className).trim().split(/\s+/).slice(0, 3).join('.')}` : ''}`);
        }
        hits.push({ visible: r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden', y: Math.round(r.top + window.scrollY), chain: chain.join(' < ') });
      }
    }
    return hits;
  }, needle);
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
}
