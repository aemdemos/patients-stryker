#!/usr/bin/env node
/*
 * The standard-pages review (space std) with the parts shared with the client review, in the
 * browser, read only: the tool keeps its design panel, the as-is comparison and its two widths;
 * the Feedback panel's Edit in DA (/std) and Invitations links for the AOE team; the Source shot
 * box without a history; the status page from pages.json with the organising box for the AOE
 * team and no migration scope box; the Invitations page listing std invitations only. Test
 * invitations, revoked and forgotten after. Needs the local preview of standardise-v3.
 * usage: node tools/review/backend/test/std-shared.test.mjs [base, default http://localhost:3000] [page]
 */
import { createRequire } from 'module';
import { actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

async function admin(p) {
  const resp = await fetch(actionUrl(), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  return JSON.parse(await resp.text()).body;
}
const [base = 'http://localhost:3000', PAGE = '/us/en/foot-and-ankle/products/prophecy'] = process.argv.slice(2);
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const aoe = await admin({
  op: 'invite', name: 'tool test std shared aoe', paths: ['/'], days: 1, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test std shared reviewer', paths: ['/'], days: 1,
});
const browser = await chromium.launch();
const errors = [];
const open = async (token, path) => {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await p.goto(`${base}/tools/review/${path}${path.includes('?') ? '&' : '?'}invite=${encodeURIComponent(token)}`, { waitUntil: 'load' });
  return { ctx, p };
};
try {
  {
    const { ctx, p } = await open(aoe.token, `index.html?page=${encodeURIComponent(PAGE)}`);
    await p.waitForFunction(() => document.querySelector('.rv-pagebox-body .rv-chat'), null, { timeout: 90000 });
    await p.waitForTimeout(3000);
    const r = await p.evaluate(() => ({
      left: !!document.querySelector('.rv-panel-left'),
      blocks: document.querySelectorAll('.rv-blocks li').length,
      widths: [...document.querySelectorAll('[data-vp]')].map((b) => b.dataset.vp),
      cmp: [...document.querySelectorAll('[data-cmp]')].map((b) => b.dataset.cmp),
      frame: document.querySelector('.rv-std iframe').getAttribute('src'),
      links: [...document.querySelectorAll('.rv-links a')].map((a) => ({ t: a.textContent, h: a.getAttribute('href'), v: a.offsetParent !== null })),
      shot: document.querySelector('.rv-shotbox-body')?.textContent || '',
    }));
    check('std tool: no design panel (off since 25 Nov 2026: comments and QA notes only)', !r.left && r.blocks === 0, JSON.stringify(r).slice(0, 200));
    check('std tool: Desktop and Phone, as-is and source', JSON.stringify(r.widths) === '["1440","375"]' && r.cmp.includes('rs') && r.cmp.includes('src'), JSON.stringify(r));
    check('std tool: the standard page in the frame, as it is (no switcher)', /\/content\/std\/us\/en\/[^?]+$/.test(r.frame), r.frame);
    const edit = r.links.find((l) => /Edit in Document Authoring/.test(l.t));
    check('std tool: Edit in DA opens the /std document', edit && edit.v && edit.h.endsWith(`/stryker-com/std${PAGE}`), JSON.stringify(edit));
    check('std tool: Invitations link for the AOE team', r.links.some((l) => /Invitations/.test(l.t) && l.v));
    check('std tool: the shot box says there is no history yet', /No shot history for this page yet/.test(r.shot), r.shot);
    await ctx.close();
  }
  {
    const { ctx, p } = await open(aoe.token, 'status.html');
    await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''));
    const r = await p.evaluate(() => ({
      count: document.querySelector('.st-count').textContent,
      mark: !document.querySelector('.st-mark').hidden,
      scope: !document.querySelector('.st-scope').hidden,
      templates: document.querySelectorAll('.st-template option').length,
    }));
    check('std status: the 672 standard pages (pages.json)', /of 672 pages/.test(r.count), r.count);
    check('std status: organising for the AOE team, no migration scope box', r.mark && !r.scope, JSON.stringify(r));
    check('std status: template filter', r.templates > 1);
    await ctx.close();
  }
  {
    const { ctx, p } = await open(rev.token, 'status.html');
    await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''));
    const hidden = await p.evaluate(() => document.querySelector('.st-mark').hidden && document.querySelector('.ui-nav-invites').hidden);
    check('std status: the customer sees no AOE parts', hidden);
    await ctx.close();
  }
  {
    const { ctx, p } = await open(aoe.token, 'invites.html');
    await p.waitForSelector('.iv-table tbody tr');
    const names = await p.$$eval('.iv-table tbody tr', (rs) => rs.map((tr) => tr.cells[0].textContent));
    check('std invitations: this review\'s only', names.some((n) => /tool test std shared reviewer/.test(n)) && !names.some((n) => /^chelms@adobe\.com$/.test(n)), JSON.stringify(names.slice(0, 8)));
    await ctx.close();
  }
} finally {
  await browser.close();
  await admin({ op: 'revoke', id: aoe.id });
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
  check('no page errors', !errors.length, errors.join(' | '));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
