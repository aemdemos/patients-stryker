#!/usr/bin/env node
/*
 * The whole review loop on the backend, in a browser: a reviewer opens the tool with a test
 * invitation link on a real standard page nobody has saved anything on (the first in pages.json;
 * a --page with other entries is refused, so a reviewer's work is never overwritten) (name from the link, read only, the link leaves the
 * address bar), saves a page comment and the reviewed mark; the summary (summarise.mjs) finds the
 * comment in the backend; the AOE team marks it done (set-status.mjs); a fresh browser shows the
 * comment, the mark and "AOE: done"; the results page (results right) lists the comment with its
 * status; a revoked link is refused. Everything the test wrote is removed at the end and the
 * invitation revoked. Tokens are never printed.
 * usage: node tools/review/backend/test/tool.test.mjs [--base http://localhost:3000]
 *   [--page /us/en/…] [--ns 892544-strykerstdreview-stage]
 * Also: unsaved changes and Undo changes.
 */
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
const ns = opt('--ns', '892544-strykerstdreview-stage');
const COMMENT = `backend tool test ${new Date().toISOString()}`;
const out = mkdtempSync(join(tmpdir(), 'review-loop-'));

async function admin(params) {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${ns}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(params),
  });
  return (await resp.json()).body;
}

// a page nobody has saved anything on (the test must never overwrite a reviewer's entries)
const used = new Set((await admin({ op: 'export' })).rows.map((r) => r.page));
const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));
const PAGE = opt('--page', pages.map((p) => p.path).find((p) => !used.has(p)));
if (!PAGE || used.has(PAGE)) {
  console.error(`${PAGE || 'no page'}: has saved review entries; the test runs only on a page without any`);
  process.exit(2);
}
console.log(`test page: ${PAGE}`);
let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${detail}`}`);
};

