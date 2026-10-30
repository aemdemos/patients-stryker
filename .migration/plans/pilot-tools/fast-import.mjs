// Fast import runner for the corp importers, with a local page cache. Same output as the
// excat run-bulk-import.js (<out>/content/<path>.plain.html, <out>/tools/importer/reports/
// <path>.report.json), measured 4-5x faster on stryker.com:
// - record (first time a URL is seen, or --refresh): the live page is loaded once, without the
//   third-party trackers, and its rendered DOM (after the page's own scripts ran) is saved to
//   the cache with the stylesheets it uses
// - import: always from the cached snapshot, scripts off, stylesheets from the cache (computed
//   styles as live: markLivePage), images / fonts / frames not loaded. The importer runs in
//   pristine globals: on a live product page the page's scripts made the helix importer take
//   ~5s to evaluate and the bundle another ~5s
// - one browser for the whole run, N pages in parallel, no anti-bot delays / scrolling
// Re-imports with importer fixes then read the same input every time, offline.
//
// usage: node fast-import.mjs --import-script <bundle.js> --urls <file> --out <dir>
//          [--cache <dir>] [--refresh] [--concurrency 2]
// cache default: out/page-cache next to this script (git-ignored)
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'fs';
import { createHash } from 'crypto';
import { dirname, join, resolve } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { ALTCHA } from './stryker-block.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const require = createRequire(`${S}/package.json`);
const { chromium } = require('playwright');
const { processPlainHtml } = await import(`${S}/import-processors/index.js`);

const HERE = dirname(fileURLToPath(import.meta.url));
const VIEWPORT = { width: 1920, height: 1080 }; // as run-bulk-import.js
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
// third parties the content does not need: analytics, consent, Marketo tracking, social pixels.
// Video players (Scene7, YouTube) and Marketo forms still load: they build content the
// importer reads (a Scene7 video's poster image). Adobe Launch (adobedtm) loads too: it loads
// the YouTube iframe API, which gives each YouTube iframe its video title (the link text)
const TRACKERS = /cookielaw|onetrust|demdex|omtrdc|munchkin|mktoresp|telemetry\.stryker|google-analytics|googletagmanager|doubleclick|facebook|linkedin|hotjar|bing\.com|qualtrics|clarity\.ms|rum\.hlx/;
// stryker.com rule (stryker-block.mjs): never load ALTCHA; the <altcha-widget> element
// (challengeurl, read by markLivePage) is in the markup either way
const blocked = (url) => TRACKERS.test(new URL(url).host) || ALTCHA.test(new URL(url).pathname);

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const importScript = resolve(opt('--import-script'));
const urlsFile = resolve(opt('--urls'));
const out = resolve(opt('--out'));
const cache = resolve(opt('--cache', join(HERE, 'out/page-cache')));
const refresh = args.includes('--refresh');
const concurrency = Number(opt('--concurrency', 2));

const helix = readFileSync(`${S}/static/inject/helix-importer.js`, 'utf-8');
const bundle = readFileSync(importScript, 'utf-8');
const urls = readFileSync(urlsFile, 'utf-8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const hash = (s) => createHash('sha1').update(s).digest('hex');
const pageFile = (url) => join(cache, 'pages', `${hash(url)}.html`);
const assetFile = (url) => join(cache, 'assets', hash(url));
const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
};

/** as run-bulk-import.js sanitizeDocumentPath */
function documentPath(docPath, url) {
  let p = (docPath && typeof docPath === 'string' ? docPath : new URL(url).pathname || '/').replace(/\\/g, '/');
  if (p.startsWith('/')) p = p.slice(1);
  if (p.endsWith('/')) p = p.slice(0, -1);
  return p || 'index';
}

/** A stylesheet from the cache, or fetched (live) and cached. */
async function stylesheet(route) {
  const url = route.request().url();
  const file = assetFile(url);
  if (existsSync(file) && existsSync(`${file}.json`)) {
    const meta = JSON.parse(readFileSync(`${file}.json`, 'utf-8'));
    return route.fulfill({ status: meta.status, contentType: meta.contentType, body: readFileSync(file) });
  }
  try {
    const response = await route.fetch();
    const body = await response.body();
    write(file, body);
    write(`${file}.json`, JSON.stringify({ url, status: response.status(), contentType: response.headers()['content-type'] || 'text/css' }));
    return route.fulfill({ response, body });
  } catch {
    return route.abort();
  }
}

