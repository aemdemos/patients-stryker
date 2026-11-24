#!/usr/bin/env node
/*
 * The status page (status.html) on the backend, in a browser: six standard pages nobody has saved
 * anything on get one example of each state (test entries, written with a test invitation), then:
 * every page listed with its state chip (colour + label), counts per state, the reviewer's order
 * (answered first), filtering by a state tile; an AOE answer later shows the page as new and
 * answered; the AOE team's view words and orders it for them. Everything is removed at the end.
 * usage: node tools/review/backend/test/status.test.mjs [--base http://localhost:3000]
 *   [--ns <namespace, default Stage (tests): backend/target.mjs>] [--shot <png>: a screenshot of the reviewer's view]
 */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { TEST, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
const ns = opt('--ns', TEST.ns);

async function admin(params) {
  const resp = await fetch(actionUrl(ns), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(params),
  });
  return (await resp.json()).body;
}
let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${detail}`}`);
};

// six pages nobody has saved anything on
const used = new Set((await admin({ op: 'export' })).rows.map((r) => r.page));
const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
const P = pages.map((p) => p.path).filter((p) => !used.has(p)).slice(0, 7);
if (P.length < 7) {
  console.error('not enough pages without entries');
  process.exit(2);
}
const reviewer = await admin({
  op: 'invite', name: 'status test reviewer', paths: P, days: 1,
});
const aoe = await admin({
  op: 'invite', name: 'status test AOE', paths: P, days: 1, role: 'aoe',
});
let minute = 0;
const at = () => {
  minute += 1;
  return new Date(Date.now() - (60 - minute) * 60000).toISOString();
};
const r = (page, item, kind, value) => ({
  page, item, kind, value: JSON.stringify(value), reviewer: 'status test reviewer', time: at(), inv: reviewer.id, role: 'reviewer',
});
const a = (page, item, kind, value) => ({
  page, item, kind, value: JSON.stringify(value), reviewer: 'status test AOE', time: at(), inv: aoe.id, role: 'aoe',
});
const WANT = {
  [P[0]]: 'waiting-aoe',
  [P[1]]: 'waiting-customer',
  [P[2]]: 'resolved',
  [P[3]]: 'approved',
  [P[4]]: 'in-review',
  [P[5]]: 'unreviewed',
  [P[6]]: 'skipped',
};
await admin({
  op: 'import',
  rows: [
    r(P[0], 'page', 'comment', 'The hero is cropped.'),
    r(P[0], 'page', 'state', 'waiting-aoe'),
    r(P[1], 'page', 'comment', 'The table is too wide.'),
    r(P[1], 'page', 'state', 'waiting-aoe'),
    a(P[1], 'page', 'reply:comment:st0001', { text: 'Narrowed it.', status: { state: 'done', release: 'r1' } }),
    a(P[1], 'page', 'state', 'waiting-customer'),
    r(P[2], 'page', 'comment', 'Wrong image.'),
    a(P[2], 'page', 'reply:comment:st0002', { text: 'Replaced.', status: { state: 'done' } }),
    r(P[2], 'page', 'done:comment', true),
    r(P[2], 'page', 'state', 'approved'),
    r(P[3], 'page', 'state', 'approved'),
    r(P[4], 'b:columns:00000001', 'variant', 'card-grid'),
    r(P[4], 'page', 'comment', 'Ann, what do you think?'),
    r(P[6], 'page', 'state', 'skip'),
  ],
});

