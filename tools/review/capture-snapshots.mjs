#!/usr/bin/env node
/*
 * Review tool: snapshots of the source pages (www.stryker.com) for the review's source layer.
 * Per page and width (1440, 375): the full page as JPEG tiles (TILE px high) and the text runs and
 * images with their position (the anchors of sync.js, key + y), in <out>/<eds path>/<width>/.
 * One page at a time; pages already captured are skipped (resumable). ALTCHA, the cookie banner
 * and trackers are blocked.
 *
 * usage: node tools/review/capture-snapshots.mjs --map <eds path → source URL json> --out <dir>
 *          [--pages <eds path,…>] [--widths 1440,375] [--limit N]
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const map = JSON.parse(readFileSync(opt('--map'), 'utf8'));
const out = opt('--out');
const widths = (opt('--widths') || '1440,375').split(',').map(Number);
const limit = Number(opt('--limit') || 0);
let pages = opt('--pages') ? opt('--pages').split(',') : Object.keys(map);
if (limit) pages = pages.slice(0, limit);

const TILE = 4000;
const QUALITY = 60;
const BLOCK = /altcha|captcha|cookielaw|onetrust|googletagmanager|google-analytics|doubleclick|facebook|licdn|linkedin|qualtrics|zoominfo|zi-scripts|stackadapt|demdex|omtrdc|serving-sys|tribalfusion|quantserve|mathtag|intentsify|dpmsrv|usbrowserspeed|contextweb|smtrk|domdex|quantcount/;

// the anchors: the same rules as tools/review/sync.js leaves(), on the whole page
function anchors() {
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, li, td, th, dt, dd, figcaption, blockquote';
  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const root = document.querySelector('main') || document.body;
  const outList = [];
  root.querySelectorAll(TEXT).forEach((el) => {
    if (el.querySelector(TEXT)) return;
    const text = norm(el.textContent);
    if (text.length < 12) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    outList.push({ key: `t:${text.slice(0, 90)}`, y: Math.round(r.top + window.scrollY) });
  });
  root.querySelectorAll('img').forEach((img) => {
    const file = (img.currentSrc || img.src || '').split('?')[0].split('/').pop();
    const r = img.getBoundingClientRect();
    if (!file || !r.width || !r.height) return;
    outList.push({ key: `i:${file}`, y: Math.round(r.top + window.scrollY) });
  });
  return outList;
}

const browser = await chromium.launch();
let done = 0;
let skipped = 0;
const failed = [];
const started = Date.now();
for (const path of pages) {
  for (const width of widths) {
    const dir = join(out, path, String(width));
    if (existsSync(join(dir, 'meta.json'))) {
      skipped += 1;
      continue;
    }
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.setDefaultTimeout(60000);
    await page.route(BLOCK, (r) => r.abort());
    try {
      const resp = await page.goto(map[path], { waitUntil: 'load', timeout: 90000 });
      if (!resp || resp.status() >= 400) throw new Error(`status ${resp ? resp.status() : 'none'}`);
      await page.addStyleTag({ content: '#onetrust-consent-sdk, #onetrust-banner-sdk { display: none !important; }' });
      // through the page, so lazy images and count-ups finish, then back to the top
      await page.evaluate(async () => {
        const step = Math.round(window.innerHeight * 0.8);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => { setTimeout(r, 150); });
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(2500);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const leaves = await page.evaluate(anchors);
      mkdirSync(dir, { recursive: true });
      const tiles = [];
      for (let y = 0, i = 0; y < height; y += TILE, i += 1) {
        const h = Math.min(TILE, height - y);
        const file = `${i}.jpg`;
        await page.screenshot({
          path: join(dir, file), type: 'jpeg', quality: QUALITY, fullPage: true, clip: { x: 0, y, width, height: h },
        });
        tiles.push({ y, h, file });
      }
      writeFileSync(join(dir, 'meta.json'), JSON.stringify({
        url: map[path], width, height, tiles, leaves, captured: new Date().toISOString(),
      }));
      done += 1;
    } catch (e) {
      failed.push(`${path} ${width}: ${e.message.slice(0, 100)}`);
    }
    await ctx.close();
    if ((done + failed.length) % 10 === 0) {
      const s = Math.round((Date.now() - started) / 1000);
      console.log(`${done} captured, ${failed.length} failed, ${skipped} already there, ${s}s`);
    }
  }
}
await browser.close();
console.log(`done: ${done} captured, ${failed.length} failed, ${skipped} already there, ${Math.round((Date.now() - started) / 1000)}s`);
if (failed.length) console.log(failed.join('\n'));
