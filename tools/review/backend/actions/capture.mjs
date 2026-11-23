/*
 * Action `capture` (private): the source shots taken by the backend, in a browser inside the
 * action (Chromium 133 for Amazon Linux 2 with Debian 10's NSS / NSPR shipped with it: the
 * Runtime container is Debian 10, see deploy.mjs). Run every 15 minutes (admin schedule) and
 * at once after a Refresh request (action shots). One run at a time (a lock), at most RUN_MS.
 * params.op:
 *   run (default)  for the space (main): the open Refresh requests, then every published page of
 *                  the migration scope without a shot (its first shot); a source that answers
 *                  something else than 200, or redirects to another page, is a source to
 *                  correct (tried again when its row changes, or after a day)
 *   test { page, source }   one shot of a test page (/test/… only), for the tests
 *   health                  loads one known page (nothing kept): the browser still works
 * Every shot: every width (1440, 860, 375), JPEG tiles of 4000 px (SHA-256 each) in Files, the
 * text / image anchors, the status, final URL and title, into the page's shot history
 * (lib/shots.mjs: never replaced, never removed).
 */
import crypto from 'crypto';
import { join } from 'path';
import { rmSync } from 'fs';
import { open, SPACES } from '../lib/core.mjs';
import { pageList } from '../lib/scope.mjs';
import {
  readHistory, addVersions, listRequests, failRequest,
} from '../lib/shots.mjs';
import {
  readCaptureState, writeCaptureState, pagesWithShots, tileFile, lockFile,
} from '../lib/capture-state.mjs';

