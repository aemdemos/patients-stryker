#!/usr/bin/env node
/*
 * Review tool in the browser: the migration scope. Read only (no saves): the status page for the
 * AOE team (the whole scope, "Not published yet", the scope box, the template filter) and for a
 * reviewer (published pages only, no scope box); the tool showing a shot the backend took (the
 * tiles through the tile action); the first page of a group as representative (batches.js).
 * Test invitations, revoked and forgotten after. Needs the dev server of the review branch.
 * usage: node tools/review/backend/test/scope-tool.test.mjs <base> [page with a backend shot]
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
const [base = 'http://localhost:3220', SHOT_PAGE = '/us/en/joint-replacement/sps-blog/2018/bpci-a-team-last-but-not-least'] = process.argv.slice(2);
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const aoe = await admin({
  op: 'invite', name: 'tool test scope ui aoe', paths: ['/'], days: 1, space: 'main', role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test scope ui reviewer', paths: ['/'], days: 1, space: 'main',
});
const browser = await chromium.launch();
const errors = [];
const open = async (token, path) => {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await p.goto(`${base}/tools/review/${path}${path.includes('?') ? '&' : '?'}invite=${encodeURIComponent(token)}`, { waitUntil: 'load' });
  return { ctx, p };
};
try {
  {
    const { ctx, p } = await open(aoe.token, 'status.html');
    await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''));
    const r = await p.evaluate(() => ({
      count: document.querySelector('.st-count').textContent,
      scope: !document.querySelector('.st-scope').hidden && document.querySelector('.st-scope-sum').textContent,
      body: document.querySelector('.st-scope-body').textContent,
      tiles: [...document.querySelectorAll('.st-tile')].map((t) => t.textContent),
      templates: document.querySelectorAll('.st-template option').length,
      chip: [...document.querySelectorAll('.st-chip.st-unpublished')].length,
    }));
    check('AOE: the whole scope listed', /of 25\d\d pages/.test(r.count), r.count);
    check('AOE: the scope box with counts', /Migration scope: \d+ pages, \d+ published/.test(r.scope || ''), r.scope);
    check('AOE: rows to correct listed', /Rows of the scope table to correct \(1\)/.test(r.body), r.body.slice(0, 300));
    check('AOE: a browser check / last run shown', /Last capture|No capture run/.test(r.body));
    check('AOE: Not published yet tile', r.tiles.some((t) => /Not published yet/.test(t)), JSON.stringify(r.tiles));
    check('AOE: template filter filled', r.templates > 5, String(r.templates));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(rev.token, 'status.html');
    await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''));
    const r = await p.evaluate(() => ({
      count: document.querySelector('.st-count').textContent,
      scope: document.querySelector('.st-scope').hidden,
      tiles: [...document.querySelectorAll('.st-tile')].map((t) => t.textContent),
    }));
    check('reviewer: published pages only', /of \d+ pages/.test(r.count), r.count);
    check('reviewer: no scope box, no Not published yet', r.scope && !r.tiles.some((t) => /Not published/.test(t)), JSON.stringify(r));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(rev.token, `index.html?page=${encodeURIComponent(SHOT_PAGE)}&vp=375`);
    await p.waitForFunction(() => document.querySelectorAll('.rv-src-page img').length > 0, null, { timeout: 60000 });
    await p.evaluate(() => document.querySelectorAll('.rv-src-page img').forEach((i) => i.scrollIntoView()));
    await p.waitForTimeout(4000);
    const r = await p.evaluate(() => ({
      tiles: [...document.querySelectorAll('.rv-src-page img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 })),
      options: [...document.querySelectorAll('.rv-shot-pick option')].map((o) => o.textContent),
      tag: document.querySelector('.rv-src .rv-tag').textContent,
    }));
    check('tool: the backend\'s shot shown through the tile action', r.tiles.length > 0 && r.tiles.every((t) => /\/tile\?/.test(t.src) && t.ok), JSON.stringify(r.tiles).slice(0, 300));
    check('tool: the history has it as the first shot', r.options.length >= 1 && /first shot/.test(r.options[r.options.length - 1]), JSON.stringify(r.options));
    const reps = await p.evaluate(async () => {
      const { markFirstRepresentatives, orgLabel } = await import('./batches.js');
      const items = [
        { path: '/b', group: 1 }, { path: '/a', group: 1 }, { path: '/c', group: 2, representative: true }, { path: '/d', group: 2 },
      ];
      markFirstRepresentatives(items);
      return items.map((i) => orgLabel(i));
    });
    check('groups: the first page stands in (☆), a chosen one wins (★)', JSON.stringify(reps) === JSON.stringify(['Group 1', 'Group 1 ☆', 'Group 2 ★', 'Group 2']), JSON.stringify(reps));
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
