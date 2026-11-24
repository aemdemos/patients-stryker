#!/usr/bin/env node
/*
 * Review backend, deployed: the AOE team's invitations (web action invites). Test invitations
 * only (main space, /test pages, 1 day): reviewers refused; the list (the space's only, no
 * tokens, createdBy); create (the link on the origin's host and working, pages only within the
 * AOE's own, a name needed); revoke (another's, not one's own; the revoked link stops working).
 * Then the test invitations are revoked and forgotten (admin forget-test-invites). The admin
 * calls need the workspace credential (Settings).
 * usage: node tools/review/backend/test/invites-live.test.mjs
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

const SPACE = 'main';
const ORIGIN = 'https://client-review-v3--stryker-com--strykerenterprise.aem.page';
let failed = 0;
const check = (what, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` ${detail}`}`);
};
const call = async (path, token, body) => {
  const resp = await fetch(`${webBase()}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-review-invite': token, origin: ORIGIN, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: resp.status, body: await resp.json().catch(() => null) };
};

const a = await admin({
  op: 'invite', name: 'tool test invites aoe A', paths: ['/test'], days: 1, space: SPACE, role: 'aoe',
});
const b = await admin({
  op: 'invite', name: 'tool test invites aoe B', paths: ['/test'], days: 1, space: SPACE, role: 'aoe',
});
const r = await admin({
  op: 'invite', name: 'tool test invites reviewer', paths: ['/test'], days: 1, space: SPACE,
});
const std = await admin({
  op: 'invite', name: 'tool test invites std', paths: ['/test'], days: 1,
});
const made = [];
try {
  const byReviewer = await call('invites', r.token);
  check('reviewers refused', byReviewer.status === 403 && byReviewer.body.error.code === 'aoe-only');
  const list = await call('invites', a.token);
  const ids = list.body.invites.map((i) => i.id);
  check('list: the space\'s invitations', list.status === 200 && [a.id, b.id, r.id].every((id) => ids.includes(id)), JSON.stringify(list.body).slice(0, 200));
  check('list: not other spaces\'', !ids.includes(std.id));
  check('list: no tokens', !JSON.stringify(list.body).includes(a.token.split('.')[1]) && !list.body.invites.some((i) => 'token' in i));
  check('list: one\'s own marked, created by admin', list.body.invites.find((i) => i.id === a.id).me && list.body.invites.find((i) => i.id === a.id).createdBy === 'admin');

  const c = await call('invites', a.token, {
    op: 'create', name: 'tool test invites made', role: 'reviewer', paths: ['/test/x'], days: 1,
  });
  check('create: a reviewer invitation', c.status === 200 && c.body.invite.scope.role === 'reviewer' && c.body.invite.scope.space === SPACE, JSON.stringify(c.body));
  if (c.status === 200) made.push(c.body.invite.id);
  // (made on Stage: the link also names Stage's backend; on Production it names none)
  const made1 = c.body.invite.link ? new URL(c.body.invite.link) : null;
  check('create: the link on the origin\'s host, its backend named on Stage only, no token field', made1?.href.startsWith(`${ORIGIN}/tools/review/index.html?`) && made1.searchParams.get('invite')
    && made1.searchParams.get('backend') === (TEST.name === 'stage' ? 'stage' : null) && !('token' in c.body.invite), c.body.invite.link?.replace(/invite=[^&]+/, 'invite=…'));
  const token = c.body.invite?.link ? new URL(c.body.invite.link).searchParams.get('invite') : '';
  const works = await call(`state?page=${encodeURIComponent('/test/x/page')}`, token);
  check('create: the new link works', works.status === 200 && works.body.reviewer === 'tool test invites made' && works.body.scope.space === SPACE);
  const listed = (await call('invites', a.token)).body.invites.find((i) => i.id === c.body.invite.id);
  check('create: listed with who made it', listed?.createdBy === 'tool test invites aoe A' && listed.state === 'active');
  const aoeMade = await call('invites', a.token, {
    op: 'create', name: 'tool test invites made aoe', role: 'aoe', paths: ['/test'], days: 1,
  });
  check('create: an AOE invitation (results on)', aoeMade.status === 200 && aoeMade.body.invite.scope.role === 'aoe' && !!aoeMade.body.invite.results);
  if (aoeMade.status === 200) made.push(aoeMade.body.invite.id);
  const outside = await call('invites', a.token, {
    op: 'create', name: 'tool test invites outside', paths: ['/us/en'], days: 1,
  });
  check('create: pages outside one\'s own refused', outside.status === 403 && outside.body.error.code === 'out-of-scope');
  const noName = await call('invites', a.token, { op: 'create', name: ' ', paths: ['/test'] });
  check('create: a name needed', noName.status === 400);

  const own = await call('invites', a.token, { op: 'revoke', id: a.id });
  check('revoke: not one\'s own', own.status === 409 && own.body.error.code === 'own-invite');
  const otherSpace = await call('invites', a.token, { op: 'revoke', id: std.id });
  check('revoke: not another space\'s', otherSpace.status === 404);
  const rv = await call('invites', a.token, { op: 'revoke', id: c.body.invite.id });
  check('revoke: marked, by whom', rv.status === 200 && rv.body.invite.state === 'revoked' && rv.body.invite.revokedBy === 'tool test invites aoe A', JSON.stringify(rv.body));
  const dead = await call(`state?page=${encodeURIComponent('/test/x/page')}`, token);
  check('revoke: the link stops working', dead.status === 401 && dead.body.error.code === 'revoked');
  const other = await call('invites', a.token, { op: 'revoke', id: b.id });
  check('revoke: another AOE\'s', other.status === 200);
  const bDead = await call('invites', b.token);
  check('revoke: that AOE is out at once', bDead.status === 401);
} finally {
  await Promise.all([a.id, b.id, r.id, std.id, ...made].map((id) => admin({ op: 'revoke', id })));
  const forgot = await admin({ op: 'forget-test-invites' });
  check('test invitations forgotten', forgot.forgotten >= 4, JSON.stringify(forgot));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
