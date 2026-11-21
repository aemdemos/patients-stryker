#!/usr/bin/env node
/*
 * The whole review loop on the backend, in a browser, on a real standard page nobody has saved
 * anything on (a --page with other entries is refused, so a reviewer's work is never touched):
 * the reviewer (name from the link, read only; the link leaves the address bar) writes in the page's
 * chat, sends the page to the AOE team and switches a design, with Save (and Undo before); the
 * summary finds the comment; set-status sends the page back with a status; the reviewer answers
 * and sends it again; an AOE member writes with a status and sends it back in the tool; the
 * reviewer ticks the thread Done and approves (resolved); the results page; an interrupted save
 * is sent again; a revoked link is refused. Everything the test wrote is removed at the end and
 * the invitations revoked. Tokens are never printed.
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
  const open = async (url, ready = '.rv-pagebox-body .rv-chat') => {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.route(/altcha|captcha/, (r) => r.abort());
    await page.goto(url);
    await page.waitForFunction((sel) => document.querySelector(sel), ready, { timeout: 60000 });
    await page.waitForTimeout(3000);
    return { context, page };
  };
  const PAGE_CHAT = '.rv-pagebox-body';
  const send = async (p, text, chat = PAGE_CHAT) => {
    await p.fill(`${chat} textarea.rv-reply`, text);
    await p.click(`${chat} .rv-composer button:text-is("Send")`);
  };
  const setStatus = (p, label) => p.click(`.rv-status-actions button:text-is("${label}")`);
  const saveNow = async (p) => {
    const done = p.waitForResponse((r) => r.url().includes('std-review/save') && r.request().method() === 'POST', { timeout: 30000 });
    await p.click('.rv-save');
    const code = (await done).status();
    await p.waitForFunction(() => /All changes saved/.test(document.body.textContent), null, { timeout: 30000 }).catch(() => null);
    return code;
  };
  const banner = (p) => p.evaluate(() => ({
    text: document.querySelector('.rv-status-banner strong')?.textContent || '',
    badge: document.querySelector('.rv-page-badge')?.textContent || '',
  }));
  const bubbles = (p, chat = PAGE_CHAT) => p.evaluate((sel) => [...document.querySelectorAll(`${sel} .rv-bubble`)].map((b) => ({
    mine: b.classList.contains('rv-mine'), who: b.querySelector('.rv-msg-who')?.textContent || '', text: b.querySelector('.rv-msg-text')?.textContent || '', aoe: b.querySelector('.rv-aoe')?.textContent || '',
  })), chat);

  // 1. the reviewer: the first message on the page (the comment), a second one, the page sent to
  //    the AOE team, a design switch, all with Save
  let { context, page } = await open(link);
  const name = await page.evaluate(() => {
    const n = document.querySelector('.rv-reviewer');
    return { value: n.value, readOnly: n.readOnly };
  });
  check('the name comes from the link, read only', name.value === 'tool test backend' && name.readOnly, JSON.stringify(name));
  check('the link leaves the address bar', !(await page.evaluate(() => window.location.search)).includes('invite='));
  check('the status banner and the toolbar badge: not reviewed yet', (await banner(page)).text === 'Not reviewed yet' && (await banner(page)).badge === 'Not reviewed yet', JSON.stringify(await banner(page)));
  // Undo changes: unsaved changes go, the page is back at its saved state
  await send(page, 'a change to undo');
  await setStatus(page, 'In review');
  check('unsaved changes enable Undo changes', await page.evaluate(() => !document.querySelector('.rv-undo').disabled
    && /2 unsaved changes/.test(document.querySelector('.rv-status').textContent)));
  await page.click('.rv-undo');
  await page.click('dialog.rv-dialog button.rv-danger');
  await page.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  check('after Undo: no messages, no status, nothing to save', (await bubbles(page)).length === 0 && (await banner(page)).text === 'Not reviewed yet'
    && await page.evaluate(() => document.querySelector('.rv-undo').disabled && document.querySelector('.rv-save').disabled), JSON.stringify(await bubbles(page)));
  await send(page, COMMENT);
  await send(page, 'Ann, is this right?');
  let b = await bubbles(page);
  check('messages: newest at the bottom, mine on the right, with the author', b.length === 2 && b[1].text === 'Ann, is this right?' && b.every((x) => x.mine && x.who.startsWith('tool test backend')), JSON.stringify(b));
  check('… waiting for Save', await page.evaluate(() => document.querySelectorAll('.rv-pagebox-body .rv-msg-unsaved').length === 2));
  await setStatus(page, 'Send to the AOE team');
  check('the banner shows the unsaved status', /Waiting for the AOE team/.test((await banner(page)).text) && await page.evaluate(() => /Save to apply/.test(document.querySelector('.rv-status-banner').textContent)));
  // a block's chat opens with one click, its message box focused
  await page.click('.rv-panel-left .rv-chat-head .rv-comment-toggle');
  check('a block\'s chat opens at once, the message box focused', await page.evaluate(() => document.activeElement?.classList.contains('rv-reply')
    && !!document.activeElement.closest('.rv-panel-left')));
  await page.waitForFunction(() => document.querySelector('.rv-item button.rv-step[aria-label="Next variant"]'), null, { timeout: 60000 });
  await page.click('.rv-item button.rv-step[aria-label="Next variant"]');
  await page.waitForFunction(() => document.querySelector('.rv-item.rv-changed'), null, { timeout: 30000 });
  check('Save: the backend takes everything', await saveNow(page) === 200);
  check('… the banner: waiting for the AOE team, set by the reviewer', (await banner(page)).text === 'Waiting for the AOE team');
  await context.close();

  // 2. the backend has it all, written as the invitation's reviewer
  const rows = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE && r.reviewer === 'tool test backend');
  check('the backend has the comment (the first message)', rows.some((r) => r.kind === 'comment' && JSON.parse(r.value) === COMMENT), JSON.stringify(rows).slice(0, 300));
  check('… the second message', rows.filter((r) => r.kind.startsWith('reply:comment:')).length === 1);
  check('… the page status', rows.some((r) => r.kind === 'state' && JSON.parse(r.value) === 'waiting-aoe'));
  const choice = rows.find((r) => r.kind === 'variant');
  check('the design switch is saved under the block key, not its position', !!choice && /^b:[a-z-]+:[0-9a-f]{8}(#\d+)?$/.test(choice.item), JSON.stringify(choice));

  // 3. the AOE team: summary from the backend, then a status, the page sent back
  execFileSync('node', ['tools/review/summarise.mjs', '--out', out, '--themes', join(out, 'none.json'), '--base', base, '--ns', ns], { stdio: 'pipe' });
  const items = JSON.parse(readFileSync(join(out, 'work-items.json'), 'utf8')).items;
  const item = items.find((it) => it.id === `page:${PAGE}`);
  check('the summary has the comment as a page work item', !!item && item.evidence.some((e) => e.text === COMMENT), JSON.stringify(items.map((it) => it.id)));
  const status = execFileSync('node', ['tools/review/set-status.mjs', '--work', join(out, 'work-items.json'), '--item', `page:${PAGE}`,
    '--state', 'done', '--release', 'r-test', '--reason', 'loop test', '--send-back', '--ns', ns], { encoding: 'utf8' });
  check('set-status: a message with the status, the page sent back', /1 of 1 AOE answers saved/.test(status), status);

  // 4. a fresh browser: the chat, the status, the design switch
  ({ context, page } = await open(link));
  await page.waitForFunction(() => document.querySelector('.rv-item'), null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  b = await bubbles(page);
  check('… and the saved design switch, found by its key', await page.evaluate(() => document.querySelectorAll('.rv-item.rv-changed').length === 1));
  check('a fresh browser: the comment first, mine; the AOE message on the left with its status', b[0]?.text === COMMENT && b[0].mine
    && b.some((x) => !x.mine && /AOE: done in r-test/.test(x.aoe)), JSON.stringify(b));
  check('… the banner: waiting for the customer', (await banner(page)).text === 'Waiting for the customer', JSON.stringify(await banner(page)));
  await send(page, 'Not quite: the image is still small.');
  await setStatus(page, 'Send to the AOE team');
  await saveNow(page);
  check('the reviewer answers and sends the page to the AOE team again', (await banner(page)).text === 'Waiting for the AOE team');
  await context.close();

  // 5. the AOE team in the tool: a message with a status, the page sent back
  aoeInv = await admin({
    op: 'invite', name: 'tool test AOE', paths: [PAGE], days: 1, role: 'aoe',
  });
  const aoeLink = `${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}&invite=${encodeURIComponent(aoeInv.token)}`;
  ({ context, page } = await open(aoeLink));
  const aoeButtons = await page.evaluate(() => [...document.querySelectorAll('.rv-status-actions button')].map((x) => x.textContent));
  check('the AOE member: name with (AOE), one status button: send back to the customer', (await page.evaluate(() => document.querySelector('.rv-reviewer').value)) === 'tool test AOE (AOE)'
    && aoeButtons.join() === 'Send back to the customer', JSON.stringify(aoeButtons));
  check('… sees every message, the reviewer\'s on the left', (await bubbles(page)).filter((x) => !x.mine).length >= 3);
  await page.selectOption(`${PAGE_CHAT} select.rv-reply-status`, 'done');
  await page.fill(`${PAGE_CHAT} input.rv-reply-release`, 'r-ui');
  await send(page, 'Enlarged the image to the live page size.');
  await setStatus(page, 'Send back to the customer');
  check('the AOE member saves a message with a status and sends the page back', await saveNow(page) === 200
    && (await banner(page)).text === 'Waiting for the customer', JSON.stringify(await banner(page)));
  await context.close();

  // 6. the reviewer: ticks the thread Done, approves the page
  ({ context, page } = await open(link));
  b = await bubbles(page);
  check('the reviewer sees the AOE message with its status', b.some((x) => !x.mine && /AOE: done in r-ui/.test(x.aoe)), JSON.stringify(b));
  await page.check(`${PAGE_CHAT} input.rv-done`);
  await setStatus(page, 'Approve');
  await saveNow(page);
  check('ticked Done and approved: the page is resolved', (await banner(page)).text === 'Resolved' && await page.evaluate(() => document.querySelector('.rv-pagebox-body input.rv-done').checked), JSON.stringify(await banner(page)));
  await context.close();
  const thread = (await admin({ op: 'export' })).rows.filter((r) => r.page === PAGE && r.item === 'page' && (r.kind.startsWith('reply:comment:') || r.kind === 'done:comment'));
  check('the backend has the chat and the Done mark, each with its author and role', thread.filter((r) => r.kind.startsWith('reply:')).length === 4
    && thread.some((r) => r.reviewer === 'tool test AOE' && r.role === 'aoe') && thread.some((r) => r.kind === 'done:comment' && JSON.parse(r.value) === true),
  JSON.stringify(thread.map((r) => [r.reviewer, r.role, r.kind.split(':')[0]])));

  // 7. the results page with the results right
  ({ context, page } = await open(`${base}/tools/review/results.html?invite=${encodeURIComponent(inv.token)}`, '#comments table'));
  const res = await page.evaluate((text) => {
    const row = [...document.querySelectorAll('#comments tr')].find((tr) => tr.textContent.includes(text));
    return { found: !!row, aoe: row?.lastElementChild?.textContent || '', search: window.location.search };
  }, COMMENT);
  check('the results page lists the comment: done, with the AOE status', res.found && /done · done, in r-ui/.test(res.aoe), JSON.stringify(res));
  check('… and keeps the link out of the address bar', !res.search.includes('invite='));
  await context.close();

  // 8. a save cut off by closing the page at once: sent again on the next visit
  ({ context, page } = await open(link));
  const LATER = `${COMMENT} (sent again)`;
  await send(page, LATER);
  await page.click('.rv-save');
  await page.close({ runBeforeUnload: false });
  const again2 = await context.newPage();
  await again2.route(/altcha|captcha/, (r) => r.abort());
  await again2.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(PAGE)}`);
  await again2.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 60000 });
  await again2.waitForTimeout(5000);
  const later = (await admin({ op: 'export' })).rows.some((r) => r.page === PAGE && r.kind.startsWith('reply:comment:') && JSON.parse(r.value).text === LATER);
  check('an interrupted save is sent again on the next visit', later);
  await context.close();

  // 9. after revoking, the tool says so
  await admin({ op: 'revoke', id: inv.id });
  ({ context, page } = await open(link, '.rv-pagebox-body'));
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
