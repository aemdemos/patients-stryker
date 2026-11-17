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
let aoeInv = null;
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

  const threadOn = (p) => p.evaluate(() => ({
    state: document.querySelector('.rv-pagebox-body .rv-thread-state')?.textContent || '',
    msgs: document.querySelectorAll('.rv-pagebox-body .rv-msg').length,
  }));
  // a thread action (Reply, Send to …, Resolve): an unsaved change until Save
  const act = async (p, button, text) => {
    if (text !== undefined) await p.fill('.rv-pagebox-body textarea.rv-reply', text);
    await p.click(`.rv-pagebox-body .rv-reply-actions button:text-is("${button}")`);
  };
  const saveNow = async (p) => {
    const done = p.waitForResponse((r) => r.url().includes('std-review/save') && r.request().method() === 'POST', { timeout: 30000 });
    await p.click('.rv-save');
    const code = (await done).status();
    await p.waitForFunction(() => /All changes saved/.test(document.body.textContent), null, { timeout: 30000 }).catch(() => null);
    return code;
  };
  const pressed = (p) => p.evaluate(() => [...document.querySelectorAll('.rv-page-state')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent));

  // 1. the reviewer: a comment discussed internally, sent to the AOE team, the page approved,
  //    a design switch, all with Save
  let { context, page } = await open(link);
  const name = await page.evaluate(() => {
    const n = document.querySelector('.rv-reviewer');
    return { value: n.value, readOnly: n.readOnly };
  });
  check('the name comes from the link, read only', name.value === 'tool test backend' && name.readOnly, JSON.stringify(name));
  check('the link leaves the address bar', !(await page.evaluate(() => window.location.search)).includes('invite='));
  // Undo changes: unsaved changes go, the page is back at its saved state
  await page.fill('.rv-pagebox-body textarea.rv-comment', 'a change to undo');
  await page.dispatchEvent('.rv-pagebox-body textarea.rv-comment', 'change');
  await page.click('.rv-page-state-in-review');
  check('unsaved changes enable Undo changes', await page.evaluate(() => !document.querySelector('.rv-undo').disabled
    && /2 unsaved changes/.test(document.querySelector('.rv-status').textContent)));
  await page.click('.rv-undo');
  await page.click('dialog.rv-dialog button.rv-danger');
  await page.waitForFunction(() => document.querySelector('.rv-pagebox-body textarea.rv-comment'), null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  const undone = await page.evaluate(() => ({
    comment: document.querySelector('.rv-pagebox-body textarea.rv-comment').value,
    undo: document.querySelector('.rv-undo').disabled,
    save: document.querySelector('.rv-save').disabled,
    drafts: window.localStorage.getItem('std-review-drafts'),
  }));
  check('after Undo: no comment, no page state, nothing to save', undone.comment === '' && (await pressed(page)).length === 0 && undone.undo && undone.save
    && !(undone.drafts || '').includes('a change to undo'), JSON.stringify(undone));
  await page.fill('.rv-pagebox-body textarea.rv-comment', COMMENT);
  await page.dispatchEvent('.rv-pagebox-body textarea.rv-comment', 'change');
  check('a new comment: its thread starts in discussion, not sent yet', /^In discussion · not sent to the AOE team yet/.test((await threadOn(page)).state), JSON.stringify(await threadOn(page)));
  await act(page, 'Reply', 'Ann, is this right?');
  await act(page, 'Send to the AOE team', 'Please enlarge the image.');
  check('messages wait for Save, marked unsaved', await page.evaluate(() => document.querySelectorAll('.rv-pagebox-body .rv-msg-unsaved').length === 2)
    && /^Sent to the AOE team/.test((await threadOn(page)).state), JSON.stringify(await threadOn(page)));
  await page.click('.rv-page-state-approved');
  await page.waitForFunction(() => document.querySelector('.rv-item button.rv-step[aria-label="Next variant"]'), null, { timeout: 60000 });
  await page.click('.rv-item button.rv-step[aria-label="Next variant"]');
  await page.waitForFunction(() => document.querySelector('.rv-item.rv-changed'), null, { timeout: 30000 });
  check('Save: the backend takes everything', await saveNow(page) === 200);
  await context.close();

  // 2. the backend has it all, written as the invitation's reviewer; the AOE side sees the thread
  const rows = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE && r.reviewer === 'tool test backend');
  check('the backend has the comment', rows.some((r) => r.kind === 'comment' && JSON.parse(r.value) === COMMENT), JSON.stringify(rows).slice(0, 300));
  check('… the internal reply and the handover', rows.filter((r) => r.kind.startsWith('reply:comment:')).length === 2
    && rows.some((r) => r.kind.startsWith('reply:comment:') && JSON.parse(r.value).action === 'handover'));
  check('… the page approved', rows.some((r) => r.kind === 'state' && JSON.parse(r.value) === 'approved'));
  const choice = rows.find((r) => r.kind === 'variant');
  check('the design switch is saved under the block key, not its position', !!choice && /^b:[a-z-]+:[0-9a-f]{8}(#\d+)?$/.test(choice.item), JSON.stringify(choice));

  // 3. the AOE team: summary from the backend (what was handed over), then a status
  execFileSync('node', ['tools/review/summarise.mjs', '--out', out, '--themes', join(out, 'none.json'), '--base', base, '--ns', ns], { stdio: 'pipe' });
  const items = JSON.parse(readFileSync(join(out, 'work-items.json'), 'utf8')).items;
  const item = items.find((it) => it.id === `page:${PAGE}`);
  check('the summary has the handed-over comment as a page work item', !!item && item.evidence.some((e) => e.text === COMMENT), JSON.stringify(items.map((it) => it.id)));
  const status = execFileSync('node', ['tools/review/set-status.mjs', '--work', join(out, 'work-items.json'), '--item', `page:${PAGE}`,
    '--state', 'done', '--release', 'r-test', '--reason', 'loop test', '--ns', ns], { encoding: 'utf8' });
  check('set-status sends it back with the status', /1 of 1 AOE answers saved/.test(status), status);

  // 4. a fresh browser: the comment, the page state, the design switch, the AOE status
  ({ context, page } = await open(link));
  await page.waitForFunction(() => document.querySelector('.rv-item'), null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const again = await page.evaluate(() => ({
    comment: document.querySelector('.rv-pagebox-body textarea.rv-comment').value,
    aoe: document.querySelector('.rv-pagebox-body .rv-aoe')?.textContent || '',
  }));
  check('… and the saved design switch, found by its key', await page.evaluate(() => document.querySelectorAll('.rv-item.rv-changed').length === 1));
  check('a fresh browser shows the comment and the approved page', again.comment === COMMENT && (await pressed(page)).join() === 'Approved', JSON.stringify({ ...again, pressed: await pressed(page) }));
  check('… and the thread sent back with the AOE status', /^Answered · waiting for you/.test((await threadOn(page)).state) && /AOE: done in r-test/.test(again.aoe), JSON.stringify(await threadOn(page)));

  // 5. the back and forth: a plain reply changes nothing, sending it on does
  await act(page, 'Reply', 'Not quite: the image is still small.');
  await saveNow(page);
  check('a plain reply keeps the turn (still answered)', /^Answered/.test((await threadOn(page)).state), JSON.stringify(await threadOn(page)));
  await act(page, 'Send to the AOE team', 'Could you check again?');
  await saveNow(page);
  check('"Send to the AOE team" hands it over', /^Sent to the AOE team/.test((await threadOn(page)).state), JSON.stringify(await threadOn(page)));
  await context.close();

  aoeInv = await admin({
    op: 'invite', name: 'tool test AOE', paths: [PAGE], days: 1, role: 'aoe',
  });
  const aoeLink = `${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&invite=${encodeURIComponent(aoeInv.token)}`;
  ({ context, page } = await open(aoeLink));
  check('the AOE member: name with (AOE), the thread waits for them, page state read only', (await page.evaluate(() => document.querySelector('.rv-reviewer').value)) === 'tool test AOE (AOE)'
    && /^Waiting for you/.test((await threadOn(page)).state) && await page.evaluate(() => !!document.querySelector('.rv-page-state-ro') && !document.querySelector('.rv-page-state')), JSON.stringify(await threadOn(page)));
  await act(page, 'Reply', 'Internal: which token do we change?');
  await page.selectOption('.rv-pagebox-body select.rv-reply-status', 'done');
  await page.fill('.rv-pagebox-body input.rv-reply-release', 'r-ui');
  await act(page, 'Send back to the reviewers', 'Enlarged the image to the live page size.');
  check('the AOE member saves an internal reply and sends it back with a status', await saveNow(page) === 200
    && /^Sent back to the reviewers/.test((await threadOn(page)).state), JSON.stringify(await threadOn(page)));
  await context.close();

  ({ context, page } = await open(link));
  const seen = await page.evaluate(() => document.querySelector('.rv-pagebox-body .rv-thread').textContent);
  check('the reviewer sees the full thread, the AOE internal reply too, and the status', /Internal: which token/.test(seen) && /AOE: done in r-ui/.test(seen), seen.slice(0, 200));
  await act(page, 'Resolve');
  await saveNow(page);
  check('the reviewer resolves the thread', /^Resolved · closed/.test((await threadOn(page)).state), JSON.stringify(await threadOn(page)));
  await context.close();
  const thread = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE && r.item === 'page' && r.kind.startsWith('reply:comment:'));
  check('the backend has the whole thread, each message with its author and role', thread.length === 8
    && thread.some((r) => r.reviewer === 'tool test AOE' && r.role === 'aoe')
    && thread.some((r) => r.reviewer === 'tool test backend' && JSON.parse(r.value).action === 'resolve'), JSON.stringify(thread.map((r) => [r.reviewer, r.role, JSON.parse(r.value).action || 'reply'])));

  // 6. the results page with the results right
  ({ context, page } = await open(`${base}/tools/review/results.html?invite=${encodeURIComponent(inv.token)}`, '#comments table'));
  const res = await page.evaluate((text) => {
    const row = [...document.querySelectorAll('#comments tr')].find((tr) => tr.textContent.includes(text));
    return { found: !!row, aoe: row?.lastElementChild?.textContent || '', search: window.location.search };
  }, COMMENT);
  check('the results page lists the comment: resolved, with the AOE status', res.found && /resolved · done, in r-ui/.test(res.aoe), JSON.stringify(res));
  check('… and keeps the link out of the address bar', !res.search.includes('invite='));
  await context.close();

  // 7. a save cut off by closing the page at once: sent again on the next visit
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

  // 8. after revoking, the tool says so
  await admin({ op: 'revoke', id: inv.id });
  ({ context, page } = await open(link));
  check('a revoked link: the tool says it was withdrawn', await page.evaluate(() => document.body.textContent.includes('withdrawn')));
  await context.close();
} finally {
  await browser.close();
  const purge = await admin({ op: 'purge-invite', id: inv.id });
  await admin({ op: 'revoke', id: inv.id });
  if (aoeInv) {
    await admin({ op: 'purge-invite', id: aoeInv.id });
    await admin({ op: 'revoke', id: aoeInv.id });
  }
  console.log(`clean-up: ${purge.deleted} test entries and ${purge.statuses} statuses removed, invitation revoked`);
}
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
