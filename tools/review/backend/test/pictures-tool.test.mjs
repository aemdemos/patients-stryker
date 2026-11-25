#!/usr/bin/env node
/*
 * Pictures in the chats, in a browser on the review's dev server (Stage by default): an AOE member
 * pastes a screenshot into the page's message box and adds a second one with the Picture button,
 * sends; the message shows both; a reviewer's open page shows them too (live update); a click
 * opens the viewer: zoom in, zoom out, Fit, the next picture, Esc closes. A big picture (5000 px)
 * is made smaller before it is sent. On a published page nobody used (purged after).
 * usage: node tools/review/backend/test/pictures-tool.test.mjs <dev server, e.g. http://localhost:3220>
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
// (the review's pages: the client review's from the query index, the standard review's pages.json)
const index = REVIEW.pages?.index
  ? 'https://main--stryker-com--strykerenterprise.aem.live/us/en/query-index.json?limit=2000'
  : `${base}/tools/review/pages.json`;
const live = await (await fetch(index)).json().catch(() => null);
const pages = live?.data?.map((p) => p.path) || (live?.pages || []).map((p) => p.path);
const PAGE = pages.find((p) => !used.has(p) && /\/news\//.test(p)) || pages.find((p) => !used.has(p));
console.log(`test page: ${PAGE}`);
const aoe = await admin({
  op: 'invite', name: 'tool test pictures AOE', paths: [PAGE], days: 1, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test pictures reviewer', paths: [PAGE], days: 1,
});
const browser = await chromium.launch();
const open = async (token) => {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  await p.route(/altcha|captcha/, (r) => r.abort());
  await p.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&invite=${encodeURIComponent(token)}`);
  await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-composer textarea'), null, { timeout: 90000 });
  await p.waitForTimeout(1500);
  return { ctx, p };
};
// a picture drawn in the page (a canvas), pasted as a file
const paste = (p, w, h, label) => p.evaluate(async ([pw, ph, text]) => {
  const c = document.createElement('canvas');
  c.width = pw;
  c.height = ph;
  const g = c.getContext('2d');
  g.fillStyle = '#eb1000';
  g.fillRect(0, 0, pw, ph);
  g.fillStyle = '#fff';
  g.font = `${Math.round(ph / 5)}px sans-serif`;
  g.fillText(text, 20, ph / 2);
  const blob = await new Promise((done) => { c.toBlob(done, 'image/png'); });
  const dt = new DataTransfer();
  dt.items.add(new File([blob], `${text}.png`, { type: 'image/png' }));
  const area = document.querySelector('.rv-pagebox-body .rv-composer textarea');
  area.focus();
  area.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
}, [w, h, label]);
try {
  const a = await open(aoe.token);
  const r = await open(rev.token);
  // 1. paste one (big: made smaller), add one with the button, write, send
  await paste(a.p, 5000, 1200, 'pasted');
  await a.p.waitForFunction(() => document.querySelectorAll('.rv-pagebox-body .pv-attach-item').length === 1, null, { timeout: 20000 });
  check('pasting a screenshot into the message box adds it', true);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await a.p.setInputFiles('.rv-pagebox-body .pv-pick input', { name: 'button.png', mimeType: 'image/png', buffer: png });
  await a.p.waitForFunction(() => document.querySelectorAll('.rv-pagebox-body .pv-attach-item').length === 2, null, { timeout: 20000 });
  check('the Picture button adds one too', true);
  const TEXT = `pictures test ${Date.now()}`;
  await a.p.fill('.rv-pagebox-body .rv-composer textarea', TEXT);
  await a.p.click('.rv-pagebox-body .rv-composer .rv-primary');
  const shown = await a.p.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('.rv-pagebox-body .rv-chat .pv-thumb img')];
    return imgs.length === 2 && imgs.every((i) => i.complete && i.naturalWidth > 0);
  }, null, { timeout: 60000 }).then(() => true).catch(() => false);
  const sent = await a.p.evaluate(() => ({
    strip: document.querySelectorAll('.rv-pagebox-body .pv-attach-item').length,
    text: [...document.querySelectorAll('.rv-pagebox-body .rv-msg-text')].map((x) => x.textContent),
    sizes: [...document.querySelectorAll('.rv-pagebox-body .rv-chat .pv-thumb img')].map((i) => `${i.naturalWidth}x${i.naturalHeight}`),
  }));
  check('sent: the message shows both pictures, the box is empty again', shown && sent.strip === 0 && sent.text.some((t) => t === TEXT), JSON.stringify(sent));
  check('… the 5000 px picture was made smaller (≤ 4096)', sent.sizes.some((x) => Number(x.split('x')[0]) <= 4096 && Number(x.split('x')[0]) > 1000), JSON.stringify(sent.sizes));
  // 2. the reviewer's open page shows them (live update)
  const theirs = await r.p.waitForFunction(() => [...document.querySelectorAll('.rv-pagebox-body .rv-chat .pv-thumb img')].filter((i) => i.complete && i.naturalWidth > 0).length === 2, null, { timeout: 45000 })
    .then(() => true).catch(() => false);
  check('the reviewer\'s open page shows the pictures (live update)', theirs);
  // 3. the viewer
  await r.p.click('.rv-pagebox-body .rv-chat .pv-thumb');
  await r.p.waitForFunction(() => document.querySelector('.pv-dialog')?.open && document.querySelector('.pv-img').naturalWidth > 0 && /%$/.test(document.querySelector('.pv-zoom').textContent), null, { timeout: 20000 });
  const zoom = () => r.p.evaluate(() => ({ w: document.querySelector('.pv-img').getBoundingClientRect().width, label: document.querySelector('.pv-zoom').textContent, count: document.querySelector('.pv-count').textContent }));
  const fit = await zoom();
  await r.p.click('.pv-dialog .pv-btn[title^="Zoom in"]');
  const bigger = await zoom();
  await r.p.click('.pv-dialog .pv-btn[title^="Zoom out"]');
  await r.p.click('.pv-dialog .pv-btn[title^="Zoom out"]');
  const smaller = await zoom();
  await r.p.click('.pv-dialog .pv-btn[title^="Fit"]');
  const again = await zoom();
  const inWindow = await r.p.evaluate(() => document.querySelector('.pv-img').getBoundingClientRect().width <= window.innerWidth);
  check('the viewer: fit to the window, zoom in, zoom out, Fit again', inWindow && bigger.w > fit.w * 1.2 && smaller.w < bigger.w && Math.abs(again.w - fit.w) < 2 && /%$/.test(fit.label), JSON.stringify({
    fit, bigger, smaller, again,
  }));
  await r.p.keyboard.press('ArrowRight');
  await r.p.waitForTimeout(800);
  const next = await zoom();
  check('… the message\'s other picture with →', fit.count === '1 / 2' && next.count === '2 / 2', JSON.stringify([fit.count, next.count]));
  await r.p.keyboard.press('Escape');
  check('… Esc closes it', await r.p.evaluate(() => !document.querySelector('.pv-dialog').open));
  await a.ctx.close();
  await r.ctx.close();
} finally {
  await browser.close();
  for (const i of [aoe, rev]) {
    const purged = await admin({ op: 'purge-invite', id: i.id });
    if (i === aoe) check('clean-up: the pictures removed with the test invitation', purged.images >= 2, JSON.stringify(purged));
    await admin({ op: 'revoke', id: i.id });
  }
  await admin({ op: 'forget-test-invites' });
  const left = (await admin({ op: 'export' })).rows.filter((x) => x.page === PAGE).length;
  check('clean-up: nothing left on the test page', left === 0, left);
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
