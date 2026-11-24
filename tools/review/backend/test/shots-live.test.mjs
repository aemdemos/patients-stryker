#!/usr/bin/env node
/*
 * Review backend, deployed: the source shots (lib/shots.mjs, action shots, admin shot-*) on a
 * test page only. Two versions into the history (the second answering a request), a version
 * already there refused, the history read with a reviewer and an AOE invitation (anchors only in
 * the newest), a request: reviewers refused, AOE accepted once, failed with a reason, closed by
 * the version that answers it; pages without a first shot refused. Then purge-test removes the
 * test page's shots and the invitations are revoked. The admin calls need the workspace
 * credential (Settings).
 * usage: node tools/review/backend/test/shots-live.test.mjs
 */
import { REVIEW } from '../../config.js';
import { TEST, actionUrl, webBase } from '../target.mjs';

async function admin(p, namespace = TEST.ns) {
  const resp = await fetch(actionUrl(namespace), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}

const PAGE = '/test/client-review-shots';
const SPACE = 'main';
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const call = async (path, token, body) => {
  const resp = await fetch(`${webBase()}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-review-invite': token, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: resp.status, body: await resp.json().catch(() => null) };
};
const HASH = 'a'.repeat(64);
const version = (id, dir, captured, request) => ({
  id,
  dir,
  url: 'https://www.stryker.com/us/en/test.html',
  captured,
  by: 'shots test',
  ...(request ? { request } : {}),
  widths: Object.fromEntries([1440, 860, 375].map((w) => [w, {
    captured, width: w, height: 900, status: 200, finalUrl: 'https://www.stryker.com/us/en/test.html', tiles: [{ y: 0, h: 900, file: '0.jpg', sha256: HASH }], leaves: [{ key: 't:test text', y: 10 }],
  }])),
});
const Q = `shots?page=${encodeURIComponent(PAGE)}`;

const rev = await admin({
  op: 'invite', name: 'tool test shots reviewer', paths: ['/test'], days: 1, space: SPACE,
});
const aoe = await admin({
  op: 'invite', name: 'tool test shots aoe', paths: ['/test'], days: 1, space: SPACE, role: 'aoe',
});
try {
  await admin({ op: 'purge-test', page: PAGE, space: SPACE });
  const empty = await call(Q, rev.token);
  check('no shots yet', empty.status === 200 && empty.body.versions.length === 0 && empty.body.request === null, JSON.stringify(empty.body));
  const noFirst = await call('shots', aoe.token, { page: PAGE });
  check('request without a first shot refused', noFirst.status === 409 && noFirst.body.error.code === 'no-first-shot', JSON.stringify(noFirst.body));

  const first = await admin({ op: 'shot-add', space: SPACE, items: [{ page: PAGE, version: version('s-20261123-081400', '', '2026-11-23T08:14:00.000Z') }] });
  check('first shot added', first.added.length === 1 && !first.refused.length, JSON.stringify(first));
  const dup = await admin({ op: 'shot-add', space: SPACE, items: [{ page: PAGE, version: version('s-20261123-081400', '', '2026-11-23T08:14:00.000Z') }] });
  check('the same version refused (never replaced)', !dup.added.length && /never replaced/.test(dup.refused[0]?.reason), JSON.stringify(dup));
  const badHash = version('s-20261124-090000', '/s-20261124-090000', '2026-11-24T09:00:00.000Z');
  badHash.widths[1440].tiles[0].sha256 = 'nope';
  const bad = await admin({ op: 'shot-add', space: SPACE, items: [{ page: PAGE, version: badHash }] });
  check('a version without tile hashes refused', !bad.added.length && bad.refused.length === 1, JSON.stringify(bad));

  const byRev = await call('shots', rev.token, { page: PAGE });
  check('request: reviewers refused', byRev.status === 403 && byRev.body.error.code === 'aoe-only', JSON.stringify(byRev.body));
  const req = await call('shots', aoe.token, { page: PAGE });
  check('request: AOE accepted', req.status === 200 && req.body.request.status === 'pending' && !req.body.already, JSON.stringify(req.body));
  const again = await call('shots', aoe.token, { page: PAGE });
  check('request: once (the open one returned)', again.body.already && again.body.request.id === req.body.request.id);
  const listed = await admin({ op: 'shot-requests', space: SPACE });
  check('shot-requests lists it', listed.requests.some((r) => r.page === PAGE && r.by === 'tool test shots aoe'));
  const stdList = await admin({ op: 'shot-requests' });
  check('not in the std space', !stdList.requests.some((r) => r.page === PAGE));

  await admin({
    op: 'shot-fail', space: SPACE, page: PAGE, reason: 'test failure',
  });
  const seenFailed = await call(Q, rev.token);
  check('failed request shown with its reason', seenFailed.body.request?.status === 'failed' && seenFailed.body.request.reason === 'test failure', JSON.stringify(seenFailed.body.request));
  const retry = await call('shots', aoe.token, { page: PAGE });
  check('a failed request can be asked again', retry.status === 200 && retry.body.request.status === 'pending' && !retry.body.already);

  const second = await admin({
    op: 'shot-add', space: SPACE, items: [{ page: PAGE, version: version('s-20261124-090000', '/s-20261124-090000', '2026-11-24T09:00:00.000Z', retry.body.request.id) }],
  });
  check('second shot added', second.added.length === 1, JSON.stringify(second));
  const hist = await call(Q, rev.token);
  const [v1, v2] = hist.body.versions;
  check('history: both, oldest first', hist.body.versions.length === 2 && v1.id === 's-20261123-081400' && v2.id === 's-20261124-090000');
  check('history: anchors only in the newest', typeof v1.widths[1440].leaves === 'number' && Array.isArray(v2.widths[1440].leaves));
  check('history: dates and hashes kept', v1.captured === '2026-11-23T08:14:00.000Z' && v1.widths[860].tiles[0].sha256 === HASH && !!v1.recorded);
  check('the answered request is closed', hist.body.request === null, JSON.stringify(hist.body.request));
  const one = await call(`${Q}&version=s-20261123-081400`, aoe.token);
  check('one version with its anchors', one.status === 200 && Array.isArray(one.body.version.widths[375].leaves));
  const outside = await call(`shots?page=${encodeURIComponent('/us/en/search')}`, rev.token);
  check('pages outside the invitation refused', outside.status === 403);
} finally {
  const purged = await admin({ op: 'purge-test', page: PAGE, space: SPACE });
  const gone = await admin({ op: 'shot-history', page: PAGE, space: SPACE });
  check('test shots removed', purged.page === PAGE && gone.versions.length === 0);
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'revoke', id: aoe.id });
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
