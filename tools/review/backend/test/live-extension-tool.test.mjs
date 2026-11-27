#!/usr/bin/env node
/*
 * The review extension pilot (25 Nov 2026, tools/review/extension): in Chromium with the
 * extension loaded, the review tool offers Compare with: Live, the real stryker.com page (framed:
 * the extension lifts its framing headers for review pages only), with its own scripts running;
 * Scroll Sync both ways through the extension's bridge; note mode switches Live to Screenshot.
 * Without the extension: no Live. At phone width (the pages drawn full size: they scroll). On a
 * published page (test invitation only, nothing written).
 * usage: node tools/review/backend/test/live-extension-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { mkdtempSync, cpSync } from 'fs';
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
const aoeInv = await admin({
  op: 'invite', name: 'tool test live extension AOE', paths: [PAGE], days: 1, role: 'aoe',
});
const aoeUrl = url.replace(encodeURIComponent(rev.token), encodeURIComponent(aoeInv.token));
// the review page's Extension button (the AOE team's): its panel under it
const extensionPanel = async (page) => {
  await page.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
  await page.waitForTimeout(1500);
  const shown = await page.evaluate(() => !!document.querySelector('.rv-ext') && !document.querySelector('.rv-ext').hidden);
  if (!shown) return { shown };
  await page.click('.rv-ext summary');
  await page.waitForSelector('.rv-ext-download', { timeout: 10000 });
  return page.evaluate(() => {
    const b = document.querySelector('.rv-ext summary').getBoundingClientRect();
    const body = document.querySelector('.rv-ext-body').getBoundingClientRect();
    return {
      shown: true,
      below: body.top >= b.bottom && Math.abs(body.left - b.left) < 2,
      state: document.querySelector('.rv-ext-state').textContent,
      href: document.querySelector('.rv-ext-download').getAttribute('href'),
      steps: document.querySelectorAll('.rv-ext-body .pl-steps li').length,
    };
  });
};
const errors = [];
try {
  // 1. without the extension: no Live
  const plain = await chromium.launch();
  const pp = await (await plain.newContext()).newPage();
  await pp.route(/altcha|captcha/, (r) => r.abort());
  await pp.goto(url);
  await pp.waitForSelector('[data-cmp="src"]', { timeout: 60000 });
  check('without the extension: no Live', !(await pp.$('[data-cmp="real"]')) && !(await pp.$('.rv-real')));
  check('… a reviewer: no Extension button', !(await extensionPanel(pp)).shown);
  await pp.goto(aoeUrl);
  const off = await extensionPanel(pp);
  check('… the AOE team: the Extension button, its panel under it: not installed, the steps, the download', off.shown && off.below && /Not installed/.test(off.state) && off.href === './review-live-extension.zip' && off.steps === 4, JSON.stringify(off));
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
    // (its label fades out under the pointer: the bridge says where the pointer is)
    const lb = await p.evaluate(() => { const r = document.querySelector('.rv-real .rv-tag').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.mouse.move(lb.x - 5, lb.y + 30);
    await p.mouse.move(lb.x, lb.y, { steps: 4 });
    const liveAway = await p.waitForFunction(() => document.querySelector('.rv-real .rv-tag').classList.contains('rv-tag-away'), null, { timeout: 5000 }).then(() => true).catch(() => false);
    check('… its label fades out under the pointer', liveAway);
    await p.mouse.move(10, 10);
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
    // (the AOE team, with the extension: the button says installed)
    const ap = await ctx.newPage();
    await ap.route(/altcha|captcha/, (r) => r.abort());
    await ap.goto(aoeUrl);
    const on = await extensionPanel(ap);
    check('with the extension, the Extension button: installed (its version)', on.shown && /Installed in this browser \(version \d/.test(on.state), JSON.stringify(on));
    await ap.close();
    // 5. the start page: the pilot box for the AOE team (installed), none for reviewers
    for (const [who, token, shownTo] of [['AOE member', aoeInv.token, true], ['reviewer', rev.token, false]]) {
      await p.goto(`${base}/tools/review/launch.html?invite=${encodeURIComponent(token)}`);
      await p.waitForFunction(() => /Welcome/.test(document.querySelector('.ln-hello')?.textContent || ''), null, { timeout: 60000 });
      const box = await p.evaluate(() => ({ hidden: document.querySelector('.ln-pilot').hidden, on: !!document.querySelector('.ln-pilot-on'), zip: document.querySelector('.ln-pilot a[download]')?.getAttribute('href') }));
      check(`start page, ${who}: the pilot box ${shownTo ? 'shown, "installed", with the download' : 'not shown'}`, shownTo ? (!box.hidden && box.on && box.zip === './review-live-extension.zip') : box.hidden, JSON.stringify(box));
    }
    const zip = await fetch(`${base}/tools/review/review-live-extension.zip`);
    check('the download is served', zip.ok && (await zip.arrayBuffer()).byteLength > 1000, zip.status);
    check('no page errors', errors.length === 0, errors.join(' | '));
  } finally {
    await ctx.close();
  }

} finally {
  await admin({ op: 'revoke', id: aoeInv.id });
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
