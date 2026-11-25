#!/usr/bin/env node
/*
 * Review tool in the browser: the AOE team's Invitations page and the links to it. Test
 * invitations only (main space, /test pages, 1 day): a reviewer is turned away; an AOE sees the
 * list (itself marked, no Revoke), makes an invitation (the link shown once, listed with who made
 * it), can't go beyond its own pages, revokes in two steps (hidden unless revoked ones are
 * shown); the links on the status page and in the tool for the AOE team only. Then every test
 * invitation is revoked and forgotten. Needs the dev server of the review branch and the
 * workspace credential.
 * usage: node tools/review/backend/test/invites-tool.test.mjs <base, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { TEST, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

async function admin(p, namespace = TEST.ns) {
  const resp = await fetch(actionUrl(namespace), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}

const [base = 'http://localhost:3220'] = process.argv.slice(2);
const SPACE = 'main';
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};

const aoe = await admin({
  op: 'invite', name: 'tool test inv ui aoe', paths: ['/test'], days: 1, space: SPACE, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test inv ui reviewer', paths: ['/test'], days: 1, space: SPACE,
});
const browser = await chromium.launch();
const errors = [];
const open = async (token, path) => {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(40000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await p.goto(`${base}/tools/review/${path}${path.includes('?') ? '&' : '?'}invite=${encodeURIComponent(token)}`, { waitUntil: 'load' });
  return { ctx, p };
};
const rows = (p) => p.$$eval('.iv-table tbody tr', (rs) => rs.map((r) => ({
  name: r.cells[0].textContent, made: r.cells[3].textContent, state: r.cells[5].textContent, revoke: !!r.cells[6].querySelector('button'),
})));
try {
  {
    const { ctx, p } = await open(rev.token, 'invites.html');
    await p.waitForFunction(() => !document.querySelector('.iv-denied').hidden);
    check('reviewer: turned away, no form', /Only the AOE team/.test(await p.textContent('.iv-denied')) && await p.$eval('.iv-new', (e) => e.hidden));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(aoe.token, 'invites.html');
    await p.waitForSelector('.iv-table tbody tr');
    let r = await rows(p);
    const meRow = r.find((x) => x.name.startsWith('tool test inv ui aoe'));
    check('AOE: list, itself marked (you), no Revoke on it', meRow && /\(you\)/.test(meRow.name) && !meRow.revoke, JSON.stringify(meRow));
    check('AOE: the reviewer listed with Revoke', r.some((x) => x.name === 'tool test inv ui reviewer' && x.revoke));
    check('AOE: pages default to its own', (await p.inputValue('.iv-paths')) === '/test');
    check('no "results" option any more (every invitation opens the summary)', !(await p.$('.iv-results')));
    await p.fill('.iv-name', 'tool test inv ui made');
    await p.fill('.iv-days', '1');
    await p.click('.iv-create');
    await p.waitForFunction(() => /Invitation for tool test inv ui made/.test(document.querySelector('.iv-made').textContent));
    const link = await p.$eval('.iv-link input', (i) => i.value);
    // (on Stage the link also names Stage's backend: ?backend=stage&invite=…)
    check('create: the link shown once, with Copy', /\/tools\/review\/launch\.html\?(backend=stage&)?invite=/.test(link) && !!(await p.$('.iv-link button')));
    const links = await p.$$eval('.iv-link input', (l) => l.map((i) => i.value));
    check('create: a reviewer\'s invitation comes with its summary link too', links.some((l) => /\/tools\/review\/summary\.html\?backend=stage&invite=/.test(l)), JSON.stringify(links.map((l) => l.replace(/invite=[^&]+/, 'invite=…'))));
    await p.waitForFunction(() => [...document.querySelectorAll('.iv-table tbody tr')].some((tr) => tr.cells[0].textContent === 'tool test inv ui made'));
    r = await rows(p);
    check('create: listed, made by the AOE', r.some((x) => x.name === 'tool test inv ui made' && /by tool test inv ui aoe/.test(x.made) && x.state === 'Active'), JSON.stringify(r));
    await p.fill('.iv-name', 'tool test inv ui outside');
    await p.fill('.iv-paths', '/us/en');
    await p.click('.iv-create');
    await p.waitForSelector('.iv-made .iv-error');
    check('create: beyond its own pages refused', /not part of your own invitation/.test(await p.textContent('.iv-made')));
    const row = p.locator('.iv-table tbody tr', { hasText: 'tool test inv ui reviewer' });
    await row.locator('button', { hasText: 'Revoke' }).click();
    check('revoke: asks first', await row.locator('.iv-revoke-yes').count() === 1);
    await row.locator('button', { hasText: 'Cancel' }).click();
    check('revoke: Cancel goes back', await row.locator('.iv-revoke-yes').count() === 0);
    await row.locator('button', { hasText: 'Revoke' }).click();
    await row.locator('.iv-revoke-yes').click();
    await p.waitForFunction(() => ![...document.querySelectorAll('.iv-table tbody tr')].some((tr) => tr.cells[0].textContent === 'tool test inv ui reviewer'));
    check('revoke: gone from the active list', true);
    await p.check('.iv-all');
    r = await rows(p);
    const revoked = r.find((x) => x.name === 'tool test inv ui reviewer');
    check('revoke: shown as revoked, by whom', revoked && /Revoked/.test(revoked.state) && /by tool test inv ui aoe/.test(revoked.state), JSON.stringify(revoked));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(aoe.token, 'status.html');
    await p.waitForFunction(() => !/Loading/.test(document.querySelector('.rs-updated').textContent));
    check('status page: Invitations for the AOE team', await p.$eval('.ui-nav-invites', (e) => !e.hidden));
    await ctx.close();
  }
  {
    const fresh = await admin({
      op: 'invite', name: 'tool test inv ui reviewer 2', paths: ['/test'], days: 1, space: SPACE,
    });
    const { ctx, p } = await open(fresh.token, 'status.html');
    await p.waitForFunction(() => !/Loading/.test(document.querySelector('.rs-updated').textContent));
    check('status page: no Invitations for reviewers', await p.$eval('.ui-nav-invites', (e) => e.hidden));
    await ctx.close();
    await admin({ op: 'revoke', id: fresh.id });
  }
  {
    const { ctx, p } = await open(aoe.token, 'index.html?page=%2Ftest%2Fx');
    await p.waitForTimeout(6000);
    const a = await p.$$eval('.rv-links a', (as) => as.filter((x) => /Invitations/.test(x.textContent)).map((x) => ({ href: x.getAttribute('href'), visible: x.offsetParent !== null })));
    check('tool: Invitations link for the AOE team', a.length === 1 && a[0].visible && a[0].href === './invites.html', JSON.stringify(a));
    await ctx.close();
  }
} finally {
  await browser.close();
  const mine = (await admin({ op: 'invites', space: SPACE })).invites.filter((i) => /^tool test inv ui/.test(i.name) && !i.revoked);
  await Promise.all(mine.map((i) => admin({ op: 'revoke', id: i.id })));
  await admin({ op: 'revoke', id: aoe.id });
  await admin({ op: 'revoke', id: rev.id });
  const forgot = await admin({ op: 'forget-test-invites' });
  check('test invitations revoked and forgotten', forgot.forgotten >= 3, JSON.stringify(forgot));
  check('no page errors', !errors.length, errors.join(' | '));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
