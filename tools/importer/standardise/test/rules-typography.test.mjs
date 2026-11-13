#!/usr/bin/env node
/*
 * Tests of rules/typography.js on every /std document, against the invariants of the scale:
 * - the words stay (the readable tags aside);
 * - the design names stay: colours, fonts, alignment (each tag's non-size parts);
 * - no measured size is left: in the text only step names, no Heading size row, Copy size /
 *   Label size by step name;
 * - the tags stay balanced (every opener closed, no stray closer);
 * - the worked-out desktop size of each size tag agrees with the size the page renders
 *   (--measured: type-measure output at 1440px, by the tag's text): the share within 1px.
 * usage: node test/rules-typography.test.mjs --content <content dir> [--measured <runs.json>]
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
const measured = opt('--measured') ? JSON.parse(readFileSync(opt('--measured'), 'utf8')) : [];
const rules = readFileSync(join(HERE, '../rules/typography.js'), 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const docs = walk(join(content, 'std')).filter((f) => f.endsWith('.plain.html') && !f.includes('/drafts/'))
  .map((f) => ({ path: f.slice(content.length).replace(/\.plain\.html$/, ''), html: readFileSync(f, 'utf8') }));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const results = await page.evaluate(async ({ src, list }) => {
  const m = await import(`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(src)))}`);
  const STEP = new Set(Object.keys(m.STEPS));
  // (the text, without the settings rows: their values change on purpose)
  const words = (el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('.section-metadata, .metadata').forEach((x) => x.remove());
    return copy.textContent.replace(/\[\[[^\]]*\]/g, ' ').replace(/\]/g, ' ').replace(/\s+/g, '');
  };
  const tokens = (el) => [...el.textContent.matchAll(/\[\[([^\]]+)\]/g)].map((x) => x[1])
    .filter((t) => t.trim() !== 'Blank line').flatMap((t) => t.split(',').map((x) => x.trim()));
  const sizeLike = (t) => /^\d+(\.\d+)?\s*(×|x|vw)$/i.test(t) || /^(display|headline|title|lead|fluid|large|small|subtitle|statement|hero|body)$/i.test(t);
  // every opener closed, no stray closer, per top-level element
  const balanced = (body) => [...body.children].every((root) => {
    let depth = 0;
    let ok = true;
    const s = root.textContent;
    for (let i = 0; i < s.length; i += 1) {
      const tag = s.slice(i).match(/^\[\[([^\]]+)\]/);
      if (tag && tag[1].trim() !== 'Blank line') {
        depth += 1;
        i += tag[0].length - 1;
      } else if (tag) i += tag[0].length;
      else if (s[i] === ']' && depth) depth -= 1;
    }
    if (depth) ok = false;
    return ok;
  });
  return list.map((d) => {
    const parse = () => new DOMParser().parseFromString(`<body>${d.html}</body>`, 'text/html').body;
    const before = parse();
    const after = parse();
    const { changes, sizes } = m.transformDocument(after, { page: !d.path.includes('/fragments/') });
    const fails = [];
    if (words(before) !== words(after)) fails.push('words changed');
    const design = (el) => tokens(el).filter((t) => !sizeLike(t)).sort().join(',');
    if (design(before) !== design(after)) fails.push('design names changed');
    const left = tokens(after).filter((t) => sizeLike(t) && !STEP.has(t));
    if (left.length) fails.push(`sizes left: ${[...new Set(left)].join(', ')}`);
    const rows = [...after.querySelectorAll('.section-metadata > div')].map((r) => [...r.children].map((c) => c.textContent.trim()));
    if (rows.some(([k]) => /^Heading size/.test(k))) fails.push('Heading size row left');
    rows.filter(([k]) => /^(Copy|Label) size/.test(k)).forEach(([k, v]) => {
      if (!STEP.has(v)) fails.push(`${k} ${v}`);
    });
    if (!balanced(after)) fails.push('tags not balanced');
    return {
      path: d.path, changes, sizes, fails,
    };
  });
}, { src: rules, list: docs });
await browser.close();

// the worked-out sizes against the rendered ones (by the tag's text, any pilot page)
const byText = new Map();
measured.forEach((r) => {
  const k = r.text.replace(/\s+/g, ' ').trim().slice(0, 30);
  if (!byText.has(k)) byText.set(k, []);
  byText.get(k).push(r.size);
});
let checked = 0;
let agree = 0;
const off = [];
results.forEach((r) => r.sizes.forEach((s) => {
  const k = s.text.replace(/\[\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  if (k.length < 3 || !byText.has(k)) return;
  checked += 1;
  const near = byText.get(k).some((px) => Math.abs(px - s.px) <= 1);
  if (near) agree += 1;
  else off.push(`${r.path.split('/').pop()}: "${k}" worked out ${s.px}px (${s.step}), renders ${[...new Set(byText.get(k))].join('/')}px`);
}));

const failed = results.filter((r) => r.fails.length);
results.forEach((r) => {
  if (r.fails.length) console.log(`FAIL ${r.path}: ${r.fails.join('; ')}`);
});
const tags = results.reduce((n, r) => n + r.sizes.length, 0);
console.log(`\n${results.length} documents, ${failed.length} failed; ${tags} size tags`);
if (measured.length) {
  console.log(`worked-out desktop size = rendered size (±1px) for ${agree} of ${checked} tags found on the pages (${Math.round((100 * agree) / Math.max(checked, 1))}%)`);
  off.slice(0, 25).forEach((o) => console.log(`  ${o}`));
}
process.exit(failed.length ? 1 : 0);
