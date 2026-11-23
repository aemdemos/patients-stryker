#!/usr/bin/env node
/*
 * Test of the shared review rules (tools/review/threads.js): page statuses (who may set which,
 * precedence, older reviewed mark), threads as plain chats with a Done mark (older resolve moves,
 * AOE status rows), thread counts.
 * usage: node tools/review/backend/test/states.test.mjs
 */
import {
  pageState, threadState, stateAllowed, batchProblem,
} from '../../threads.js';

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

// who may set which status
check('reviewers: in review, send to the AOE team, approve, skip, clear', ['in-review', 'waiting-aoe', 'approved', 'skip', ''].every((s) => stateAllowed(s, 'reviewer')));
check('reviewers cannot send to the customer', !stateAllowed('waiting-customer', 'reviewer'));
check('the AOE team: send back to the customer only', stateAllowed('waiting-customer', 'aoe') && !['in-review', 'waiting-aoe', 'approved', 'skip'].some((s) => stateAllowed(s, 'aoe')));

// threads
const opener = row(B, 'comment', 'too small');
const msg = row(B, 'reply:comment:r1', { text: 'Ann, do you agree?' });
const answer = aoe(B, 'reply:comment:a1', { text: 'enlarged', status: { state: 'done', release: 'r2' } });
const t1 = threadState([opener, msg, answer]);
check('a thread: open, its messages counted, the AOE status kept', !t1.done && t1.replies === 2 && t1.status?.state === 'done' && t1.status.release === 'r2', JSON.stringify(t1));
check('ticked Done', threadState([opener, msg, row(B, 'done:comment', true)]).done === true);
check('unticked again', threadState([opener, row(B, 'done:comment', true), aoe(B, 'done:comment', false)]).done === false);
check('older data: a thread closed with resolve is done', threadState([opener, row(B, 'reply:comment:r9', { action: 'resolve' })]).done === true);
check('older data: a status row is an AOE status', threadState([opener, row(B, 'status:comment', { state: 'wontdo' }, 'AOE', 'aoe')]).status?.state === 'wontdo');

// page statuses
const cases = [
  ['nothing yet', [], 'unreviewed'],
  ['activity only (a design choice)', [row(B, 'variant', 'card-grid')], 'in-review'],
  ['a comment only', [opener], 'in-review'],
  ['marked in review', [row('page', 'state', 'in-review')], 'in-review'],
  ['sent to the AOE team', [opener, row('page', 'state', 'waiting-aoe')], 'waiting-aoe'],
  ['sent back to the customer', [opener, row('page', 'state', 'waiting-aoe'), aoe('page', 'state', 'waiting-customer')], 'waiting-customer'],
  ['approved, never any feedback', [row('page', 'state', 'approved')], 'approved'],
  ['approved after a comment', [opener, row('page', 'state', 'approved')], 'resolved'],
  ['approved after a design choice', [row(B, 'variant', 'card-grid'), row('page', 'state', 'approved')], 'resolved'],
  ['skip', [opener, row('page', 'state', 'skip')], 'skipped'],
  ['skip taken back', [row('page', 'state', 'skip'), row('page', 'state', '')], 'in-review'],
  ['the older reviewed mark counts as approved', [row('page', 'reviewed', true)], 'approved'],
  ['a deleted QA note is no thread', [row('note:n1', 'note', { id: 'n1', text: 'x', deleted: true }), row('page', 'state', 'approved')], 'approved'],
  ['a removed comment (empty) is no thread', [row(B, 'comment', 'x'), row(B, 'comment', ''), row('page', 'state', 'approved')], 'approved'],
];
cases.forEach(([label, rows, want]) => {
  const got = pageState(rows);
  check(`page: ${label}: ${got.state}`, got.state === want, `(want ${want}) ${JSON.stringify(got)}`);
});
const p = pageState([opener, msg, row(B, 'done:comment', true), row('note:n1', 'note', { id: 'n1', text: 'odd' }), aoe('page', 'state', 'waiting-customer')]);
check('counts open / done threads; who set the status', p.threads.open === 1 && p.threads.done === 1 && p.set?.by === 'Iustin' && p.set.role === 'aoe'
  && p.reviewers.join() === 'Jane', JSON.stringify(p));
// batches: organisation, not activity
const onlyBatch = pageState([aoe('page', 'batch', 3)]);
check('a batch mark alone: not reviewed yet, no activity, its batch', onlyBatch.state === 'unreviewed' && onlyBatch.last === null && onlyBatch.batch === 3, JSON.stringify(onlyBatch));
const moved = pageState([aoe('page', 'batch', 3), row('page', 'comment', 'hi'), aoe('page', 'batch', 5)]);
check('the newest batch wins; activity still counts', moved.batch === 5 && moved.state === 'in-review' && moved.last?.by === 'Jane', JSON.stringify(moved));
check('unmarked (null): no batch', pageState([aoe('page', 'batch', 2), aoe('page', 'batch', null)]).batch === null);
check('batch values: 1–999 or null', !batchProblem('1') && !batchProblem('999') && !batchProblem('null') && ['0', '1000', '2.5', '"3"', 'x'].every((v) => batchProblem(v)));
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
