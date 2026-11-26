#!/usr/bin/env node
/*
 * Compare with: Representative (26 Nov 2026), in a browser on the review's dev server (Stage by
 * default). A test AOE invitation puts two published pages nobody used in a test group, the second
 * its representative: on the first page the tool offers Representative and shows the
 * representative's migrated page (Scroll Sync works with it); on the representative itself and on
 * a page in no group there is no such choice; with a page not published yet as the representative
 * (client review: from the migration scope), a message says it is not migrated yet. Everything the
 * test wrote is purged after.
 * usage: node tools/review/backend/test/rep-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { REVIEW } from '../../config.js';
import { TEST, actionUrl, webBase } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const base = process.argv[2] || 'http://localhost:3220';
const SPACE = REVIEW.space;
const GROUP = 997;
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: SPACE, ...p }) })).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};

const exported = (await admin({ op: 'export' })).rows;
const used = new Set(exported.map((r) => r.page));
const index = REVIEW.pages?.index
  ? 'https://main--stryker-com--strykerenterprise.aem.live/us/en/query-index.json?limit=2000'
  : `${base}/tools/review/pages.json`;
const list = await (await fetch(index)).json().catch(() => null);
const pages = (list?.data?.map((p) => p.path) || (list?.pages || []).map((p) => p.path)).filter((p) => !used.has(p));
const [A, B, C] = pages.filter((p) => /\/news\/20/.test(p)).concat(pages).slice(0, 3);
const aoe = await admin({
  op: 'invite', name: 'tool test representative AOE', paths: ['/'], days: 1, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test representative reviewer', paths: ['/'], days: 1,
});
const save = (page, changes) => fetch(`${webBase(TEST.ns)}/save`, {
  method: 'POST',
  headers: { 'x-review-invite': aoe.token, 'content-type': 'application/json', origin: 'http://localhost:3220' },
  body: JSON.stringify({ page, changes }),
}).then((r) => r.json());
const org = (page, kind, value) => ({
  page, item: 'page', kind, value: JSON.stringify(value), rev: 0,
});
// a page of the migration scope not published yet (client review only)
let unpublished = null;
if (REVIEW.pages?.scope) {
  const r = await (await fetch(`${webBase(TEST.ns)}/pages`, { headers: { 'x-review-invite': aoe.token, origin: 'http://localhost:3220' } })).json();
  unpublished = (r.pages || []).find((p) => p.published === false && !used.has(p.path))?.path || null;
}
console.log(`pages: ${A}, ${B} (representative), ${C} (no group); not published: ${unpublished}`);
const browser = await chromium.launch();
const errors = [];
try {
  const put = await save(A, [org(A, 'group', GROUP), org(B, 'group', GROUP), org(B, 'representative', true)]);
  check('test group made (two pages, the second its representative)', put.results?.every((x) => x.ok), JSON.stringify(put).slice(0, 200));
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  await ctx.route(/altcha|captcha/, (r) => r.abort());
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 2).join(' ').slice(0, 300)));
  const open = async (page) => {
    await p.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(page)}&mode=side&vp=375&invite=${encodeURIComponent(rev.token)}`);
    await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
    await p.waitForTimeout(1500);
    return p.evaluate(() => !document.querySelector('[data-cmp="rep"]').hidden);
  };
  // 1. a page of the group: Representative, the representative's migrated page
  check('a page of a group: Compare with offers Representative', await open(A));
  await p.click('[data-cmp="rep"]');
  const loaded = await p.waitForFunction((b) => {
    const f = document.querySelector('.rv-rep iframe');
    return f.contentWindow?.location.pathname.endsWith(b) && f.contentDocument?.querySelector('main .section');
  }, B, { timeout: 45000 }).then(() => true).catch(() => false);
  const shown = await p.evaluate(() => ({ tag: document.querySelector('.rv-rep .rv-tag').textContent, msg: document.querySelector('.rv-rep-msg').hidden }));
  check('… it shows the representative\'s migrated page, said so (★, the group)', loaded && /Representative ★ \(group 997\)/.test(shown.tag) && shown.msg, JSON.stringify(shown));
  // (once its sections have loaded: the sync waits for them)
  await p.waitForFunction(() => [...document.querySelector('.rv-rep iframe').contentDocument.querySelectorAll('main .section')].every((x) => x.dataset.sectionStatus === 'loaded'), null, { timeout: 30000 }).catch(() => null);
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.rv-std iframe').contentWindow.scrollTo(0, 400));
  await p.waitForTimeout(1500);
  const synced = await p.evaluate(() => document.querySelector('.rv-rep iframe').contentWindow.scrollY);
  check(`… Scroll Sync with it (${synced} px)`, synced > 0, synced);
  await p.click('[data-action="note"]');
  check('… note mode switches it to the Screenshot', await p.evaluate(() => document.querySelector('[data-cmp="src"]').getAttribute('aria-pressed') === 'true'));
  await p.click('[data-action="note"]');
  // 2. the representative itself, and a page in no group: no Representative
  check('the representative itself: no Representative', !(await open(B)));
  check('a page in no group: no Representative', !(await open(C)));
  // 3. a representative not migrated yet: the message
  if (unpublished) {
    const put2 = await save(A, [org(unpublished, 'group', GROUP), org(unpublished, 'representative', true), org(B, 'representative', false)]);
    check('the representative changed to a page not published yet', put2.results?.every((x) => x.ok), JSON.stringify(put2).slice(0, 200));
    await open(A);
    await p.click('[data-cmp="rep"]');
    await p.waitForTimeout(800);
    const msg = await p.evaluate(() => ({ hidden: document.querySelector('.rv-rep-msg').hidden, text: document.querySelector('.rv-rep-msg').textContent, tag: document.querySelector('.rv-rep .rv-tag').textContent }));
    check('… a message in its place: not migrated yet, its path', !msg.hidden && /Not migrated yet/.test(msg.text) && msg.text.includes(unpublished) && /Representative \(group 997\)/.test(msg.tag), JSON.stringify(msg));
  }
  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
} finally {
  await browser.close();
  for (const i of [aoe, rev]) {
    await admin({ op: 'purge-invite', id: i.id });
    await admin({ op: 'revoke', id: i.id });
  }
  await admin({ op: 'forget-test-invites' });
  const left = (await admin({ op: 'export' })).rows.filter((r) => [A, B, C, unpublished].includes(r.page)).length;
  check('clean-up: nothing left on the test pages', left === 0, left);
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
