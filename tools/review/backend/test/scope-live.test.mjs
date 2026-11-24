#!/usr/bin/env node
/*
 * Review backend, deployed: the migration scope, the backend's captures and group approval.
 * - pages: reviewers get the scope's published pages; the AOE team every scope page, the facts
 *   (not in the scope, rows to correct, waiting, the capture's runs and browser check)
 * - capture (op test, a /test page only): a shot at every width by the backend's browser, in
 *   the history (store files, hashes), its tiles through the tile action, matching their hashes;
 *   a source that answers 404 refused with the reason
 * - group approval (two /test pages in one group): one approved → the other approved with its
 *   group; moved out of the group → no longer
 * Then the test pages are purged (entries, shots, tiles) and the invitations revoked.
 * usage: node tools/review/backend/test/scope-live.test.mjs
 */
import { createHash } from 'crypto';
import { REVIEW } from '../../config.js';
import { NS, actionUrl } from '../target.mjs';

async function runtime(action, p) {
  const resp = await fetch(actionUrl(NS, action), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${action} ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}
const admin = (p) => runtime('admin', p);
const SPACE = 'main';
const SHOT = '/test/scope-capture';
const GA = ['/test/scope-group-a', '/test/scope-group-b'];
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const call = async (path, token, body) => {
  const resp = await fetch(`${REVIEW.backend}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-review-invite': token, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: resp.status, body: await resp.json().catch(() => null) };
};

const aoe = await admin({
  op: 'invite', name: 'tool test scope live aoe', paths: ['/'], days: 1, space: SPACE, role: 'aoe',
});
const rev = await admin({
  op: 'invite', name: 'tool test scope live reviewer', paths: ['/'], days: 1, space: SPACE,
});
try {
  const pr = await call('pages', rev.token);
  const pa = await call('pages', aoe.token);
  check('pages: reviewers get published pages only', pr.status === 200 && pr.body.pages.length > 0 && pr.body.pages.every((p) => p.published) && !pr.body.capture);
  check('pages: the AOE team gets the whole scope and the facts', pa.status === 200 && pa.body.pages.length > pr.body.pages.length
    && Array.isArray(pa.body.notInScope) && Array.isArray(pa.body.problems) && !!pa.body.capture, JSON.stringify(Object.keys(pa.body || {})));
  check('pages: each with source and template', pa.body.pages.every((p) => /^https:\/\/www\.stryker\.com\/.+\.html$/.test(p.source) && 'template' in p));
  check('pages: the same published pages', pa.body.pages.filter((p) => p.published).length === pr.body.pages.length);

  for (const p of [SHOT, ...GA]) await admin({ op: 'purge-test', page: p, space: SPACE });
  const shot = await runtime('capture', {
    op: 'test', space: SPACE, page: SHOT, source: 'https://www.stryker.com/us/en/search.html',
  });
  check('capture: a test shot by the backend', !!shot.id && !shot.error, JSON.stringify(shot));
  const h = await admin({ op: 'shot-history', page: SHOT, space: SPACE });
  const v = h.versions[0];
  check('capture: in the history, every width, hashes', v?.store === 'files' && ['1440', '860', '375'].every((w) => v.widths[w]?.status === 200 && v.widths[w].tiles.every((t) => /^[0-9a-f]{64}$/.test(t.sha256))), JSON.stringify(v).slice(0, 200));
  check('capture: title and final URL kept', /Search/.test(v?.title || '') && v.widths[1440].finalUrl === 'https://www.stryker.com/us/en/search.html');
  const t = v.widths[860].tiles[0];
  const tile = await fetch(`${REVIEW.backend}/tile?${new URLSearchParams({
    space: SPACE, page: SHOT, version: v.id, vp: '860', file: t.file,
  })}`);
  const buf = Buffer.from(await tile.arrayBuffer());
  check('tile: served, the same bytes as recorded', tile.ok && createHash('sha256').update(buf).digest('hex') === t.sha256, `${tile.status}`);
  const bad = await runtime('capture', {
    op: 'test', space: SPACE, page: `${SHOT}-404`, source: 'https://www.stryker.com/us/en/no-such-page-for-the-test.html',
  });
  check('capture: a missing source refused with the reason', /answers 404/.test(bad.error?.message || ''), JSON.stringify(bad));

  // group approval: two test pages in group 990, one approved
  const org = await call('save', aoe.token, {
    page: GA[0],
    changes: GA.map((page) => ({
      page, item: 'page', kind: 'group', value: '990', rev: 0,
    })),
  });
  check('groups: both test pages in one group', org.status === 200 && org.body.results.every((r) => r.ok));
  const ok = await call('save', rev.token, { page: GA[0], changes: [{ item: 'page', kind: 'state', value: JSON.stringify('approved'), rev: 0 }] });
  check('group approval: one page approved', ok.status === 200 && ok.body.results[0].ok, JSON.stringify(ok.body));
  let ov = await call('overview', rev.token);
  const b = ov.body.pages.find((p) => p.page === GA[1]);
  check('group approval: the other approved with its group', b?.state === 'approved' && b.groupApproved?.page === GA[0] && b.groupApproved.by === 'tool test scope live reviewer', JSON.stringify(b));
  await call('save', aoe.token, {
    page: GA[1], changes: [{ item: 'page', kind: 'group', value: 'null', rev: 0 }],
  });
  ov = await call('overview', rev.token);
  const out = ov.body.pages.find((p) => p.page === GA[1]);
  check('group approval: out of the group, out of the approval', out && out.state !== 'approved' && !out.groupApproved, JSON.stringify(out));
} finally {
  for (const p of [SHOT, `${SHOT}-404`, ...GA]) await admin({ op: 'purge-test', page: p, space: SPACE });
  const gone = await admin({ op: 'shot-history', page: SHOT, space: SPACE });
  check('test pages purged (shots too)', gone.versions.length === 0);
  await admin({ op: 'revoke', id: aoe.id });
  await admin({ op: 'revoke', id: rev.id });
  await admin({ op: 'forget-test-invites' });
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
