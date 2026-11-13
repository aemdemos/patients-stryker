#!/usr/bin/env node
/*
 * Standardise pilot, step 1: every block instance of the imported documents with its
 * features, for clustering (cluster.py) and the standard-variant candidates (rules/).
 *
 * Document features (per block instance): block name and options, the section's styles and
 * settings rows (the readable form, scripts/corp-settings.js; `(2)` rows belong to the
 * section's 2nd block of that kind), the cell structure and the kind of content in each cell,
 * the inline [[…]] tags, Box / Blank / Column break lines. Fragments are inventoried in their
 * own documents and listed with the pages that link them.
 *
 * Usage: node tools/importer/standardise/inventory.mjs --content <content dir> --root <rs>
 *          --out <instances.jsonl> [--pages <list of page paths>]
 *   --content  the folder holding <root>/us/en/… .plain.html (e.g. the workspace content/)
 *   --root     the content root of the pages (rs: the readable-settings pages)
 *   --pages    only these page paths (one per line, /rs/us/en/…) and their fragments
 */
import {
  readFileSync, writeFileSync, existsSync, readdirSync, statSync,
} from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { features, hashOf } from './lib/features.js';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const content = opt('--content');
const root = (opt('--root', 'rs')).replace(/^\/|\/$/g, '');
const out = opt('--out');
if (!content || !out) {
  console.error('usage: inventory.mjs --content <dir> --root <rs> --out <instances.jsonl> [--pages <list>]');
  process.exit(2);
}

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const docPath = (file) => `/${file.slice(content.replace(/\/$/, '').length + 1).replace(/\.plain\.html$/, '')}`;
// (not the library documents under <root>/.da/)
const all = walk(join(content, root))
  .filter((f) => f.endsWith('.plain.html') && !f.split('/').includes('.da')).map(docPath);
const isFragment = (p) => p.includes('/fragments/');
const read = (p) => readFileSync(join(content, `${p}.plain.html`), 'utf8');
const fragmentLinks = (html) => [...html.matchAll(/href="(\/[^"#?]*\/fragments\/[^"#?]*)"/g)]
  .map((m) => m[1].replace(/\/$/, ''));

// pages in scope, and the fragments they (and their fragments) link
const pages = (opt('--pages') ? readFileSync(opt('--pages'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
  : all.filter((p) => !isFragment(p)));
const usedBy = new Map();
const queue = pages.map((p) => [p, p]);
const docs = new Set();
while (queue.length) {
  const [doc, page] = queue.shift();
  if (existsSync(join(content, `${doc}.plain.html`))) {
    if (isFragment(doc)) usedBy.set(doc, new Set([...(usedBy.get(doc) || []), page]));
    const first = !docs.has(doc);
    docs.add(doc);
    if (first) fragmentLinks(read(doc)).forEach((f) => queue.push([f, page]));
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const lines = [];
const list = [...docs].sort();
for (let i = 0; i < list.length; i += 1) {
  const doc = list[i];
  // eslint-disable-next-line no-await-in-loop
  const instances = await page.evaluate(features, read(doc));
  instances.forEach((it) => {
    const { html, ...rest } = it;
    lines.push(JSON.stringify({
      id: `${doc}#s${it.section}b${it.block}`,
      doc,
      pages: isFragment(doc) ? [...(usedBy.get(doc) || [])].sort() : [doc],
      hash: hashOf(it),
      ...rest,
    }));
  });
}
await browser.close();
writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`${list.length} documents (${pages.length} pages), ${lines.length} block instances → ${out}`);
