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
 *   check { pages?, force?, forceLook? }  the daily source change check (lib/changes.mjs): the
 *                  pages of the check's list not checked today, one at a time, gently: the content
 *                  every day, the look once a week (spread out); screenshots only for a confirmed
 *                  change (pages: a list instead of the check's own, for tests; force: checked
 *                  again today; forceLook: the visual check today)
 *   bench { pages: [{ page, source }], mode, tabs }   the change check's pilot (nothing kept):
 *                  each page loaded in a mode (js, lite, waitUntil, wait, pause, settle, scroll,
 *                  visual), tabs at once in one browser → timings, content fingerprints
 *                  (lib/fingerprint.mjs) and, with visual, an image fingerprint per screen
 * Every shot: every width (1440, 860, 375), JPEG tiles of 4000 px (SHA-256 each) in Files, the
 * text / image anchors, the status, final URL and title, into the page's shot history
 * (lib/shots.mjs: never replaced, never removed).
 */
import crypto from 'crypto';
import { open, SPACES } from '../lib/core.mjs';
import { launch, openPage, loadSource } from '../lib/browser.mjs';
import { pageList } from '../lib/scope.mjs';
import {
  readHistory, addVersions, listRequests, failRequest,
} from '../lib/shots.mjs';
import {
  readCaptureState, writeCaptureState, pagesWithShots, tileFile, lockFile,
} from '../lib/capture-state.mjs';
import { rebuildSummary } from '../lib/summary.mjs';
import { pageContent, fingerprintOf } from '../lib/fingerprint.mjs';
import {
  readScope, readSite, readPageState, writeJson, readJson, pageFile, siteFile, checkLockFile, dayOf,
  differences, confirm, looksDifferent, lookDue, addLog, GONE_AFTER,
} from '../lib/changes.mjs';

const WIDTHS = [1440, 860, 375];
const TILE = 4000;
const QUALITY = 60;
const RUN_MS = 210000;
const RETRY_MS = 86400000;
const HEALTH_URL = 'https://www.stryker.com/us/en/search.html';
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const shotId = (iso) => `s-${iso.slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;
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

/** one width of a source page → { meta, tiles: [Buffer] }; throws with a reason for the AOE team */
async function shootWidth(browser, url, width) {
  const page = await openPage(browser, width);
  try {
    const captured = new Date().toISOString();
    const status = await loadSource(page, url);
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

// an image fingerprint of the page at 1440: a difference hash (64 bits) per screen of 900 px,
// from a screenshot at 1/16 scale with moving things hidden (videos, embeds, carousels); decoded
// in a blank page of its own (the source's content security policy may refuse data: images)
async function visualHash(page, scratch) {
  await page.addStyleTag({ content: 'video, iframe, embed, object, .slick-slider, .swiper, [class*="carousel"] { visibility: hidden !important; }' });
  const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 20000);
  // (as base64: the library answers bytes, not a Buffer)
  const b64 = await page.screenshot({
    type: 'jpeg', quality: 80, encoding: 'base64', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height, scale: 1 / 16 },
  });
  return scratch.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${b64}`;
    await img.decode();
    const W = 9;
    const H = 8;
    const band = Math.round(900 / 16);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const out = [];
    for (let y = 0; y < img.height; y += band) {
      ctx.drawImage(img, 0, y, img.width, Math.min(band, img.height - y), 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      const lum = (i) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      let bits = '';
      for (let r = 0; r < H; r += 1) {
        for (let col = 0; col < W - 1; col += 1) bits += lum((r * W + col) * 4) > lum((r * W + col + 1) * 4) ? '1' : '0';
      }
      out.push(BigInt(`0b${bits}`).toString(16).padStart(16, '0'));
    }
    return out;
  }, b64);
}

