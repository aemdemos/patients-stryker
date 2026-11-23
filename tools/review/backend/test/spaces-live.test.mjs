#!/usr/bin/env node
/*
 * Review backend, deployed: a main-space invitation reads and writes only main entries. A test
 * invitation (main space, a /test page only, 1 day) saves a page comment; the main export has
 * it, the std export doesn't, the std review's rows are untouched (count before = after); then
 * the test entries are purged and the invitation revoked. Only test pages; never a page reviewers
 * use. The admin calls need the workspace credential (Settings).
 * usage: node tools/review/backend/test/spaces-live.test.mjs
 */
import { REVIEW } from '../../config.js';

// the private admin action (as admin.mjs calls it; the credential is added by the environment)
async function admin(p, namespace = '892544-strykerstdreview-stage') {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${namespace}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}

const PAGE = '/test/client-review-space';
let failed = 0;
const check = (what, ok) => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
};
const call = async (path, token, body) => {
  const resp = await fetch(`${REVIEW.backend}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-review-invite': token, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: resp.status, body: await resp.json().catch(() => null) };
};

const stdBefore = (await admin({ op: 'export' })).rows.length;
const inv = await admin({
  op: 'invite', name: 'tool test main', paths: ['/test'], days: 1, space: 'main',
});
check('invitation in the main space', inv.scope?.space === 'main' && /^https:\/\/main--/.test(inv.link));
try {
  const first = await call(`state?page=${encodeURIComponent(PAGE)}`, inv.token);
  check('state: read with the main invitation', first.status === 200 && first.body.scope.space === 'main');
  const saved = await call('save', inv.token, {
    page: PAGE, changes: [{ item: 'page', kind: 'comment', value: JSON.stringify('space test'), rev: 0 }],
  });
  check('save: a page comment', saved.status === 200 && saved.body.results[0].ok);
  const again = await call(`state?page=${encodeURIComponent(PAGE)}`, inv.token);
  check('state: the comment is back', again.body.rows.some((r) => r.kind === 'comment' && r.value === JSON.stringify('space test')));
  const main = (await admin({ op: 'export', space: 'main' })).rows;
  const std = (await admin({ op: 'export' })).rows;
  check('main export has it', main.some((r) => r.page === PAGE));
  check('std export does not', !std.some((r) => r.page === PAGE));
  check('std rows untouched', std.length === stdBefore);
  // batches: the AOE team's only, several pages in one save, no activity
  const notMine = await call('save', inv.token, {
    page: PAGE, changes: [{ item: 'page', kind: 'batch', value: '3', rev: 0 }],
  });
  check('batch: a reviewer may not mark', notMine.status === 403 && notMine.body.error.code === 'aoe-only');
  const aoeInv = await admin({
    op: 'invite', name: 'tool test main aoe', paths: ['/test'], days: 1, space: 'main', role: 'aoe',
  });
  try {
    const marked = await call('save', aoeInv.token, {
      page: PAGE,
      changes: [`${PAGE}`, `${PAGE}-2`].map((pg) => ({
        page: pg, item: 'page', kind: 'batch', value: '3', rev: 0,
      })),
    });
    check('batch: the AOE team marks two pages in one save', marked.status === 200 && marked.body.results.every((r) => r.ok));
    const again = await call('save', aoeInv.token, {
      page: PAGE, changes: [{ item: 'page', kind: 'batch', value: '4', rev: 0 }],
    });
    check('batch: newest wins (no rev check)', again.status === 200 && again.body.results[0].ok);
    const bad = await call('save', aoeInv.token, {
      page: PAGE, changes: [{ item: 'page', kind: 'batch', value: '"x"', rev: 0 }],
    });
    check('batch: only numbers', bad.status === 400);
    const over = await call('overview', aoeInv.token);
    const two = over.body.pages.find((x) => x.page === `${PAGE}-2`);
    const one = over.body.pages.find((x) => x.page === PAGE);
    check('overview: the batch per page, not activity', two?.batch === 3 && two.state === 'unreviewed' && one?.batch === 4, JSON.stringify([one, two]));
  } finally {
    await admin({ op: 'purge-invite', id: aoeInv.id, space: 'main' });
    await admin({ op: 'revoke', id: aoeInv.id });
  }
} finally {
  const purged = await admin({ op: 'purge-invite', id: inv.id, space: 'main' });
  check('test entries purged', purged.deleted >= 1);
  await admin({ op: 'revoke', id: inv.id });
  const left = (await admin({ op: 'export', space: 'main' })).rows.filter((r) => r.page.startsWith(PAGE));
  check('nothing left on the test page', left.length === 0);
}
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
