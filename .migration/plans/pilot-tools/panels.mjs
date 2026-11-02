// Lists the full-bleed panels of live stryker.com pages: classes, size, background and how much
// text / media they hold (empty coloured panels are bands or stripes).
// usage: node panels.mjs <url> [url …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const url of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: Number(process.env.WIDTH || 1440), height: 900 } });
  await blockAltcha(page);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.c-full-bleed-panel')].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const media = el.querySelectorAll('img, video, iframe').length;
      return `${String(el.className).replace(/\s+/g, ' ').trim()} ${Math.round(r.width)}x${Math.round(r.height)} y${Math.round(r.top + window.scrollY)} ${cs.display} bg ${cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 60) : cs.backgroundColor} mt ${cs.marginTop} mb ${cs.marginBottom} next ${el.closest(".fullbleedpanel")?.nextElementSibling ? Math.round(el.closest(".fullbleedpanel").nextElementSibling.getBoundingClientRect().top + window.scrollY) : "-"} prev-end ${el.closest(".fullbleedpanel")?.previousElementSibling ? Math.round(el.closest(".fullbleedpanel").previousElementSibling.getBoundingClientRect().bottom + window.scrollY) : "-"} text ${(el.innerText || '').trim().length} media ${media}`;
    }));
    console.log(url);
    rows.forEach((row) => console.log('  ', row));
  } catch (e) {
    console.log(url, 'error', e.message);
  }
  await page.close();
}
await browser.close();
