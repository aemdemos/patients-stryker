import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import config from './keyboard.config.js';
import installPageHelpers from './lib/page-helpers.js';
import acquireHostSlot from './lib/host-slots.js';
import {
  brief, walkForward, analyseTrap, walkBackward, analyseStops, checkSkipLink,
  checkCookieBanner, hideCookieBanner,
} from './lib/tab-walk.js';
import { checkObscured, checkFocusVisible } from './lib/focus-visible.js';
import runComponentChecks from './lib/components.js';
import { pageVerdict } from './lib/compare.js';

// One test per page, site and viewport, each in its own browser context.
// Results: one JSON file per page in the keyboard project's outputDir; the
// keyboard reporter compares source and EDS after all tests have finished.

const BASE_URL = (process.env.A11Y_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const absolute = (u) => (/^https?:\/\//i.test(u) ? u : `${BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`);
const slug = (u) => new URL(absolute(u)).pathname.replace(/\.html$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

const pairs = process.env.A11Y_KBD_EDS
  ? [{ name: slug(process.env.A11Y_KBD_EDS), eds: process.env.A11Y_KBD_EDS, source: process.env.A11Y_KBD_SOURCE || null }]
  : config.pairs;
const viewportFilter = (process.env.A11Y_VIEWPORTS || '').split(',').map((v) => v.trim()).filter(Boolean);
const viewports = viewportFilter.length
  ? config.viewports.filter((v) => viewportFilter.includes(v.name))
  : config.viewports;
const sourceConcurrency = Number(process.env.A11Y_SOURCE_CONCURRENCY) || config.sourceConcurrency;

const withoutHash = (u) => u.split('#')[0];

// Loads the page, then scrolls through it once so lazy-loaded content (forms,
// embeds, blocks loaded on scroll) is present before the keyboard checks.
// Scrolling does not move the sequential focus starting point, so Tab still
// starts at the top.
async function load(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeoutMs });
  await page.waitForLoadState('load', { timeout: config.navigationTimeoutMs }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    const pause = () => new Promise((r) => { setTimeout(r, 120); });
    let y = 0;
    while (y < Math.min(document.documentElement.scrollHeight, 40000)) {
      window.scrollTo(0, y);
      await pause();
      y += step;
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function runPage(page, url, site, viewport, result) {
  await load(page, url);
  result.finalUrl = page.url();
  const navigations = [];
  const baseline = withoutHash(page.url());

  // cookie banner: report keyboard behaviour, dismiss, reload so Tab starts at the top
  const host = new URL(url).host;
  result.cookieBanner = await checkCookieBanner(page, config.cookieBanner[host], config.cookieBannerWaitMs);
  if (result.cookieBanner.present) {
    await load(page, baseline);
    await hideCookieBanner(page, result.cookieBanner.selector);
  }

  // Tab walk (records "covered on focus"), traps, Shift+Tab walk, visible focus
  const obscured = new Map();
  const walk = await walkForward(page, config, async (stop) => {
    obscured.set(stop.i, await checkObscured(page, stop));
  });
  result.traps = [];
  let reverseKeys = [];
  if (walk.trap) result.traps.push(await analyseTrap(page, walk));
  else {
    const { keys, ...reverse } = await walkBackward(page, walk, config);
    reverseKeys = keys;
    result.reverse = reverse;
    if (reverse.trap) result.traps.push(reverse.trap);
  }
  result.focusVisible = await checkFocusVisible(page, walk.stops, viewport, obscured, brief);
  const analysis = await analyseStops(page, walk, viewport, config);
  result.tabOrder = {
    count: walk.stops.length,
    completed: walk.completed,
    limitReached: walk.limitReached,
    presses: walk.presses,
    ...analysis,
    stops: walk.stops.map((s) => ({ ...brief(s), rect: s.rect, ...(s.hidden.length ? { hidden: s.hidden } : {}) })),
  };
  result.skipLink = await checkSkipLink(page, walk);

  // components
  const ctx = {
    page,
    cfg: config,
    dirty: false,
    async checkNavigation() {
      if (withoutHash(page.url()) === baseline) return false;
      navigations.push(page.url());
      await load(page, baseline);
      return true;
    },
    async reload() {
      await load(page, baseline);
      if (result.cookieBanner.present) await hideCookieBanner(page, result.cookieBanner.selector);
    },
  };
  // elements reached by Tab or Shift+Tab (main document only)
  const stopIds = walk.completed
    ? new Set([
      ...walk.stops.filter((s) => s.frame === 'main' && !s.inFrame).map((s) => s.key),
      ...reverseKeys,
    ].filter((k) => /^main\|\d+$/.test(k)).map((k) => k.split('|')[1]))
    : null;
  await page.evaluate(() => window.kbdHelpers.blurActive());
  result.components = await runComponentChecks(ctx, stopIds);
  const blocked = await page.evaluate(() => window.kbdHelpers.blocked.map((b) => b.type)).catch(() => []);
  result.guard = { navigations, blockedActions: blocked.length };
}

for (const pair of pairs) {
  for (const site of ['source', 'eds']) {
    if (pair[site]) {
      for (const viewport of viewports) {
        test(`keyboard: ${pair.name} › ${site} › ${viewport.name}`, async ({ browser }, testInfo) => {
          testInfo.setTimeout(config.testTimeoutMs);
          const url = absolute(pair[site]);
          const outDir = testInfo.project.outputDir;
          fs.mkdirSync(outDir, { recursive: true });
          const result = {
            pair: pair.name,
            site,
            viewport: viewport.name,
            width: viewport.width,
            url,
            startedAt: new Date().toISOString(),
          };
          const started = Date.now();
          let slot = null;
          let context = null;
          try {
            if (site === 'source') {
              slot = await acquireHostSlot(path.join(outDir, '.locks'), new URL(url).host, sourceConcurrency, config.testTimeoutMs);
              testInfo.setTimeout(config.testTimeoutMs + slot.waitedMs);
              result.waitedForSlotMs = slot.waitedMs;
            }
            context = await browser.newContext({
              viewport: { width: viewport.width, height: viewport.height },
              ignoreHTTPSErrors: true,
            });
            await context.addInitScript(installPageHelpers);
            const page = await context.newPage();
            page.setDefaultTimeout(15000);
            // never keep popups open
            context.on('page', (p) => { if (p !== page) p.close().catch(() => {}); });
            await runPage(page, url, site, viewport, result);
          } catch (e) {
            result.error = (e.message || String(e)).split('\n')[0];
          } finally {
            if (context) await context.close().catch(() => {});
            if (slot) slot.release();
            result.durationMs = Date.now() - started;
            const file = `${pair.name}__${viewport.name}__${site}.json`;
            fs.writeFileSync(path.join(outDir, file), JSON.stringify(result, null, 2));
          }

          // source results are information only; the EDS page passes or fails
          const { failures } = pageVerdict(result);
          if (site === 'eds' && failures.length) {
            throw new Error(`${failures.length} keyboard failure(s): ${failures.map((f) => f.check).join('; ')}`);
          }
        });
      }
    }
  }
}
