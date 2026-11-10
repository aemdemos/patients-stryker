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
import { createHash } from 'crypto';
import { createRequire } from 'module';
import { join } from 'path';

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

// (runs in the browser, on one document's html)
function features(html) {
  const { body } = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const IMAGE = /\/is\/image\/|\/content\/dam\/.*\.(png|jpe?g|gif|webp|svg)|media-assets/i;
  const VIDEO = /\.m3u8|\/is\/content\/|youtube\.com|youtu\.be|vimeo\.com/i;
  const kindsOf = (cell) => {
    const kinds = new Set();
    cell.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(() => kinds.add('heading'));
    cell.querySelectorAll('ul, ol').forEach(() => kinds.add('list'));
    cell.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const title = a.getAttribute('title') || '';
      const alone = text(a) === text(a.closest('p, div'));
      if (VIDEO.test(href)) kinds.add('video');
      else if (/\/fragments\//.test(href)) kinds.add('fragment');
      else if (IMAGE.test(href) || IMAGE.test(title)) kinds.add('image');
      else if (alone && a.closest('strong, em')) kinds.add('button');
      else if (alone) kinds.add('link');
    });
    cell.querySelectorAll('img, picture').forEach(() => kinds.add('image'));
    cell.querySelectorAll('p').forEach((p) => {
      const t = text(p);
      if (t === '[[Blank line]]') kinds.add('blank');
      else if (/^box(:| end)/i.test(t)) kinds.add('box');
      else if (t === 'Column break') kinds.add('column-break');
      else if (t && !p.querySelector('a') && !/^\[\[[^\]]*\]\]$/.test(t)) kinds.add('text');
    });
    if (!kinds.size && text(cell)) kinds.add('text');
    return [...kinds].sort();
  };
  const tagsOf = (el) => {
    const tags = {};
    [...el.textContent.matchAll(/\[\[([^\]]+)\]/g)].forEach((m) => m[1].split(',').forEach((t) => {
      const k = t.trim().replace(/^[\d.]+×$/, 'N×').replace(/^[\d.]+vw$/, 'Nvw');
      tags[k] = (tags[k] || 0) + 1;
    }));
    return tags;
  };
  const found = [];
  [...body.children].forEach((section, si) => {
    const meta = section.querySelector(':scope > .section-metadata');
    const settings = {};
    if (meta) {
      [...meta.children].forEach((row) => {
        const [k, v] = [...row.children].map((c) => text(c));
        if (k) settings[k] = v || '';
      });
    }
    const styles = (settings.style || '').split(',').map((s) => s.trim()).filter(Boolean);
    delete settings.style;
    const blocks = [...section.querySelectorAll(':scope > div[class]')]
      .filter((b) => !b.classList.contains('section-metadata'));
    const nth = {};
    blocks.forEach((block, bi) => {
      const [name, ...options] = [...block.classList];
      nth[name] = (nth[name] || 0) + 1;
      const k = nth[name];
      // this block's settings: plain rows (first block, or shared) and its own `(k)` rows
      const own = {};
      Object.entries(settings).forEach(([key, v]) => {
        const m = key.match(/^(.*?) \((\d+)\)$/);
        if (m && Number(m[2]) === k) own[m[1]] = v;
        else if (!m && (k === 1 || /^(Column widths|Copy size|Label size|Heading size|Headings|Text|Padding|Margin)$/.test(key))) own[key] = v;
      });
      const rows = [...block.children].map((row) => [...row.children].map((cell) => ({
        kinds: kindsOf(cell),
        chars: text(cell).replace(/\[\[[^\]]*\]|\]/g, '').length,
      })));
      found.push({
        section: si,
        block: bi,
        name,
        options,
        styles,
        settings: own,
        sectionSettings: Object.keys(settings),
        rows: rows.length,
        cells: rows[0] ? rows[0].length : 0,
        cellKinds: rows[0] ? rows[0].map((c) => c.kinds) : [],
        cellChars: rows[0] ? rows[0].map((c) => c.chars) : [],
        tags: tagsOf(block),
        html: block.outerHTML,
      });
    });
  });
  return found;
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
      hash: createHash('sha1').update(html + JSON.stringify(it.settings) + it.styles.join(',')).digest('hex').slice(0, 12),
      ...rest,
    }));
  });
}
await browser.close();
writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`${list.length} documents (${pages.length} pages), ${lines.length} block instances → ${out}`);
