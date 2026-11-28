#!/usr/bin/env node
/*
 * The status page's selection (26 Nov 2026), in a browser on the review's dev server (Stage by
 * default), as a test AOE member, changing nothing: the header tick selects every page the
 * filters show, also those not loaded yet (selecting all is all: the dialog never talks about
 * loading); a change that replaces or removes what pages are in, or touches pages the filters
 * hide, asks first in the tool's one confirmation dialog (ask.js), with what they are in now
 * (Cancel: nothing saved, the bar as it was); after a filter change the bar says how many selected pages the list
 * doesn't show, "Keep only the listed ones" drops them; Show more goes once every page is shown
 * (never a count below 0). And the dialog's Move really saves: one page with no batch or group
 * (never the AOE team's own), selected and then filtered out of the list, moved to a test batch,
 * then the test's entry removed (purge-invite).
 * usage: node tools/review/backend/test/status-select-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { REVIEW } from '../../config.js';
import { TEST, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const base = process.argv[2] || 'http://localhost:3220';
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: REVIEW.space, ...p }) })).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};

// (a test AOE member and a review session: the DA sign-in, 27 Nov 2026; test sessions on Stage)
const AOE = 'zz-select-aoe@example.com';
await admin({
  op: 'person-put', email: AOE, name: 'tool test select AOE', role: 'aoe', paths: ['/'],
});
const aoe = { token: (await admin({ op: 'test-session', email: AOE })).session, id: `p:${AOE}` };
const before = (await admin({ op: 'export' })).rows.length;
const browser = await chromium.launch();
const errors = [];
try {
  const p = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 2).join(' ').slice(0, 300)));
  await p.goto(`${base}/tools/review/status.html#session=${encodeURIComponent(aoe.token)}`);
  await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || '') && document.querySelector('.st-table th input[type=checkbox]'), null, { timeout: 90000 });
  if (!(await p.$eval('.st-clear', (b) => b.disabled))) await p.click('.st-clear');
  await p.waitForTimeout(500);
  const total = Number((await p.textContent('.st-count')).split(' of ')[0]);
  const loaded = await p.evaluate(() => document.querySelectorAll('.st-table tbody tr').length);
  // 1. the header tick: every page the filters show
  await p.click('.st-table th input[type=checkbox]');
  const sel = await p.evaluate(() => document.querySelector('.st-bulk b')?.textContent || '');
  check(`the header tick selects every page the filters show (${total}), not only the ${loaded} loaded`, sel === `${total} pages selected:` && total > loaded, sel);
  // 2. a change that removes what pages are in (their batch), or, in a review without batches,
  // touches selected pages a search hides: asked first, in the shared dialog; Cancel saves nothing
  const batched = (await admin({ op: 'export' })).rows.some((r) => r.kind === 'batch');
  if (!batched) {
    await p.fill('.st-search', 'zz-nothing-matches-this');
    await p.waitForTimeout(800);
  }
  await p.click('.st-bulk button:has-text("Take out of their batch")');
  const ask = await p.waitForSelector('dialog.ui-dialog[open]', { timeout: 10000 }).then(() => p.textContent('dialog.ui-dialog')).catch(() => '');
  const barWhileAsked = await p.evaluate(() => document.querySelector('.st-bulk b')?.textContent || '');
  check('… taking them out of their batch asks first in the shared dialog: their batch now, nothing about loading', /Take \d+ pages out of their batch\?/.test(ask) && /Their batch now/.test(ask) && /Take \d+ pages out/.test(ask) && !/load|on screen|shown in the list/i.test(ask) && barWhileAsked === `${total} pages selected:`, ask.slice(0, 300));
  await p.click('dialog.ui-dialog button:has-text("Cancel")');
  if (!batched) await p.fill('.st-search', '');
  await p.waitForTimeout(1500);
  const after = (await admin({ op: 'export' })).rows.length;
  const barBack = await p.evaluate(() => document.querySelector('.st-bulk b')?.textContent || '');
  check('… Cancel: the bar as it was, nothing saved', barBack === `${total} pages selected:` && after === before, JSON.stringify({ barBack, before, after }));
  // 3. a filter change: the selected pages the list doesn't show; keep only the listed ones
  const word = await p.evaluate(() => (document.querySelector('.st-table .st-page-cell small')?.textContent || '/us/en/about').split('/').filter(Boolean)[2]);
  await p.fill('.st-search', word);
  await p.waitForTimeout(800);
  const narrowed = Number((await p.textContent('.st-count')).split(' of ')[0]);
  const note = await p.evaluate(() => document.querySelector('.st-bulk-note')?.textContent || '');
  check(`after a filter change ("${word}": ${narrowed} listed): the bar says how many selected aren't listed`, note.startsWith(`${total - narrowed} of them not in the list`), note);
  await p.click('.st-bulk button:has-text("Keep only the listed ones")');
  await p.waitForTimeout(500);
  const kept = await p.evaluate(() => document.querySelector('.st-bulk b')?.textContent || '');
  check('… Keep only the listed ones: the selection is the list', kept === `${narrowed} page${narrowed === 1 ? '' : 's'} selected:`, kept);
  await p.click('.st-bulk button:has-text("Clear the selection")');
  await p.click('.st-clear');
  await p.waitForTimeout(800);
  // 4. Show more: gone once every page is shown, never below 0
  let clicks = 0;
  let texts = [];
  while (clicks < 30 && await p.evaluate(() => !document.querySelector('.st-more').hidden && getComputedStyle(document.querySelector('.st-more')).display !== 'none')) {
    texts.push(await p.textContent('.st-more'));
    await p.click('.st-more');
    clicks += 1;
    await p.waitForTimeout(200);
  }
  texts = texts.map((t) => Number(t.match(/-?\d+/)?.[0]));
  const rows = await p.evaluate(() => document.querySelectorAll('.st-table tbody tr').length);
  check(`Show more: ${clicks} clicks to every page (${rows}), then gone, never below 0`, rows === total && texts.every((n) => n > 0) && clicks < 30, JSON.stringify({ rows, total, texts }));
  // 5. "Yes, change them": a page with no batch or group, selected, then out of the list
  const rowsNow = (await admin({ op: 'export' })).rows;
  const organised = new Set(rowsNow.filter((r) => ['batch', 'group', 'representative'].includes(r.kind)).map((r) => r.page));
  const free = await p.evaluate((busy) => [...document.querySelectorAll('.st-table .st-page-cell small')].map((x) => x.textContent).find((path) => !busy.includes(path)), [...organised]);
  if (free) {
    await p.fill('.st-search', free);
    await p.waitForTimeout(800);
    await p.click('.st-table tbody tr input[type=checkbox]');
    await p.fill('.st-search', 'zz-nothing-matches-this');
    await p.waitForTimeout(800);
    await p.fill('.st-bulk input[aria-label="Batch number"]', '998');
    await p.click('.st-bulk .st-bulk-group:has(input[aria-label="Batch number"]) button:has-text("Move")');
    const asked = await p.waitForSelector('dialog.ui-dialog[open]', { timeout: 10000 }).then(() => p.textContent('dialog.ui-dialog')).catch(() => '');
    await p.click('dialog.ui-dialog button.ui-ask-primary:has-text("Move 1 page")');
    const saved = await p.waitForFunction(() => /moved to batch 998/.test(document.querySelector('.st-org-msg').textContent), null, { timeout: 30000 }).then(() => true).catch(() => false);
    const entry = (await admin({ op: 'export' })).rows.find((r) => r.page === free && r.kind === 'batch');
    check(`"Move 1 page" in the dialog saves: ${free} in batch 998 (it was selected, then filtered out)`, /Move 1 page to batch 998\?/.test(asked) && /not in the list the filters show now/.test(asked) && saved && entry?.value === '998', JSON.stringify({ asked: asked.slice(0, 120), saved, entry }));
  } else console.log('(no page without a batch or group shown: the save step skipped)');
  check('no page errors', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
  await admin({ op: 'purge-invite', id: aoe.id });
  await admin({ op: 'person-forget', email: AOE });
  const leftover = (await admin({ op: 'export' })).rows.filter((r) => r.kind === 'batch' && r.value === '998').length;
  check('clean-up: the test batch removed', leftover === 0, leftover);
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
