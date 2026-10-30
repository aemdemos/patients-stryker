// h2 bottom rules, live vs preview, on a page list: node h2-rules.mjs <list>
// for every h2 whose text is on both: whether it has a visible bottom border on each side
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolvePage } from './resolve.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const pages = readFileSync(process.argv[2], 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).map(resolvePage);
const read = () => [...document.querySelectorAll('main h2, .main h2, h2')].filter((h) => h.getBoundingClientRect().width)
  .map((h) => {
    const cs = getComputedStyle(h);
    return [h.textContent.replace(/\s+/g, ' ').trim().slice(0, 50), cs.borderBottomStyle !== 'none' && parseFloat(cs.borderBottomWidth) > 0];
  });
const browser = await chromium.launch();
const tally = {
  both: 0, liveOnly: 0, oursOnly: 0, none: 0,
};
const oursOnly = [];
try {
  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(`https://www.stryker.com${p.aem}.html`, { waitUntil: 'load', timeout: 45000 });
      const live = new Map(await page.evaluate(read));
      await page.goto(`http://localhost:3000/content/drafts/reimport${p.eds}`, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(2500);
      const ours = new Map(await page.evaluate(read));
      ours.forEach((b, t) => {
        if (!live.has(t)) return;
        const l = live.get(t);
        if (l && b) tally.both += 1;
        else if (l) { tally.liveOnly += 1; oursOnly.push(`LIVE ONLY ${p.eds.slice(7, 50)} | ${t}`); }
        else if (b) { tally.oursOnly += 1; oursOnly.push(`${p.eds.slice(7, 50)} | ${t}`); } else tally.none += 1;
      });
    } catch (e) {
      console.log('skip', p.eds, e.message.slice(0, 60));
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log(tally);
oursOnly.slice(0, 15).forEach((l) => console.log('  ours only:', l));
