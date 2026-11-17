#!/usr/bin/env node
/*
 * Test of the shared review rules (tools/review/threads.js): thread states from handovers (plain
 * replies never change the turn), page states (in review, approve, skip) and their order of
 * precedence, older data (reviewed mark, AOE status rows).
 * usage: node tools/review/backend/test/states.test.mjs
 */
import { pageState, threadState } from '../../threads.js';

let n = 0;
const row = (item, kind, value, reviewer = 'Jane', role = 'reviewer') => {
  n += 1;
  return {
    page: '/p', item, kind, value: JSON.stringify(value), reviewer, role, time: `2026-11-17T10:${String(n).padStart(2, '0')}:00.000Z`,
  };
};
const aoe = (item, kind, value) => row(item, kind, value, 'Iustin', 'aoe');
const B = 'b:columns:1';
let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${detail}`}`);
};

// threads
const opener = row(B, 'comment', 'too small');
const internal = row(B, 'reply:comment:r1', { text: 'do you agree, Ann?' });
const ann = row(B, 'reply:comment:r2', { text: 'yes' }, 'Ann');
const sent = row(B, 'reply:comment:r3', { action: 'handover', text: 'please enlarge' });
const aoeTalk = aoe(B, 'reply:comment:a1', { text: 'internal: which token?' });
const back = aoe(B, 'reply:comment:a2', { action: 'handover', text: 'enlarged', status: { state: 'done', release: 'r2' } });
const close = row(B, 'reply:comment:r4', { action: 'resolve' });
check('a new comment and plain replies: internal', threadState([opener, internal, ann]).state === 'internal');
check('… sent to the AOE team: waiting for the AOE team', threadState([opener, internal, ann, sent]).state === 'waiting-aoe');
check('… AOE internal talk changes nothing', threadState([opener, sent, aoeTalk]).state === 'waiting-aoe');
const handed = threadState([opener, sent, aoeTalk, back]);
check('… sent back with a status: waiting for the reviewers, status kept', handed.state === 'waiting-reviewer' && handed.status?.state === 'done' && handed.status.release === 'r2', JSON.stringify(handed));
check('… resolved', threadState([opener, sent, back, close]).state === 'resolved');
check('an older AOE reply with a status counts as a handover', threadState([opener, aoe(B, 'reply:comment:a3', { text: 'x', status: { state: 'done' } })]).state === 'waiting-reviewer');
check('an older status row counts as an AOE handover', threadState([opener, row(B, 'status:comment', { state: 'done' }, 'AOE', 'aoe')]).state === 'waiting-reviewer');

// page states
const cases = [
  ['nothing yet', [], 'unreviewed'],
  ['activity only (a design choice)', [row(B, 'variant', 'card-grid')], 'in-review'],
  ['marked in review by hand', [row('page', 'state', 'in-review')], 'in-review'],
  ['approved, never any feedback', [row('page', 'state', 'approved')], 'approved'],
  ['approved after a design choice', [row(B, 'variant', 'card-grid'), row('page', 'state', 'approved')], 'resolved'],
  ['an internal thread only', [opener, internal], 'in-review'],
  ['a thread sent to the AOE team', [opener, sent], 'waiting-aoe'],
  ['a thread sent back', [opener, sent, back], 'waiting-reviewer'],
  ['waiting for the AOE team beats approved', [opener, sent, row('page', 'state', 'approved')], 'waiting-aoe'],
  ['resolved threads + approved', [opener, sent, back, close, row('page', 'state', 'approved')], 'resolved'],
  ['skip beats everything', [opener, sent, row('page', 'state', 'skip')], 'skipped'],
  ['skip taken back', [row('page', 'state', 'skip'), row('page', 'state', '')], 'in-review'],
  ['the older reviewed mark counts as approved', [row('page', 'reviewed', true)], 'approved'],
  ['a deleted QA note is no thread', [row('note:n1', 'note', { id: 'n1', text: 'x', deleted: true })], 'in-review'],
  ['a removed comment (empty) is no thread', [row(B, 'comment', 'x'), row(B, 'comment', ''), row('page', 'state', 'approved')], 'approved'],
];
cases.forEach(([label, rows, want]) => {
  const got = pageState(rows);
  check(`page: ${label}: ${got.state}`, got.state === want, `(want ${want}) ${JSON.stringify(got.threads)}`);
});
const counts = pageState([opener, sent, back, close, row('page', 'state', 'approved')]);
check('counts, approved by, reviewers (AOE members not among them)', counts.threads.resolved === 1 && counts.approved?.by === 'Jane'
  && counts.reviewers.join() === 'Jane', JSON.stringify(counts));
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
