// Measures the Columns grid rows (columns-grid) of local preview pages at 375 / 768 / 1440:
// each cell's position, width and display, relative to its row; the first text of the cell.
// usage: node grid-local.mjs <url> [url …]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const url of process.argv.slice(2)) {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  console.log(url);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    for (const w of [375, 768, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(500);
      const rows = await page.evaluate(() => [...document.querySelectorAll('.columns.columns-grid > div')].map((row) => {
        const r = row.getBoundingClientRect();
        return {
          cls: row.parentElement.className,
          w: Math.round(r.width),
          cells: [...row.children].map((c) => {
            const b = c.getBoundingClientRect();
            const cs = getComputedStyle(c);
            return `x${Math.round(b.x - r.x)} y${Math.round(b.y - r.y)} w${Math.round(b.width)}${cs.display === 'none' ? ' hidden' : ''} pad ${cs.paddingLeft} [${(c.innerText || c.querySelector('img')?.alt || '').trim().slice(0, 14)}]`;
          }),
        };
      }));
      console.log(` ${w}`);
      rows.forEach((row) => console.log(`   ${row.cls} (row ${row.w}): ${row.cells.join(' || ')}`));
    }
  } catch (e) {
    console.log('  error', e.message);
  }
  await page.close();
}
await browser.close();
