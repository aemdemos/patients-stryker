#!/usr/bin/env node
/*
 * The status page in the browser, read only: what a customer (reviewer invitation) sees and can
 * use (none of the AOE team's parts), the pages opening in a new tab, and the page's state kept
 * on refresh (status tiles, search, order, template, state, only new, scroll). Test invitations,
 * revoked and forgotten after. Needs the dev server of the review branch.
 * usage: node tools/review/backend/test/status-view.test.mjs <base, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

async function admin(p) {
  const resp = await fetch('https://adobeioruntime.net/api/v1/namespaces/892544-strykerstdreview-stage/actions/std-review/admin?blocking=true&result=true', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  return JSON.parse(await resp.text()).body;
}
const [base = 'http://localhost:3220'] = process.argv.slice(2);
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const rev = await admin({
  op: 'invite', name: 'tool test status view customer', paths: ['/'], days: 1, space: 'main',
});
const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const ready = () => p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''));
  await p.goto(`${base}/tools/review/status.html?invite=${encodeURIComponent(rev.token)}`, { waitUntil: 'load' });
  await ready();
  const seen = await p.evaluate(() => {
    const visible = (sel) => [...document.querySelectorAll(sel)].some((e) => e.offsetParent !== null || (e.tagName === 'DETAILS' && !e.hidden));
    return {
      mark: visible('.st-mark'),
      scope: visible('.st-scope'),
      invites: visible('.st-invites'),
      edit: document.querySelectorAll('.st-edit').length,
      unpublished: [...document.querySelectorAll('.st-tile')].some((t) => /Not published/.test(t.textContent)),
      aoeButtons: [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null).map((b) => b.textContent.trim()),
      links: [...document.querySelectorAll('.st-table tbody a')].slice(0, 20).map((a) => a.target),
      count: document.querySelector('.st-count').textContent,
    };
  });
  check('customer: no organising box', !seen.mark);
  check('customer: no migration scope box', !seen.scope);
  check('customer: no Invitations, no Edit in DA', !seen.invites && seen.edit === 0, JSON.stringify(seen));
  check('customer: no Not published yet', !seen.unpublished);
  check('customer: only the page\'s own buttons', seen.aoeButtons.every((b) => !/Mark|Take them out|representative|Use the pages/.test(b)), JSON.stringify(seen.aoeButtons));
  check('customer: published pages only', /of \d+ pages/.test(seen.count) && !seen.unpublished, seen.count);
  check('pages open in a new tab', seen.links.length > 0 && seen.links.every((t) => t === '_blank'), JSON.stringify(seen.links));

  // the page's state, then a refresh
  await p.click('.st-tile.st-unreviewed');
  await p.fill('.st-search', 'news');
  await p.selectOption('.st-order', 'title');
  const tpl = await p.$$eval('.st-template option', (os) => os.map((o) => o.value).filter(Boolean)[0] || '');
  if (tpl) await p.selectOption('.st-template', tpl);
  await p.check('.st-new');
  await p.uncheck('.st-new');
  await p.waitForTimeout(300);
  const before = await p.evaluate(() => ({
    count: document.querySelector('.st-count').textContent,
    picked: [...document.querySelectorAll('.st-tile.st-picked')].map((t) => t.className),
  }));
  await p.reload({ waitUntil: 'load' });
  await ready();
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({
    count: document.querySelector('.st-count').textContent,
    picked: [...document.querySelectorAll('.st-tile.st-picked')].map((t) => t.className),
    search: document.querySelector('.st-search').value,
    order: document.querySelector('.st-order').value,
    template: document.querySelector('.st-template').value,
  }));
  check('refresh: the picked status kept', after.picked.length === 1 && JSON.stringify(after.picked) === JSON.stringify(before.picked), JSON.stringify({ before, after }));
  check('refresh: search, order, template kept', after.search === 'news' && after.order === 'title' && after.template === tpl, JSON.stringify(after));
  check('refresh: the same pages shown', after.count === before.count, `${before.count} / ${after.count}`);
  // the scroll position: on the full list (a filtered list may be too short to scroll)
  await p.click('.st-tile.st-picked');
  await p.fill('.st-search', '');
  await p.selectOption('.st-template', '');
  await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(600);
  await p.reload({ waitUntil: 'load' });
  await ready();
  await p.waitForTimeout(800);
  const scroll = await p.evaluate(() => Math.round(window.scrollY));
  check('refresh: the scroll position kept', Math.abs(scroll - 1500) < 40, String(scroll));
  // clean up the stored view for this test browser
  await p.evaluate(() => Object.keys(window.localStorage).filter((k) => /status-view/.test(k)).forEach((k) => window.localStorage.removeItem(k)));
  await ctx.close();
} finally {
  await browser.close();
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
  check('no page errors', !errors.length, errors.join(' | '));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
