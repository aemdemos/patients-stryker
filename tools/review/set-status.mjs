#!/usr/bin/env node
/*
 * The AOE team's progress back to the reviewers, for many rows at once (one by one: answer in the
 * tool with an AOE invitation): an AOE answer in the thread of every reviewer row of a work item
 * (work-items.json from summarise.mjs), through the backend's private admin action `answer` (the
 * workspace credential is added by the environment). Reply value { text: reason, status: { state,
 * release, reason, workItem, commit } }, signed --by (default AOE), role aoe. The tool shows it in
 * the thread, the results page in its AOE column, the next summary per row ("partly" when mixed).
 * usage: node tools/review/set-status.mjs --item <work item id> --state done|progress|wontdo|open
 *   [--release r1] [--reason "…"] [--refs <ref>,<ref>] [--work migration-work/review-summary/work-items.json]
 *   [--by "name"] [--dry-run] [--ns 892544-strykerstdreview-stage]
 * --refs: only these rows of the item (refs as in work-items.json: <page>#<item>|<kind>).
 * Decisions are not given a status here: the apply step records what it applied.
 */
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const STATES = ['done', 'progress', 'wontdo', 'open'];
const id = opt('--item');
const state = opt('--state');
const work = opt('--work', 'migration-work/review-summary/work-items.json');
const refs = opt('--refs', '') ? opt('--refs').split(',').map((r) => r.trim()) : null;
const dry = args.includes('--dry-run');
const ns = opt('--ns', '892544-strykerstdreview-stage');

if (!id || !STATES.includes(state)) {
  console.error(`usage: --item <work item id> --state ${STATES.join('|')} [--release r1] [--reason "…"] [--refs …] [--dry-run]`);
  process.exit(2);
}
const { items } = JSON.parse(readFileSync(work, 'utf8'));
const item = items.find((it) => it.id === id);
if (!item) {
  console.error(`no work item ${id} in ${work}`);
  process.exit(1);
}
if (item.kind === 'decision') {
  console.error('decisions get no status here: the apply step records what it applied');
  process.exit(1);
}
const evidence = item.evidence.filter((e) => e.page !== '*' && (!refs || refs.includes(e.ref)));
if (refs && evidence.length !== refs.length) {
  console.error(`refs not in ${id}: ${refs.filter((r) => !evidence.some((e) => e.ref === r)).join(', ')}`);
  process.exit(1);
}
let commit = '';
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch (e) {
  commit = '';
}
const value = {
  state, release: opt('--release', ''), reason: opt('--reason', ''), workItem: id, commit,
};
const by = opt('--by', 'AOE');
const rows = evidence.filter((e) => ['comment', 'note'].includes(e.kind)).map((e) => ({
  page: e.page, item: e.item, thread: e.kind, text: value.reason || undefined, status: value, by,
}));
rows.forEach((r) => console.log(`${dry ? '(dry run) ' : ''}${r.page} ${r.item} ${r.thread} thread → ${state}${value.release ? ` in ${value.release}` : ''}`));
if (dry || !rows.length) process.exit(0);

const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${ns}/actions/std-review/admin?blocking=true&result=true`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'answer', rows }),
});
const body = resp.ok ? (await resp.json()).body : null;
const saved = (body?.results || []).filter((r) => r.ok).length;
console.log(`${saved} of ${rows.length} AOE answers saved${body?.error ? ` (${body.error.message})` : ''}${resp.ok ? '' : ` (${resp.status})`}`);
process.exit(saved === rows.length ? 0 : 1);
