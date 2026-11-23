/*
 * Review tool: taking a source shot (a snapshot of a www.stryker.com page at one width) and
 * turning shots into a version of the page's shot history (backend/lib/shots.mjs). Shared by
 * capture-snapshots.mjs (the first shots) and refresh-shots.mjs (new shots on request), so every
 * shot is taken the same way.
 *
 * A shot: the full page as JPEG tiles (TILE px high) and the text runs and images with their
 * position (the anchors of sync.js, key + y), in <dir>/: <n>.jpg and meta.json { url, width,
 * height, tiles: [{ y, h, file, sha256 }], leaves, captured, status, finalUrl }. ALTCHA, the
 * cookie banner and trackers are blocked.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { createHash } from 'crypto';
import { createRequire } from 'module';
import { join } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
export const { chromium } = createRequire(`${S}/package.json`)('playwright');

export const TILE = 4000;
export const QUALITY = 60;
// blocked: ALTCHA / captcha by their path (on any host), the cookie banner and trackers by their
// host. Hosts only, not whole URLs: a page whose own path names a tracker (2018 news "stryker-
// featured-in-linkedins-top-companies…") must still load
const BLOCK_PATH = /altcha|captcha/i;
const BLOCK_HOST = /altcha|captcha|cookielaw|onetrust|googletagmanager|google-analytics|doubleclick|facebook|licdn|linkedin|qualtrics|zoominfo|zi-scripts|stackadapt|demdex|omtrdc|serving-sys|tribalfusion|quantserve|mathtag|intentsify|dpmsrv|usbrowserspeed|contextweb|smtrk|domdex|quantcount/;
const BLOCK = (url) => BLOCK_PATH.test(url.pathname) || BLOCK_HOST.test(url.hostname);

export const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

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

/** one shot of url at width into dir (one page, closed after); → its meta (also dir/meta.json) */
export async function shoot(browser, url, width, dir) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  try {
    const page = await ctx.newPage();
    page.setDefaultTimeout(60000);
    await page.route(BLOCK, (r) => r.abort());
    const captured = new Date().toISOString();
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
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
      tiles.push({
        y, h, file, sha256: sha256(join(dir, file)),
      });
    }
    const meta = {
      url, width, height, tiles, leaves, captured, status: resp.status(), finalUrl: page.url(),
    };
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta));
    return meta;
  } finally {
    await ctx.close();
  }
}

/** the UTC time as a shot id: s-YYYYMMDD-HHMMSS */
export const shotId = (iso) => `s-${iso.slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;

/**
 * a version of the shot history from the shots of one capture (width → meta.json, read again
 * from disk, hashes computed again from the tiles there)
 */
export function versionOf(dirsByWidth, {
  id, dir, by, request,
}) {
  const widths = {};
  Object.entries(dirsByWidth).forEach(([w, d]) => {
    const meta = JSON.parse(readFileSync(join(d, 'meta.json'), 'utf8'));
    widths[w] = {
      captured: meta.captured,
      width: meta.width,
      height: meta.height,
      ...(meta.status ? { status: meta.status, finalUrl: meta.finalUrl } : {}),
      tiles: meta.tiles.map((t) => ({ ...t, sha256: sha256(join(d, t.file)) })),
      leaves: meta.leaves,
    };
  });
  const captured = Object.values(widths).map((s) => s.captured).sort()[0];
  const url = JSON.parse(readFileSync(join(Object.values(dirsByWidth)[0], 'meta.json'), 'utf8')).url;
  return {
    id: id || shotId(captured), dir: dir ?? '', url, captured, by, ...(request ? { request } : {}), widths,
  };
}

/** the review backend's private admin action (the workspace credential is added by the environment) */
export async function admin(p, namespace = '892544-strykerstdreview-stage') {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${namespace}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  const { body } = JSON.parse(text);
  if (body?.error) throw new Error(`admin ${p.op}: ${body.error.message}`);
  return body;
}
