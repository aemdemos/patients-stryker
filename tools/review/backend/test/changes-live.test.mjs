#!/usr/bin/env node
/*
 * Review backend, deployed (Stage by default): the daily source change check end to end on two
 * test pages (capture op check with its own page list, force: checked again the same day).
 * 1. the first check starts each page's history (baseline: 3 loads, a shot since none yet);
 * 2. checked again: unchanged, no new shot;
 * 3. one test page's source switched to another real page (its content really changes):
 *    changed, a new shot labelled "change history: changed"; the other page unchanged;
 * 4. the shots action gives the tool the record; the site's code is recorded.
 * Test pages only (/test/…), purged after (entries, shots, change records). Gentle: 2 sources.
 * usage: node tools/review/backend/test/changes-live.test.mjs
 */
import { TEST, actionUrl, webBase } from '../target.mjs';

const A = '/test/changes-a';
const B = '/test/changes-b';
const SRC = [
  'https://www.stryker.com/us/en/acute-care/products/eye-surgery.html',
  'https://www.stryker.com/us/en/craniomaxillofacial/products/3d-systems.html',
  'https://www.stryker.com/us/en/foot-and-ankle/procedures/brachymetatarsia.html',
];
async function call(action, p) {
  const resp = await fetch(actionUrl(TEST.ns, action), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${action} ${p.op}: ${resp.status} ${text.slice(0, 200)}`);
  return JSON.parse(text).body;
}
const admin = (p) => call('admin', { space: 'main', ...p });
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 400)}`}`);
  if (!ok) failed += 1;
};
const run = (pages) => call('capture', {
  op: 'check', space: 'main', force: true, pages,
});
const record = (page) => admin({ op: 'changes-page', page });
const history = async (page) => (await admin({ op: 'shot-history', page })).versions || [];

try {
  for (const p of [A, B]) await admin({ op: 'purge-test', page: p });
  let r = await run([{ page: A, source: SRC[0], template: 't1' }, { page: B, source: SRC[1], template: 't2' }]);
  check('1. first check: both pages start their history', r.baseline === 2 && !r.blocked, JSON.stringify(r));
  let a = await record(A);
  check('1. the record: baseline, parts known, images dated', a?.log?.[0]?.result === 'baseline' && a.known.length > 0 && Object.keys(a.images).length > 0, JSON.stringify(a).slice(0, 300));
  check('1. a shot to start from (the page had none)', (await history(A)).some((v) => v.by === 'change history: start'));
  const site = await admin({ op: 'changes-site' });
  check('1. the site\'s code recorded (CSS / JS by stamp and size)', Object.keys(site.code || {}).length > 0, JSON.stringify(site.code).slice(0, 200));

  r = await run([{ page: A, source: SRC[0], template: 't1' }, { page: B, source: SRC[1], template: 't2' }]);
  check('2. checked again: unchanged (or a learned variant), no shot', r.unchanged + r.variant === 2 && r.shots === 0, JSON.stringify(r));
  const shotsBefore = (await history(A)).length;

  r = await run([{ page: A, source: SRC[2], template: 't1' }, { page: B, source: SRC[1], template: 't2' }]);
  check('3. A\'s source now another page: changed, with a shot; B unchanged', r.changed === 1 && r.shots === 1 && r.unchanged + r.variant === 1, JSON.stringify(r));
  a = await record(A);
  const last = a.log[a.log.length - 1];
  check('3. A\'s record: changed, its parts, the shot', last.result === 'changed' && last.parts.length > 0 && !!last.shot, JSON.stringify(last));
  const h = await history(A);
  check('3. the new shot in A\'s history, labelled', h.length === shotsBefore + 1 && h[h.length - 1].by === 'change history: changed' && h[h.length - 1].id === last.shot, JSON.stringify(h.map((v) => [v.id, v.by])));

  // the tool's view: the shots action (an AOE test invitation)
  const inv = await admin({
    op: 'invite', name: 'tool test changes', paths: ['/test/'], days: 1, role: 'aoe',
  });
  const s = await (await fetch(`${webBase(TEST.ns)}/shots?page=${encodeURIComponent(A)}`, { headers: { 'x-review-invite': inv.token } })).json();
  check('4. the shots action gives the record (since, last, changes)', s.changes?.since && s.changes.last?.result === 'changed' && s.changes.changes.some((c) => c.result === 'changed'), JSON.stringify(s.changes));
  await admin({ op: 'revoke', id: inv.id });
  await admin({ op: 'forget-test-invites' });
} finally {
  for (const p of [A, B]) await admin({ op: 'purge-test', page: p });
  check('clean-up: no change record left', !(await record(A)) && !(await record(B)));
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