const WIDTHS = [1440, 860, 375];
const TILE = 4000;
const QUALITY = 60;
const RUN_MS = 210000;
const RETRY_MS = 86400000;
const PACK = 'https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar';
const HEALTH_URL = 'https://www.stryker.com/us/en/search.html';
// blocked as in every capture: ALTCHA / captcha by path, the cookie banner and trackers by host
const BLOCK_PATH = /altcha|captcha/i;
const BLOCK_HOST = /altcha|captcha|cookielaw|onetrust|googletagmanager|google-analytics|doubleclick|facebook|licdn|linkedin|qualtrics|zoominfo|zi-scripts|stackadapt|demdex|omtrdc|serving-sys|tribalfusion|quantserve|mathtag|intentsify|dpmsrv|usbrowserspeed|contextweb|smtrk|domdex|quantcount/;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const shotId = (iso) => `s-${iso.slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;
const sameUrl = (a, b) => {
  const u = (x) => {
    const p = new URL(x);
    return `${p.host}${p.pathname}`;
  };
  return u(a) === u(b);
};

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

async function launch() {
  // (the pack's Amazon Linux 2 libraries: unpacked only "on Lambda with Node 18"; a warm
  // container may keep another version's browser in /tmp)
  process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x';
  rmSync('/tmp/chromium', { force: true });
  const chromium = (await import('@sparticuz/chromium-min')).default;
  const puppeteer = (await import('puppeteer-core')).default;
  const exe = await chromium.executablePath(PACK);
  // Debian 10's NSS / NSPR (shipped with the action), before Amazon Linux 2's
  process.env.LD_LIBRARY_PATH = `${join(__dirname, 'libs')}:${process.env.LD_LIBRARY_PATH || ''}`;
  return puppeteer.launch({
    args: chromium.args.filter((a) => !['--single-process', '--no-zygote'].includes(a)).concat(['--disable-dev-shm-usage']),
    executablePath: exe,
    headless: 'shell',
    defaultViewport: { width: 1440, height: 900 },
  });
}

/** one width of a source page → { meta, tiles: [Buffer] }; throws with a reason for the AOE team */
async function shootWidth(browser, url, width) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.setUserAgent(UA);
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      let u;
      try {
        u = new URL(r.url());
      } catch (e) {
        r.continue();
        return;
      }
      if (BLOCK_PATH.test(u.pathname) || BLOCK_HOST.test(u.hostname)) r.abort();
      else r.continue();
    });
    const captured = new Date().toISOString();
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    const status = resp ? resp.status() : 0;
    if (status !== 200) throw Object.assign(new Error(`the source answers ${status || 'nothing'}`), { source: true });
    if (!sameUrl(page.url(), url)) throw Object.assign(new Error(`the source redirects to ${page.url()}`), { source: true });
    await page.addStyleTag({ content: '#onetrust-consent-sdk, #onetrust-banner-sdk { display: none !important; }' });
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => { setTimeout(r, 150); });
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => { setTimeout(r, 2500); });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const leaves = await page.evaluate(anchors);
    const title = await page.title();
    const tiles = [];
    const meta = [];
    for (let y = 0, i = 0; y < height; y += TILE, i += 1) {
      const h = Math.min(TILE, height - y);
      const buf = Buffer.from(await page.screenshot({
        type: 'jpeg', quality: QUALITY, clip: { x: 0, y, width, height: h }, captureBeyondViewport: true,
      }));
      tiles.push(buf);
      meta.push({
        y, h, file: `${i}.jpg`, sha256: sha256(buf),
      });
    }
    return {
      meta: {
        captured, width, height, status, finalUrl: page.url(), tiles: meta, leaves,
      },
      title,
      buffers: tiles,
    };
  } finally {
    await page.close();
  }
}

/** a full shot of a page (every width) into Files and its history → the version id */
async function shoot(stores, browser, space, page, source, extra) {
  const id = shotId(new Date().toISOString());
  const widths = {};
  let title = '';
  for (const w of WIDTHS) {
    const r = await shootWidth(browser, source, w);
    title = title || r.title;
    await Promise.all(r.buffers.map((b, i) => stores.files.write(tileFile(space, page, id, w, `${i}.jpg`), b)));
    widths[w] = r.meta;
  }
  const captured = Object.values(widths).map((s) => s.captured).sort()[0];
  const version = {
    id, dir: `/${id}`, store: 'files', url: source, title, captured, ...extra, widths,
  };
  const { added, refused } = await addVersions(stores.files, space, [{ page, version }]);
  if (!added.length) throw new Error(`not recorded: ${refused[0]?.reason}`);
  return id;
}

async function run(stores, space, started) {
  const { files } = stores;
  const cs = await readCaptureState(files, space);
  const { pages } = await pageList(space);
  const byPath = new Map(pages.map((p) => [p.path, p]));
  const withShots = await pagesWithShots(files, space);
  const now = Date.now();
  // the published pages of the scope without a shot: first seen now (kept), unless their source
  // is to correct (same source, tried less than a day ago)
  const firsts = pages.filter((p) => p.published && !withShots.has(p.path));
  firsts.forEach((p) => {
    cs.firstSeen[p.path] = cs.firstSeen[p.path] || new Date(now).toISOString();
  });
  const due = firsts.filter((p) => {
    const pr = cs.problems[p.path];
    return !pr || pr.source !== p.source || now - Date.parse(pr.at) > RETRY_MS;
  });
  const requests = (await listRequests(files, space)).filter((r) => r.status === 'pending');
  const done = [];
  const failed = [];
  let browser = null;
  const work = [
    ...requests.map((r) => ({ kind: 'refresh', page: r.page, request: r })),
    ...due.map((p) => ({ kind: 'first', page: p.path, source: p.source })),
  ];
  try {
    for (const job of work) {
      if (Date.now() - started > RUN_MS) break;
      browser = browser || await launch();
      try {
        if (job.kind === 'refresh') {
          const history = await readHistory(files, space, job.page);
          const latest = history.versions[history.versions.length - 1];
          // (the source of the scope table, else the newest shot's)
          const source = byPath.get(job.page)?.source || latest?.url;
          if (!source) throw Object.assign(new Error('no source for this page'), { source: true });
          const id = await shoot(stores, browser, space, job.page, source, {
            by: job.request.by, request: job.request.id, requestedAt: job.request.at,
          });
          done.push(`${job.page} ${id} (refresh)`);
        } else {
          const id = await shoot(stores, browser, space, job.page, job.source, {
            by: 'first shot (backend)', firstSeen: cs.firstSeen[job.page],
          });
          delete cs.problems[job.page];
          done.push(`${job.page} ${id} (first)`);
        }
      } catch (e) {
        const reason = String(e.message || e).slice(0, 250);
        failed.push(`${job.page}: ${reason}`);
        if (job.kind === 'refresh') await failRequest(files, space, job.page, reason);
        else {
          cs.problems[job.page] = {
            source: job.source, reason, at: new Date().toISOString(), tries: (cs.problems[job.page]?.tries || 0) + 1,
          };
        }
        // a browser that broke is started again for the next page
        if (!e.source && browser) {
          await browser.close().catch(() => null);
          browser = null;
        }
      }
    }
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
  // pages that have their shot (or left the scope) no longer wait
  Object.keys(cs.firstSeen).forEach((p) => {
    if (!byPath.has(p)) delete cs.firstSeen[p];
  });
  Object.keys(cs.problems).forEach((p) => {
    if (!byPath.get(p)?.published) delete cs.problems[p];
  });
  const waiting = work.length - done.length - failed.length;
  cs.lastRun = {
    at: new Date(started).toISOString(), took: Date.now() - started, done, failed, waiting,
  };
  if (done.length) cs.health = { at: new Date().toISOString(), ok: true, detail: 'shots taken' };
  await writeCaptureState(files, space, cs);
  return cs.lastRun;
}

async function health(stores, space) {
  const browser = await launch();
  let result;
  try {
    const r = await shootWidth(browser, HEALTH_URL, 1440);
    result = { at: new Date().toISOString(), ok: true, detail: `${HEALTH_URL}: ${r.title}` };
  } catch (e) {
    result = { at: new Date().toISOString(), ok: false, detail: String(e.message || e).slice(0, 250) };
  } finally {
    await browser.close().catch(() => null);
  }
  const cs = await readCaptureState(stores.files, space);
  cs.health = result;
  await writeCaptureState(stores.files, space, cs);
  return result;
}

export async function main(params) {
  const started = Date.now();
  const stores = await open();
  const { files } = stores;
  const space = SPACES[params.space] ? params.space : 'main';
  const op = params.op || 'run';
  // one run at a time (a run that died leaves its lock: older than 10 minutes, it is ignored)
  try {
    const lock = JSON.parse((await files.read(lockFile(space))).toString());
    if (Date.now() - Date.parse(lock.at) < 600000) return { body: { skipped: 'a capture is running', since: lock.at } };
  } catch (e) {
    // no lock
  }
  await files.write(lockFile(space), JSON.stringify({ at: new Date().toISOString(), op }));
  try {
    if (op === 'test') {
      const page = String(params.page || '');
      if (!page.startsWith('/test/')) return { body: { error: { code: 'bad-request', message: 'test pages only (/test/…)' } } };
      const browser = await launch();
      try {
        const id = await shoot(stores, browser, space, page, String(params.source || HEALTH_URL), { by: 'capture test' });
        return { body: { page, id, took: Date.now() - started } };
      } catch (e) {
        return { body: { page, error: { code: 'capture', message: String(e.message || e).slice(0, 250) } } };
      } finally {
        await browser.close().catch(() => null);
      }
    }
    if (op === 'health') return { body: await health(stores, space) };
    const last = await run(stores, space, started);
    // nothing to do and no health check for a day: check the browser once
    const cs = await readCaptureState(files, space);
    if (!last.done.length && !last.failed.length && (!cs.health || Date.now() - Date.parse(cs.health.at) > RETRY_MS)) {
      last.health = await health(stores, space);
    }
    return { body: last };
  } catch (e) {
    return { body: { error: { code: 'capture', message: String(e.message || e).slice(0, 300) } } };
  } finally {
    await files.delete(lockFile(space)).catch(() => null);
  }
}
