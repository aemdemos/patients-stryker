#!/usr/bin/env node
/*
 * End-to-end test of the review backend on a workspace (default Stage): invitations, scope,
 * loading, saving, conflicts, limits, CORS, AOE statuses, revocation. Works on the test page
 * /test/backend and a test group (`group:test|backend`) only, and removes both at the end; the
 * test invitation is revoked. Tokens are never printed.
 * usage: node tools/review/backend/test/backend.test.mjs [--ns 892544-strykerstdreview-stage]
 */
const args = process.argv.slice(2);
const i = args.indexOf('--ns');
const ns = i >= 0 ? args[i + 1] : '892544-strykerstdreview-stage';
const WEB = `https://${ns}.adobeioruntime.net/api/v1/web/std-review`;
const PAGE = '/test/backend';
const ORIGIN = 'https://standardise-v3--stryker-com--strykerenterprise.aem.page';

async function admin(params) {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${ns}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(params),
  });
  return (await resp.json()).body;
}
async function web(path, { method = 'GET', invite, body, origin = ORIGIN } = {}) {
  const headers = { origin };
  if (invite) headers['x-review-invite'] = invite;
  if (body) headers['content-type'] = 'application/json';
  const resp = await fetch(`${WEB}/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await resp.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }
  return { status: resp.status, json, headers: resp.headers };
}
const state = (invite, page = PAGE) => web(`state?page=${encodeURIComponent(page)}`, { invite });
const save = (invite, changes, page = PAGE) => web('save', { method: 'POST', invite, body: { page, changes } });

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${detail}`}`);
};

await admin({ op: 'purge-test', page: PAGE });
const inv = await admin({
  op: 'invite', name: 'backend test', paths: [PAGE], days: 1,
});
check('invitation created with a link', !!inv.token && inv.link.includes('invite=') && inv.scope.paths[0] === PAGE, JSON.stringify(inv.error || ''));
const noGroups = await admin({
  op: 'invite', name: 'backend test (no groups)', paths: [PAGE], days: 1, groups: false,
});
const T = inv.token;

let r = await state('');
check('no invitation: 401', r.status === 401 && r.json?.error.code === 'no-invite', r.status);
r = await state(`${T.slice(0, -4)}AAAA`);
check('a forged token: 401', r.status === 401 && r.json?.error.code === 'bad-invite', r.status);
r = await state(T, '/us/en/foot-and-ankle/products/prophecy');
check('a page outside the invitation: 403', r.status === 403, r.status);
r = await state(T);
check('load: 200, the reviewer from the invitation, no rows yet', r.status === 200 && r.json.reviewer === 'backend test' && r.json.rows.filter((x) => x.page === PAGE).length === 0, JSON.stringify(r.json).slice(0, 200));

r = await save(T, [{
  item: 's1b0', kind: 'variant', value: '"card-grid"', rev: 0, reviewer: 'someone else',
}]);
check('save: ok, rev 1', r.status === 200 && r.json.results[0].ok && r.json.results[0].rev === 1, JSON.stringify(r.json));
r = await save(T, [{
  item: 's1b0', kind: 'variant', value: '"image-row"', rev: 0,
}]);
check('a save from an old state: conflict, nothing written', r.json?.results[0].conflict === true && r.json.results[0].rev === 1, JSON.stringify(r.json));
r = await save(T, [{
  item: 's1b0', kind: 'variant', value: '"media-text"', rev: 1,
}, {
  item: 'note:t1', kind: 'note', value: JSON.stringify({ id: 't1', text: 'a test note', status: 'open' }), rev: 0,
}]);
check('two changes in one save', r.json?.results.every((x) => x.ok), JSON.stringify(r.json));
r = await save(T, [{
  page: '*', item: 'group:test|backend', kind: 'variant', value: '"card-grid"', rev: 0,
}]);
check('a group choice (page *) with the group right', r.json?.results?.[0].ok === true, JSON.stringify(r.json));
r = await save(noGroups.token, [{
  page: '*', item: 'group:test|backend', kind: 'width', value: '"wide-first"', rev: 0,
}]);
check('a group choice without the group right: 403', r.status === 403, r.status);
r = await save(T, [{
  item: 's1b0', kind: 'status:comment', value: '{}', rev: 0,
}]);
check('a reviewer cannot write an AOE status: 400', r.status === 400, r.status);
r = await save(T, [{
  item: 's1b0', kind: 'comment', value: JSON.stringify('x'.repeat(21000)), rev: 0,
}]);
check('a value over 20 KB: 400', r.status === 400, r.status);
r = await save(T, [{
  item: 's1b0', kind: 'comment', value: '"hi"', rev: 0,
}], '/us/en/foot-and-ankle/products/prophecy');
check('saving on a page outside the invitation: 403', r.status === 403, r.status);

r = await state(T);
const rows = r.json?.rows || [];
const v = rows.find((x) => x.page === PAGE && x.item === 's1b0' && x.kind === 'variant');
check('load after saves: newest value, rev 2, reviewer from the invitation', v?.value === '"media-text"' && v.rev === 2 && v.reviewer === 'backend test', JSON.stringify(v));
check('load includes the group choice', rows.some((x) => x.page === '*' && x.item === 'group:test|backend'));

const st = await admin({ op: 'status', rows: [{ page: PAGE, item: 'note:t1', kind: 'status:note', value: { state: 'done', release: 'r1', reason: 'test' } }] });
check('AOE status via the admin action', st.results?.[0].ok === true, JSON.stringify(st));
r = await state(T);
check('the status shows on load, by AOE', (r.json?.rows || []).some((x) => x.kind === 'status:note' && x.reviewer === 'AOE'));
const ex = await admin({ op: 'export' });
check('export has the entries', (ex.rows || []).some((x) => x.page === PAGE && x.item === 's1b0'));

// threads: replies by a reviewer and by the AOE team, closing, role rules
const aoe = await admin({
  op: 'invite', name: 'backend test (AOE)', paths: [PAGE], days: 1, role: 'aoe',
});
check('an AOE invitation: role aoe, results on', aoe.scope?.role === 'aoe' && aoe.scope.results === true, JSON.stringify(aoe.scope));
const rep = (token, id, value, rev = 0) => save(token, [{
  item: 's1b0', kind: `reply:comment:${id}`, value: JSON.stringify(value), rev,
}]);
r = await rep(aoe.token, 'answer01', { text: 'Widened the image column.', status: { state: 'done', release: 'r1' } });
check('the AOE team answers with a status', r.json?.results?.[0].ok === true, JSON.stringify(r.json));
r = await rep(T, 'reply001', { text: 'Thanks, looks better.' });
check('a reviewer replies', r.json?.results?.[0].ok === true, JSON.stringify(r.json));
r = await rep(T, 'reply001', { text: 'edited' }, 1);
check('a reply is written once (no edit)', r.status === 400 && r.json?.error.code === 'bad-reply', r.status);
r = await rep(T, 'status01', { text: 'x', status: { state: 'done' } });
check('a reviewer cannot give a status', r.status === 400, r.status);
r = await rep(aoe.token, 'close001', { action: 'resolve' });
check('the AOE team cannot close a thread', r.status === 400, r.status);
r = await rep(T, 'close002', { action: 'resolve', text: 'Resolved.' });
check('a reviewer closes the thread', r.json?.results?.[0].ok === true, JSON.stringify(r.json));
r = await state(T);
const thread = (r.json?.rows || []).filter((x) => x.item === 's1b0' && x.kind.startsWith('reply:comment:'));
check('load: the thread with roles (aoe, reviewer)', thread.length === 3 && thread.some((x) => x.role === 'aoe' && x.reviewer === 'backend test (AOE)')
  && thread.filter((x) => x.role === 'reviewer').length === 2, JSON.stringify(thread.map((x) => [x.reviewer, x.role])));
const ans = await admin({ op: 'answer', rows: [{ page: PAGE, item: 's1b0', thread: 'comment', text: 'From the command line.', status: { state: 'progress' } }] });
check('admin answer: an AOE reply in the thread', ans.results?.[0].ok === true && /^reply:comment:/.test(ans.results[0].kind), JSON.stringify(ans));
// everyone sees every message; only handovers change whose turn it is
const say = (token, item, id, value) => save(token, [{
  item, kind: `reply:comment:${id}`, value: JSON.stringify(value), rev: 0,
}]);
await save(T, [{
  item: 's2b0', kind: 'comment', value: JSON.stringify('internal question'), rev: 0,
}]);
await say(T, 's2b0', 'int00001', { text: 'Ann, do you agree?' });
const seen = async (token) => ((await state(token)).json?.rows || []).filter((x) => x.item === 's2b0').length;
check('the AOE team sees a thread still in discussion among the reviewers', await seen(aoe.token) === 2);
check('so do the reviewers', await seen(T) === 2);
r = await say(T, 's2b0', 'send0001', { action: 'handover', text: 'Please look at this.' });
check('"send to the AOE team" is allowed for reviewers', r.json?.results?.[0].ok === true, JSON.stringify(r.json));
check('… and the handover', await seen(aoe.token) === 3, await seen(aoe.token));
r = await say(aoe.token, 's2b0', 'aoeint01', { text: 'internal: which token?' });
check('the AOE team\'s own discussion is visible to the reviewers at once', r.json?.results?.[0].ok === true && await seen(T) === 4);
r = await say(aoe.token, 's2b0', 'aoeback1', { action: 'handover', text: 'Fixed.', status: { state: 'done', release: 'r2' } });
check('"send back" works', r.json?.results?.[0].ok === true && await seen(T) === 5, await seen(T));
// page states: reviewers only
const pageState = (token, value) => save(token, [{
  item: 'page', kind: 'state', value: JSON.stringify(value), rev: 0,
}]);
r = await pageState(aoe.token, 'skip');
check('the AOE team cannot set a page state', r.status === 400 && r.json?.error.code === 'bad-state', r.status);
r = await pageState(T, 'maybe');
check('an unknown page state is refused', r.status === 400, r.status);
r = await pageState(T, 'approved');
check('a reviewer approves the page', r.json?.results?.[0].ok === true, JSON.stringify(r.json));
const ov = await web('overview', { invite: T });
check('overview: the page waits for the reviewers (one thread sent back, one closed)', ov.json?.pages?.find((p) => p.page === PAGE)?.state === 'waiting-reviewer', JSON.stringify(ov.json?.pages));
await admin({ op: 'revoke', id: aoe.id });

r = await web('results', { invite: T });
check('results without the results right: 403', r.status === 403 && r.json?.error.code === 'no-results', r.status);
const withResults = await admin({
  op: 'invite', name: 'backend test (results)', paths: [PAGE], days: 1, results: true,
});
check('an invitation with the results right gets a results link', !!withResults.results && withResults.results.includes('results.html?invite='));
r = await web('results', { invite: withResults.token });
check('results: the entries in scope', r.status === 200 && r.json.rows.some((x) => x.page === PAGE && x.item === 's1b0')
  && r.json.rows.every((x) => x.page === '*' || x.page === PAGE), r.status);
await admin({ op: 'revoke', id: withResults.id });

r = await web(`state?page=${encodeURIComponent(PAGE)}`, { method: 'OPTIONS' });
check('CORS preflight from the review preview', r.status === 204 && r.headers.get('access-control-allow-origin') === ORIGIN, `${r.status} ${r.headers.get('access-control-allow-origin')}`);
r = await web(`state?page=${encodeURIComponent(PAGE)}`, { method: 'OPTIONS', origin: 'https://example.com' });
check('no CORS for another site', !r.headers.get('access-control-allow-origin'), r.headers.get('access-control-allow-origin'));

await admin({ op: 'revoke', id: inv.id });
await admin({ op: 'revoke', id: noGroups.id });
r = await state(T);
check('a revoked invitation: 401', r.status === 401 && r.json?.error.code === 'revoked', r.status);
const purge = await admin({ op: 'purge-test', page: PAGE });
check('clean-up: test entries and test group choice removed', purge.deleted >= 3 && purge.groups === 1, JSON.stringify(purge));

console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
