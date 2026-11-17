#!/usr/bin/env node
/*
 * Review feedback → work items for the AOE team (summary.js): a readable report (report.md), the
 * same for agents (work-items.json) and the items the agent still has to read (to-read.json; its
 * readings go to the themes file, see tools/review/README.md). Reads the review backend (or --csv),
 * every standard page from the preview (for the blocks' designs and the reach of each design) and
 * the agent's readings (--themes, kept next to the output by default). Runs against the workspace preview.
 * usage: node tools/review/summarise.mjs [--csv rows.csv] [--out migration-work/review-summary]
 *   [--themes <out>/themes.json] [--base http://localhost:3000] [--include-tests] [--ns <workspace>]
 */
import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'fs';
import { createRequire } from 'module';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
const out = opt('--out', 'migration-work/review-summary');
const themesFile = opt('--themes', `${out}/themes.json`);
const csvFile = opt('--csv', null);
const includeTests = args.includes('--include-tests');
const prefix = /localhost|127\.0\.0\.1|preview-aemcoder/.test(base) ? '/content' : '';

const ns = opt('--ns', '892544-strykerstdreview-stage');
// the rows: a CSV file (tests: test/sample-rows.csv), else every entry of the review backend
// (its private admin action; the workspace credential is added by the environment)
let csv = null;
let backendRows = null;
if (csvFile) csv = readFileSync(csvFile, 'utf8');
else {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${ns}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'export' }),
  });
  const body = resp.ok ? (await resp.json()).body : null;
  if (!body?.rows) throw new Error(`review backend export: ${resp.status} ${JSON.stringify(body?.error || '')}`);
  backendRows = body.rows;
}
const themes = existsSync(themesFile) ? JSON.parse(readFileSync(themesFile, 'utf8')) : { items: {} };

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(60000);
await page.goto(`${base}/tools/review/pages.json`);
const { result, markdown, missing } = await page.evaluate(async ({
  text, given, themes: readings, prefix: pre, includeTests: tests,
}) => {
  const s = await import('/tools/review/summary.js');
  const { parseCsv } = await import('/tools/review/store.js');
  let rows = given;
  if (!rows) {
    const table = parseCsv(text);
    const head = table.shift() || [];
    const fields = ['__id__', 'page', 'item', 'kind', 'value', 'reviewer', 'time'];
    const at = Object.fromEntries(fields.map((f) => [f, head.indexOf(f)]));
    rows = table.filter((r) => r.length > 1).map((r) => Object.fromEntries(fields.map((f) => [f, r[at[f]] ?? ''])));
  }
  const { pages } = await (await fetch('/tools/review/pages.json')).json();
  const { groups } = await (await fetch('/tools/review/groups.json')).json();
  const models = {};
  const lost = [];
  // every standard page (the reach of each design), a few at a time
  for (let i = 0; i < pages.length; i += 12) {
    const batch = pages.slice(i, i + 12);
    const htmls = await Promise.all(batch.map((p) => fetch(`${pre}/std${p.path}.plain.html`).then((r) => (r.ok ? r.text() : null))));
    batch.forEach((p, j) => {
      if (htmls[j] === null) lost.push(p.path);
      else models[p.path] = s.pageModel(htmls[j]);
    });
  }
  const titles = Object.fromEntries(pages.map((p) => [p.path, p.title]));
  const res = s.summarise({
    rows, models, titles, groups, themes: readings, includeTests: tests,
  });
  return { result: res, markdown: s.toMarkdown(res), missing: lost };
}, {
  text: csv, given: backendRows, themes, prefix, includeTests,
});
await browser.close();

mkdirSync(out, { recursive: true });
writeFileSync(`${out}/work-items.json`, JSON.stringify(result, null, 1));
writeFileSync(`${out}/report.md`, markdown);
// what the agent still has to read: items with no reading or a stale one, in short form
const toRead = result.items.filter((it) => it.kind !== 'decision' && (!it.reading || it.reading.stale))
  .map((it) => ({
    id: it.id,
    kind: it.kind,
    title: it.title,
    reach: it.reach,
    rows: it.evidence.map((e) => ({
      ref: e.ref, where: e.where, category: e.category, width: e.width, text: e.text, by: e.reviewer, status: e.status?.state,
    })),
  }));
writeFileSync(`${out}/to-read.json`, JSON.stringify({ themesFile, items: toRead }, null, 1));
console.log(`${result.items.length} work items from ${result.source.used} rows (${result.source.skipped} test rows left out) → ${out}/report.md, ${out}/work-items.json`);
Object.entries(result.counts).forEach(([k, n]) => console.log(`  ${k}: ${n}`));
console.log(`  ${toRead.length} items to read (no reading yet or new feedback since) → ${out}/to-read.json`);
if (missing.length) console.log(`  ${missing.length} standard pages not found on the preview, e.g. ${missing.slice(0, 3).join(', ')}`);
