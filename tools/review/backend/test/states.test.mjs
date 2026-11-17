#!/usr/bin/env node
/*
 * Test of the page states for the status page (lib/states.mjs): one page per state, the order of
 * precedence, threads (reviewer reply, AOE answer, close, an older AOE status row), notes.
 * usage: node tools/review/backend/test/states.test.mjs
 */
import { pageState } from '../lib/states.mjs';

let n = 0;
const row = (item, kind, value, reviewer = 'Jane', role = 'reviewer') => {
  n += 1;
  return {
    page: '/p', item, kind, value: JSON.stringify(value), reviewer, role, time: `2026-11-17T10:${String(n).padStart(2, '0')}:00.000Z`,
  };
};
const aoe = (item, kind, value) => row(item, kind, value, 'Iustin', 'aoe');
const cases = [
  ['nothing yet', [], 'unreviewed'],
  ['a design choice only, not marked', [row('b:columns:1', 'variant', 'card-grid')], 'in-review'],
  ['marked reviewed, nothing else', [row('page', 'reviewed', true)], 'approved'],
  ['marked reviewed after a design choice', [row('b:columns:1', 'variant', 'card-grid'), row('page', 'reviewed', true)], 'resolved'],
  ['a comment, no answer', [row('b:columns:1', 'comment', 'too small')], 'waiting-aoe'],
  ['a comment the AOE team answered', [row('b:columns:1', 'comment', 'too small'), aoe('b:columns:1', 'reply:comment:a1', { text: 'done', status: { state: 'done' } })], 'waiting-reviewer'],
  ['… then the reviewer replied', [row('b:columns:1', 'comment', 'too small'), aoe('b:columns:1', 'reply:comment:a1', { text: 'done' }), row('b:columns:1', 'reply:comment:r1', { text: 'not quite' })], 'waiting-aoe'],
  ['… then closed and the page marked', [row('b:columns:1', 'comment', 'too small'), aoe('b:columns:1', 'reply:comment:a1', { text: 'done' }), row('b:columns:1', 'reply:comment:r2', { action: 'resolve' }), row('page', 'reviewed', true)], 'resolved'],
  ['closed but the page not marked reviewed', [row('b:columns:1', 'comment', 'too small'), row('b:columns:1', 'reply:comment:r2', { action: 'resolve' })], 'in-review'],
  ['one thread open beats one answered', [row('b:a:1', 'comment', 'x'), aoe('b:a:1', 'reply:comment:a1', { text: 'y' }), row('b:b:2', 'comment', 'z')], 'waiting-aoe'],
  ['an older AOE status row counts as an answer', [row('s1b0', 'comment', 'x'), row('s1b0', 'status:comment', { state: 'done' }, 'AOE', 'aoe')], 'waiting-reviewer'],
  ['a QA note, open', [row('note:n1', 'note', { id: 'n1', text: 'odd', status: 'open' })], 'waiting-aoe'],
  ['a deleted QA note is no thread', [row('note:n1', 'note', { id: 'n1', text: 'odd', deleted: true })], 'in-review'],
  ['a removed comment (empty) is no thread', [row('b:columns:1', 'comment', 'x'), row('b:columns:1', 'comment', ''), row('page', 'reviewed', true)], 'approved'],
  ['the reviewed mark taken back', [row('page', 'reviewed', true), row('page', 'reviewed', false)], 'in-review'],
];
let failures = 0;
cases.forEach(([label, rows, want]) => {
  const got = pageState(rows);
  const ok = got.state === want;
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${got.state}${ok ? '' : ` (want ${want}) ${JSON.stringify(got.threads)}`}`);
});
const mixed = pageState(cases[7][1]);
const okCounts = JSON.stringify(mixed.threads) === JSON.stringify({ open: 0, answered: 0, resolved: 1 }) && mixed.reviewed?.by === 'Jane' && mixed.reviewers.join() === 'Jane';
if (!okCounts) failures += 1;
console.log(`${okCounts ? 'ok  ' : 'FAIL'} counts, reviewed mark and reviewers (AOE members not among them)`);
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
