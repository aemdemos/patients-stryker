#!/usr/bin/env node
/*
 * Review tool in the browser: the Source shot box. Read only on a real page (its first shot from
 * the history, the tiles shown); the rest on a test page with a test history of two versions: the
 * history select (newest first, an earlier shot shown and said so), Refresh for the AOE team
 * (the request shown, the button off), reviewers without the button. Then purge-test and the
 * invitations revoked. Needs the dev server of the review branch and the workspace credential.
 * usage: node tools/review/backend/test/shots-tool.test.mjs <base, e.g. http://localhost:3220> [real page]
 */
import { createRequire } from 'module';
import { TEST as WORKSPACE, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

async function admin(p, namespace = WORKSPACE.ns) {
  const resp = await fetch(actionUrl(namespace), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}

// (a page with only its first shot: /us/en/search has a refresh since 23 Nov)
const [base = 'http://localhost:3220', REAL = '/us/en/about/news/2020/stryker-launches-ambulatory-surgery-center-focused-business'] = process.argv.slice(2);
const TEST = '/test/client-review-shots-ui';
const SPACE = 'main';
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const version = (id, dir, captured) => ({
  id,
  dir,
  url: 'https://www.stryker.com/us/en/search.html',
  captured,
  by: 'shots ui test',
  widths: Object.fromEntries([1440, 860, 375].map((w) => [w, {
    captured, width: w, height: 900, tiles: [{ y: 0, h: 900, file: '0.jpg', sha256: 'b'.repeat(64) }], leaves: [{ key: 't:test text here', y: 10 }],
  }])),
});

const aoe = await admin({
  op: 'invite', name: 'tool test shots ui aoe', paths: ['/'], days: 1, space: SPACE, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test shots ui reviewer', paths: ['/'], days: 1, space: SPACE,
});
const browser = await chromium.launch();
const errors = [];
const open = async (token, page) => {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(40000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await p.goto(`${base}/tools/review/index.html?invite=${encodeURIComponent(token)}&page=${encodeURIComponent(page)}`, { waitUntil: 'load' });
  await p.waitForFunction(() => document.querySelector('.rv-shotbox-body')?.children.length > 0 && !/shows with your review link/.test(document.querySelector('.rv-shotbox-body').textContent));
  await p.waitForTimeout(1500);
  return { ctx, p };
};
const box = (p) => p.evaluate(() => ({
  options: [...document.querySelectorAll('.rv-shot-pick option')].map((o) => o.textContent),
  info: document.querySelector('.rv-shot-info')?.textContent || '',
  req: document.querySelector('.rv-shot-req')?.textContent || '',
  button: (() => {
    const b = document.querySelector('.rv-shot-refresh');
    return b ? { visible: b.offsetParent !== null, disabled: b.disabled, text: b.textContent } : null;
  })(),
  tag: document.querySelector('.rv-src .rv-tag')?.textContent || '',
  tiles: [...document.querySelectorAll('.rv-src-page img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 })),
}));
try {
  await admin({ op: 'purge-test', page: TEST, space: SPACE });
  // a real page, read only: its first shot
  {
    const { ctx, p } = await open(aoe.token, REAL);
    await p.evaluate(() => document.querySelectorAll('.rv-src-page img').forEach((i) => i.scrollIntoView()));
    await p.waitForTimeout(3000);
    const b = await box(p);
    check('real page: one shot, the first', b.options.length === 1 && /first shot/.test(b.options[0]), JSON.stringify(b.options));
    check('real page: date and source URL', /Taken .* of www\.stryker\.com\/us\/en\/about\/news\/2020\//.test(b.info) && /One shot so far/.test(b.info), b.info);
    check('real page: tiles from the first shot\'s place, loaded', b.tiles.length > 0 && b.tiles.every((t) => t.src.endsWith(`${REAL}/1440/0.jpg`) && t.ok), JSON.stringify(b.tiles));
    check('real page: AOE sees Refresh', b.button?.visible && !b.button.disabled && b.button.text === 'Refresh source shot', JSON.stringify(b.button));
    await ctx.close();
  }
  await admin({
    op: 'shot-add',
    space: SPACE,
    items: [
      { page: TEST, version: version('s-20261123-080000', '', '2026-11-23T08:00:00.000Z') },
      { page: TEST, version: version('s-20261124-090000', '/s-20261124-090000', '2026-11-24T09:00:00.000Z') },
    ],
  });
  {
    const { ctx, p } = await open(aoe.token, TEST);
    let b = await box(p);
    check('test page: newest first, both marked', b.options.length === 2 && /newest/.test(b.options[0]) && /first shot/.test(b.options[1]), JSON.stringify(b.options));
    check('test page: newest shown, from its folder', b.tiles[0]?.src.endsWith(`/review-snapshots-main${TEST}/s-20261124-090000/1440/0.jpg`) && !/earlier/.test(b.tag), `${b.tiles[0]?.src} ${b.tag}`);
    await p.selectOption('.rv-shot-pick', 's-20261123-080000');
    await p.waitForTimeout(2500);
    b = await box(p);
    check('test page: an earlier shot shown and said so', /an earlier one/.test(b.tag) && /\/1440\/0\.jpg$/.test(b.tiles[0]?.src || '') && !/s-2026/.test(b.tiles[0]?.src || ''), `${b.tag} ${b.tiles[0]?.src}`);
    await p.click('.rv-shot-refresh');
    await p.waitForFunction(() => /asked for by/.test(document.querySelector('.rv-shot-req')?.textContent || ''));
    b = await box(p);
    check('refresh: the request shown, the button off', /New shot asked for by tool test shots ui aoe/.test(b.req) && b.button.disabled, JSON.stringify(b));
    const { requests } = await admin({ op: 'shot-requests', space: SPACE });
    check('refresh: the request in the backend', requests.some((r) => r.page === TEST && r.status === 'pending'));
    await ctx.close();
  }
  {
    const { ctx, p } = await open(rev.token, TEST);
    const b = await box(p);
    check('reviewer: the request shown, no Refresh', /asked for by/.test(b.req) && !b.button?.visible, JSON.stringify(b.button));
    await ctx.close();
  }
} finally {
  await browser.close();
  await admin({ op: 'purge-test', page: TEST, space: SPACE });
  const gone = await admin({ op: 'shot-history', page: TEST, space: SPACE });
  check('test shots removed', gone.versions.length === 0);
  await admin({ op: 'revoke', id: aoe.id });
  await admin({ op: 'revoke', id: rev.id });
  check('no page errors', !errors.length, errors.join(' | '));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
