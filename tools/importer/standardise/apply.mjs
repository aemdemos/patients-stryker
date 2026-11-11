#!/usr/bin/env node
/*
 * Standardise pilot, step 7: apply the review decisions to the /std documents.
 *
 * For every Columns instance of the pilot (candidates.json):
 *   1. its choice: the block's own decision > its group's choice (unless the block is one of the
 *      group's exceptions) > the pre-selected standard > none. "legacy" and none leave it as is;
 *   2. the content hash: the block must be as it was reviewed (the hash of the review, taken on
 *      /rs; /std fragment links count as their /rs links), else it is skipped;
 *   3. the transfer rules (rules/columns.js), run in a Playwright page as the DOM;
 *   4. the documents with a changed block are written back, only their changed sections
 *      re-serialised (every other byte stays as it was).
 * The originals are copied to --backup first (once; later runs read them from there, so a
 * re-run after a rule fix starts from the reviewed documents again).
 * The report lists per page the blocks changed with what each transform dropped or changed, the
 * blocks kept as they are, and the skipped ones (changed since the review, choice not fitting).
 *
 * usage: node tools/importer/standardise/apply.mjs --content <content dir>
 *          --candidates <candidates.json> --decisions <export.json> [--decisions <more.json> …]
 *          --backup <dir> --report <apply-report.json> [--dry-run]
 */
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync,
} from 'fs';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { features, hashOf } from './lib/features.js';
import splitSections from './lib/sections.js';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const all = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []));
const content = opt('--content');
const backup = opt('--backup');
const reportFile = opt('--report');
const dryRun = args.includes('--dry-run');
if (!content || !backup || !reportFile || !opt('--candidates') || !all('--decisions').length) {
  console.error('usage: apply.mjs --content <dir> --candidates <json> --decisions <json> … --backup <dir> --report <json> [--dry-run]');
  process.exit(2);
}
const data = JSON.parse(readFileSync(opt('--candidates'), 'utf8'));
const rules = readFileSync(join(HERE, 'rules/columns.js'), 'utf8');

// the decision files, merged: the latest record of a block or a group wins
const decisions = {};
const clusters = {};
const newer = (a, b) => !a || String(b.at || '') >= String(a.at || '');
all('--decisions').forEach((file) => {
  const d = JSON.parse(readFileSync(file, 'utf8'));
  Object.entries(d.decisions || {}).forEach(([id, rec]) => {
    if (newer(decisions[id], rec)) decisions[id] = rec;
  });
  Object.entries(d.clusters || {}).forEach(([id, rec]) => {
    if (newer(clusters[id], rec)) clusters[id] = rec;
  });
});

function resolve(inst) {
  const own = decisions[inst.id];
  if (own) return { choice: own.choice, scope: 'instance', hash: own.hash || inst.hash };
  const group = clusters[inst.cluster];
  if (group && !(group.exceptions || []).includes(inst.id)) return { choice: group.choice, scope: 'cluster', hash: inst.hash };
  if (inst.preselect) return { choice: inst.preselect, scope: 'preselected', hash: inst.hash };
  return { choice: null, scope: 'none', hash: inst.hash };
}

// the documents and their instances (a fragment is listed once, whatever page links it)
const docs = new Map();
const seen = new Set();
Object.entries(data.pages).forEach(([page, p]) => p.instances.forEach((inst) => {
  if (seen.has(inst.id)) return;
  seen.add(inst.id);
  if (!docs.has(inst.doc)) docs.set(inst.doc, { pages: new Set(), instances: [] });
  docs.get(inst.doc).pages.add(page);
  docs.get(inst.doc).instances.push(inst);
}));

