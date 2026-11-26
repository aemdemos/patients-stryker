#!/usr/bin/env node
/*
 * The status page's organising for the AOE team, in the browser: a page's row editor (batch,
 * group, representative; empty takes out), the selection bar (move, take out, representatives),
 * the groups with their representative to choose (or none: the first page stands in) and their
 * pages to take out (its own group 902 only: real groups may exist). On three pages nobody has
 * used in any way (no review entries, batches or groups) and all published (a group's stand-in ☆
 * is its first published page): the test finds a search of the status page that lists exactly
 * three such pages (a folder, else a folder and a word; 26 Nov 2026: fixed pages got the AOE
 * team's batches), or takes the search given (checked the same way). A test AOE invitation whose
 * entries are all removed after (purge-invite) and which is revoked.
 * usage: node tools/review/backend/test/org-edit.test.mjs <base> [space] [search listing 3 pages]
 */
import { createRequire } from 'module';
import { actionUrl, webBase, TEST } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

async function admin(p) {
  const resp = await fetch(actionUrl(), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  return JSON.parse(await resp.text()).body;
}
const [base = 'http://localhost:3220', SPACE = 'main', GIVEN = ''] = process.argv.slice(2);
const sp = SPACE === 'std' ? {} : { space: SPACE };
const usedRows = (await admin({ op: 'export', ...sp })).rows;
const used = new Set(usedRows.map((r) => r.page));
// the review's pages (the migration scope's for the client review, else pages.json)
const scopeAoe = await admin({
  op: 'invite', name: 'tool test org edit scope', paths: ['/'], days: 1, role: 'aoe', ...sp,
});
let listed = [];
try {
  const headers = { 'x-review-invite': scopeAoe.token, origin: 'http://localhost:3220' };
  listed = (await (await fetch(`${webBase(TEST.ns)}/pages`, { headers })).json()).pages || [];
} catch (e) {
  listed = [];
}
if (!listed.length) {
  const json = await (await fetch(`${base}/tools/review/pages.json`)).json().catch(() => ({}));
  listed = json.pages || [];
}
await admin({ op: 'revoke', id: scopeAoe.id, ...sp });
const free = (x) => !used.has(x.path) && x.published !== false;
// (the status page's search: every word in the title or path)
const textOf = (x) => `${x.title || ''} ${x.path}`.toLowerCase();
const matches = (search) => {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  return listed.filter((x) => words.every((w) => textOf(x).includes(w)));
};
const fits = (search) => {
  const m = matches(search);
  return m.length === 3 && m.every(free);
};
/** a search listing exactly three pages, all published and none of them used in any way */
function freeSearch() {
  const folders = [...new Set(listed.filter(free).map((x) => x.path.replace(/[^/]+\/?$/, '')))]
    .filter((f) => f.length > 7).sort();
  const plain = folders.find(fits);
  if (plain) return plain;
  let hit = '';
  folders.find((folder) => {
    const words = new Set(listed.filter((x) => free(x) && x.path.startsWith(folder))
      .flatMap((x) => textOf(x).split(/[^a-z0-9]+/).filter((w) => w.length > 3)));
    hit = [...words].sort().map((w) => `${folder} ${w}`).find(fits) || '';
    return hit;
  });
  return hit;
}
const SEARCH = GIVEN || freeSearch();
if (!SEARCH) {
  console.log('refused: no search lists exactly three published pages nobody has used (give one)');
  process.exit(2);
}
const PAGES = new Set(matches(SEARCH).map((x) => x.path));
console.log(`test pages: the search "${SEARCH}" (${[...PAGES].join(', ')})`);
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const before = usedRows.filter((r) => PAGES.has(r.page));
if (!fits(SEARCH)) {
  console.log(`refused: "${SEARCH}" lists ${PAGES.size} pages, ${before.length} entries on them (only three published pages nobody has used)`);
  process.exit(2);
}
const aoe = await admin({
  op: 'invite', name: 'tool test org edit', paths: ['/'], days: 1, role: 'aoe', ...sp,
});
const browser = await chromium.launch();
const errors = [];
try {
  const p = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await p.goto(`${base}/tools/review/status.html?invite=${encodeURIComponent(aoe.token)}`, { waitUntil: 'load' });
  await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''));
  await p.fill('.st-search', SEARCH);
  await p.waitForTimeout(500);
  // the three pages in path order (P[0] < P[1] < P[2]: P[0] stands in for a group without a
  // chosen representative)
  const P = (await p.$$eval('.st-table tbody tr small', (ss) => ss.map((x) => x.textContent))).sort();
  const name = { two: P[2], three: P[1], four: P[0] };
  const rowOf = (end) => p.locator('.st-table tbody tr', { has: p.locator(`small:text-is("${name[end]}")`) });
  const tag = async (end) => ((await rowOf(end).locator('.st-batch-tag').textContent().catch(() => '')) || '').trim();
  const saved = (text) => p.waitForFunction((t) => (document.querySelector('.st-org-msg').textContent || '').includes(t), text, { timeout: 60000 });
  check('three test pages listed', await p.locator('.st-table tbody tr').count() === 3);

  // the row editor
  await rowOf('two').locator('.st-ed-open').click();
  await rowOf('two').locator('input[aria-label^="Batch"]').fill('901');
  await rowOf('two').locator('input[aria-label^="Group"]').fill('902');
  await rowOf('two').locator('.st-ed input[type="checkbox"]').check();
  await rowOf('two').locator('.st-ed-save').click();
  await saved('saved');
  await p.waitForTimeout(800);
  check('editor: batch, group, representative saved', await tag('two') === 'Batch 901 · Group 902 ★', await tag('two'));
  await rowOf('two').locator('.st-ed-open').click();
  await rowOf('two').locator('input[aria-label^="Batch"]').fill('');
  await rowOf('two').locator('.st-ed-save').click();
  await saved('saved');
  await p.waitForTimeout(800);
  check('editor: empty batch takes it out', await tag('two') === 'Group 902 ★', await tag('two'));
  await rowOf('two').locator('.st-ed-open').click();
  await rowOf('two').locator('input[aria-label^="Group"]').fill('1000');
  await rowOf('two').locator('.st-ed-save').click();
  check('editor: a number out of range is refused', /1 to 999/.test(await rowOf('two').locator('.st-ed-err').textContent()));
  await rowOf('two').locator('.st-ed-cancel').click();

  // the selection bar
  await rowOf('three').locator('td input[type="checkbox"]').first().check();
  await rowOf('four').locator('td input[type="checkbox"]').first().check();
  check('selection: the bar for 2 pages', /2 pages selected/.test(await p.textContent('.st-bulk')));
  await p.locator('.st-bulk input[aria-label="Group number"]').fill('902');
  await p.locator('.st-bulk .st-bulk-group', { hasText: 'Group' }).locator('button', { hasText: 'Move' }).click();
  await saved('moved to group 902');
  await p.waitForTimeout(800);
  check('selection: moved to the group, the representative kept', await tag('three') === 'Group 902' && await tag('four') === 'Group 902' && await tag('two') === 'Group 902 ★', `${await tag('two')} / ${await tag('three')} / ${await tag('four')}`);

  // the groups: the representative chosen, then none (the first page stands in)
  await p.click('.st-groups summary');
  const g902 = p.locator('.st-group-row', { hasText: 'Group 902' });
  await g902.locator('.st-rep-pick').selectOption(name.three);
  await saved('representative chosen');
  await p.waitForTimeout(800);
  check('groups: another representative chosen, the earlier one no more', await tag('three') === 'Group 902 ★' && await tag('two') === 'Group 902', `${await tag('two')} / ${await tag('three')}`);
  await g902.locator('.st-rep-pick').selectOption('');
  await saved('no representative chosen');
  await p.waitForTimeout(800);
  // (path order: …-four < …-three < …-two)
  check('groups: none chosen, the first page stands in (☆)', await tag('four') === 'Group 902 ☆' && await tag('three') === 'Group 902', `${await tag('four')} / ${await tag('three')}`);
  await g902.locator('details summary').click();
  await g902.locator('li', { hasText: `(${name.four})` }).locator('.st-take-out').click();
  await saved('taken out of group 902');
  await p.waitForTimeout(800);
  check('groups: a page taken out', await tag('four') === '' && await tag('three') === 'Group 902 ☆', `${await tag('four')} / ${await tag('three')}`);

  // the selection bar: take out of the group
  await p.locator('.st-bulk button', { hasText: 'Clear the selection' }).click();
  await rowOf('two').locator('td input[type="checkbox"]').first().check();
  await rowOf('three').locator('td input[type="checkbox"]').first().check();
  await p.locator('.st-bulk button', { hasText: 'Take out of their group' }).click();
  await saved('taken out of their group');
  await p.waitForTimeout(800);
  check('selection: taken out of their group, the group gone', await tag('two') === '' && await tag('three') === '' && await p.locator('.st-group-row', { hasText: 'Group 902' }).count() === 0, await p.textContent('.st-groups-sum'));
} finally {
  await browser.close();
  const purged = await admin({ op: 'purge-invite', id: aoe.id, ...sp });
  await admin({ op: 'revoke', id: aoe.id });
  await admin({ op: 'forget-test-invites' });
  const left = (await admin({ op: 'export', ...sp })).rows.filter((r) => PAGES.has(r.page));
  check('test entries removed', left.length === 0, `${purged.deleted} purged, ${left.length} left`);
  check('no page errors', !errors.length, errors.join(' | '));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
