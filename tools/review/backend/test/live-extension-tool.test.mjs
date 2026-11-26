#!/usr/bin/env node
/*
 * The review extension pilot (25 Nov 2026, tools/review/extension): in Chromium with the
 * extension loaded, the review tool offers Compare with: Live, the real stryker.com page (framed:
 * the extension lifts its framing headers for review pages only), with its own scripts running;
 * Scroll Sync both ways through the extension's bridge; note mode switches Live to Screenshot.
 * Snap: the first time asks for the icon click; end to end with a test copy allowed to capture.
 * Without the extension: no Live. At phone width (the pages drawn full size: they scroll). On a
 * published page (test invitation only, nothing written).
 * usage: node tools/review/backend/test/live-extension-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import {
  mkdtempSync, cpSync, readFileSync, writeFileSync,
} from 'fs';
import { fileURLToPath } from 'url';
import { REVIEW } from '../../config.js';
import { TEST, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const base = process.argv[2] || 'http://localhost:3220';
// (a copy: Chrome writes into the folder it loads)
const EXT = mkdtempSync('/tmp/run-outputs/ext-copy-');
cpSync(fileURLToPath(new URL('../../extension', import.meta.url)), EXT, { recursive: true });
const SPACE = REVIEW.space;
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: SPACE, ...p }) })).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};

const index = REVIEW.pages?.index
  ? 'https://main--stryker-com--strykerenterprise.aem.live/us/en/query-index.json?limit=2000'
  : `${base}/tools/review/pages.json`;
const list = await (await fetch(index)).json().catch(() => null);
const pages = list?.data?.map((p) => p.path) || (list?.pages || []).map((p) => p.path);
const PAGE = pages.find((p) => /\/news\/20/.test(p)) || pages[0];
console.log(`test page: ${PAGE}`);
const rev = await admin({
  op: 'invite', name: 'tool test live extension', paths: [PAGE], days: 1,
});
const url = `${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&mode=side&vp=375&invite=${encodeURIComponent(rev.token)}`;
const errors = [];
try {
  // 1. without the extension: no Live
  const plain = await chromium.launch();
  const pp = await (await plain.newContext()).newPage();
  await pp.route(/altcha|captcha/, (r) => r.abort());
  await pp.goto(url);
  await pp.waitForSelector('[data-cmp="src"]', { timeout: 60000 });
  check('without the extension: no Live', !(await pp.$('[data-cmp="real"]')) && !(await pp.$('.rv-real')));
  await plain.close();

  // 2. with it
  const ctx = await chromium.launchPersistentContext(mkdtempSync('/tmp/run-outputs/ext-profile-'), {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1500, height: 950 },
  });
  try {
    await ctx.route(/altcha|captcha/, (r) => r.abort());
    const p = await ctx.newPage();
    p.setDefaultTimeout(60000);
    p.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 2).join(' ').slice(0, 300)));
    await p.goto(url);
    await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
    await p.waitForTimeout(3000);
    check('with the extension: Compare with offers Live', !!(await p.$('[data-cmp="real"]')));
    await p.click('[data-cmp="real"]');
    const shown = await p.waitForFunction(() => document.querySelector('.rv-real .rv-tag').textContent === 'Live stryker.com', null, { timeout: 60000 }).then(() => true).catch(() => false);
    const frame = p.frames().find((f) => /^https:\/\/www\.stryker\.com\//.test(f.url()));
    const inside = frame ? await frame.evaluate(() => ({ title: document.title, scripts: document.scripts.length, text: document.body.innerText.length })) : null;
    check('Live: the real stryker.com page, its scripts running', shown && inside && inside.scripts > 0 && inside.text > 200, JSON.stringify(inside));
    // 3. Scroll Sync: the migrated page moves the real one, and back
    const stdTo = async (y) => p.evaluate((top) => document.querySelector('.rv-std iframe').contentWindow.scrollTo(0, top), y);
    const realY = () => frame.evaluate(() => window.scrollY);
    const stdY = () => p.evaluate(() => document.querySelector('.rv-std iframe').contentWindow.scrollY);
    await stdTo(1500);
    await p.waitForTimeout(1500);
    const moved = await realY();
    const stdNow = await stdY();
    check(`Scroll Sync: the migrated page scrolled (${stdNow} px), the real page follows to the same content (${moved} px)`, stdNow > 100 && moved > 50, moved);
    await frame.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(1500);
    const back = await stdY();
    check(`… and back: the real page scrolled to the top, the migrated page follows (${back} px)`, back < 400, back);
    // 4. note mode: Live becomes Screenshot
    await p.click('[data-action="note"]');
    const cmp = await p.evaluate(() => document.querySelector('[data-cmp="src"]').getAttribute('aria-pressed'));
    check('note mode with Live showing: the Screenshot shown', cmp === 'true', cmp);
    await p.click('[data-action="note"]');
    // 5. Snap, as shipped: the first time in a tab the browser wants the extension's icon clicked
    await p.click('[data-cmp="real"]');
    await p.waitForFunction(() => document.querySelector('.rv-real .rv-tag').textContent === 'Live stryker.com', null, { timeout: 60000 });
    await p.click('.rv-snap');
    const ask = await p.waitForFunction(() => !document.querySelector('.rv-snap-msg').hidden && document.querySelector('.rv-snap-msg').textContent, null, { timeout: 15000 }).then((h) => h.jsonValue()).catch(() => '');
    check('Snap, first time in a tab: asks for one click on the extension\'s icon (or Alt+Shift+S)', /icon/.test(ask) && /Alt\+Shift\+S/.test(ask), ask);
    // 6. the start page: the pilot box for the AOE team (installed), none for reviewers
    const aoe = await admin({
      op: 'invite', name: 'tool test live extension AOE', paths: [PAGE], days: 1, role: 'aoe',
    });
    for (const [who, token, shownTo] of [['AOE member', aoe.token, true], ['reviewer', rev.token, false]]) {
      await p.goto(`${base}/tools/review/launch.html?invite=${encodeURIComponent(token)}`);
      await p.waitForFunction(() => /Welcome/.test(document.querySelector('.ln-hello')?.textContent || ''), null, { timeout: 60000 });
      const box = await p.evaluate(() => ({ hidden: document.querySelector('.ln-pilot').hidden, on: !!document.querySelector('.ln-pilot-on'), zip: document.querySelector('.ln-pilot a[download]')?.getAttribute('href') }));
      check(`start page, ${who}: the pilot box ${shownTo ? 'shown, "installed", with the download' : 'not shown'}`, shownTo ? (!box.hidden && box.on && box.zip === './review-live-extension.zip') : box.hidden, JSON.stringify(box));
    }
    await admin({ op: 'revoke', id: aoe.id });
    const zip = await fetch(`${base}/tools/review/review-live-extension.zip`);
    check('the download is served', zip.ok && (await zip.arrayBuffer()).byteLength > 1000, zip.status);
    check('no page errors', errors.length === 0, errors.join(' | '));
  } finally {
    await ctx.close();
  }

  // 7. Snap end to end, with a test copy allowed to capture without the click (the only
  // difference: <all_urls>; a browser grants the shipped one that with the icon click)
  const EXT2 = mkdtempSync('/tmp/run-outputs/ext-copy-');
  cpSync(EXT, EXT2, { recursive: true });
  const m = JSON.parse(readFileSync(`${EXT2}/manifest.json`, 'utf8'));
  m.host_permissions = [...m.host_permissions, '<all_urls>'];
  writeFileSync(`${EXT2}/manifest.json`, JSON.stringify(m));
  const ctx2 = await chromium.launchPersistentContext(mkdtempSync('/tmp/run-outputs/ext-profile-'), {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT2}`, `--load-extension=${EXT2}`],
    viewport: { width: 1500, height: 950 },
  });
  try {
    await ctx2.route(/altcha|captcha/, (r) => r.abort());
    const p = await ctx2.newPage();
    p.setDefaultTimeout(60000);
    await p.goto(url);
    await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
    await p.waitForTimeout(2000);
    await p.click('[data-cmp="real"]');
    await p.waitForFunction(() => document.querySelector('.rv-real .rv-tag').textContent === 'Live stryker.com', null, { timeout: 60000 });
    await p.waitForTimeout(1500);
    await p.click('.rv-snap');
    const added = await p.waitForFunction(() => document.querySelectorAll('.rv-pagebox-body .pv-attach-item').length === 1, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const snap = await p.evaluate(async () => {
      const img = document.querySelector('.rv-pagebox-body .pv-attach-item img');
      if (!img) return null;
      await img.decode().catch(() => null);
      const pane = document.querySelector('.rv-real').getBoundingClientRect();
      return {
        w: img.naturalWidth, h: img.naturalHeight, paneW: Math.round(pane.width), paneH: Math.round(pane.height), msg: document.querySelector('.rv-snap-msg').textContent,
      };
    });
    check('Snap: a picture of exactly the Live page in the general page comments\' box', added && snap
      && Math.abs(snap.w / snap.h - snap.paneW / snap.paneH) < 0.02 && /General page comments/.test(snap.msg), JSON.stringify(snap));
  } finally {
    await ctx2.close();
  }
} finally {
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