// the reviewed documents: from the backup when there is one (a re-run), else the content
const fileOf = (dir, doc) => join(dir, `${doc}.plain.html`);
const reviewed = (doc) => readFileSync(existsSync(fileOf(backup, doc)) ? fileOf(backup, doc) : fileOf(content, doc), 'utf8');
// (the review hashed the /rs documents: /std fragment links count as their /rs links)
const asReviewed = (html) => html.replace(/href="\/std\/([^"#?]*\/fragments\/)/g, 'href="/rs/$1')
  .replace(/>\/std\/([^<]*\/fragments\/)/g, '>/rs/$1');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.evaluate(async (src) => {
  window.stdRules = await import(`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(src)))}`);
}, rules);

const report = {
  applied: new Date().toISOString(), dryRun, pages: {}, totals: {},
};
const count = (key) => { report.totals[key] = (report.totals[key] || 0) + 1; };
const written = [];

// one document: resolve its blocks' choices, check them, transform, write it back
async function applyDoc(doc, entry) {
  const html = reviewed(doc);
  const { parts, tail } = splitSections(html);
  // (the hashes of the blocks as they are now)
  const found = await page.evaluate(features, asReviewed(html));
  const hashes = Object.fromEntries(found.map((it) => [`s${it.section}b${it.block}`, hashOf(it)]));
  const plan = [];
  const result = {
    doc, pages: [...entry.pages].sort(), changed: [], kept: [], skipped: [],
  };
  entry.instances.forEach((inst) => {
    const r = resolve(inst);
    const key = `s${inst.section}b${inst.block}`;
    const item = {
      id: inst.id, cluster: inst.cluster, scope: r.scope, choice: r.choice,
    };
    if (!r.choice || r.choice === 'legacy') {
      result.kept.push({ ...item, why: r.choice ? 'kept as is (decided)' : 'no decision' });
      count(r.choice ? 'kept' : 'undecided');
    } else if (hashes[key] !== r.hash) {
      result.skipped.push({ ...item, why: hashes[key] ? 'the block changed since the review' : 'the block is no longer there' });
      count('skipped');
    } else if (!(inst.eligible || []).includes(r.choice)) {
      result.skipped.push({ ...item, why: `the choice ${r.choice} does not fit this block` });
      count('skipped');
    } else {
      plan.push({ ...item, section: inst.section, block: inst.block });
    }
  });
  if (plan.length) {
    const out = await page.evaluate(({ source, steps }) => {
      const { body } = new DOMParser().parseFromString(`<body>${source}</body>`, 'text/html');
      const sections = [...body.children];
      const done = {};
      const changes = [];
      steps.forEach((s) => {
        const current = done[s.section] || sections[s.section];
        const t = window.stdRules.transform(current, s.block, s.choice);
        changes.push({ id: s.id, ok: t.ok, changes: t.changes });
        if (t.ok) done[s.section] = t.section;
      });
      return {
        count: sections.length,
        tags: sections.map((e) => e.tagName),
        sections: Object.fromEntries(Object.entries(done).map(([i, el]) => [i, el.outerHTML])),
        changes,
      };
    }, { source: html, steps: plan });
    if (out.count !== parts.length || out.tags.some((t) => t !== 'DIV')) {
      result.skipped.push(...plan.map((p) => ({ ...p, why: 'the document could not be split into its sections' })));
      plan.forEach(() => count('skipped'));
    } else {
      out.changes.forEach((c) => {
        const p = plan.find((x) => x.id === c.id);
        if (c.ok) {
          result.changed.push({
            id: p.id, cluster: p.cluster, scope: p.scope, choice: p.choice, changes: c.changes,
          });
          count(`changed:${p.scope}`);
          count(`standard:${p.choice}`);
        } else {
          result.skipped.push({ ...p, why: c.changes.join('; ') });
          count('skipped');
        }
      });
      if (result.changed.length) {
        const text = parts.map((s, i) => s.before + (out.sections[i] ?? s.html)).join('') + tail;
        if (!dryRun) {
          if (!existsSync(fileOf(backup, doc))) {
            mkdirSync(dirname(fileOf(backup, doc)), { recursive: true });
            copyFileSync(fileOf(content, doc), fileOf(backup, doc));
          }
          writeFileSync(fileOf(content, doc), text);
        }
        written.push(doc);
      }
    }
  }
  report.pages[doc] = result;
}

// (one document after the other, on the one page)
await [...docs].reduce((prev, [doc, entry]) => prev.then(() => applyDoc(doc, entry)),
  Promise.resolve());
await browser.close();

report.totals.documents = docs.size;
report.totals.written = written.length;
writeFileSync(reportFile, JSON.stringify(report, null, 1));
const t = report.totals;
const scopes = Object.entries(t).filter(([k]) => k.startsWith('changed:'));
const changed = scopes.reduce((n, [, v]) => n + v, 0);
console.log(`${docs.size} documents: ${changed} blocks standardised (${scopes.map(([k, v]) => `${k.slice(8)} ${v}`).join(', ')}), `
  + `${t.kept || 0} kept as is, ${t.undecided || 0} without a decision, ${t.skipped || 0} skipped; `
  + `${written.length} documents ${dryRun ? 'would be ' : ''}written → ${reportFile}`);
