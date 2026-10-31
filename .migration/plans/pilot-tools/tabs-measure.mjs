// The first tab bar on a page (stryker.com .c-tabs .tabs-nav / our Tabs block) at given widths:
// each tab's box, label font, padding, borders and colours (active one marked), the bar's box
// and the first panel's top. usage: node tabs-measure.mjs <url> <widths>
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const browser = await chromium.launch();
for (const width of process.argv[3].split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await blockAltcha(page);
  await page.goto(process.argv[2], { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(3000);
  console.log(width, await page.evaluate(() => {
    const bar = document.querySelector('.c-tabs .tabs-nav, .tabs [role=tablist]');
    if (!bar) return 'no tabs';
    const y = (e) => Math.round(e.getBoundingClientRect().top + window.scrollY);
    const host = bar.closest('.tabs') || bar;
    const tabs = [...host.querySelectorAll('.tab-link, [role=tab]')].filter((t) => t.offsetParent);
    const rows = tabs.map((t) => {
      const leaf = [...t.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim()) || t;
      const cs = getComputedStyle(leaf);
      const ct = getComputedStyle(t);
      const r = t.getBoundingClientRect();
      const active = t.matches('.active, [aria-selected=true]') || !!t.closest('.active');
      return `  ${active ? '*' : ' '}"${t.textContent.trim().slice(0, 18)}" x${Math.round(r.left)} y${y(t)} ${Math.round(r.width)}x${Math.round(r.height)} | ${cs.fontFamily.split(',')[0]} ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ${cs.textTransform} ${cs.color} | pad ${ct.padding} m ${ct.margin} bg ${ct.backgroundColor} bt ${ct.borderTopWidth} ${ct.borderTopColor} bb ${ct.borderBottomWidth} ${ct.borderBottomColor} bl ${ct.borderLeftWidth} br ${ct.borderRightWidth}`;
    });
    const cb = getComputedStyle(bar);
    const r = bar.getBoundingClientRect();
    const panel = [...host.querySelectorAll('.tab-content, [role=tabpanel]')].find((p) => p.offsetParent);
    return `bar x${Math.round(r.left)} y${y(bar)} ${Math.round(r.width)}x${Math.round(r.height)} bb ${cb.borderBottomWidth} ${cb.borderBottomColor} justify ${cb.justifyContent} gap ${cb.gap}\n${rows.join('\n')}\n  panel top ${panel ? y(panel) : '-'}`;
  }));
  await page.close();
}
await browser.close();
