#!/usr/bin/env node
/*
 * Saved copies of the original stryker.com pages at one width, for measuring the original's looks
 * offline (the source → standard direction, 2026-11-19). Each page is loaded live once (trackers,
 * ALTCHA and the captcha blocked), scrolled through so content built on view is there, and its
 * rendered DOM saved with the stylesheets it uses, as the fast import does
 * (.migration/plans/pilot-tools/fast-import.mjs) but at the given width: layouts the page's
 * scripts compute (slick carousels) are frozen at the width a copy is saved at, so each measured
 * width has its own copy. Resumable: pages already saved are skipped.
 * usage: node tools/importer/standardise/looks/save-source.mjs --urls <file> --width 1440
 *   [--out /tmp/run-outputs/source-pages] [--concurrency 2] [--refresh]
 * Output: <out>/<width>/pages/<sha1(url)>.html (+ .json: status, final url, time),
 *   <out>/assets/<sha1(stylesheet url)> (+ .json: status, content type), shared by the widths.
 */
import { createRequire } from 'module';
import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const urlsFile = opt('--urls');
const width = Number(opt('--width', 1440));
const out = opt('--out', '/tmp/run-outputs/source-pages');
const concurrency = Number(opt('--concurrency', 2));
const refresh = args.includes('--refresh');
if (!urlsFile) {
  console.error('usage: save-source.mjs --urls <file> --width <px> [--out <dir>] [--concurrency n]');
  process.exit(2);
}
const urls = readFileSync(urlsFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const hash = (s) => createHash('sha1').update(s).digest('hex');
const pageFile = (url) => join(out, String(width), 'pages', `${hash(url.split('#')[0])}.html`);
const assetFile = (url) => join(out, 'assets', hash(url));
const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
};
// trackers by their servers; ALTCHA and the captcha by their paths (never loaded on stryker.com)
const TRACKERS = /cookielaw|onetrust|demdex|omtrdc|munchkin|mktoresp|telemetry\.stryker|google-analytics|googletagmanager|doubleclick|facebook|linkedin|hotjar|bing\.com|qualtrics|clarity\.ms|rum\.hlx/i;
const blocked = (u) => {
  if (/altcha|captcha/i.test(u)) return true;
  try {
    return TRACKERS.test(new URL(u).hostname);
  } catch (e) {
    return false;
  }
};

/** a stylesheet: from the saved copies, or fetched live and saved */
async function stylesheet(route) {
  const url = route.request().url();
  const file = assetFile(url);
  if (existsSync(file)) {
    const meta = JSON.parse(readFileSync(`${file}.json`, 'utf8'));
    return route.fulfill({
      status: meta.status, contentType: meta.contentType, body: readFileSync(file),
    });
  }
  try {
    const response = await route.fetch();
    const body = await response.body();
    write(file, body);
    write(`${file}.json`, JSON.stringify({ status: response.status(), contentType: response.headers()['content-type'] || 'text/css' }));
    return route.fulfill({ response, body });
  } catch (e) {
    return route.abort();
  }
}

/** live page → its rendered DOM, saved */
async function save(context, url) {
  const page = await context.newPage();
  try {
    await page.route('**/*', (route) => {
      const req = route.request();
      if (blocked(req.url())) return route.abort();
      if (req.resourceType() === 'stylesheet') return stylesheet(route);
      return route.continue();
    });
    const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(async () => {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3000);
      return r;
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    // content built when it scrolls into view: the whole page, once
    await page.evaluate(() => new Promise((resolve) => {
      const step = (y) => {
        if (y >= document.body.scrollHeight) {
          window.scrollTo(0, 0);
          resolve();
          return;
        }
        window.scrollTo(0, y);
        setTimeout(() => step(y + window.innerHeight), 150);
      };
      step(0);
    }));
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const html = await page.evaluate(() => {
      const dt = document.doctype ? `<!DOCTYPE ${document.doctype.name}>` : '';
      // (as fast-import.mjs: CSSOM-inserted rules into their style elements; no scripts' head
      // elements, no noscript)
      const sheets = [...document.querySelectorAll('style')].map((el) => {
        try {
          return [...el.sheet.cssRules].map((rule) => rule.cssText).join('\n');
        } catch (e) {
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
      url,
      width,
      status: response ? response.status() : null,
      finalUrl: page.url(),
      saved: new Date().toISOString(),
    }));
    return true;
  } finally {
    await page.close().catch(() => {});
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width, height: width < 600 ? 800 : 1000 }, deviceScaleFactor: 1, locale: 'en-US', ignoreHTTPSErrors: true,
});
const todo = urls.filter((u) => refresh || !existsSync(pageFile(u)));
let next = 0;
let done = urls.length - todo.length;
const failed = [];
const t0 = Date.now();
const worker = async () => {
  if (next >= todo.length) return;
  const url = todo[next];
  next += 1;
  await save(context, url).catch((e) => failed.push(`${url} ${e.message.slice(0, 80)}`));
  done += 1;
  if (done % 20 === 0) {
    const rate = (Date.now() - t0) / Math.max(1, done - (urls.length - todo.length));
    console.log(`${new Date().toISOString().slice(11, 19)} ${width}px ${done}/${urls.length} · ~${Math.round(((urls.length - done) * rate) / 60000)} min left`);
  }
  await worker();
};
await Promise.all(Array.from({ length: concurrency }, worker));
await browser.close();
console.log(`${width}px: ${done}/${urls.length} saved, ${failed.length} failed${failed.length ? `\n  ${failed.join('\n  ')}` : ''}`);
