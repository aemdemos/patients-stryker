#!/usr/bin/env node
/*
 * Standardise pilot, step 7 checks: the style coverage check in a standardised mode. The check
 * (tools/importer/migration-index/check-style-coverage.mjs) runs on the /std documents as they
 * were reviewed (apply's backup) and as apply wrote them, against the same live snapshots. A
 * style the documents carried before and not after is
 *   - expected when the standard drops it on purpose: blank lines inside a standardised block
 *     (as many as apply reports removed), a box inside a standardised block whose change list
 *     says its boxes were removed;
 *   - flagged otherwise (a rule bug, or a drop nobody decided).
 * Styles carried after and not before are listed as gained.
 *
 * usage: node tools/importer/standardise/check-standardised.mjs --check <check-style-coverage.mjs>
 *          --content <content dir> --backup <apply backup dir> --report <apply-report.json>
 *          --candidates <candidates.json> --cache <page cache dir> --work <scratch dir>
 *          [--json <out.json>]
 */
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, cpSync,
} from 'fs';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { join } from 'path';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const need = ['--check', '--content', '--backup', '--report', '--candidates', '--cache', '--work'];
if (need.some((n) => !opt(n))) {
  console.error(`usage: check-standardised.mjs ${need.map((n) => `${n} <…>`).join(' ')} [--json <out>]`);
  process.exit(2);
}
const work = opt('--work');
const applied = JSON.parse(readFileSync(opt('--report'), 'utf8'));
const data = JSON.parse(readFileSync(opt('--candidates'), 'utf8'));
const pages = Object.entries(data.pages).map(([path, p]) => ({ path: path.replace(/^\//, ''), url: p.live }));

// two run folders for the check: the documents before (the backup over the current /std) and after
const runDir = (name) => join(work, name);
['before', 'after'].forEach((name) => {
  const std = join(runDir(name), 'content/std');
  if (existsSync(std)) throw new Error(`${std} exists: use a new --work folder`);
  mkdirSync(std, { recursive: true });
  cpSync(join(opt('--content'), 'std'), std, { recursive: true });
  if (name === 'before') cpSync(join(opt('--backup'), 'std'), std, { recursive: true });
  const reports = join(runDir(name), 'tools/importer/reports');
  mkdirSync(reports, { recursive: true });
  pages.forEach((p, i) => writeFileSync(join(reports, `${i}.report.json`), JSON.stringify({ status: 'success', ...p })));
});

const check = (name) => {
  const out = join(work, `${name}.json`);
  try {
    execFileSync('node', [opt('--check'), '--run', runDir(name), '--cache', opt('--cache'), '--json', out], { stdio: ['ignore', 'ignore', 'inherit'] });
  } catch (e) {
    // (exit code 1: some page misses a style; the json has it)
    if (!existsSync(out)) throw e;
  }
  return JSON.parse(readFileSync(out, 'utf8'));
};
const before = check('before');
const after = check('after');

// what apply did per page (its document and the fragments it links): blank lines removed, the
// documents whose boxes went
const changedOf = (page) => Object.values(applied.pages).filter((d) => d.pages.includes(`/${page}`))
  .flatMap((d) => d.changed);
const blankRemoved = (page) => changedOf(page).flatMap((c) => c.changes)
  .map((t) => t.match(/(\d+) blank lines? removed/)).filter(Boolean)
  .reduce((n, m) => n + Number(m[1]), 0);

// is a text inside a standardised block (a std-… class) whose boxes were removed?
const browser = await chromium.launch();
const page = await browser.newPage();
const inStandard = (doc, key) => {
  const file = join(runDir('after'), 'content', `${doc}.plain.html`);
  if (!doc || !existsSync(file)) return Promise.resolve(null);
  return page.evaluate(({ html, text }) => {
    const plain = (s) => String(s || '').replace(/\[\[[^\]]*\]/g, '').replace(/\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const { body } = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    const block = [...body.querySelectorAll('div[class*="std-"]')]
      .find((b) => plain(b.textContent).includes(text.slice(0, 40)));
    return block ? [...block.classList].join(' ') : null;
  }, { html: readFileSync(file, 'utf8'), text: key });
};

const key = (r) => `${r.rule}|${r.key}|${r.detail || ''}`;
const issues = (p) => (p?.results || []).filter((r) => r.status === 'wrong' || r.status === 'missing');
const byPath = (run) => Object.fromEntries(run.pages.map((p) => [p.path, p]));
const b = byPath(before);
const a = byPath(after);
const summary = {
  expected: [], flagged: [], gained: [], errors: [],
};

async function comparePage({ path }) {
  if (a[path]?.error || b[path]?.error) {
    summary.errors.push({ page: path, error: a[path]?.error || b[path]?.error });
    return;
  }
  const was = issues(b[path]);
  const now = issues(a[path]);
  const left = [...was];
  const fresh = now.filter((r) => {
    const i = left.findIndex((x) => key(x) === key(r) && (r.rule !== 'blank-line' || x.found === r.found));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
  left.filter((r) => r.rule !== 'blank-line' || !now.some((x) => x.rule === 'blank-line'))
    .forEach((r) => summary.gained.push({ page: path, ...r }));
  const removed = blankRemoved(path);
  await fresh.reduce((chain, r) => chain.then(async () => {
    const item = { page: path, ...r };
    if (r.rule === 'blank-line') {
      const was1 = Number((was.find((x) => x.rule === 'blank-line')?.found || r.key).match(/^\d+/)[0]);
      const now1 = Number(r.found.match(/^\d+/)[0]);
      item.why = `${was1 - now1} fewer, ${removed} removed by the standards`;
      (was1 - now1 <= removed ? summary.expected : summary.flagged).push(item);
      return;
    }
    const block = await inStandard(r.doc || path, r.key);
    const boxesGone = changedOf(path).some((c) => c.changes.some((t) => /boxes inside the columns removed|white box/i.test(t)));
    if (r.rule === 'box-colour' && block && boxesGone) {
      item.why = `inside ${block}, its boxes removed by the standard`;
      summary.expected.push(item);
    } else {
      item.why = block ? `inside ${block}` : 'outside the standardised blocks';
      summary.flagged.push(item);
    }
  }), Promise.resolve());
}
await pages.reduce((chain, p) => chain.then(() => comparePage(p)), Promise.resolve());
await browser.close();

const line = (r) => `  /${r.page}: ${r.rule} "${r.key}"${r.detail ? ` (${r.detail})` : ''} → ${r.status}${r.found ? `: ${r.found}` : ''}${r.why ? ` — ${r.why}` : ''}`;
console.log(`${pages.length} pages: ${summary.expected.length} expected drops, ${summary.flagged.length} flagged, ${summary.gained.length} gained, ${summary.errors.length} errors`);
if (summary.flagged.length) console.log(`\n## flagged\n${summary.flagged.map(line).join('\n')}`);
if (summary.expected.length) console.log(`\n## expected (the standards' drops)\n${summary.expected.map(line).join('\n')}`);
if (summary.gained.length) console.log(`\n## gained\n${summary.gained.map(line).join('\n')}`);
summary.errors.forEach((e) => console.log(`ERROR /${e.page}: ${e.error}`));
if (opt('--json')) writeFileSync(opt('--json'), JSON.stringify(summary, null, 1));
process.exit(summary.flagged.length || summary.errors.length ? 1 : 0);
