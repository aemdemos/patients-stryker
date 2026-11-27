#!/usr/bin/env node
/*
 * The DA sign-in in the tool (branch da-app-v3, 27 Nov 2026), in a browser on the branch's dev
 * server, with the Stage backend and test people (@example.com, removed after):
 * - the sign-in page (start.html): opened on its own it sends you to Document Authoring; in a
 *   stand-in for DA (a page that frames it and says hello like DA) a sign-in not made by DA, and
 *   a faked DA one, are refused with a message;
 * - no session: a tool page goes to the sign-in (the DA address, with the page asked for);
 * - an AOE session (`#session=`): kept, out of the address bar; the start page greets by name
 *   with the People card; the People page adds a person, changes their pages, asks before
 *   removing (Cancel keeps them), removes them;
 * - sending a page back to the reviewer is refused until it is published (here Adobe's admin
 *   service can't be asked without Sidekick: refused, said why), nothing saved;
 * - a reviewer session: no People, only their pages; once removed, the sign-in again.
 * usage: node tools/review/backend/test/da-signin-tool.test.mjs <dev server, e.g. http://localhost:3222>
 */
import { createRequire } from 'module';
import { actionUrl, TEST } from '../target.mjs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const base = process.argv[2] || 'http://localhost:3222';
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: 'main', ...p }),
})).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};

