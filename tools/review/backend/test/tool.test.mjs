#!/usr/bin/env node
/*
 * The whole review loop on the backend, in a browser: a reviewer opens the tool with a test
 * invitation link on a real standard page (name from the link, read only, the link leaves the
 * address bar), saves a page comment and the reviewed mark; the summary (summarise.mjs) finds the
 * comment in the backend; the AOE team marks it done (set-status.mjs); a fresh browser shows the
 * comment, the mark and "AOE: done"; the results page (results right) lists the comment with its
 * status; a revoked link is refused. Everything the test wrote is removed at the end and the
 * invitation revoked. Tokens are never printed.
 * usage: node tools/review/backend/test/tool.test.mjs [--base http://localhost:3000]
 *   [--page /us/en/foot-and-ankle/products/prophecy] [--ns 892544-strykerstdreview-stage]
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
const PAGE = opt('--page', '/us/en/foot-and-ankle/products/prophecy');
const ns = opt('--ns', '892544-strykerstdreview-stage');
const COMMENT = `backend tool test ${new Date().toISOString()}`;
const out = mkdtempSync(join(tmpdir(), 'review-loop-'));

async function admin(params) {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${ns}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(params),
  });
  return (await resp.json()).body;
}
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
  await page.evaluate((text) => {
    const box = document.querySelector('.rv-pagebox-body textarea.rv-comment');
    box.value = text;
    box.dispatchEvent(new Event('change'));
    const mark = document.querySelector('.rv-reviewed');
    mark.checked = true;
    mark.dispatchEvent(new Event('change'));
  }, COMMENT);
  await page.click('.rv-save');
  const saved = await page.waitForFunction(() => /All changes saved/.test(document.body.textContent), null, { timeout: 30000 })
    .then(() => true).catch(() => false);
  check('Save: the tool reports all changes saved', saved);
  await context.close();

  // 2. the backend has both, written as the invitation's reviewer
  const rows = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE && r.reviewer === 'tool test backend');
  check('the backend has the comment', rows.some((r) => r.kind === 'comment' && JSON.parse(r.value) === COMMENT), JSON.stringify(rows).slice(0, 300));
  check('the backend has the reviewed mark', rows.some((r) => r.kind === 'reviewed' && JSON.parse(r.value) === true));

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

  // 6. after revoking, the tool says so
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
