// The space between a page's last visible text and its footer, at 390 / 1200.
// usage: node end-gap.mjs <url> [url …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const url of process.argv.slice(2)) {
  for (const width of [390, 1200]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await blockAltcha(page);
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2500);
    console.log(width, url.slice(-45), await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const top = footer.getBoundingClientRect().top + window.scrollY;
      const last = [...document.querySelectorAll('main *, #aem-specific-data *')]
        .filter((e) => e.offsetParent && !e.closest('footer') && (e.innerText || '').trim() && !e.children.length).pop();
      const r = last.getBoundingClientRect();
      const box = last.closest('.section, .page-section, .container');
      return `last "${last.innerText.trim().slice(0, 30)}" ends ${Math.round(r.bottom + window.scrollY)}, footer ${Math.round(top)}, gap ${Math.round(top - r.bottom - window.scrollY)} (${box ? box.className.slice(0, 50) : '-'})`;
    }));
    await page.close();
  }
}
await browser.close();
