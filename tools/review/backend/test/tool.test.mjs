#!/usr/bin/env node
/*
 * The review tool with the backend, in a browser: opened with a test invitation link on a real
 * standard page, the name comes from the link (read only) and the link leaves the address bar; a
 * page comment and the reviewed mark are saved with the Save button, read back by the backend and
 * shown again in a fresh browser. Everything the test invitation wrote is removed at the end and
 * the invitation revoked. Tokens are never printed.
 * usage: node tools/review/backend/test/tool.test.mjs [--base http://localhost:3000]
 *   [--page /us/en/foot-and-ankle/products/prophecy] [--ns 892544-strykerstdreview-stage]
 */
import { createRequire } from 'module';

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
  op: 'invite', name: 'tool test backend', paths: [PAGE], days: 1,
});
const link = `${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&invite=${encodeURIComponent(inv.token)}`;
const browser = await chromium.launch();
try {
  const open = async (url) => {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.route(/altcha|captcha/, (r) => r.abort());
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('.rv-pagebox-body textarea.rv-comment'), null, { timeout: 60000 });
    await page.waitForTimeout(3000);
    return { context, page };
  };

  // 1. first visit with the invitation link
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

  // 3. a fresh browser with the same link sees them
  ({ context, page } = await open(link));
  const again = await page.evaluate(() => ({
    comment: document.querySelector('.rv-pagebox-body textarea.rv-comment').value,
    reviewed: document.querySelector('.rv-reviewed').checked,
  }));
  check('a fresh browser shows the saved comment and mark', again.comment === COMMENT && again.reviewed, JSON.stringify(again));
  await context.close();

  // 4. after revoking, the tool says so
  await admin({ op: 'revoke', id: inv.id });
  ({ context, page } = await open(link));
  const said = await page.evaluate(() => document.body.textContent.includes('withdrawn'));
  check('a revoked link: the tool says it was withdrawn', said);
  await context.close();
} finally {
  await browser.close();
  const purge = await admin({ op: 'purge-invite', id: inv.id });
  await admin({ op: 'revoke', id: inv.id });
  console.log(`clean-up: ${purge.deleted} test entries removed, invitation revoked`);
}
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