const AOE = 'zz-tool-aoe@example.com';
const REV = 'zz-tool-reviewer@example.com';
const NEW = 'zz-tool-new@example.com';
await admin({
  op: 'person-put', email: AOE, name: 'ZZ Tool AOE', role: 'aoe', paths: ['/'],
});
await admin({
  op: 'person-put', email: REV, name: 'ZZ Tool Reviewer', role: 'reviewer', paths: ['/us/en/about'],
});
const aoe = (await admin({ op: 'test-session', email: AOE })).session;
const rev = (await admin({ op: 'test-session', email: REV })).session;
const browser = await chromium.launch();
const errors = [];
const fresh = async () => {
  const p = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
  p.setDefaultTimeout(30000);
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  return p;
};
try {
  // 1. the sign-in page: on its own, and in a stand-in for DA with sign-ins that don't count
  let p = await fresh();
  await p.goto(`${base}/tools/review/start.html?next=${encodeURIComponent('/tools/review/status.html')}`);
  await p.waitForSelector('.sg-actions a', { timeout: 20000 });
  const own = await p.evaluate(() => ({ state: document.querySelector('.sg-state').textContent, href: document.querySelector('.sg-actions a').href }));
  check('sign-in page on its own: sends you to Document Authoring, with the page asked for', /Document Authoring/.test(own.state) && own.href.startsWith('https://da.live/app/strykerenterprise/stryker-com/tools/review/start?') && own.href.includes('next=%2Ftools%2Freview%2Fstatus.html'), JSON.stringify(own));
  const standIn = async (token) => {
    // (a blank page of the same host: the tool's own pages would go to the sign-in)
    await p.goto(`${base}/tools/review/zz-stand-in-for-da`);
    await p.evaluate((t) => {
      document.body.replaceChildren();
      const f = document.createElement('iframe');
      f.style.cssText = 'width:1200px;height:800px';
      f.addEventListener('load', () => setTimeout(() => {
        const { port2 } = new MessageChannel();
        f.contentWindow.postMessage({
          ready: true, token: t, email: 'someone@example.com', context: { org: 'strykerenterprise', repo: 'stryker-com', ref: 'local' },
        }, '*', [port2]);
      }, 750), { once: true });
      f.src = '/tools/review/start.html';
      document.body.append(f);
    }, token);
    const f = await p.waitForFunction(() => {
      const d = document.querySelector('iframe')?.contentDocument;
      const s = d?.querySelector('.sg-state')?.textContent || '';
      return s && !/Signing you in/.test(s) ? `${s} | ${d.querySelector('.sg-detail').textContent}` : false;
    }, null, { timeout: 30000 });
    return f.jsonValue();
  };
  const notDa = await standIn('aaa.eyJjbGllbnRfaWQiOiJzb21lYXBwIn0.bbb');
  check('in DA, a sign-in not made by DA: refused, said why', /could not be signed in/.test(notDa) && /not made by Document Authoring/.test(notDa), notDa);
  const faked = await standIn('aaa.eyJjbGllbnRfaWQiOiJkYXJrYWxsZXkifQ.bbb');
  check('in DA, a faked DA sign-in: refused by Adobe, said why', /could not be signed in/.test(faked) && /Adobe did not accept/.test(faked), faked);

  // 2. no session: a tool page goes to the sign-in, with itself as the page to come back to
  p = await fresh();
  await p.goto(`${base}/tools/review/status.html`);
  await p.waitForURL(/^https:\/\/da\.live\//, { timeout: 30000 }).catch(() => null);
  const to = p.url();
  check('no session: the Status page goes to the sign-in in DA', to.startsWith('https://da.live/app/strykerenterprise/stryker-com/tools/review/start?') && /ref=local/.test(to) && to.includes('next=%2Ftools%2Freview%2Fstatus.html'), to);

  // 3. an AOE session: kept, out of the address; greeted; the People card
  p = await fresh();
  await p.goto(`${base}/tools/review/launch.html#session=${encodeURIComponent(aoe)}`);
  await p.waitForFunction(() => /ZZ Tool AOE/.test(document.querySelector('.ln-hello')?.textContent || ''), null, { timeout: 30000 }).catch(() => null);
  const start = await p.evaluate(() => ({
    hello: document.querySelector('.ln-hello').textContent,
    hash: window.location.hash,
    people: !!document.querySelector('a[href="./people.html"]'),
    invites: !!document.querySelector('a[href="./invites.html"]'),
  }));
  check('AOE session: greeted by name, the session out of the address bar', /ZZ Tool AOE/.test(start.hello) && !start.hash.includes('session'), JSON.stringify(start));
  check('… the People card and link, no Invitations', start.people && !start.invites, JSON.stringify(start));

  // 4. the People page
  await p.goto(`${base}/tools/review/people.html`);
  await p.waitForSelector('.pp-table table', { timeout: 30000 });
  await p.fill('.pp-email', NEW);
  await p.fill('.pp-name', 'ZZ Tool New');
  await p.fill('.pp-paths', '/us/en/about\n/us/en/careers');
  await p.click('.pp-add');
  await p.waitForFunction((e) => [...document.querySelectorAll('.pp-table td')].some((td) => td.textContent === e), NEW, { timeout: 30000 });
  check('People: a person added (email, name, pages)', (await admin({ op: 'people' })).people.some((x) => x.email === NEW && x.paths.join() === '/us/en/about,/us/en/careers'));
  const row = () => p.locator('.pp-table tr', { hasText: NEW });
  await row().locator('.pp-change').click();
  await row().locator('.pp-ed-paths').fill('/us/en/about');
  await row().locator('.pp-ed-save').click();
  await p.waitForFunction((e) => [...document.querySelectorAll('.pp-table tr')].some((tr) => tr.textContent.includes(e) && !tr.textContent.includes('/us/en/careers')), NEW, { timeout: 30000 });
  check('People: their pages changed', (await admin({ op: 'people' })).people.find((x) => x.email === NEW)?.paths.join() === '/us/en/about');
  await row().locator('.pp-remove').click();
  const asked = await p.waitForSelector('dialog.ui-dialog[open]', { timeout: 10000 }).then(() => p.textContent('dialog.ui-dialog')).catch(() => '');
  await p.click('dialog.ui-dialog button:has-text("Cancel")');
  await p.waitForTimeout(800);
  check('People: Remove asks first in the shared dialog; Cancel keeps them', /Remove ZZ Tool New from the review\?/.test(asked) && /stops working at once/.test(asked) && !(await admin({ op: 'people' })).people.find((x) => x.email === NEW)?.removed, asked.slice(0, 200));
  await row().locator('.pp-remove').click();
  await p.click('dialog.ui-dialog button.ui-ask-danger:has-text("Remove")');
  await p.waitForFunction((e) => ![...document.querySelectorAll('.pp-table td')].some((td) => td.textContent === e), NEW, { timeout: 30000 });
  check('… Remove: gone from the list, kept as removed', (await admin({ op: 'people' })).people.find((x) => x.email === NEW)?.removed === true);
  check('People: no Change or Remove on one\'s own row', await p.locator('.pp-table tr', { hasText: AOE }).locator('.pp-remove, .pp-change').count() === 0);

  // 5. sending a page back to the reviewer: only once published (here: can't be asked → refused)
  const page = '/us/en/about/news/2024/stryker-s-stiles-shares-how-our-latest-orthopaedic-innovations-d';
  const before = (await admin({ op: 'export' })).rows.filter((r) => r.page === page && r.kind === 'state').length;
  await p.goto(`${base}/tools/review/index.html?page=${encodeURIComponent(page)}`);
  await p.waitForSelector('.rv-page-state-waiting-customer', { timeout: 60000 });
  await p.click('.rv-page-state-waiting-customer');
  const block = await p.waitForSelector('dialog.ui-dialog[open]', { timeout: 20000 }).then(() => p.textContent('dialog.ui-dialog')).catch(() => '');
  await p.click('dialog.ui-dialog button:has-text("OK")').catch(() => null);
  await p.waitForTimeout(1500);
  const after = (await admin({ op: 'export' })).rows.filter((r) => r.page === page && r.kind === 'state').length;
  check('Send back to the reviewer: refused until published, said why, nothing saved', /Publish this page first/.test(block) && after === before, `${block.slice(0, 200)} | ${before} → ${after}`);

  // 6. a reviewer session: no People, only their pages; removed → the sign-in again
  p = await fresh();
  await p.goto(`${base}/tools/review/status.html#session=${encodeURIComponent(rev)}`);
  await p.waitForFunction(() => /pages/.test(document.querySelector('.st-count')?.textContent || ''), null, { timeout: 60000 });
  const r = await p.evaluate(() => ({
    people: !document.querySelector('.ui-nav-people')?.hidden,
    paths: [...document.querySelectorAll('.st-table .st-page-cell small')].map((x) => x.textContent),
  }));
  check('reviewer session: no People in the bar, only their pages (/us/en/about)', !r.people && r.paths.length > 0 && r.paths.every((x) => x.startsWith('/us/en/about')), JSON.stringify({ people: r.people, n: r.paths.length, first: r.paths[0] }));
  await admin({ op: 'person-remove', email: REV });
  await p.goto(`${base}/tools/review/launch.html`);
  await p.waitForURL(/^https:\/\/da\.live\//, { timeout: 30000 }).catch(() => null);
  check('… removed from the review: back to the sign-in', p.url().startsWith('https://da.live/app/'), p.url());
  check('no page errors', errors.filter((e) => !/da\.live/.test(e)).length === 0, errors.join(' | '));
} finally {
  await browser.close();
  await Promise.all([AOE, REV, NEW].map((email) => admin({ op: 'person-forget', email })));
  const left = (await admin({ op: 'people' })).people.filter((x) => /^zz-tool-/.test(x.email)).length;
  check('clean-up: the test people gone', left === 0, left);
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
