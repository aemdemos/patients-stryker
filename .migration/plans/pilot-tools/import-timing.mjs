// Where the time of one import goes: page load (networkidle), injecting the helix importer and
// the bundle, the bundle's onLoad, the transform (html2md + md2da)
// usage: node import-timing.mjs <bundle> <url> [url …]
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { blockAltcha } from './stryker-block.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const require = createRequire(`${S}/package.json`);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const block = args[0] === '--block' ? args.shift() : null;
const [bundle, ...urls] = args;
// third parties the content does not need: analytics, tag manager, consent, Marketo tracking,
// video streams, social embeds
const BLOCKED = /adobedtm|cookielaw|onetrust|demdex|omtrdc|munchkin|mktoresp|telemetry\.stryker|s7mbrstream|google-analytics|googletagmanager|doubleclick|facebook|linkedin|hotjar|youtube|ytimg|vimeo|bing|qualtrics|clarity/;
const helix = readFileSync(`${S}/static/inject/helix-importer.js`, 'utf-8');
const script = readFileSync(bundle, 'utf-8');
const t = () => Date.now();
const t0 = t();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await blockAltcha(context);
console.log(`launch ${t() - t0}ms`);
for (const url of urls) {
  const page = await context.newPage();
  const hosts = {};
  page.on('request', (r) => { const h = new URL(r.url()).host; hosts[h] = (hosts[h] || 0) + 1; });
  if (block) await page.route('**/*', (route) => (BLOCKED.test(new URL(route.request().url()).host) ? route.abort() : route.continue()));
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 200)));
  if (process.env.INIT) {
    await page.addInitScript({ content: helix });
    await page.addInitScript({ content: `${script}\n;window.CustomImportScript = CustomImportScript;` });
  }
  const times = {};
  let at = t();
  const lap = (name) => { times[name] = t() - at; at = t(); };
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  lap('load');
  await page.evaluate(() => 1);
  lap('ping');
  if (process.env.FREEZE) {
    await page.evaluate(() => {
      // stop the page's own loops (carousels, players, trackers): timers, animation frames, media
      const last = setTimeout(() => {}, 0);
      for (let id = 0; id <= last; id += 1) { clearTimeout(id); clearInterval(id); }
      window.setTimeout = () => 0;
      window.setInterval = () => 0;
      window.requestAnimationFrame = () => 0;
      document.querySelectorAll('video, audio').forEach((m) => m.pause());
    });
    lap('freeze');
    await page.evaluate(() => 1);
    lap('ping2');
  }
  if (!process.env.INIT) times.helixInPage = await page.evaluate((s) => {
    const p0 = performance.now();
    const el = document.createElement('script');
    el.textContent = s;
    document.head.append(el);
    return Math.round(performance.now() - p0);
  }, helix);
  lap('helix');
  if (!process.env.INIT) await page.evaluate((s) => {
    const el = document.createElement('script');
    el.textContent = s;
    document.head.append(el);
  }, script);
  await page.waitForFunction(() => window.CustomImportScript?.default, { timeout: 10000 });
  lap('inject');
  await page.evaluate(async () => {
    const c = window.CustomImportScript.default;
    if (c.onLoad) await c.onLoad({ document });
  });
  lap('onLoad');
  await page.evaluate(async (u) => {
    const c = window.CustomImportScript.default;
    const r = await window.WebImporter.html2md(u, document, c, { toDocx: false, toMd: true, originalURL: u });
    window.WebImporter.md2da(r.md);
  }, url);
  lap('transform');
  console.log(url.slice(25, 100), JSON.stringify(times));
  console.log('   ', Object.entries(hosts).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}`).join(', '));
  await page.close();
}
await browser.close();