/** Live page → rendered DOM snapshot in the cache. */
async function record(context, url) {
  const page = await context.newPage();
  try {
    await page.route('**/*', (route) => {
      const req = route.request();
      if (blocked(req.url())) return route.abort();
      if (req.resourceType() === 'stylesheet') return stylesheet(route);
      return route.continue();
    });
    // as run-bulk-import.js: a page whose load event never comes is taken once its DOM is ready
    const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(async () => {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3000);
      return r;
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    // content built when it scrolls into view (Scene7 video posters): the whole page, once
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => { setTimeout(r, 150); });
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const html = await page.evaluate(() => {
      const dt = document.doctype ? `<!DOCTYPE ${document.doctype.name}>` : '';
      // the snapshot is parsed again with scripts off: elements scripts put in the head (an
      // iframe) would end the head there, and the meta tags after them would land in the body;
      // noscript content (tracking pixels) would be parsed as elements instead of text
      // style rules scripts added through the CSSOM (insertRule: the Scene7 viewers) are not
      // in the markup: each style element gets its sheet's rules as text
      const sheets = [...document.querySelectorAll('style')].map((el) => {
        try {
          return [...el.sheet.cssRules].map((rule) => rule.cssText).join('\n');
        } catch {
          return null;
        }
      });
      const root = document.documentElement.cloneNode(true);
      root.querySelectorAll('style').forEach((el, i) => {
        if (sheets[i] !== null && sheets[i] !== undefined) el.textContent = sheets[i];
      });
      [...root.querySelector('head').children]
        .filter((el) => !/^(META|LINK|TITLE|STYLE|SCRIPT|BASE|TEMPLATE)$/.test(el.tagName))
        .forEach((el) => el.remove());
      root.querySelectorAll('noscript').forEach((el) => el.remove());
      return `${dt}\n${root.outerHTML}`;
    });
    write(pageFile(url), html);
    write(`${pageFile(url)}.json`, JSON.stringify({
      url, status: response ? response.status() : null, finalUrl: page.url(), recorded: new Date().toISOString(),
    }));
  } finally {
    await page.close().catch(() => {});
  }
}

/** Import from the snapshot (scripts off): the importer's onLoad, transform, md → DA html. */
async function importPage(context, url) {
  const page = await context.newPage();
  try {
    const html = readFileSync(pageFile(url), 'utf-8');
    await page.route('**/*', (route) => {
      const req = route.request();
      if (req.isNavigationRequest() && req.frame() === page.mainFrame()) {
        return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
      }
      if (req.resourceType() === 'stylesheet') return stylesheet(route);
      return route.abort();
    });
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate((src) => { (0, eval)(src); }, helix);
    await page.evaluate((src) => { (0, eval)(`${src}\n;window.CustomImportScript = CustomImportScript;`); }, bundle);
    const result = await page.evaluate(async (pageUrl) => {
      const config = window.CustomImportScript.default;
      if (typeof config.onLoad === 'function') await config.onLoad({ document });
      const r = await window.WebImporter.html2md(pageUrl, document, config, { toDocx: false, toMd: true, originalURL: pageUrl });
      return { path: r.path, report: r.report, html: window.WebImporter.md2da(r.md) };
    }, url);
    if (!result.path || !result.html) throw new Error('transform returned no path / html');
    const docPath = documentPath(result.path, url);
    write(join(out, 'content', `${docPath}.plain.html`), processPlainHtml(result.html));
    write(join(out, 'tools/importer/reports', `${docPath}.report.json`), JSON.stringify({
      status: 'success', url, path: docPath, timestamp: new Date().toISOString(), ...(result.report || {}),
    }, null, 2));
    return docPath;
  } finally {
    await page.close().catch(() => {});
  }
}

const t0 = Date.now();
const browser = await chromium.launch({ headless: true });
const live = await browser.newContext({
  viewport: VIEWPORT, userAgent: USER_AGENT, locale: 'en-US', ignoreHTTPSErrors: true,
});
const offline = await browser.newContext({
  viewport: VIEWPORT, userAgent: USER_AGENT, locale: 'en-US', javaScriptEnabled: false, bypassCSP: true,
});
let next = 0;
let ok = 0;
let recorded = 0;
const failed = [];
async function worker() {
  while (next < urls.length) {
    const i = next;
    next += 1;
    const url = urls[i];
    try {
      if (refresh || !existsSync(pageFile(url))) {
        await record(live, url);
        recorded += 1;
      }
      const docPath = await importPage(offline, url);
      ok += 1;
      console.log(`[${i + 1}/${urls.length}] ✅ ${docPath}`);
    } catch (e) {
      failed.push(url);
      console.log(`[${i + 1}/${urls.length}] ❌ ${url}: ${e.message.split('\n')[0]}`);
      write(join(out, 'tools/importer/reports', `${documentPath(null, url)}.report.json`), JSON.stringify({
        status: 'failed', url, timestamp: new Date().toISOString(), error: e.message,
      }, null, 2));
    }
  }
}
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
await browser.close();
console.log(`[Fast Import] Completed. Success: ${ok}/${urls.length}, recorded: ${recorded}, Failures: ${failed.length}, ${Math.round((Date.now() - t0) / 1000)}s`);
process.exitCode = failed.length ? 1 : 0;
