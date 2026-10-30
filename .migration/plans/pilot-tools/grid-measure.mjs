// Measures the multi-column responsive-grid rows of live stryker.com pages at 375 / 768 / 1440:
// each column's aem-GridColumn classes, position, width, padding and display.
// usage: node grid-measure.mjs <url> [url …] > out.json
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const urls = process.argv.slice(2);
const browser = await chromium.launch();
const result = {};
for (const url of urls) {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2000);
    result[url] = {};
    for (const w of [375, 768, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(700);
      result[url][w] = await page.evaluate(() => {
        const rows = [];
        document.querySelectorAll('.aem-Grid').forEach((g) => {
          const kids = [...g.children].filter((c) => /aem-GridColumn--default--([1-9]|1[01])\b/.test(c.className));
          if (kids.length < 2) return;
          const gr = g.getBoundingClientRect();
          rows.push({
            grid: Math.round(gr.width),
            cols: kids.map((k) => {
              const r = k.getBoundingClientRect();
              const cs = getComputedStyle(k);
              return {
                cls: (k.className.match(/aem-GridColumn--\S+/g) || []).join(' '),
                x: Math.round(r.x - gr.x),
                y: Math.round(r.y - gr.y),
                w: Math.round(r.width),
                pad: `${cs.paddingLeft} ${cs.paddingRight}`,
                d: cs.display,
                t: (k.innerText || '').trim().slice(0, 25),
              };
            }),
          });
        });
        return rows;
      });
    }
  } catch (e) {
    result[url] = { error: e.message };
  }
  await page.close();
}
await browser.close();
console.log(JSON.stringify(result, null, 1));
