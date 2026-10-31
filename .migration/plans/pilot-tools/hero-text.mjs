// Hero text on a live stryker.com page and its local preview, side by side: for each line of
// the preview's first Hero Corp text box, the element holding it on both (the deepest one with
// that text): top, height, font size, line height and margins, and where the sticky header ends.
// usage: node hero-text.mjs <live url> <preview url> [widths, default 375,600,768,900,1440]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [live, preview, list] = process.argv.slice(2);
const widths = (list || '375,600,768,900,1440').split(',').map(Number);

const measure = (texts) => {
  const out = {};
  const all = [...document.querySelectorAll('body *')];
  texts.forEach((t) => {
    const el = all.filter((e) => e.offsetParent !== null && (e.innerText || '').replace(/\s+/g, ' ').trim().startsWith(t))
      .sort((a, b) => a.getElementsByTagName('*').length - b.getElementsByTagName('*').length)[0];
    if (!el) return;
    const block = el.closest('p, h1, h2, h3, h4, h5, h6, li') || el;
    const r = block.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const bs = getComputedStyle(block);
    out[t] = `${block.tagName} top ${Math.round(r.top + window.scrollY)} h ${Math.round(r.height)} x ${Math.round(r.left)} | font ${cs.fontSize} lh ${cs.lineHeight} | block lh ${bs.lineHeight} mt ${bs.marginTop} mb ${bs.marginBottom}`;
  });
  const header = document.querySelector('header .main-nav, header nav, header, .g-header');
  const navs = [...document.querySelectorAll('header, .nav-wrapper, .header-corp, .main-nav')]
    .map((e) => e.getBoundingClientRect().bottom).filter((b) => b > 0);
  out.header = `header bottom ${Math.round(Math.max(0, ...navs))} (${header ? header.tagName : '-'})`;
  return out;
};

const browser = await chromium.launch();
const prev = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await prev.goto(preview, { waitUntil: 'load', timeout: 45000 });
await prev.waitForTimeout(2000);
const texts = await prev.evaluate(() => {
  const box = document.querySelector('.hero-corp > div:last-child');
  return box ? [...box.querySelectorAll('h1, h2, h3, h4, p')].map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 25)).filter(Boolean) : [];
});
await prev.close();
console.log('lines:', texts);
for (const width of widths) {
  for (const [name, url] of [['live', live], ['ours', preview]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    if (name === 'live') await blockAltcha(page);
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2500);
    const out = await page.evaluate(measure, texts);
    console.log(`== ${width} ${name}`);
    Object.entries(out).forEach(([k, v]) => console.log(`   ${k.slice(0, 22).padEnd(22)} ${v}`));
    await page.close();
  }
}
await browser.close();
