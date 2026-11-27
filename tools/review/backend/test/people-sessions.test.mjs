#!/usr/bin/env node
/*
 * The people of a review and their review sessions (the DA sign-in, branch da-app-v3, 27 Nov 2026),
 * against the Stage backend: invitations still work; people added, listed, removed by the AOE
 * team (never oneself); a session per person (test sessions: Stage only), limited to its pages,
 * refused once the person is removed, forged ones refused; a sign-in not made by DA refused; the
 * published site allowed (CORS). Test people (@example.com) and invitations removed after.
 * usage: node tools/review/backend/test/people-sessions.test.mjs
 */
import { actionUrl, webBase, TEST } from '../target.mjs';
const admin = async (p) => (await (await fetch(actionUrl(TEST.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: 'main', ...p }) })).json()).body;
const web = (a, opts = {}) => fetch(`${webBase(TEST.ns)}/${a}`, opts).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
let failed = 0;
const check = (w, ok, d = '') => { if (!ok) failed += 1; console.log(`${ok ? 'ok  ' : 'FAIL'} ${w}${ok ? '' : ` ${JSON.stringify(d).slice(0, 300)}`}`); };
// the old way still works: an invitation
const inv = await admin({ op: 'invite', name: 'tool test smoke', paths: ['/'], days: 1, role: 'reviewer' });
const st = await web(`state?page=${encodeURIComponent('/us/en/about/news/2024/stryker-s-stiles-shares-how-our-latest-orthopaedic-innovations-d')}`, { headers: { 'x-review-invite': inv.token } });
check('an invitation still works (state)', st.status === 200 && st.body.reviewer === 'tool test smoke', st.status);
await admin({ op: 'revoke', id: inv.id });
// people and sessions
const aoe = 'zz-aoe@example.com'; const rev = 'zz-reviewer@example.com';
check('person-put refuses a bad email', !!(await admin({ op: 'person-put', email: 'nope', name: 'x' })).error);
await admin({ op: 'person-put', email: aoe, name: 'ZZ AOE test', role: 'aoe', paths: ['/'] });
await admin({ op: 'person-put', email: rev, name: 'ZZ Reviewer test', role: 'reviewer', paths: ['/us/en/about'] });
const sa = await admin({ op: 'test-session', email: aoe });
const sr = await admin({ op: 'test-session', email: rev });
check('test sessions on Stage', !!sa.session && !!sr.session, { sa, sr });
const H = (t) => ({ headers: { 'x-review-invite': t, origin: 'https://da-app-v3--stryker-com--strykerenterprise.aem.live' } });
const sp = await web(`state?page=${encodeURIComponent('/us/en/about/news/2024/stryker-s-stiles-shares-how-our-latest-orthopaedic-innovations-d')}`, H(sr.session));
check('… its person, role and pages', sp.status === 200 && sp.body.reviewer === 'ZZ Reviewer test' && sp.body.role === 'reviewer', sp.body);
const out = await web(`state?page=${encodeURIComponent('/us/en/joint-replacement')}`, H(sr.session));
check('… a page outside its pages is refused', out.status === 403, out.status);
const pg = await web('people', H(sa.session));
check('people: the AOE member lists the people', pg.status === 200 && pg.body.people.some((p) => p.email === rev) && pg.body.me === aoe, pg.body);
const pgr = await web('people', H(sr.session));
check('people: a reviewer is refused', pgr.status === 403, pgr.status);
const self = await web('people', { method: 'POST', headers: { ...H(sa.session).headers, 'content-type': 'application/json' }, body: JSON.stringify({ op: 'remove', email: aoe }) });
check('people: one can\'t remove oneself', self.status === 400, self.body);
const rm = await web('people', { method: 'POST', headers: { ...H(sa.session).headers, 'content-type': 'application/json' }, body: JSON.stringify({ op: 'remove', email: rev }) });
check('people: the AOE member removes the reviewer', rm.status === 200 && rm.body.person.removed, rm.body);
const after = await web(`state?page=${encodeURIComponent('/us/en/about/news/2024/stryker-s-stiles-shares-how-our-latest-orthopaedic-innovations-d')}`, H(sr.session));
check('… the removed reviewer\'s session is refused at once', after.status === 401, after.status);
const cors = await fetch(`${webBase(TEST.ns)}/pages`, { method: 'OPTIONS', headers: { origin: 'https://da-app-v3--stryker-com--strykerenterprise.aem.live', 'access-control-request-headers': 'x-review-invite' } });
check('the published site may call the backend (CORS)', cors.headers.get('access-control-allow-origin') === 'https://da-app-v3--stryker-com--strykerenterprise.aem.live', cors.status);
const si = await web('signin?space=main', { headers: { authorization: 'Bearer a.b.c' } });
check('signin: a token not from DA is refused', si.status === 401 && si.body.error.code === 'other-app', si.body);
const forged = (await admin({ op: 'test-session', email: aoe })).session.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
check('a forged session is refused', (await web(`state?page=${encodeURIComponent('/us/en/about/news/2024/stryker-s-stiles-shares-how-our-latest-orthopaedic-innovations-d')}`, H(forged))).status === 401);
// clean-up
await admin({ op: 'person-forget', email: aoe });
await admin({ op: 'person-forget', email: rev });
await admin({ op: 'forget-test-invites' });
check('clean-up: test people gone', !(await admin({ op: 'people' })).people.some((p) => /zz-.*@example\.com/.test(p.email)));
console.log(failed ? `${failed} FAILED` : 'all passed');
