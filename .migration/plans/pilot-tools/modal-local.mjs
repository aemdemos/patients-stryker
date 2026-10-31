// The modal tile and modal on a local preview page at given widths: tile size / icon, then
// click → dialog box, title, close button, contact columns, table, button.
// usage: node modal-local.mjs <url> [375,768,1440]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of (process.argv[3] || '375,768,1440').split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('.modal-tile-link')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);
  const tile = await page.evaluate(() => {
    const a = document.querySelector('.modal-tile-link');
    if (!a) return 'no tile';
    const img = a.querySelector('img').getBoundingClientRect();
    const icon = a.querySelector('.modal-tile-icon').getBoundingClientRect();
    return `tile img ${Math.round(img.width)}x${Math.round(img.height)} x${Math.round(img.x)}; icon ${Math.round(icon.width)} at ${Math.round(icon.x - img.x)},${Math.round(icon.y - img.y)} label "${a.getAttribute('aria-label')}"`;
  });
  console.log(`== ${width}`, errors.join(' | '));
  console.log('  ', tile);
  if (tile !== 'no tile') {
    await page.click('.modal-tile-link');
    await page.waitForTimeout(1500);
    const out = await page.evaluate(() => {
      const d = document.querySelector('.modal dialog[open]');
      if (!d) return ['no open dialog'];
      const b = (el) => { const r = el.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.x)},${Math.round(r.y)}`; };
      const h2 = d.querySelector('h2');
      const hs = getComputedStyle(h2);
      const close = d.querySelector('.modal-close');
      const cols = [...d.querySelectorAll('.columns > div > div')].map(b).join(' | ');
      const btn = d.querySelector('a.button');
      return [
        `dialog ${b(d)} radius ${getComputedStyle(d).borderRadius} shadow ${getComputedStyle(d).boxShadow.slice(0, 40)}`,
        `title ${b(h2)} ${hs.fontFamily.slice(0, 22)} ${hs.fontSize} ${hs.fontWeight} rule ${hs.borderBottom} pad ${hs.padding}`,
        `close ${b(close)}`,
        `columns ${cols}`,
        `h4 ${(() => { const c = getComputedStyle(d.querySelector('h4')); return `${c.fontFamily.slice(0, 22)} ${c.fontSize} ${c.fontWeight} margin ${c.margin}`; })()}`,
        `table ${d.querySelector('.table') ? b(d.querySelector('.table')) : 'none'}`,
        `button ${btn ? `${b(btn)} "${btn.textContent.trim()}" bg ${getComputedStyle(btn).backgroundColor} target ${btn.target}` : 'none'}`,
      ];
    });
    out.forEach((l) => console.log('  ', l));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    console.log('   after Escape:', await page.evaluate(() => (document.querySelector('.modal dialog[open]') ? 'still open' : 'closed')));
  }
  await page.close();
}
await browser.close();
