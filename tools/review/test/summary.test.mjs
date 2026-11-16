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

check('rows used: 27 review rows, 2 AOE status rows', result.source.used === 27 && result.source.aoeStatusRows === 2);
check('counts per kind', JSON.stringify(result.counts) === JSON.stringify({
  decision: 5, variant: 5, conversion: 4, page: 2, question: 3,
}));
// decisions
check('group width choice', byId['decision:group:columns|media-text|text,media']?.target.width === 'wide-first');
check('group text set: newest reviewer wins', byId['decision:group:section|text-serif-title']?.target.value === 'text-serif');
check('single choices aggregated (2 blocks on 2 pages)', byId['decision:block:cards-corp:variant:teaser>resources']?.reach.blocks === 2);
check('a choice equal to the standard is no decision', !result.items.some((it) => it.id.startsWith('decision:block:columns:variant:feature-statement')));
check('section text set choice', !!byId['decision:section:text:default>text-large']);
// variant changes: comments go to the design the block shows (its own choice first)
check('media-text comments on 3 blocks', where('variant:columns:media-text') === 'Columns s11b0, Columns s3b0, Columns s9b0');
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
// AOE status
check('status: partly done', byId['variant:columns:media-text']?.state === 'partly');
check("status: won't do", byId['conversion:columns:media-text']?.state === 'wontdo');
check('links open the tool at the block', byId['variant:cards-corp:teaser']?.evidence[0].link.includes('block=s9b0'));

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