// the pilot of the daily change check: pages in a mode, tabs at once, nothing kept
async function bench(params) {
  const pages = [].concat(params.pages || []).filter((p) => p && /^https:\/\/www\.stryker\.com\//.test(p.source || '')).slice(0, 40);
  const mode = {
    js: true, lite: false, waitUntil: 'load', wait: 1500, pause: 150, settle: 4000, scroll: true, visual: false, ...(params.mode || {}),
  };
  const tabs = Math.max(1, Math.min(8, Number(params.tabs) || 1));
  const t0 = Date.now();
  const browser = await launch();
  const launchMs = Date.now() - t0;
  const out = [];
  let next = 0;
  const worker = async () => {
    const scratch = mode.visual ? await browser.newPage() : null;
    while (next < pages.length) {
      const p = pages[next];
      next += 1;
      const s = Date.now();
      let page;
      try {
        page = await openPage(browser, 1440, { lite: mode.lite });
        if (!mode.js) await page.setJavaScriptEnabled(false);
        // (the pilot's ETags: every HTML, CSS and JS file the page loads, with its ETag and date)
        const files = [];
        if (params.etags) {
          page.on('response', (r) => {
            const type = r.request().resourceType();
            if (!['document', 'stylesheet', 'script'].includes(type)) return;
            const h = r.headers();
            files.push({
              type, url: r.url().slice(0, 300), status: r.status(), etag: h.etag || null, modified: h['last-modified'] || null, cache: h['cache-control'] || null,
            });
          });
        }
        await loadSource(page, p.source, {
          wait: mode.wait, pause: mode.pause, waitUntil: mode.waitUntil, settle: mode.js ? mode.settle : 0, scroll: mode.scroll,
        });
        const loadMs = Date.now() - s;
        const content = await page.evaluate(pageContent);
        // (the pilot's probe: elements whose attributes match a pattern, with their attributes)
        if (params.probe) {
          content.probe = await page.evaluate((re) => [...document.querySelectorAll('*')]
            .filter((el) => [...el.attributes].some((a) => new RegExp(re, 'i').test(a.value)))
            .slice(0, 12)
            .map((el) => `<${el.tagName.toLowerCase()} ${[...el.attributes].map((a) => `${a.name}="${a.value.slice(0, 120)}"`).join(' ')}>`), params.probe);
        }
        const fp = fingerprintOf(content);
        // (and the images' ETags, asked without downloading them: HEAD from the page; another
        // host's answer shows its headers only when it allows the page's origin)
        let imageTags = null;
        if (params.etags) {
          imageTags = await page.evaluate(async () => {
            const urls = [...new Set([...document.querySelectorAll('img')].map((i) => i.currentSrc || i.src || i.getAttribute('data-src')).filter((u) => u && /^https?:/.test(u)))].slice(0, 8);
            return Promise.all(urls.map(async (u) => {
              try {
                const r = await fetch(u, { method: 'HEAD', mode: 'cors', credentials: 'omit' });
                return { url: u.slice(0, 200), status: r.status, etag: r.headers.get('etag'), modified: r.headers.get('last-modified') };
              } catch (e) {
                return { url: u.slice(0, 200), error: String(e.message || e).slice(0, 60) };
              }
            }));
          });
        }
        const v0 = Date.now();
        const visual = mode.visual ? await visualHash(page, scratch) : null;
        out.push({
          page: p.page, ms: Date.now() - s, loadMs, visualMs: mode.visual ? Date.now() - v0 : 0, fp, visual, ...(params.raw ? { content } : {}),
          ...(params.etags ? { files, imageTags } : {}),
        });
      } catch (e) {
        out.push({ page: p.page, ms: Date.now() - s, error: String(e.message || e).slice(0, 150) });
      } finally {
        await page?.close().catch(() => null);
      }
    }
    await scratch?.close().catch(() => null);
  };
  await Promise.all(Array.from({ length: tabs }, worker));
  await browser.close().catch(() => null);
  return {
    mode, tabs, launchMs, took: Date.now() - t0, pages: out,
  };
}

// ---------- the daily source change check ----------
// no page started after this: a page whose history starts or that changed takes 3 loads and a
// shot (40 s and more), and the action stops at 300 s (a run started a page at 210 s once and
// was cut off)
const CHECK_MS = 170000;
const CHECK_PAUSE = 700;
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** one gentle lite load of a source → its content fingerprint */
async function readSource(browser, source) {
  const page = await openPage(browser, 1440, { lite: true });
  try {
    await loadSource(page, source, {
      wait: 300, pause: 40, waitUntil: 'domcontentloaded', settle: 2000,
    });
    return { fp: fingerprintOf(await page.evaluate(pageContent)) };
  } finally {
    await page.close().catch(() => null);
  }
}

/** one full load of a source (images and all) → its visual fingerprint (a hash per screen) */
async function readLook(browser, scratch, source) {
  const page = await openPage(browser, 1440);
  try {
    await loadSource(page, source, { wait: 1500, settle: 4000 });
    return await visualHash(page, scratch);
  } finally {
    await page.close().catch(() => null);
  }
}

/** a fresh state for a page new to the check */
const freshState = (p) => ({
  page: p.page, source: p.source, known: [], look: null, log: [], misses: 0,
});

/** one page of the check → its record written, the result */
async function checkPage(stores, browser, scratch, space, p, today, { forceLook = false } = {}) {
  const { files } = stores;
  let state = await readPageState(files, space, p.page) || freshState(p);
  const at = new Date().toISOString();
  const a = await readSource(browser, p.source);
  const out = {};
  let entry;
  const shotNow = async (extra) => {
    const shot = await shoot(stores, browser, space, p.page, p.source, extra);
    // (the look the shot shows: the next visual check compares with it)
    state.look = { hash: await readLook(browser, scratch, p.source), day: today };
    return shot;
  };
  if (!state.known.length) {
    // the history starts: 3 loads, every version of a part seen is known; a shot when the page
    // has none yet (the state the history starts from)
    const b = await readSource(browser, p.source);
    const c = await readSource(browser, p.source);
    state.known = [...new Set([a, b, c].flatMap((x) => x.fp.parts.map((q) => q.hash)))];
    let shot = null;
    if (!(await readHistory(files, space, p.page)).versions.length) shot = await shotNow({ by: 'change history: start' });
    entry = {
      day: today, at, result: 'baseline', parts: a.fp.parts.length, shot, ...(shot ? { look: 'baseline' } : {}),
    };
    out.shot = shot;
  } else {
    const d = differences(state, a.fp);
    if (!d.parts.length) {
      entry = { day: today, at, result: 'unchanged' };
    } else {
      // a confirming load a little later: only what is new on both counts
      await sleep(3000);
      const b = await readSource(browser, p.source);
      const c = confirm(d, b.fp, state);
      if (c.parts.length || c.unsteady.length) {
        const change = { parts: [...c.parts, ...c.unsteady].map((x) => x.key), ...(c.unsteady.length ? { unsteady: true } : {}) };
        const shot = await shotNow({ by: 'change history: changed', change });
        state.known = [...new Set([...a.fp.parts, ...b.fp.parts].map((q) => q.hash))];
        entry = {
          day: today, at, result: 'changed', ...change, shot,
        };
        out.shot = shot;
      } else {
        // seen once, not on the confirming load: a dynamic part's variant, learned
        state.known = [...new Set([...state.known, ...a.fp.parts.map((q) => q.hash), ...b.fp.parts.map((q) => q.hash)])];
        entry = { day: today, at, result: 'variant', parts: d.parts.map((x) => x.key) };
      }
    }
  }
  // the weekly visual check (its night, or a week since the last), unless a shot was just taken
  if (!out.shot && (forceLook || lookDue(state, p.page, today))) {
    const look = await readLook(browser, scratch, p.source);
    if (!state.look?.hash) {
      state.look = { hash: look, day: today };
      entry.look = 'baseline';
    } else if (!looksDifferent(state.look.hash, look)) {
      state.look.day = today;
      entry.look = 'same';
    } else {
      await sleep(3000);
      const again = await readLook(browser, scratch, p.source);
      if (looksDifferent(state.look.hash, again)) {
        // looks different on both loads: a new shot, its look the one to compare with next
        const shot = await shotNow({ by: 'change history: changed', change: { look: true } });
        entry = {
          ...entry, day: today, at, result: 'changed', look: true, shot,
        };
        out.shot = shot;
      } else {
        state.look.day = today;
        entry.look = 'noise';
      }
    }
  }
  state = addLog(state, entry);
  state.misses = 0;
  state.source = p.source;
  await writeJson(files, pageFile(space, p.page), state);
  out.result = entry.result;
  out.look = entry.look || null;
  return out;
}

/** a page that could not be read today: unreachable, gone after GONE_AFTER days in a row */
async function unreachable(files, space, p, today, reason) {
  let state = await readPageState(files, space, p.page) || freshState(p);
  if (state.day !== today) state.misses = (state.misses || 0) + 1;
  state = addLog(state, {
    day: today, at: new Date().toISOString(), result: state.misses >= GONE_AFTER ? 'gone' : 'unreachable', reason,
  });
  await writeJson(files, pageFile(space, p.page), state);
}

async function check(stores, space, started, params) {
  const { files } = stores;
  const today = dayOf();
  const scope = Array.isArray(params.pages) ? { pages: params.pages } : await readScope(files, space);
  const site = await readSite(files, space);
  const stats = {
    checked: 0, baseline: 0, unchanged: 0, variant: 0, changed: 0, unreachable: 0, shots: 0, looks: 0, blocked: false, errors: [],
  };
  // the pages not checked today, the longest unchecked first
  const states = await Promise.all(scope.pages.map(async (p) => ({ p, s: await readPageState(files, space, p.page) })));
  const due = states.filter(({ s }) => params.force || !s || s.day !== today)
    .sort((x, y) => String(x.s?.log?.slice(-1)[0]?.at || '').localeCompare(String(y.s?.log?.slice(-1)[0]?.at || '')))
    .map(({ p }) => p);
  const suspects = [];
  let in404 = 0;
  let browser = await launch();
  let scratch = await browser.newPage();
  const restart = async () => {
    await browser.close().catch(() => null);
    browser = await launch();
    scratch = await browser.newPage();
  };
  const one = async (p) => {
    const r = await checkPage(stores, browser, scratch, space, p, today, { forceLook: !!params.forceLook });
    stats[r.result] += 1;
    if (r.shot) stats.shots += 1;
    if (r.look) stats.looks += 1;
  };
  try {
    for (const p of due) {
      if (Date.now() - started > CHECK_MS) break;
      try {
        await one(p);
        in404 = 0;
      } catch (e) {
        const reason = String(e.message || e).slice(0, 200);
        if (!e.source) {
          stats.errors.push(`${p.page}: ${reason}`);
          await restart();
        } else if (/answers 404/.test(reason)) {
          // a 404: maybe stryker.com refusing the backend for a while; tried again at the end,
          // and three in a row stop the run (the pages stay due)
          suspects.push(p);
          in404 += 1;
          if (in404 >= 3) {
            stats.blocked = true;
            break;
          }
        } else {
          await unreachable(files, space, p, today, reason);
          stats.unreachable += 1;
        }
      }
      stats.checked += 1;
      await sleep(CHECK_PAUSE);
    }
    if (!stats.blocked) {
      for (const p of suspects) {
        if (Date.now() - started > CHECK_MS + 20000) break;
        await sleep(2000);
        try {
          await one(p);
        } catch (e) {
          await unreachable(files, space, p, today, String(e.message || e).slice(0, 200));
          stats.unreachable += 1;
        }
      }
    }
  } finally {
    await browser.close().catch(() => null);
  }
  site.lastRun = { at: new Date(started).toISOString(), took: Date.now() - started, ...stats };
  site.runs = [...(site.runs || []), site.lastRun].slice(-500);
  await writeJson(files, siteFile(space), site);
  return site.lastRun;
}

export async function main(params) {
  const started = Date.now();
  if (params.op === 'check') {
    const stores = await open(params);
    const space = SPACES[params.space] ? params.space : 'main';
    const lock = await readJson(stores.files, checkLockFile(space), null);
    if (lock && Date.now() - Date.parse(lock.at) < 600000) return { body: { skipped: 'a check is running', since: lock.at } };
    await writeJson(stores.files, checkLockFile(space), { at: new Date().toISOString() });
    try {
      return { body: await check(stores, space, started, params) };
    } catch (e) {
      return { body: { error: { code: 'check', message: String(e.message || e).slice(0, 300) } } };
    } finally {
      await stores.files.delete(checkLockFile(space)).catch(() => null);
    }
  }
  if (params.op === 'bench') {
    try {
      return { body: await bench(params) };
    } catch (e) {
      return { body: { error: { code: 'bench', message: String(e.message || e).slice(0, 300) } } };
    }
  }
  const stores = await open(params);
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
    // the reviews' summaries built again (a safety net for anything a save missed)
    await Promise.all(['main', 'std'].map((sp) => rebuildSummary(stores, sp).catch(() => null)));
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
