// Where a preview page loses (or gains) height against its live source: the preview's headings
// and first lines of paragraphs, in page order, with their top on both pages, the running
// difference and how much of it each step adds. usage: node drift.mjs <live> <preview> [width]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [live, preview, width = '1200'] = process.argv.slice(2);
const browser = await chromium.launch();
const open = async (url) => {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
  await blockAltcha(page);
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3000);
  return page;
};
const ours = await open(preview);
const anchors = await ours.evaluate(() => [...document.querySelectorAll('main :is(h1, h2, h3, h4, p, li)')]
  .filter((e) => e.offsetParent && (e.innerText || '').trim().length > 12 && !e.closest('.sticky-nav, nav'))
  .map((e) => ({ text: e.innerText.replace(/\s+/g, ' ').trim().slice(0, 28), tag: e.tagName, top: Math.round(e.getBoundingClientRect().top + window.scrollY), section: (e.closest('.section') || {}).className || '' })));
const src = await open(live);
const tops = await src.evaluate((texts) => {
  const all = [...document.querySelectorAll('body *')].filter((e) => e.offsetParent);
  return texts.map((t) => {
    const el = all.filter((e) => (e.innerText || '').replace(/\s+/g, ' ').trim().startsWith(t))
      .sort((a, b) => a.getElementsByTagName('*').length - b.getElementsByTagName('*').length)[0];
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
  });
}, anchors.map((a) => a.text));
let prev = 0;
const seen = new Set();
const sums = { lost: 0, gained: 0, big: 0 };
anchors.forEach((a, i) => {
  if (tops[i] === null || seen.has(a.text)) return;
  seen.add(a.text);
  const delta = a.top - tops[i];
  const step = delta - prev;
  prev = delta;
  const mark = Math.abs(step) >= 15 ? ' <<' : '';
  // steps over 300px are a missing / extra part (a form that does not render locally), not spacing
  if (Math.abs(step) > 300) sums.big += 1;
  else if (step < 0) sums.lost += -step;
  else sums.gained += step;
  console.log(`${String(tops[i]).padStart(6)} ${String(a.top).padStart(6)} Δ${String(delta).padStart(6)} step ${String(step).padStart(5)}${mark}  ${a.tag} "${a.text}" [${a.section.replace(/\bsection\b/, '').trim().slice(0, 40)}]`);
});
console.log(`SUMMARY lost ${sums.lost}px, gained ${sums.gained}px, net ${sums.gained - sums.lost}px (steps over 300px left out: ${sums.big})`);
await browser.close();