const browser = await chromium.launch();
const open = async (token) => {
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${base}/tools/review/status.html?invite=${encodeURIComponent(token)}`);
  await page.waitForFunction(() => document.querySelector('.st-table table'), null, { timeout: 90000 });
  return { context, page };
};
const rowsOf = (page) => page.evaluate(() => [...document.querySelectorAll('.st-table tbody tr')].map((tr) => ({
  path: tr.querySelector('small').textContent,
  state: [...tr.querySelector('.st-chip').classList].find((c) => c.startsWith('st-') && c !== 'st-chip').slice(3),
  label: tr.querySelector('.st-chip').textContent,
  isNew: !!tr.querySelector('.st-new-badge'),
})));
try {
  // the reviewer's view
  let { context, page } = await open(reviewer.token);
  if (opt('--shot')) await page.screenshot({ path: opt('--shot'), fullPage: true });
  let rows = await rowsOf(page);
  check('every page of the scope is listed', rows.length === 7, rows.length);
  check('each page has its state', rows.every((x) => WANT[x.path] === x.state), JSON.stringify(rows.map((x) => [x.path.split('/').pop(), x.state])));
  check('the reviewer\'s order: waiting for the customer first, then not reviewed, skipped last', rows[0].state === 'waiting-customer' && rows[1].state === 'waiting-aoe'
    && rows[5].state === 'unreviewed' && rows[6].state === 'skipped', JSON.stringify(rows.map((x) => x.state)));
  const colours = await page.evaluate(() => Object.fromEntries(['st-skipped', 'st-unreviewed'].map((c) => [c, getComputedStyle(document.querySelector(`.st-chip.${c}`)).backgroundColor])));
  check('skipped is black, not reviewed yet is gray', colours['st-skipped'] === 'rgb(31, 35, 40)' && colours['st-unreviewed'] === 'rgb(175, 184, 193)', JSON.stringify(colours));
  check('the names', rows[0].label === 'Waiting for the customer' && rows[1].label === 'Waiting for the AOE team', JSON.stringify(rows.map((x) => x.label)));
  const blueYellow = await page.evaluate(() => Object.fromEntries(['st-waiting-customer', 'st-in-review'].map((c) => [c, getComputedStyle(document.querySelector(`.st-chip.${c}`)).backgroundColor])));
  check('waiting for the customer is blue, in review is yellow', blueYellow['st-waiting-customer'] === 'rgb(9, 105, 218)' && blueYellow['st-in-review'] === 'rgb(212, 167, 44)', JSON.stringify(blueYellow));
  const tiles = await page.evaluate(() => [...document.querySelectorAll('.st-tile')].map((t) => t.textContent));
  check('counts per state', tiles.length === 7 && tiles.every((t) => t.startsWith('1')), JSON.stringify(tiles));
  await page.click('.st-tile.st-waiting-aoe');
  rows = await rowsOf(page);
  check('a state tile filters the list', rows.length === 1 && rows[0].state === 'waiting-aoe', JSON.stringify(rows));
  check('a page links into the review tool', await page.evaluate(() => document.querySelector('.st-table tbody a').getAttribute('href').startsWith('./index.html?page=')));
  await context.close();

  // the AOE team answers on the first page and sends it back; the reviewer's next visit shows it as new
  await admin({ op: 'answer', rows: [{ page: P[0], item: 'page', thread: 'comment', text: 'Re-centred the crop.', status: { state: 'done' }, by: 'status test AOE', sendBack: true }] });
  ({ context, page } = await open(reviewer.token));
  // (same browser profile is not kept between contexts: the visit time is set by hand)
  await page.evaluate(() => {
    window.localStorage.setItem('std-review-status-visit', new Date(Date.now() - 30000).toISOString());
  });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.st-table table'), null, { timeout: 90000 });
  rows = await rowsOf(page);
  const first = rows.find((x) => x.path === P[0]);
  check('after the AOE answer: waiting for the customer, and new since the last visit', first?.state === 'waiting-customer' && first.isNew, JSON.stringify(first));
  await page.check('.st-new');
  check('"only new" keeps just that page', (await rowsOf(page)).length === 1);
  await context.close();

  // the AOE team's view
  ({ context, page } = await open(aoe.token));
  rows = await rowsOf(page);
  check('the AOE view: waiting for the AOE team first, worded for them', rows.length === 7
    && (rows[0].state === 'waiting-aoe' || rows.every((x) => x.state !== 'waiting-aoe'))
    && rows.find((x) => x.state === 'waiting-customer')?.label === 'Waiting for the customer', JSON.stringify(rows.map((x) => [x.state, x.label])));
  check('the AOE view links the results page', await page.evaluate(() => !document.querySelector('.st-results').hidden));
  await context.close();
} finally {
  await browser.close();
  const p1 = await admin({ op: 'purge-invite', id: reviewer.id });
  const p2 = await admin({ op: 'purge-invite', id: aoe.id });
  // (the admin action's answer writes under the AOE name, not an invitation)
  const p3 = await admin({ op: 'purge-by', by: 'status test AOE' });
  await admin({ op: 'revoke', id: reviewer.id });
  await admin({ op: 'revoke', id: aoe.id });
  console.log(`clean-up: ${p1.deleted + p2.deleted + p3.deleted} test entries and ${p1.statuses + p2.statuses} replies removed, invitations revoked`);
}
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
