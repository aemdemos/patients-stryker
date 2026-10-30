// Renders block library preview pages and reports each block: name, options, load status, size,
// and the first text; page errors too. usage: node library-render.mjs <url> [url …]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const url of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2500);
  const blocks = await page.evaluate(() => [...document.querySelectorAll('main .block')]
    .filter((b) => !b.classList.contains('library-metadata'))
    .map((b) => {
      const r = b.getBoundingClientRect();
      return `${b.className.replace(/\bblock\b/, '').trim().slice(0, 70)} [${b.dataset.blockStatus}] ${Math.round(r.width)}x${Math.round(r.height)} "${(b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;
    }));
  console.log(url.split('/').pop(), `corp=${await page.evaluate(() => document.body.classList.contains('corp'))}`, errors.length ? `errors: ${errors.join(' | ')}` : '');
  blocks.forEach((b) => console.log('  ', b));
  await page.close();
}
await browser.close();
