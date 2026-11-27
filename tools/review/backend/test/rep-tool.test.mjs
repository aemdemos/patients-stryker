#!/usr/bin/env node
/*
 * Compare with: Representative (26 Nov 2026), in a browser on the review's dev server (Stage by
 * default). A test AOE invitation puts two published pages nobody used in a test group, the second
 * its representative: on the first page Representative shows the representative's migrated page,
 * labelled "Migrated representative" (Scroll Sync works with it); on the representative itself
 * and on a page in no group the button is there but disabled (its tooltip says why), and with
 * Representative chosen such a page shows a message in its place; with a page not published yet as
 * the representative (client review: from the migration scope), disabled too, and the message says
 * it is not migrated yet. The pages' labels fade out under the pointer. Everything the test wrote
 * is purged after.
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
  const NO_REP = 'No representative has been established or migrated for this page yet';
  // the button: { shown, enabled, title }
  const open = async (page, extra = '') => {
    await p.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(page)}&mode=side&vp=375${extra}&invite=${encodeURIComponent(rev.token)}`);
    await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
    await p.waitForTimeout(1500);
    return p.evaluate(() => {
      const b = document.querySelector('[data-cmp="rep"]');
      return { shown: !b.hidden, enabled: !b.disabled, title: b.title };
    });
  };
  const message = () => p.evaluate(() => ({ hidden: document.querySelector('.rv-rep-msg').hidden, text: document.querySelector('.rv-rep-msg').textContent, tag: document.querySelector('.rv-rep .rv-tag').textContent }));
  // 1. a page of the group: Representative, the representative's migrated page
  const onA = await open(A);
  check('a page of a group: Representative there and usable', onA.shown && onA.enabled, JSON.stringify(onA));
  await p.click('[data-cmp="rep"]');
  const loaded = await p.waitForFunction((b) => {
    const f = document.querySelector('.rv-rep iframe');
    return f.contentWindow?.location.pathname.endsWith(b) && f.contentDocument?.querySelector('main .section');
  }, B, { timeout: 45000 }).then(() => true).catch(() => false);
  const shown = await p.evaluate(() => ({ tag: document.querySelector('.rv-rep .rv-tag').textContent, msg: document.querySelector('.rv-rep-msg').hidden }));
  check('… it shows the representative\'s migrated page, labelled "Migrated representative"', loaded && shown.tag === 'Migrated representative' && shown.msg, JSON.stringify(shown));
  // (the labels: out of the way under the pointer, back after)
  const tagBox = await p.evaluate(() => { const r = document.querySelector('.rv-std .rv-tag').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(tagBox.x, tagBox.y);
  await p.waitForTimeout(300);
  const away = await p.evaluate(() => document.querySelector('.rv-std .rv-tag').classList.contains('rv-tag-away'));
  await p.mouse.move(tagBox.x - 200, tagBox.y + 300);
  await p.waitForTimeout(300);
  const back = await p.evaluate(() => !document.querySelector('.rv-std .rv-tag').classList.contains('rv-tag-away'));
  check('the pages\' labels fade out under the pointer, and come back', away && back, JSON.stringify({ away, back }));
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
  // (approving a page of a group: what happens to the others is said first, OK or Cancel)
  await fetch(`${webBase(TEST.ns)}/save`, {
    method: 'POST',
    headers: { 'x-review-invite': rev.token, 'content-type': 'application/json', origin: 'http://localhost:3220' },
    body: JSON.stringify({ page: B, changes: [{ item: 'page', kind: 'state', value: JSON.stringify('in-review'), rev: 0 }] }),
  });
  await open(A);
  const approveBtn = '.rv-status-actions .rv-page-state-approved';
  await p.click(approveBtn);
  const dialog = await p.waitForSelector('dialog.ui-dialog[open] .ui-ask', { timeout: 10000 }).then(() => p.evaluate(() => document.querySelector('dialog.ui-dialog .ui-ask').textContent)).catch(() => '');
  check('Approve on a page of a group: first says what happens to the others (the one in review counts as approved)', /group 997/.test(dialog) && /will count as approved/.test(dialog) && /In review/.test(dialog), dialog.slice(0, 300));
  await p.click('dialog.ui-dialog button:has-text("Cancel")');
  await p.waitForTimeout(1500);
  const cancelled = await p.evaluate(() => document.querySelector('.rv-status-banner strong').textContent);
  check('… Cancel: nothing approved', cancelled !== 'Approved as is', cancelled);
  await p.click(approveBtn);
  await p.waitForSelector('dialog.ui-dialog[open] .ui-ask', { timeout: 10000 });
  await p.click('dialog.ui-dialog button:has-text("Approve the group")');
  const approved = await p.waitForFunction(() => document.querySelector('.rv-status-banner strong').textContent === 'Approved as is', null, { timeout: 15000 }).then(() => true).catch(() => false);
  check('… Approve the group: the page approved', approved);
  // 2. the representative itself, and a page in no group: there, disabled, the tooltip says why
  const onB = await open(B);
  check('the representative itself: Representative there but disabled, said why', onB.shown && !onB.enabled && /is its group's representative/.test(onB.title), JSON.stringify(onB));
  const onC = await open(C);
  check(`a page in no group: there but disabled, the tooltip "${NO_REP}"`, onC.shown && !onC.enabled && onC.title === NO_REP, JSON.stringify(onC));
  // (with Representative chosen, such a page: the message in its place)
  await open(C, '&cmp=rep');
  const none = await message();
  check('… with Representative chosen: a message in its place', !none.hidden && /No representative/.test(none.text), JSON.stringify(none));
  // 3. a representative not migrated yet: the message
  if (unpublished) {
    const put2 = await save(A, [org(unpublished, 'group', GROUP), org(unpublished, 'representative', true), org(B, 'representative', false)]);
    check('the representative changed to a page not published yet', put2.results?.every((x) => x.ok), JSON.stringify(put2).slice(0, 200));
    const notYet = await open(A);
    check('… Representative disabled, the tooltip says so', !notYet.enabled && notYet.title === NO_REP, JSON.stringify(notYet));
    await open(A, '&cmp=rep');
    await p.waitForTimeout(800);
    const msg = await message();
    check('… with Representative chosen: a message in its place: not migrated yet, its path', !msg.hidden && /Not migrated yet/.test(msg.text) && msg.text.includes(unpublished), JSON.stringify(msg));
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
