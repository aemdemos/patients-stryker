#!/usr/bin/env node
/*
 * The review tool's Live comparison in the browser, read only: the live copy of the source page
 * (backend action live) in the Live pane, its fonts, no scripts, the tag with its time, scroll
 * sync with the page under review, links opening the real page in a new tab, a new copy for
 * another width, Render again. A test invitation, revoked and forgotten after. Needs the dev
 * server of the branch.
 * usage: node tools/review/backend/test/live-tool.test.mjs <base> <page> [space main|std] [shot.png]
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
const [base = 'http://localhost:3220', PAGE = '/us/en/about/news/2020/stryker-launches-ambulatory-surgery-center-focused-business', SPACE = 'main', SHOT = ''] = process.argv.slice(2);
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const rev = await admin({
  op: 'invite', name: 'tool test live reviewer', paths: ['/'], days: 1, ...(SPACE === 'std' ? {} : { space: SPACE }),
});
const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await p.goto(`${base}/tools/review/index.html?invite=${encodeURIComponent(rev.token)}&page=${encodeURIComponent(PAGE)}&mode=side&vp=1440`, { waitUntil: 'load' });
  await p.waitForTimeout(6000);
  await p.click('[data-cmp="live"]');
  await p.waitForFunction(() => /rendered/.test(document.querySelector('.rv-live .rv-tag').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const f = document.querySelector('.rv-live iframe');
    const d = f.contentDocument;
    return {
      tag: document.querySelector('.rv-live .rv-tag').textContent,
      src: f.getAttribute('src'),
      title: d?.title,
      scripts: d?.querySelectorAll('script').length,
      text: (d?.body?.innerText || '').length,
      fonts: d ? [...new Set([...d.fonts].filter((x) => x.status === 'loaded').map((x) => x.family))] : [],
      base: d?.querySelector('base')?.href,
      imgs: d ? [...d.images].filter((i) => i.complete && i.naturalWidth > 0).length : 0,
    };
  });
  check('live: a copy in the Live pane (blob, same origin)', /^blob:/.test(r.src || '') && r.text > 200, JSON.stringify(r).slice(0, 200));
  check('live: the tag says when it was rendered', /Live stryker\.com, rendered/.test(r.tag), r.tag);
  check('live: no scripts in the copy', r.scripts === 0);
  check('live: the Stryker fonts loaded', r.fonts.some((f) => /Stryker/.test(f)), JSON.stringify(r.fonts));
  check('live: images from stryker.com', r.imgs > 0 && /^https:\/\/www\.stryker\.com\//.test(r.base || ''), `${r.imgs} ${r.base}`);
  // a link: the real page in a new tab
  const href = await p.evaluate(() => {
    const a = [...document.querySelector('.rv-live iframe').contentDocument.querySelectorAll('a[href^="https://www.stryker.com/"], a[href^="/"]')][0];
    a?.scrollIntoView();
    return a?.href || '';
  });
  if (href) {
    const [popup] = await Promise.all([
      ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null),
      p.evaluate(() => {
        const a = [...document.querySelector('.rv-live iframe').contentDocument.querySelectorAll('a[href^="https://www.stryker.com/"], a[href^="/"]')][0];
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }),
    ]);
    const stays = await p.evaluate(() => /^blob:/.test(document.querySelector('.rv-live iframe').contentWindow.location.href));
    check('live: a link opens the real page in a new tab, the copy stays', !!popup && stays, `${popup?.url?.()} ${stays}`);
    if (popup) await popup.close();
  }
  // another width: a new copy
  const firstSrc = r.src;
  await p.click('[data-vp="375"]');
  await p.waitForFunction((s) => document.querySelector('.rv-live iframe').getAttribute('src') !== s, firstSrc, { timeout: 60000 });
  check('live: another width renders a new copy', true);
  await p.waitForFunction(() => /rendered/.test(document.querySelector('.rv-live .rv-tag').textContent), null, { timeout: 60000 });
  await p.waitForTimeout(3000);
  // sync: scroll the page under review, the live copy follows (at phone width the pages are
  // long enough to scroll in their panes; at desktop width a short page fits in its pane)
  const before = await p.evaluate(() => document.querySelector('.rv-live iframe').contentWindow.scrollY);
  await p.evaluate(() => document.querySelector('.rv-std iframe').contentWindow.scrollTo(0, 1500));
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => document.querySelector('.rv-live iframe').contentWindow.scrollY);
  check('live: scroll sync with the page under review', after > before + 200, `${before} → ${after}`);
  if (SHOT) await p.screenshot({ path: SHOT });
  await p.click('.rv-live-again');
  await p.waitForFunction(() => /\(now\)/.test(document.querySelector('.rv-live .rv-tag').textContent), null, { timeout: 60000 });
  check('live: Render again makes a fresh copy', true);
  await ctx.close();
} finally {
  await browser.close();
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
  check('no page errors', !errors.length, errors.join(' | '));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
