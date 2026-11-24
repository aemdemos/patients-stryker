// How far is a Live copy from the real stryker.com page? For each page and width: the real page in a
// normal browser (ALTCHA and trackers blocked, cookie banner hidden, scrolled slowly, settled) vs the
// backend's copy shown the same way: page height, text, iframes, share of differing pixels.
// usage: node tools/review/backend/test/live-fidelity.mjs <std token file> <out dir> <url> …
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { chromium } from '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules/playwright/index.mjs';
import { webBase } from '../target.mjs';

const [tokFile, out, ...urls] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const token = JSON.parse(readFileSync(tokFile, 'utf8')).token;
const B = `${webBase()}/live`;
const BLOCK = (u) => /altcha|captcha/i.test(u.pathname) || /altcha|captcha|cookielaw|onetrust|googletagmanager|google-analytics|doubleclick|facebook|licdn|linkedin|qualtrics|zoominfo|adobedtm|demdex|omtrdc/.test(u.hostname);
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const facts = () => ({
  height: document.documentElement.scrollHeight,
  text: document.body.innerText,
  iframes: [...document.querySelectorAll('iframe')].filter((f) => f.getBoundingClientRect().width > 50).map((f) => (f.src || '').split('?')[0].slice(0, 70)),
  hidden: [...document.querySelectorAll('main *, body > div *')].filter((e) => {
    const s = getComputedStyle(e);
    return e.children.length === 0 && e.textContent.trim().length > 20 && (s.opacity === '0' || s.visibility === 'hidden');
  }).length,
});
const browser = await chromium.launch();
const rows = [];
try {
  for (const url of urls) {
    for (const width of [1440, 375]) {
      const name = `${new URL(url).pathname.split('/').pop().replace('.html', '')}-${width}`;
      // the real page
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, ...(width === 375 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}) });
      const page = await ctx.newPage();
      page.setDefaultTimeout(90000);
      await page.route(BLOCK, (r) => r.abort());
      await page.goto(url, { waitUntil: 'load' });
      await page.addStyleTag({ content: '#onetrust-consent-sdk, #onetrust-banner-sdk { display: none !important; }' });
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => { setTimeout(r, 250); });
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(3000);
      const real = await page.evaluate(facts);
      await page.screenshot({ path: `${out}/${name}-real.png`, fullPage: true });
      await ctx.close();
      // the copy
      const t0 = Date.now();
      const resp = await fetch(`${B}?${new URLSearchParams({ page: '/us/en/fidelity-test', vp: String(width), source: url, fresh: '1' })}`, { headers: { 'x-review-invite': token } });
      const body = await resp.json();
      const took = Date.now() - t0;
      if (!body.html) {
        rows.push({ name, error: JSON.stringify(body).slice(0, 150) });
        continue;
      }
      writeFileSync(`${out}/${name}.html`, body.html);
      const c2 = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
      const p2 = await c2.newPage();
      await p2.goto(`file://${out}/${name}.html`, { waitUntil: 'load' });
      await p2.waitForTimeout(2500);
      // (facts need a script: run it from outside, the copy itself runs none)
      await c2.close();
      const c3 = await browser.newContext({ viewport: { width, height: 900 } });
      const p3 = await c3.newPage();
      await p3.goto(`file://${out}/${name}.html`, { waitUntil: 'load' });
      await p3.waitForTimeout(2500);
      const copy = await p3.evaluate(facts);
      await p3.screenshot({ path: `${out}/${name}-copy.png`, fullPage: true });
      await c3.close();
      // pixels: both screenshots in a canvas, the share that differs (top 3000 px)
      const c4 = await browser.newContext();
      const p4 = await c4.newPage();
      const a = readFileSync(`${out}/${name}-real.png`).toString('base64');
      const b = readFileSync(`${out}/${name}-copy.png`).toString('base64');
      const diff = await p4.evaluate(async ([x, y]) => {
        const load = (d) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${d}`; });
        const [i1, i2] = await Promise.all([load(x), load(y)]);
        const w = Math.min(i1.width, i2.width);
        const h = Math.min(i1.height, i2.height, 3000);
        const px = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
        const d1 = px(i1);
        const d2 = px(i2);
        let n = 0;
        for (let k = 0; k < d1.length; k += 4) if (Math.abs(d1[k] - d2[k]) + Math.abs(d1[k + 1] - d2[k + 1]) + Math.abs(d1[k + 2] - d2[k + 2]) > 60) n += 1;
        return { pct: Math.round((n / (w * h)) * 1000) / 10, compared: h };
      }, [a, b]);
      await c4.close();
      const wa = norm(real.text).split(' ');
      const wb = new Set(norm(copy.text).split(' '));
      const missing = wa.filter((w) => !wb.has(w));
      rows.push({
        name, took, heightReal: real.height, heightCopy: copy.height, textWords: wa.length, wordsMissing: missing.length, missingSample: [...new Set(missing)].slice(0, 8).join(' '),
        iframesReal: real.iframes.length, iframesCopy: copy.iframes.length, hiddenReal: real.hidden, hiddenCopy: copy.hidden, pixelsDiffer: diff.pct,
      });
      console.log(JSON.stringify(rows[rows.length - 1]));
    }
  }
} finally {
  await browser.close();
  writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 1));
}
