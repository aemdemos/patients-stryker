#!/usr/bin/env node
/*
 * Test of the AOE feedback summary (summary.js) on the sample rows (sample-rows.mjs): every row
 * lands in the expected work item, with its kind, block, reach, status and disagreements.
 * usage: node tools/review/test/summary.test.mjs [--base http://localhost:3000]
 */
import { execFileSync } from 'child_process';
import { readFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const args = process.argv.slice(2);
const i = args.indexOf('--base');
const base = i >= 0 ? args[i + 1] : 'http://localhost:3000';
const out = mkdtempSync(join(tmpdir(), 'aoe-summary-'));
execFileSync('node', ['tools/review/summarise.mjs', '--csv', 'tools/review/test/sample-rows.csv', '--out', out,
  '--themes', 'tools/review/test/sample-themes.json', '--base', base, '--include-tests'], { stdio: 'inherit' });
const result = JSON.parse(readFileSync(join(out, 'work-items.json'), 'utf8'));
const byId = Object.fromEntries(result.items.map((it) => [it.id, it]));

let failures = 0;
const check = (label, ok) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
};
const where = (id) => (byId[id]?.evidence || []).map((e) => e.where).sort().join(', ');

check('rows used: 49 of 52 (the vanished block and the 2 AOE status rows aside)', result.source.rows === 52 && result.source.used === 49 && result.source.gone === 1 && result.source.aoeStatusRows === 2, JSON.stringify(result.source));
const discussed = result.items.flatMap((it) => it.evidence).find((e) => (e.text || '').startsWith('INTERNAL:'));
check('a comment still in discussion is in the summary, marked as not sent yet', discussed?.thread?.state === 'internal', JSON.stringify(discussed?.thread));
check('counts per kind', JSON.stringify(result.counts) === JSON.stringify({
  decision: 5, variant: 5, conversion: 4, page: 2, question: 4,
}));
// decisions
check('group width choice', byId['decision:group:columns|media-text|text,media']?.target.width === 'wide-first');
check('group text set: newest reviewer wins', byId['decision:group:section|text-serif-title']?.target.value === 'text-serif');
check('single choices aggregated (2 blocks on 2 pages)', byId['decision:block:cards-corp:variant:teaser>resources']?.reach.blocks === 2);
check('a choice equal to the standard is no decision', !result.items.some((it) => it.id.startsWith('decision:block:columns:variant:feature-statement')));
check('section text set choice', !!byId['decision:section:text:default>text-large']);
// variant changes: comments go to the design the block shows (its own choice first)
check('media-text comments on 5 blocks (one still in discussion)', where('variant:columns:media-text') === 'Columns s11b0, Columns s12b0, Columns s16b0, Columns s3b0, Columns s9b0');
check('a comment on a re-chosen block goes to its new design + layout note', where('variant:cards-corp:resources') === 'Cards s14b0, Cards s5b1');
check('reach = every instance of the design', byId['variant:columns:media-text']?.reach.blocks > 500);
check('text set comment', !!byId['variant:section:text-x-large']);
// conversion fixes: notes located by their anchor (text, Dynamic Media image in a title link)
check('text note on the feature statement', where('conversion:columns:feature-statement') === 'Columns s0b0');
check('image note on the card grid', where('conversion:columns:card-grid') === 'Columns s4b0');
check('link note on default content', where('conversion:section:default') === 'Text s19');
check('resolved note left out', !result.items.some((it) => it.evidence.some((e) => e.item === 'note:sample-6')));
// pages, questions
check('page comments + note without anchor', byId['page:/us/en/foot-and-ankle/products/smart-toe-ii']?.evidence.length === 2);
check('disagreement on a group', !!byId['question:*:group:section|text-serif-title|text']);
check('disagreement on a block', !!byId['question:/us/en/foot-and-ankle/products/prophecy:s0b0|variant']);
check('a choice that no longer fits its block is a re-check, not a decision', !!byId['question:stale:/us/en/foot-and-ankle/products/prophecy:s4b0|variant']
  && !result.items.some((it) => it.kind === 'decision' && it.evidence.some((e) => e.item === 's4b0')));
// block keys: an entry saved under a key lands on its block; a key no longer on the page is a re-check
const keyed = (byId['variant:columns:media-text']?.evidence || []).find((e) => e.text?.startsWith('Saved under the block key'));
check('an entry saved under a block key lands on its block (position now, key kept)', keyed?.at === 's16b0' && /^b:columns:[0-9a-f]{8}$/.test(keyed.item), JSON.stringify(keyed));
check('a key no longer on the page: re-check question', !!byId['question:gone:/us/en/foot-and-ankle/products/prophecy:b:columns:00000000|variant']);
// threads: an AOE answer in the tool and a reviewer closing it; an answer still open
const gap = (byId['variant:columns:media-text']?.evidence || []).find((e) => e.text === 'The gap between the image and the text is too wide.');
check('a thread answered by the AOE team and closed by the reviewer: resolved, with its status', gap?.thread?.state === 'resolved'
  && gap.thread.replies === 3 && gap.status?.state === 'done' && gap.status.release === 'r2', JSON.stringify(gap?.thread));
const phone = byId['variant:cards-corp:teaser']?.evidence[0];
check('a thread the AOE team sent back: waiting for the reviewers, in progress', phone?.thread?.state === 'waiting-reviewer' && phone.status?.state === 'progress', JSON.stringify(phone?.thread));
check('AOE members are not counted as reviewers', !result.source.reviewers.includes('sample AOE member'), JSON.stringify(result.source.reviewers));
// AOE status
check('status: partly done', byId['variant:columns:media-text']?.state === 'partly');
check('thread counts per work item', JSON.stringify(byId['variant:columns:media-text']?.threads) === JSON.stringify({ 'waiting-aoe': 2, 'waiting-reviewer': 1, resolved: 1 }), JSON.stringify(byId['variant:columns:media-text']?.threads));
check("status: won't do", byId['conversion:columns:media-text']?.state === 'wontdo');
check('links open the tool at the block, by its key', /[?&]block=b%3Acards-corp%3A[0-9a-f]{8}/.test(byId['variant:cards-corp:teaser']?.evidence[0].link || ''), byId['variant:cards-corp:teaser']?.evidence[0].link);

// the agent's readings: shown, stale when older than the feedback, kept out of to-read when fresh
check('reading attached with its themes', byId['variant:columns:media-text']?.reading?.themes.length === 2
  && byId['variant:columns:media-text'].reading.stale === false);
check('reading older than its feedback is stale', byId['page:/us/en/foot-and-ankle/products/smart-toe-ii']?.reading?.stale === true);
const toRead = JSON.parse(readFileSync(join(out, 'to-read.json'), 'utf8')).items.map((it) => it.id);
check('to-read: unread and stale items, no fresh ones, no decisions', toRead.includes('page:/us/en/foot-and-ankle/products/smart-toe-ii')
  && toRead.includes('variant:cards-corp:teaser') && !toRead.includes('variant:columns:media-text')
  && !toRead.some((id) => id.startsWith('decision:')));
check('report marks the reading as the agent\'s', readFileSync(join(out, 'report.md'), 'utf8').includes('**Agent reading** (agent (Claude)'));

console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
