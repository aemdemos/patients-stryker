#!/usr/bin/env node
/*
 * Standardise pilot: the standards gallery, a draft page showing each standard Columns variant
 * with the content of real instances (the largest clusters it fits), built with the transfer
 * rules (rules/columns.js), so the gallery shows exactly what a choice would produce.
 * usage: node gallery.mjs --content <content dir> --instances <instances.jsonl>
 *          --clusters <clusters-columns.json> --out <drafts doc .plain.html> [--per 3]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const content = opt('--content');
const out = opt('--out');
const per = Number(opt('--per', 3));
const instances = Object.fromEntries(readFileSync(opt('--instances'), 'utf8').split('\n').filter(Boolean)
  .map((l) => JSON.parse(l))
  .map((i) => [i.id, i]));
const clusters = JSON.parse(readFileSync(opt('--clusters'), 'utf8'))
  .filter((c) => !c.tail).sort((a, b) => b.members.length - a.members.length);

// candidates: the first instance of each cluster, largest first (several clusters per standard)
const candidates = clusters.slice(0, 80).map((c) => {
  const inst = instances[c.members[0]];
  return {
    cluster: c.id,
    size: c.members.length,
    id: inst.id,
    page: inst.pages[0] || inst.doc,
    html: readFileSync(join(content, `${inst.doc}.plain.html`), 'utf8'),
    section: inst.section,
    block: inst.block,
  };
});

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const html = await page.evaluate(async ({ src, list, n }) => {
  const m = await import(`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(src)))}`);
  const doc = document.implementation.createHTMLDocument('');
  const el = (tag, txt) => {
    const e = doc.createElement(tag);
    if (txt) e.textContent = txt;
    return e;
  };
  const sections = [];
  const intro = el('div');
  intro.append(el('h1', 'Standard Columns variants (pilot)'));
  intro.append(el('p', 'Each standard below is shown with the content of real Columns blocks from the product pages, '
    + 'transformed by the standardisation rules: the same result a reviewer gets by choosing that standard. '
    + 'Under each example: the cluster it stands for, its size, and what the standard changes.'));
  sections.push(intro);
  Object.entries(m.STANDARDS).forEach(([key, std]) => {
    const head = el('div');
    head.append(el('h2', std.label));
    head.append(el('p', std.description));
    sections.push(head);
    let shown = 0;
    list.forEach((c) => {
      if (shown >= n) return;
      const { body } = new DOMParser().parseFromString(`<body>${c.html}</body>`, 'text/html');
      const section = body.children[c.section];
      const blocks = [...section.querySelectorAll(':scope > div[class]')].filter((b) => !b.classList.contains('section-metadata'));
      if (!blocks[c.block] || !m.eligible(blocks[c.block]).includes(key)) return;
      const { section: result, changes, ok } = m.transform(section, c.block, key);
      if (!ok) return;
      shown += 1;
      const note = el('div');
      note.append(el('p', `Example ${shown}: ${c.cluster} (${c.size} blocks), from ${c.page}. `
        + `Changes: ${changes.join('; ') || 'none'}.`));
      sections.push(note);
      // the block and its settings only (the section's other content is not part of the example)
      sections.push(doc.importNode(m.isolate(result, c.block), true));
    });
  });
  const meta = el('div');
  const md = el('div');
  md.className = 'metadata';
  [['Title', 'Standard Columns variants (pilot)'], ['site', 'corp'], ['template', 'product-detail'],
    ['style-settings', 'on'], ['robots', 'noindex, nofollow']].forEach(([k, v]) => {
    const row = el('div');
    row.append(el('div', k), el('div', v));
    md.append(row);
  });
  meta.append(md);
  sections.push(meta);
  return sections.map((s) => s.outerHTML).join('\n');
}, { src: readFileSync(join(HERE, 'rules/columns.js'), 'utf8'), list: candidates, n: per });
await browser.close();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${html}\n`);
console.log(`gallery → ${out}`);
