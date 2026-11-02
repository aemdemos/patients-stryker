// Looks for blocks / sections taken out of the page flow on preview pages: elements positioned
// absolute / fixed that overlap the next section, and sections whose boxes overlap.
// usage: node flow-check.mjs [--width 1440] <url> [url …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
let width = 1440;
if (args[0] === '--width') {
  width = Number(args[1]);
  args.splice(0, 2);
}
const browser = await chromium.launch();
for (const url of args) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(3000);
    const out = await page.evaluate(() => {
      const sections = [...document.querySelectorAll('main > .section')];
      const rows = sections.map((s) => {
        const r = s.getBoundingClientRect();
        const cs = getComputedStyle(s);
        return {
          cls: s.className.replace(/\s*section\s*/, ' ').trim().slice(0, 60),
          top: Math.round(r.top + window.scrollY),
          h: Math.round(r.height),
          pos: cs.position,
          blocks: [...s.querySelectorAll('.block')].map((b) => `${b.className.split(' ')[0]}${getComputedStyle(b).position !== 'static' ? `(${getComputedStyle(b).position})` : ''}`).join(' '),
        };
      });
      const overlaps = [];
      rows.forEach((r, i) => {
        const next = rows[i + 1];
        if (next && r.h > 0 && next.top < r.top + r.h - 2) overlaps.push(`#${i} ${r.cls} (top ${r.top}, h ${r.h}) overlaps #${i + 1} ${next.cls} (top ${next.top})`);
      });
      const out2 = [...document.querySelectorAll('main *')].filter((el) => ['absolute', 'fixed'].includes(getComputedStyle(el).position)
        && el.getBoundingClientRect().height > 150 && !el.closest('.block')?.matches('.hero-corp *'))
        .slice(0, 5).map((el) => `${el.tagName}.${String(el.className).slice(0, 40)} ${getComputedStyle(el).position} h${Math.round(el.getBoundingClientRect().height)}`);
      return { rows, overlaps, absolute: out2, height: document.body.scrollHeight };
    });
    console.log(url, `height ${out.height}`);
    out.rows.forEach((r, i) => console.log(`  #${i} top ${r.top} h ${r.h} ${r.pos !== 'static' ? r.pos : ''} [${r.cls}] ${r.blocks}`));
    out.overlaps.forEach((o) => console.log('  OVERLAP', o));
    out.absolute.forEach((o) => console.log('  ABS', o));
  } catch (e) {
    console.log(url, 'error', e.message);
  }
  await page.close();
}
await browser.close();
