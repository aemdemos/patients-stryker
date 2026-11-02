// Line pitch (block height / its number of lines) of the preview's text blocks against the
// same text on the live page, for many page pairs: one JSON line per block with the tag, the
// preview's section size styles, font size and pitch, and the live pitch.
// usage: node pitch.mjs <width> <live url> <preview url> [<live url> <preview url> …]
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const [width, ...urls] = process.argv.slice(2);
const browser = await chromium.launch();
const open = async (url) => {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
  await blockAltcha(page);
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3000);
  return page;
};
// lines of a block: the distinct tops of its text's client rects
const LINES = `(el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const tops = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => Math.round(r.bottom));
  const lines = [...new Set(tops)].sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 3).length || 1;
  return lines;
}`;
for (let i = 0; i < urls.length; i += 2) {
  const ours = await open(urls[i + 1]);
  const mine = await ours.evaluate(new Function(`const lines = ${LINES}; return [...document.querySelectorAll('main :is(p, h1, h2, h3, h4, h5, h6, li)')]
    .filter((e) => e.offsetParent && (e.innerText || '').trim().length > 15 && !e.closest('nav, .sticky-nav, .tabs-list, .button-wrapper, .accordion, .disclaimer'))
    .map((e) => {
      const cs = getComputedStyle(e);
      const n = lines(e);
      const section = e.closest('.section');
      const styles = section ? [...section.classList].filter((c) => /^(p|h|label|copy)-[0-9-]+$|^(serif|h-serif|large-headline)$/.test(c)).join(' ') : '';
      return { text: e.innerText.replace(/\\s+/g, ' ').trim().slice(0, 30), tag: e.tagName, styles, block: e.closest('.block') ? e.closest('.block').classList[0] : '', size: parseFloat(cs.fontSize), lh: parseFloat(cs.lineHeight), lines: n, pitch: +(e.getBoundingClientRect().height / n).toFixed(1) };
    });`));
  await ours.close();
  const src = await open(urls[i]);
  const theirs = await src.evaluate(new Function('texts', `const lines = ${LINES}; const all = [...document.querySelectorAll('body *')].filter((e) => e.offsetParent);
    return texts.map((t) => {
      const el = all.filter((e) => (e.innerText || '').replace(/\\s+/g, ' ').trim().startsWith(t)).sort((a, b) => a.getElementsByTagName('*').length - b.getElementsByTagName('*').length)[0];
      const block = el && el.closest('p, h1, h2, h3, h4, h5, h6, li');
      if (!block) return null;
      const n = lines(block);
      return { lines: n, pitch: +(block.getBoundingClientRect().height / n).toFixed(1), size: parseFloat(getComputedStyle(block).fontSize) };
    });`), mine.map((m) => m.text));
  await src.close();
  mine.forEach((m, j) => {
    const t = theirs[j];
    if (!t || t.lines !== m.lines) return;
    console.log(JSON.stringify({ page: urls[i + 1].split('/').pop(), ...m, livePitch: t.pitch, liveBlockSize: t.size }));
  });
}
await browser.close();
