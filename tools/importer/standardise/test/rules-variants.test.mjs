#!/usr/bin/env node
/*
 * Tests of rules/variants.js on documents with Columns and Cards blocks (the /rs copies, as imported):
 * - every Columns block gets `columns <variant>` only, a key of VARIANTS;
 * - no readable tag is left inside a Columns block, and no Box / Blank line / Column break line;
 * - the words stay (tags and those lines aside), and the links and images; the headings stay
 *   (level and text, in order; title-sized paragraphs may become headings);
 * - gold text is Bold + Italic afterwards (each `[[Gold]…]` text is inside <strong><em> or
 *   <em><strong>);
 * - the section's settings keep no Columns row (Column widths, Text box, Grid, Cell colours …).
 * usage: node test/rules-variants.test.mjs --content <content dir> [--root rs] [--limit N]
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { createRequire } from 'module';
import { join, dirname } from 'path';
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
const root = opt('--root', 'rs');
const limit = Number(opt('--limit', '0'));
const rules = readFileSync(join(HERE, '../rules/variants.js'), 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
let files = walk(join(content, root)).filter((f) => f.endsWith('.plain.html') && !f.includes('/.da/'))
  .filter((f) => /class="(columns|cards-corp)/.test(readFileSync(f, 'utf8')));
if (limit) files = files.slice(0, limit);
const docs = files.map((f) => ({ path: f.slice(content.length), html: readFileSync(f, 'utf8') }));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const results = await page.evaluate(async ({ src, list }) => {
  const m = await import(`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(src)))}`);
  const LINE = /^(box(:| end)|column break$|\[\[blank line\]\]$)/i;
  const strip = (s) => s.replace(/\[\[[^\]]*\]|\]/g, '');
  const facts = (body) => {
    const words = [];
    body.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, td, th').forEach((el) => {
      if (el.closest('.section-metadata, .metadata') || el.querySelector('p, li, h1, h2, h3, h4, h5, h6')) return;
      const t = el.textContent.replace(/\s+/g, ' ').trim();
      if (!LINE.test(t)) words.push(...strip(t).split(' ').filter(Boolean));
    });
    return {
      words: words.join(' '),
      links: [...body.querySelectorAll('a')].map((a) => a.getAttribute('href')).join('\n'),
      images: body.querySelectorAll('img').length,
      heads: [...body.querySelectorAll('h1, h2, h3, h4, h5, h6')]
        .map((h) => `${h.tagName}:${strip(h.textContent).replace(/\s+/g, ' ').trim()}`).join('\n'),
    };
  };
  return list.map((d) => {
    const { body } = new DOMParser().parseFromString(`<body>${d.html}</body>`, 'text/html');
    // the gold texts of each Columns block before (a tag and its text in one text node)
    const goldRe = /\[\[[^\]]*\b(?:Gold|Dark-Gold)\b[^\]]*\]([^\][]+)\]/gi;
    const gold = [...body.querySelectorAll('.columns')].map((c) => [...c.textContent.matchAll(goldRe)]
      .map((x) => x[1].trim()).filter(Boolean));
    const before = facts(body);
    const out = m.transformDocument(body);
    const after = facts(body);
    const fails = [];
    ['words', 'links', 'images'].forEach((k) => {
      if (before[k] !== after[k]) fails.push(`${k} changed`);
    });
    // the headings stay, in order (title-sized paragraphs may become headings between them)
    const kept = after.heads.split('\n');
    let at = 0;
    before.heads.split('\n').filter(Boolean).forEach((h) => {
      const i = kept.indexOf(h, at);
      if (i < 0) fails.push(`heading lost: ${h.slice(0, 40)}`);
      else at = i + 1;
    });
    body.querySelectorAll('.cards-corp').forEach((c) => {
      const cls = [...c.classList];
      if (cls.length !== 2 || !m.CARD_VARIANTS[cls[1]]) fails.push(`class "${c.className}"`);
      if (c.textContent.includes('[[')) fails.push('tag left in Cards');
    });
    body.querySelectorAll('.columns').forEach((c) => {
      const cls = [...c.classList];
      if (cls.length !== 2 || !m.VARIANTS[cls[1]]) fails.push(`class "${c.className}"`);
      if (c.textContent.includes('[[')) fails.push('tag left in Columns');
      if ([...c.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6')].some((el) => LINE.test(el.textContent.trim()))) fails.push('line left in Columns');
    });
    body.querySelectorAll('.section-metadata > div > div:first-child').forEach((k) => {
      if (/^(Column widths|Text box|Grid|Cell colours|Image borders|Columns)( \(\d+\))?$/.test(k.textContent.trim())
        && k.closest('div[class]') && k.closest('.section-metadata').parentElement.querySelector(':scope > .columns')
        && !k.closest('.section-metadata').parentElement.querySelector(':scope > .hero-corp')) fails.push(`row ${k.textContent.trim()} left`);
    });
    // gold: each gold text of a Columns block is Bold + Italic now
    const notGold = [...body.querySelectorAll('.columns')].flatMap((c, i) => (gold[i] || []).filter((g) => ![...c.querySelectorAll(':is(strong em, em strong, b i, i b)')]
      .some((e) => e.textContent.includes(g) || g.includes(e.textContent.trim()))));
    if (notGold.length) fails.push(`gold not Bold + Italic: ${notGold.slice(0, 2).join(' | ')}`);
    return { path: d.path, blocks: out.blocks.length, fails: [...new Set(fails)] };
  });
}, { src: rules, list: docs });
await browser.close();
const failed = results.filter((r) => r.fails.length);
failed.slice(0, 20).forEach((r) => console.log(`FAIL ${r.path}: ${r.fails.join('; ')}`));
console.log(`${results.length} documents, ${results.reduce((n, r) => n + r.blocks, 0)} Columns and Cards blocks, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
