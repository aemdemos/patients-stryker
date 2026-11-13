#!/usr/bin/env node
/*
 * Standardise pilot: the /std documents on the standard type scale (rules/typography.js).
 * Every page and fragment document under <content>/std is rewritten: its size tags and size
 * rows become step names, pages get `type-scale: standard`. Only the changed sections are
 * re-serialised. The documents as they were are copied to --backup first (once; later runs
 * read them from there, so a re-run after a rule fix starts from the same documents).
 *
 * usage: node tools/importer/standardise/apply-typography.mjs --content <content dir>
 *          --backup <dir> --report <report.json> [--dry-run]
 */
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync,
} from 'fs';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import splitSections from './lib/sections.js';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const content = opt('--content');
const backup = opt('--backup');
const reportFile = opt('--report');
const dryRun = args.includes('--dry-run');
if (!content || !backup || !reportFile) {
  console.error('usage: apply-typography.mjs --content <dir> --backup <dir> --report <json> [--dry-run]');
  process.exit(2);
}
const rules = readFileSync(join(HERE, 'rules/typography.js'), 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const docs = walk(join(content, 'std')).filter((f) => f.endsWith('.plain.html') && !f.includes('/drafts/'))
  .map((f) => f.slice(content.replace(/\/$/, '').length + 1).replace(/\.plain\.html$/, ''));
const fileOf = (dir, doc) => join(dir, `${doc}.plain.html`);
const source = (doc) => readFileSync(existsSync(fileOf(backup, doc)) ? fileOf(backup, doc) : fileOf(content, doc), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.evaluate(async (src) => {
  window.typeRules = await import(`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(src)))}`);
}, rules);

const report = { applied: new Date().toISOString(), dryRun, documents: {} };
let written = 0;
async function applyDoc(doc) {
  const html = source(doc);
  const { parts, tail } = splitSections(html);
  const out = await page.evaluate(({ text, isPage }) => {
    const { body } = new DOMParser().parseFromString(`<body>${text}</body>`, 'text/html');
    const before = [...body.children].map((s) => s.outerHTML);
    const result = window.typeRules.transformDocument(body, { page: isPage });
    const after = [...body.children].map((s) => s.outerHTML);
    return {
      count: before.length,
      changed: Object.fromEntries(after.map((h, i) => [i, h]).filter(([i, h]) => h !== before[i])),
      ...result,
    };
  }, { text: html, isPage: !doc.includes('/fragments/') });
  if (out.count !== parts.length) {
    report.documents[doc] = { skipped: 'the document could not be split into its sections' };
    return;
  }
  report.documents[doc] = { changes: out.changes, tags: out.sizes.length };
  if (!Object.keys(out.changed).length) return;
  const text = parts.map((s, i) => s.before + (out.changed[i] ?? s.html)).join('') + tail;
  if (!dryRun) {
    if (!existsSync(fileOf(backup, doc))) {
      mkdirSync(dirname(fileOf(backup, doc)), { recursive: true });
      copyFileSync(fileOf(content, doc), fileOf(backup, doc));
    }
    writeFileSync(fileOf(content, doc), text);
  }
  written += 1;
}
await docs.reduce((chain, doc) => chain.then(() => applyDoc(doc)), Promise.resolve());
await browser.close();
writeFileSync(reportFile, JSON.stringify(report, null, 1));
const tags = Object.values(report.documents).reduce((n, d) => n + (d.tags || 0), 0);
console.log(`${docs.length} documents: ${tags} size tags on the scale; ${written} documents ${dryRun ? 'would be ' : ''}written → ${reportFile}`);
