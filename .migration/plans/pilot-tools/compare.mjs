// render comparison of the pilots: live www.stryker.com vs the local preview, per width
//   node compare.mjs <out.json> <list> [list …] [--widths 1440,375] [--refresh-live] [--base prev.json]
// Live measurements are cached (out/live-cache next to this script, kept across restarts that
// clear /tmp; git-ignored), as live pages do not change between runs:
// only the preview is loaded again (pass --refresh-live to re-measure live). One page at a time.
// Per page: text-style differences (leaf computed font / size / weight / colour), live texts
// missing from the preview, height ratio (incl. the source disclaimer), media counts.
import { createRequire } from 'module';
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'fs';
import { resolvePage } from './resolve.mjs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
const refresh = args.includes('--refresh-live') && args.splice(args.indexOf('--refresh-live'), 1);
const widths = (flag('--widths') || '1440,375').split(',').map(Number);
const basePath = flag('--base');
const [outFile, ...lists] = args;
const CACHE = new URL('./out/live-cache', import.meta.url).pathname;
mkdirSync(CACHE, { recursive: true });

const pages = lists.flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)).map(resolvePage);

function measure() {
  const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  const norm = (s) => s.replace(/[\s ​]+/g, ' ').trim();
  const leaf = (el) => {
    let cur = el;
    for (;;) {
      const kids = [...cur.children].filter((c) => norm(c.textContent) === norm(cur.textContent) && !/^(BR|IMG|PICTURE)$/.test(c.tagName));
      if (!kids.length) return cur;
      [cur] = kids;
    }
  };
  // the element holding the first text (the source sets sizes and fonts on spans inside the
  // paragraph: measure the run, not the paragraph)
  const firstRun = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (norm(n.textContent)) return n.parentElement;
    }
    return leaf(el);
  };
  const sig = (el) => {
    const s = getComputedStyle(firstRun(el));
    return `${s.fontFamily.split(',')[0].replace(/"/g, '').replace(' for Stryker', '')}|${s.fontSize}|${s.fontWeight}|${s.color.replace(/rgb\((\d+), (\d+), (\d+)\)/, '$1,$2,$3')}`;
  };
  const texts = {};
  main.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,th,figcaption').forEach((el) => {
    if (el.closest('header, footer, nav, form, .marketo-form, script, style')) return;
    if (!el.getBoundingClientRect().width) return;
    if ([...el.children].some((c) => /^(P|LI|H\d|UL|OL|TABLE|DIV|SECTION|ARTICLE|FIGURE|BLOCKQUOTE)$/.test(c.tagName))) return;
    const t = norm(el.textContent).slice(0, 60);
    if (t.length < 4 || texts[t]) return;
    texts[t] = { tag: el.tagName, sig: sig(el) };
  });
  const disc = document.querySelector('.c-disclaimer');
  const extra = disc && !main.contains(disc) ? disc.getBoundingClientRect().height : 0;
  const media = [...main.querySelectorAll('img, video, iframe')].filter((m) => m.getBoundingClientRect().width > 30).length;
  return {
    texts, all: norm(main.textContent), h: Math.round(main.getBoundingClientRect().height + extra), media,
  };
}

// a page that navigates while it is measured (late client-side redirect): measured again once
async function load(page, url, scroll, retry = true) {
  try {
    return await measurePage(page, url, scroll);
  } catch (e) {
    if (!retry || !/context was destroyed|navigation/i.test(e.message)) throw e;
    await page.waitForTimeout(2000);
    return load(page, url, scroll, false);
  }
}

async function measurePage(page, url, scroll) {
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(scroll ? 2500 : 2000);
  if (scroll) {
    // scroll down step by step so lazy images and blocks load
    await page.evaluate(() => new Promise((done) => {
      const step = (y) => {
        if (y >= 25) { done(); return; }
        window.scrollTo(0, y * 800);
        setTimeout(() => step(y + 1), 60);
      };
      step(0);
    }));
    await page.waitForTimeout(1000);
  }
  return page.evaluate(measure);
}

const browser = await chromium.launch();
const res = {};
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    for (const p of pages) {
      const key = `${width} ${p.eds.slice(7)}`;
      const cacheFile = `${CACHE}/${width}-${p.eds.replace(/\//g, '_')}.json`;
      let live;
      if (!refresh && existsSync(cacheFile)) live = JSON.parse(readFileSync(cacheFile, 'utf8'));
      else {
        const page = await context.newPage();
        try {
          live = await load(page, `https://www.stryker.com${p.aem}.html`, false);
          writeFileSync(cacheFile, JSON.stringify(live));
        } finally { await page.close(); }
      }
      const page = await context.newPage();
      let ours;
      try {
        ours = await load(page, `http://localhost:3000/content/drafts/reimport${p.eds}`, true);
      } finally { await page.close(); }
      const missing = Object.keys(live.texts).filter((t) => !ours.all.includes(t.slice(0, 40)));
      const diffs = Object.entries(live.texts).filter(([t, v]) => ours.texts[t] && ours.texts[t].sig !== v.sig)
        .map(([t, v]) => `${v.tag} ${v.sig} => ${ours.texts[t].tag} ${ours.texts[t].sig} «${t.slice(0, 28)}»`);
      res[key] = {
        ratio: Math.round((ours.h / live.h) * 100) / 100, media: `${live.media}/${ours.media}`, missing, diffs,
      };
      process.stdout.write('.');
    }
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(outFile, JSON.stringify(res, null, 1));
process.stdout.write('\n');

// summary (against a previous result when given)
const base = basePath && existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : {};
const dist = {};
Object.entries(res).forEach(([k, r]) => {
  const w = k.split(' ')[0];
  const b = base[k];
  dist[w] = dist[w] || { now: 0, before: 0, diffs: 0, missing: 0 };
  dist[w].now += Math.abs(1 - r.ratio);
  dist[w].diffs += r.diffs.length;
  dist[w].missing += r.missing.length;
  if (b) dist[w].before += Math.abs(1 - b.ratio);
  const move = b ? ` (was ${b.ratio}, diffs ${b.diffs.length})` : '';
  process.stdout.write(`${k.slice(0, 70).padEnd(70)} ratio ${r.ratio}${move} diffs ${r.diffs.length} missing ${r.missing.length}\n`);
});
Object.entries(dist).forEach(([w, d]) => process.stdout.write(`${w}: height distance ${d.now.toFixed(2)}${basePath ? ` (was ${d.before.toFixed(2)})` : ''}, style diffs ${d.diffs}, missing ${d.missing}\n`));
