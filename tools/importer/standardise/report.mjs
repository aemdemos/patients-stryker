#!/usr/bin/env node
/*
 * Standardise pilot, step 8: the results, as a markdown report (internal).
 * - how many Columns blocks are on a standard after apply, by standard and by how it was
 *   decided (the block's own decision, its group's choice, pre-selected);
 * - the legacy tail: blocks kept as they are (decided) and blocks no standard fits, per page;
 * - the review effort per flow: flow 1 (page by page) against flows 2 + 3 (group boards, then
 *   the pages), as decisions made and comparisons looked at (the overlay's timings are not a
 *   measure here: the pilot's clicks were scripted after the review by eye);
 * - the checks after apply (the standardised style check, when given);
 * - the review notes: side findings about the migration, and the standards to improve.
 *
 * usage: node tools/importer/standardise/report.mjs --candidates <candidates.json>
 *          --decisions <export.json> --apply <apply-report.json> --log <log.jsonl>
 *          [--check <check-standardised.json>] [--note "<other check result>" …] --out <report.md>
 */
import { readFileSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const json = (name) => JSON.parse(readFileSync(opt(name), 'utf8'));
const data = json('--candidates');
const decisions = json('--decisions');
const applied = json('--apply');
const log = readFileSync(opt('--log'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const check = opt('--check') ? json('--check') : null;
const LABEL = { 'std-media-text': 'Media + text', 'std-cards': 'Cards', 'std-text': 'Text columns' };
const pct = (n, of) => `${of ? Math.round((100 * n) / of) : 0}%`;
const short = (id) => id.replace(/^\/std\/us\/en\//, '');

// every Columns instance once, with what apply did to it
const docs = Object.values(applied.pages);
const changed = docs.flatMap((d) => d.changed);
const kept = docs.flatMap((d) => d.kept);
const skipped = docs.flatMap((d) => d.skipped);
const total = changed.length + kept.length + skipped.length;
const tally = (list, key) => list.reduce((m, x) => ({ ...m, [x[key]]: (m[x[key]] || 0) + 1 }), {});

const out = [];
out.push('# Standardise pilot: results (Columns, product detail)', '');
out.push(`Applied ${applied.applied.slice(0, 10)} to ${Object.keys(data.pages).length} pilot pages `
  + `(${docs.length} documents with Columns blocks, pages and fragments).`, '');

out.push('## How many blocks are on a standard', '');
out.push('| | Blocks | Share |', '|---|---|---|');
out.push(`| On a standard | ${changed.length} | ${pct(changed.length, total)} |`);
Object.entries(tally(changed, 'choice')).forEach(([k, v]) => out.push(`| · ${LABEL[k] || k} | ${v} | ${pct(v, total)} |`));
const keptDecided = kept.filter((k) => k.choice === 'legacy');
const noFit = kept.filter((k) => k.choice !== 'legacy');
out.push(`| Kept as they are (decided) | ${keptDecided.length} | ${pct(keptDecided.length, total)} |`);
out.push(`| No standard fits / no decision | ${noFit.length} | ${pct(noFit.length, total)} |`);
if (skipped.length) out.push(`| Skipped (changed since the review) | ${skipped.length} | ${pct(skipped.length, total)} |`);
out.push(`| **All Columns blocks** | **${total}** | |`, '');
const scopes = tally(changed, 'scope');
out.push(`How the standards were decided: ${scopes.instance || 0} by a decision on the block, `
  + `${scopes.cluster || 0} by their group's choice, ${scopes.preselected || 0} pre-selected (looked the same as today, `
  + 'nobody needed to look).', '');

out.push('## The legacy tail', '');
const tailPages = {};
[...keptDecided, ...noFit].forEach((k) => {
  const page = k.id.split('#')[0];
  (tailPages[page] = tailPages[page] || []).push(k);
});
out.push(`${keptDecided.length + noFit.length} blocks on ${Object.keys(tailPages).length} documents stay as they are.`, '');
out.push('| Document | Kept (decided) | No standard fits |', '|---|---|---|');
Object.entries(tailPages).sort().forEach(([page, list]) => {
  const ids = (f) => list.filter(f).map((k) => k.id.split('#')[1]).join(', ') || '–';
  out.push(`| ${short(page)} | ${ids((k) => k.choice === 'legacy')} | ${ids((k) => k.choice !== 'legacy')} |`);
});
out.push('');

out.push('## Review effort per flow', '');
const half = (h) => Object.entries(data.pages).filter(([, p]) => p.half === h).map(([page]) => page);
const effort = decisions.effort || [];
const sum = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);
const flow = (n) => log.filter((l) => l.flow === n);
const blocksOf = (pages) => new Set(pages.flatMap((p) => data.pages[p].instances.map((i) => i.id))).size;
const pageEffort = (pages) => effort.filter((e) => e.kind === 'page' && pages.includes(e.key));
const a = half('A');
const bPages = half('B');
const f1 = flow(1);
const f2 = flow(2);
const f3 = flow(3);
out.push('| | Flow 1: page by page | Flows 2 + 3: groups, then pages |', '|---|---|---|');
out.push(`| Pages | ${a.length} | ${bPages.length} |`);
out.push(`| Columns blocks on them | ${blocksOf(a)} | ${blocksOf(bPages)} |`);
const boards = effort.filter((e) => e.kind === 'board');
out.push(`| Group boards decided | – | ${boards.length} (${sum(f2, 'images')} board images) |`);
// (flow "1b": a second look at flow 1's kept blocks once the standards improved)
const f1b = flow('1b');
const second = f1b.length ? ` + ${sum(f1b, 'images')} on a second look (${f1b.length} pages)` : '';
out.push(`| Page comparisons looked at | ${sum(f1, 'images')} images${second} | ${sum(f3, 'images')} images |`);
out.push(`| Decisions made | ${sum(pageEffort(a), 'choices')} on the pages | ${sum(boards, 'choices')} on the boards`
  + ` + ${sum(pageEffort(bPages), 'choices')} on the pages |`);
const overrides = f3.reduce((n, l) => n + Object.keys(l.overrides || {}).length, 0);
out.push(`| Group choices changed on the page | – | ${overrides} |`, '');
out.push('The overlay also records seconds per page and board. In the pilot the clicks were made by a '
  + 'script after the review by eye, so those timings measure the script, not a reviewer: the '
  + 'decisions and the comparisons looked at are the measure of effort here.', '');

out.push('## Checks after apply', '');
if (check) {
  out.push(`- Authored styles (standardised mode): ${check.flagged.length} flagged, ${check.expected.length} expected drops `
    + `(${[...new Set(check.expected.map((e) => e.rule))].join(', ') || 'none'}), ${check.gained.length} gained, ${check.errors.length} errors.`);
  check.flagged.forEach((f) => out.push(`  - flagged: ${short(`/${f.page}`)} ${f.rule} "${f.key}" (${f.why})`));
}
// (the other checks' results, as run: --note "<text>", repeatable)
args.flatMap((x, i) => (x === '--note' ? [args[i + 1]] : [])).forEach((n) => out.push(`- ${n}`));
out.push('');

out.push('## Review notes', '');
const notes = log.filter((l) => l.notes && l.page);
const parts = (l) => l.notes.split(/;\s*/);
const side = notes.flatMap((l) => parts(l).filter((t) => /side finding/i.test(t))
  .map((t) => `${short(l.page)}: ${t.replace(/^.*?side finding(\s*\([^)]*\))?:\s*/i, '')}`));
out.push('### Side findings about the current migration (not caused by the standards)', '');
side.forEach((s) => out.push(`- ${s}`));
out.push('');
// (the reviewer's note of every page that kept blocks, without its side findings; a page's
// latest look counts)
const latest = notes.filter((l, i) => !notes.slice(i + 1).some((x) => x.page === l.page));
const keptNotes = latest.filter((l) => Number(l.legacy) > 0)
  .map((l) => `${short(l.page)} (${l.legacy} kept or no fit): `
    + `${parts(l).filter((t) => !/side finding/i.test(t)).join('; ') || '–'}`);
out.push('### Why blocks were kept as they are', '');
keptNotes.forEach((s) => out.push(`- ${s}`));
if (f2.length) (f2[0].legacy_groups || []).forEach((g) => out.push(`- group ${g}: kept on the board`));
out.push('');

writeFileSync(opt('--out'), `${out.join('\n')}\n`);
console.log(`${total} Columns blocks: ${changed.length} on a standard (${pct(changed.length, total)}), `
  + `${keptDecided.length} kept, ${noFit.length} no fit → ${opt('--out')}`);