const inv = await admin({
  op: 'invite', name: 'tool test backend', paths: [PAGE], days: 1, results: true,
});
const link = `${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&invite=${encodeURIComponent(inv.token)}`;
const browser = await chromium.launch();
try {
  const open = async (url, ready = '.rv-pagebox-body textarea.rv-comment') => {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.route(/altcha|captcha/, (r) => r.abort());
    await page.goto(url);
    await page.waitForFunction((sel) => document.querySelector(sel), ready, { timeout: 60000 });
    await page.waitForTimeout(3000);
    return { context, page };
  };

  // 1. the reviewer: comment + reviewed mark, Save
  let { context, page } = await open(link);
  const name = await page.evaluate(() => {
    const n = document.querySelector('.rv-reviewer');
    return { value: n.value, readOnly: n.readOnly };
  });
  check('the name comes from the link, read only', name.value === 'tool test backend' && name.readOnly, JSON.stringify(name));
  check('the link leaves the address bar', !(await page.evaluate(() => window.location.search)).includes('invite='));
  // Undo changes: unsaved changes go, the page is back at its saved state
  await page.evaluate(() => {
    const box = document.querySelector('.rv-pagebox-body textarea.rv-comment');
    box.value = 'a change to undo';
    box.dispatchEvent(new Event('change'));
    const mark = document.querySelector('.rv-reviewed');
    mark.checked = true;
    mark.dispatchEvent(new Event('change'));
  });
  check('unsaved changes enable Undo changes', await page.evaluate(() => !document.querySelector('.rv-undo').disabled
    && /2 unsaved changes/.test(document.querySelector('.rv-status').textContent)));
  await page.click('.rv-undo');
  await page.click('dialog.rv-dialog button.rv-danger');
  await page.waitForFunction(() => document.querySelector('.rv-pagebox-body textarea.rv-comment'), null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  const undone = await page.evaluate(() => ({
    comment: document.querySelector('.rv-pagebox-body textarea.rv-comment').value,
    reviewed: document.querySelector('.rv-reviewed').checked,
    undo: document.querySelector('.rv-undo').disabled,
    save: document.querySelector('.rv-save').disabled,
    drafts: window.localStorage.getItem('std-review-drafts'),
  }));
  check('after Undo: no comment, no mark, nothing to save', undone.comment === '' && !undone.reviewed && undone.undo && undone.save
    && !(undone.drafts || '').includes('a change to undo'), JSON.stringify(undone));
  await page.evaluate((text) => {
    const box = document.querySelector('.rv-pagebox-body textarea.rv-comment');
    box.value = text;
    box.dispatchEvent(new Event('change'));
    const mark = document.querySelector('.rv-reviewed');
    mark.checked = true;
    mark.dispatchEvent(new Event('change'));
  }, COMMENT);
  // and a design switch on the first block with more than one design
  await page.waitForFunction(() => document.querySelector('.rv-item button.rv-step[aria-label="Next variant"]'), null, { timeout: 60000 });
  await page.click('.rv-item button.rv-step[aria-label="Next variant"]');
  await page.waitForFunction(() => document.querySelector('.rv-item.rv-changed'), null, { timeout: 30000 });
  const answer = page.waitForResponse((r) => r.url().includes('std-review/save') && r.request().method() === 'POST', { timeout: 30000 });
  await page.click('.rv-save');
  const saveStatus = await answer.then((r) => r.status()).catch(() => 0);
  const saved = await page.waitForFunction(() => /All changes saved/.test(document.body.textContent), null, { timeout: 30000 })
    .then(() => true).catch(() => false);
  check('Save: the backend answers and the tool reports all changes saved', saveStatus === 200 && saved, saveStatus);
  await context.close();

  // 2. the backend has both, written as the invitation's reviewer
  const rows = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE && r.reviewer === 'tool test backend');
  check('the backend has the comment', rows.some((r) => r.kind === 'comment' && JSON.parse(r.value) === COMMENT), JSON.stringify(rows).slice(0, 300));
  check('the backend has the reviewed mark', rows.some((r) => r.kind === 'reviewed' && JSON.parse(r.value) === true));
  const choice = rows.find((r) => r.kind === 'variant');
  check('the design switch is saved under the block key, not its position', !!choice && /^b:[a-z-]+:[0-9a-f]{8}(#\d+)?$/.test(choice.item), JSON.stringify(choice));

  // 3. the AOE team: summary from the backend, then the status
  execFileSync('node', ['tools/review/summarise.mjs', '--out', out, '--themes', join(out, 'none.json'), '--base', base, '--ns', ns], { stdio: 'pipe' });
  const items = JSON.parse(readFileSync(join(out, 'work-items.json'), 'utf8')).items;
  const item = items.find((it) => it.id === `page:${PAGE}`);
  check('the summary has the comment as a page work item', !!item && item.evidence.some((e) => e.text === COMMENT), JSON.stringify(items.map((it) => it.id)));
  const status = execFileSync('node', ['tools/review/set-status.mjs', '--work', join(out, 'work-items.json'), '--item', `page:${PAGE}`,
    '--state', 'done', '--release', 'r-test', '--reason', 'loop test', '--ns', ns], { encoding: 'utf8' });
  check('set-status saves the status in the backend', /1 of 1 status rows saved/.test(status), status);

  // 4. a fresh browser: the comment, the mark and the AOE status
  ({ context, page } = await open(link));
  const again = await page.evaluate(() => ({
    comment: document.querySelector('.rv-pagebox-body textarea.rv-comment').value,
    reviewed: document.querySelector('.rv-reviewed').checked,
    aoe: document.querySelector('.rv-pagebox-body .rv-aoe')?.textContent || '',
  }));
  await page.waitForFunction(() => document.querySelector('.rv-item'), null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  check('… and the saved design switch, found by its key', await page.evaluate(() => document.querySelectorAll('.rv-item.rv-changed').length === 1));
  check('a fresh browser shows the saved comment and mark', again.comment === COMMENT && again.reviewed, JSON.stringify(again));
  check('… and the AOE status under the comment', /AOE: done in r-test/.test(again.aoe), again.aoe);
  await context.close();

  // 5. the results page with the results right
  ({ context, page } = await open(`${base}/tools/review/results.html?invite=${encodeURIComponent(inv.token)}`, '#comments table'));
  const res = await page.evaluate((text) => {
    const row = [...document.querySelectorAll('#comments tr')].find((tr) => tr.textContent.includes(text));
    return { found: !!row, aoe: row?.lastElementChild?.textContent || '', search: window.location.search };
  }, COMMENT);
  check('the results page lists the comment with its AOE status', res.found && /done/.test(res.aoe), JSON.stringify(res));
  check('… and keeps the link out of the address bar', !res.search.includes('invite='));
  await context.close();

  // 6. a save cut off by closing the page at once: sent again on the next visit
  ({ context, page } = await open(link));
  const LATER = `${COMMENT} (sent again)`;
  await page.evaluate((text) => {
    const box = document.querySelector('.rv-pagebox-body textarea.rv-comment');
    box.value = text;
    box.dispatchEvent(new Event('change'));
  }, LATER);
  await page.click('.rv-save');
  await page.close({ runBeforeUnload: false });
  const again2 = await context.newPage();
  await again2.route(/altcha|captcha/, (r) => r.abort());
  await again2.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}`);
  await again2.waitForFunction(() => document.querySelector('.rv-pagebox-body textarea.rv-comment'), null, { timeout: 60000 });
  await again2.waitForTimeout(5000);
  const later = (await admin({ op: 'export' })).rows.find((r) => r.page === PAGE && r.item === 'page' && r.kind === 'comment');
  check('an interrupted save is sent again on the next visit', later && JSON.parse(later.value) === LATER, later?.value);
  await context.close();

  // 7. after revoking, the tool says so
  await admin({ op: 'revoke', id: inv.id });
  ({ context, page } = await open(link));
  check('a revoked link: the tool says it was withdrawn', await page.evaluate(() => document.body.textContent.includes('withdrawn')));
  await context.close();
} finally {
  await browser.close();
  const purge = await admin({ op: 'purge-invite', id: inv.id });
  await admin({ op: 'revoke', id: inv.id });
  console.log(`clean-up: ${purge.deleted} test entries and ${purge.statuses} statuses removed, invitation revoked`);
}
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
