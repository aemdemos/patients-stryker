#!/usr/bin/env node
/*
 * QA notes on the source screenshot (25 Nov 2026), in a browser on the review's dev server (Stage
 * by default): with Render showing, + Add QA note switches it to the Screenshot; both sides are
 * outlined; a click on the screenshot places a note there (its pin on the screenshot, not on the
 * migrated page); from Render, the note's line in the panel goes back to the screenshot and its
 * pin; after a reload it is still there, "On the source"; in Flip mode on Render, note mode shows
 * the Screenshot. On a published page nobody used, with a screenshot (purged after).
 * usage: node tools/review/backend/test/notes-source-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { REVIEW } from '../../config.js';
import { TEST, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const base = process.argv[2] || 'http://localhost:3220';
const SPACE = REVIEW.space;
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: SPACE, ...p }) })).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};

const used = new Set((await admin({ op: 'export' })).rows.map((r) => r.page));
const index = REVIEW.pages?.index
  ? 'https://main--stryker-com--strykerenterprise.aem.live/us/en/query-index.json?limit=2000'
  : `${base}/tools/review/pages.json`;
const live = await (await fetch(index)).json().catch(() => null);
const pages = live?.data?.map((p) => p.path) || (live?.pages || []).map((p) => p.path);
const PAGE = pages.find((p) => !used.has(p) && /\/news\/20/.test(p)) || pages.find((p) => !used.has(p));
console.log(`test page: ${PAGE}`);
const rev = await admin({
  op: 'invite', name: 'tool test source notes', paths: [PAGE], days: 1,
});
const browser = await chromium.launch();
const errors = [];
const NOTE = `on the source ${Date.now()}`;
try {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  await ctx.route(/altcha|captcha/, (r) => r.abort());
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 2).join(' ').slice(0, 300)));
  const open = () => p.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&mode=side&invite=${encodeURIComponent(rev.token)}`);
  await open();
  await p.waitForFunction(() => document.querySelector('.rv-src-page img') && document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
  await p.waitForTimeout(2500);
  if (REVIEW.compare.includes('live')) {
    await p.click('[data-cmp="live"]');
    await p.waitForTimeout(800);
  }
  // 1. note mode: Render → Screenshot, both sides outlined
  await p.click('[data-action="note"]');
  const mode = await p.evaluate(() => ({
    src: document.querySelector('[data-cmp="src"]').getAttribute('aria-pressed'),
    std: getComputedStyle(document.querySelector('.rv-std')).outlineStyle,
    srcLine: getComputedStyle(document.querySelector('.rv-src')).outlineStyle,
  }));
  check('note mode with Render showing: the Screenshot shown, both sides outlined', mode.src === 'true' && mode.std === 'solid' && mode.srcLine === 'solid', JSON.stringify(mode));
  // 2. a click on the screenshot: a note there
  const box = await p.evaluate(() => {
    const r = document.querySelector('.rv-src').getBoundingClientRect();
    return { x: r.left + r.width * 0.4, y: r.top + r.height * 0.35 };
  });
  await p.mouse.click(box.x, box.y);
  await p.waitForSelector('.rv-note-editor:not([hidden]) textarea', { timeout: 10000 });
  const head = await p.textContent('.rv-note-editor-head');
  check('… the click opens a new note, on the source screenshot', /on the source screenshot/.test(head), head);
  await p.fill('.rv-note-editor textarea', NOTE);
  await p.click('.rv-note-editor .rv-primary');
  await p.waitForFunction(() => document.querySelectorAll('.rv-src-pins .rv-pin:not(.rv-draft)').length === 1, null, { timeout: 15000 });
  const pins = await p.evaluate(() => ({
    src: document.querySelectorAll('.rv-src-pins .rv-pin').length,
    std: document.querySelector('.rv-std iframe').contentDocument?.querySelectorAll('#rv-pins .rv-pin').length || 0,
    meta: document.querySelector('.rv-note .rv-meta')?.textContent || '',
  }));
  check('its pin is on the screenshot, not on the migrated page; "On the source" in the panel', pins.src === 1 && pins.std === 0 && /On the source/.test(pins.meta), JSON.stringify(pins));
  await p.keyboard.press('Escape');
  // 3. from Render, the note's line goes back to its screenshot and pin
  if (REVIEW.compare.includes('live')) {
    await p.click('[data-cmp="live"]');
    await p.waitForTimeout(800);
    await p.click('.rv-note .rv-note-main');
    const back = await p.waitForFunction(() => document.querySelector('[data-cmp="src"]').getAttribute('aria-pressed') === 'true'
      && document.querySelector('.rv-src-pins .rv-pin.rv-sel'), null, { timeout: 15000 }).then(() => true).catch(() => false);
    check('from Render, the note\'s line shows its screenshot and its pin', back);
  }
  // 4. after a reload: still there
  await open();
  await p.waitForFunction(() => document.querySelector('.rv-src-page img') && document.querySelectorAll('.rv-note').length === 1, null, { timeout: 90000 });
  await p.waitForTimeout(2000);
  if (REVIEW.compare.includes('src')) {
    await p.click('[data-cmp="src"]');
    await p.waitForTimeout(800);
  }
  const kept = await p.evaluate(() => document.querySelectorAll('.rv-src-pins .rv-pin').length);
  check('after a reload: the pin on the screenshot again', kept === 1, kept);
  // 5. Flip mode on Render: note mode shows the Screenshot
  if (REVIEW.compare.includes('live')) {
    await p.click('[data-mode="flip"]');
    await p.click('[data-cmp="live"]');
    await p.waitForTimeout(800);
    await p.click('[data-action="note"]');
    const flip = await p.evaluate(() => document.querySelector('[data-cmp="src"]').getAttribute('aria-pressed'));
    check('Flip mode on Render: note mode shows the Screenshot', flip === 'true', flip);
    await p.click('[data-action="note"]');
  }
  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
} finally {
  await browser.close();
  await admin({ op: 'purge-invite', id: rev.id });
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
  const left = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE).length;
  check('clean-up: nothing left on the test page', left === 0, left);
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
