#!/usr/bin/env node
/*
 * Shared filters and the page picker (25 Nov 2026), in a browser on the review's dev server (Stage
 * by default): the status page and the review tool open in two tabs of one browser. A search and
 * a status set on the status page filter the tool's list at once (the Filter button dark, with
 * how many), the order too; Clear all in the tool clears them on the status page. The picker: the
 * page's title and short path, its list right below it with the current page marked, a search
 * that marks the words, ↓ / Enter opens a page, Esc closes, / opens it. Test invitation only.
 * usage: node tools/review/backend/test/filters-tool.test.mjs <dev server, e.g. http://localhost:3220>
 */
import { createRequire } from 'module';
import { REVIEW } from '../../config.js';
import { TEST, actionUrl } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const base = process.argv[2] || 'http://localhost:3220';
const SPACE = REVIEW.space;
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: SPACE, ...p }) })).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};

const rev = await admin({
  op: 'invite', name: 'tool test filters reviewer', paths: ['/'], days: 1,
});
const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  await ctx.route(/altcha|captcha/, (r) => r.abort());
  const tool = await ctx.newPage();
  tool.setDefaultTimeout(60000);
  tool.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 3).join(' ').slice(0, 300)));
  await tool.goto(`${base}/tools/review/index.html?invite=${encodeURIComponent(rev.token)}`);
  await tool.waitForFunction(() => /\/ \d+/.test(document.querySelector('.rv-count')?.textContent || ''), null, { timeout: 90000 });
  await tool.evaluate(() => document.querySelector('.rv-filter summary') && window.localStorage.length);
  const total = Number((await tool.textContent('.rv-count')).split('/ ')[1]);
  const status = await ctx.newPage();
  status.on('pageerror', (e) => errors.push(String(e.stack || e).split('\n').slice(0, 3).join(' ').slice(0, 300)));
  await status.goto(`${base}/tools/review/status.html`);
  await status.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''), null, { timeout: 90000 });
  // (start from no filter)
  if (!(await status.$eval('.st-clear', (b) => b.disabled))) await status.click('.st-clear');

  // 1. the status page's search and status reach the tool (words from this review's own pages:
  // the first page's area and next folder)
  const words = await status.evaluate(() => {
    const path = document.querySelector('.st-table .st-page-cell small')?.textContent || '/us/en/about/news/x';
    const parts = path.split('/').filter(Boolean);
    return { search: parts.slice(2, 4).join(' '), mark: parts[3] || parts[2] };
  });
  await status.fill('.st-search', words.search);
  await status.selectOption('.st-state', 'unreviewed');
  const statusShows = Number((await status.textContent('.st-count')).split(' of ')[0]);
  const got = await tool.waitForFunction((n) => document.querySelector('.rv-count').textContent.endsWith(`/ ${n}`), statusShows, { timeout: 10000 }).then(() => true).catch(() => false);
  const btn = await tool.evaluate(() => ({ on: document.querySelector('.rv-filter summary').classList.contains('rv-filter-on'), n: document.querySelector('.rv-filter-n')?.textContent }));
  check(`the status page's search and status filter the tool's list at once (${statusShows} of ${total})`, got && statusShows > 0 && statusShows < total, await tool.textContent('.rv-count'));
  check('… the Filter button dark, with how many filters', btn.on && btn.n === '2', JSON.stringify(btn));
  // 2. the picker: the filtered list, the current page marked, search marks the words
  await tool.click('.rv-pick');
  const pick = await tool.evaluate(() => ({
    open: !document.querySelector('.rv-pick-pop').hidden,
    items: document.querySelectorAll('.rv-pick-item').length,
    shows: document.querySelector('.rv-pick-shows').textContent,
    focused: document.activeElement?.classList.contains('rv-pick-search'),
    nul: /null/.test(document.querySelector('.rv-pick-pop').textContent),
  }));
  check('the picker opens below its box: the filtered pages, what is filtered, the search focused', pick.open && pick.items === statusShows && pick.shows.includes(`Filtered: "${words.search}"`) && pick.focused && !pick.nul, JSON.stringify(pick));
  await tool.keyboard.type(words.mark.slice(0, 4));
  const marks = await tool.evaluate(() => document.querySelectorAll('.rv-pick-item mark').length);
  check('… its search marks the words', marks > 0, marks);
  const before = await tool.textContent('.rv-pick-title');
  await tool.keyboard.press('ArrowDown');
  const target = await tool.evaluate(() => document.querySelector('.rv-pick-on .rv-pick-item-title').textContent);
  await tool.keyboard.press('Enter');
  const opened = await tool.waitForFunction((t) => document.querySelector('.rv-pick-title').textContent === t && document.querySelector('.rv-pick-pop').hidden, target, { timeout: 15000 }).then(() => true).catch(() => false);
  check('… ↓ and Enter open the next page', opened && target !== before, JSON.stringify({ before, target }));
  await tool.keyboard.press('/');
  const slash = await tool.evaluate(() => !document.querySelector('.rv-pick-pop').hidden);
  await tool.keyboard.press('Escape');
  const esc = await tool.evaluate(() => document.querySelector('.rv-pick-pop').hidden);
  check('… / opens it, Esc closes it', slash && esc, JSON.stringify({ slash, esc }));
  const box = await tool.evaluate(() => ({ path: document.querySelector('.rv-pick-path').textContent }));
  check('… the box shows the path without its shared start', box.path && !box.path.startsWith('/us/en/'), JSON.stringify(box));
  // 3. the order, from the tool to the status page
  await tool.click('.rv-filter summary');
  await tool.selectOption('.rv-filter-body select[aria-label="Order"]', 'title');
  const order = await status.waitForFunction(() => document.querySelector('.st-order').value === 'title', null, { timeout: 10000 }).then(() => true).catch(() => false);
  check('the tool\'s order reaches the status page', order);
  // 4. Clear all in the tool clears them on the status page
  await tool.click('.rv-filter-clear');
  const cleared = await status.waitForFunction(() => document.querySelector('.st-search').value === '' && document.querySelector('.st-state').value === '', null, { timeout: 10000 }).then(() => true).catch(() => false);
  const after = await tool.evaluate(() => ({ count: document.querySelector('.rv-count').textContent, on: document.querySelector('.rv-filter summary').classList.contains('rv-filter-on') }));
  check('Clear all in the tool: no filter on the status page either, every page in the tool', cleared && after.count.endsWith(`/ ${total}`) && !after.on, JSON.stringify(after));
  // (the order stays: it is no filter; back to the default)
  await tool.selectOption('.rv-filter-body select[aria-label="Order"]', 'waiting');
  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
} finally {
  await browser.close();
  await admin({ op: 'purge-invite', id: rev.id });
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
