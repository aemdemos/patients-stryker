#!/usr/bin/env node
/*
 * Live updates and the summary page (25 Nov 2026), in a browser on the review's dev server (Stage
 * by default): an AOE member has a page open and is typing; a reviewer's message arrives through
 * the backend; within ~20 s the open page shows it (live.js, every 15 s) without a reload, the
 * typing kept (text, focus); the status page shows the new activity the same way; the summary
 * page opens for the reviewer (no test-entries switch) and the AOE member (with it);
 * results.html forwards to summary.html. On a published page nobody used (its entries purged
 * after), test invitations only.
 * usage: node tools/review/backend/test/refresh-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { REVIEW } from '../../config.js';
import { TEST, actionUrl, webBase } from '../target.mjs';

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

// a published page of the review nobody wrote on
const used = new Set((await admin({ op: 'export' })).rows.map((r) => r.page));
const live = await (await fetch('https://main--stryker-com--strykerenterprise.aem.live/us/en/query-index.json?limit=2000')).json();
const PAGE = live.data.map((p) => p.path).find((p) => !used.has(p) && /\/news\//.test(p));
console.log(`test page: ${PAGE}`);
const aoe = await admin({
  op: 'invite', name: 'tool test refresh AOE', paths: [PAGE], days: 1, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test refresh reviewer', paths: [PAGE], days: 1,
});
const browser = await chromium.launch();
const open = async (token, path) => {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  await p.route(/altcha|captcha/, (r) => r.abort());
  await p.goto(`${base}/tools/review/${path}${path.includes('?') ? '&' : '?'}invite=${encodeURIComponent(token)}`);
  return { ctx, p };
};
try {
  // 1. the AOE member has the page open, typing
  const { ctx, p } = await open(aoe.token, `index.html?page=${encodeURIComponent(PAGE)}`);
  await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
  await p.waitForTimeout(2000);
  await p.click('.rv-pagebox-body textarea.rv-reply');
  await p.keyboard.type('typing while it updates');
  // 2. a reviewer's message through the backend
  const TEXT = `refresh test ${Date.now()}`;
  const sent = await (await fetch(`${webBase(TEST.ns)}/save`, {
    method: 'POST',
    headers: { 'x-review-invite': rev.token, 'content-type': 'application/json', origin: 'http://localhost:3220' },
    body: JSON.stringify({ page: PAGE, changes: [{ item: 'page', kind: 'comment', value: JSON.stringify(TEXT), rev: 0 }] }),
  })).json();
  check('the reviewer\'s message saved through the backend', sent.results?.[0]?.ok === true, JSON.stringify(sent));
  const t0 = Date.now();
  const arrived = await p.waitForFunction((t) => [...document.querySelectorAll('.rv-pagebox-body .rv-msg-text')].some((x) => x.textContent === t), TEXT, { timeout: 40000 })
    .then(() => true).catch(() => false);
  const took = Math.round((Date.now() - t0) / 1000);
  check(`the open page shows it without a reload (after ${took} s)`, arrived && took <= 25, took);
  const kept = await p.evaluate(() => {
    const a = document.activeElement;
    return { value: a?.value, focused: a?.classList?.contains('rv-reply') };
  });
  check('… what was being typed kept, and its focus', kept.value === 'typing while it updates' && kept.focused, JSON.stringify(kept));
  await ctx.close();

  // 3. the status page: the new activity shows by itself
  const st = await open(aoe.token, 'status.html');
  await st.p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''), null, { timeout: 90000 });
  const before = await st.p.evaluate((pg) => [...document.querySelectorAll('tr')].find((tr) => tr.textContent.includes(pg.split('/').pop()))?.textContent || '', PAGE);
  const TEXT2 = `refresh test 2 ${Date.now()}`;
  await fetch(`${webBase(TEST.ns)}/save`, {
    method: 'POST',
    headers: { 'x-review-invite': rev.token, 'content-type': 'application/json', origin: 'http://localhost:3220' },
    body: JSON.stringify({ page: PAGE, changes: [{ item: 'page', kind: 'state', value: JSON.stringify('waiting-aoe'), rev: 0 }] }),
  });
  const shown = await st.p.waitForFunction(() => /Waiting for the AOE team/.test(document.body.textContent) && /read /.test(document.querySelector('.rs-updated').textContent), null, { timeout: 40000 })
    .then(() => true).catch(() => false);
  check('the status page shows the page\'s new status by itself', shown && !!TEXT2, before.slice(0, 120));
  await st.ctx.close();

  // 4. the summary page: the reviewer (no test switch), the AOE member (with it); results.html forwards
  for (const [who, token, toggle] of [['reviewer', rev.token, false], ['AOE member', aoe.token, true]]) {
    const s = await open(token, 'summary.html');
    await s.p.waitForFunction(() => /saved changes/.test(document.querySelector('.rs-updated')?.textContent || ''), null, { timeout: 60000 }).catch(() => null);
    const r = await s.p.evaluate((t) => ({
      title: document.querySelector('h1').textContent,
      read: document.querySelector('.rs-updated').textContent,
      toggle: !document.querySelector('.rs-hide-tests').closest('label').hidden,
      found: document.body.textContent.includes(t),
    }), TEXT);
    check(`summary for the ${who}: opens, the message in it, test switch ${toggle ? 'shown' : 'hidden'}`, /summary/.test(r.title) && /saved changes/.test(r.read) && r.toggle === toggle && r.found, JSON.stringify(r));
    await s.ctx.close();
  }
  const old = await open(rev.token, 'results.html');
  await old.p.waitForURL(/summary\.html/, { timeout: 20000 }).catch(() => null);
  check('results.html (older links) forwards to summary.html', /summary\.html/.test(old.p.url()), old.p.url());
  await old.ctx.close();
} finally {
  await browser.close();
  for (const i of [aoe, rev]) {
    await admin({ op: 'purge-invite', id: i.id });
    await admin({ op: 'revoke', id: i.id });
  }
  await admin({ op: 'forget-test-invites' });
  const left = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE).length;
  check('clean-up: nothing left on the test page', left === 0, left);
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
