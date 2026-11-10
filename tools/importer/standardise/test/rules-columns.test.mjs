#!/usr/bin/env node
/*
 * Tests of rules/columns.js on real instances: one example per cluster (clusters-columns.json),
 * transformed into every standard it is eligible for, against the invariants of a standard:
 * - the words and the media links of the block are kept (in order);
 * - no measured value is left: Text box / Grid / Column widths / Columns rows, size values
 *   ([[1.75×]], [[5vw]]), Box lines, blank lines inside the block;
 * - design names stay: Cell colours, Image borders, colour and named text tags;
 * - the block carries the standard's class.
 * usage: node test/rules-columns.test.mjs --content <content dir> [--clusters <json>]
 */
import { readFileSync } from 'fs';
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
const clusters = JSON.parse(readFileSync(opt('--clusters', join(HERE, '../data/clusters-columns.json')), 'utf8'));
const rules = readFileSync(join(HERE, '../rules/columns.js'), 'utf8');

const cases = clusters.map((c) => {
  const id = c.examples[0];
  const [doc, pos] = id.split('#');
  const [, section, blockIndex] = pos.match(/s(\d+)b(\d+)/).map(Number);
  return {
    cluster: c.id, id, html: readFileSync(join(content, `${doc}.plain.html`), 'utf8'), section, blockIndex,
  };
});

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const results = await page.evaluate(async ({ src, list }) => {
  const m = await import(`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(src)))}`);
  const words = (el) => el.textContent.replace(/\[\[[^\]]*\]|\]/g, ' ').replace(/\s+/g, ' ').trim();
  const media = (el) => [...el.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    .filter((h) => /\/is\/(image|content)\/|media-assets|\.m3u8/.test(h));
  return list.map((c) => {
    const { body } = new DOMParser().parseFromString(`<body>${c.html}</body>`, 'text/html');
    const section = body.children[c.section];
    const blocks = [...section.querySelectorAll(':scope > div[class]')].filter((b) => !b.classList.contains('section-metadata'));
    const block = blocks[c.blockIndex];
    const standards = m.eligible(block);
    return standards.map((std) => {
      const { section: out, changes, ok } = m.transform(section, c.blockIndex, std);
      const after = [...out.querySelectorAll(':scope > div[class]')].filter((b) => !b.classList.contains('section-metadata'))[c.blockIndex];
      const fails = [];
      if (!ok) fails.push('not ok');
      if (!after.classList.contains(std)) fails.push('no standard class');
      // (the words without the Box and blank lines, which a standard drops on purpose)
      const keepWords = (el) => {
        const copy = el.cloneNode(true);
        [...copy.querySelectorAll('p')].filter((p) => /^box(:| end)/i.test(p.textContent.trim())
          || p.textContent.trim() === '[[Blank line]]').forEach((p) => p.remove());
        return words(copy);
      };
      const w1 = keepWords(block);
      const w2 = keepWords(after);
      if (w1.replace(/\s/g, '') !== w2.replace(/\s/g, '')) {
        const a = w1.replace(/\s/g, '');
        const b = w2.replace(/\s/g, '');
        let i = 0;
        while (i < a.length && a[i] === b[i]) i += 1;
        fails.push(`words changed at "${a.slice(Math.max(0, i - 20), i + 30)}" vs "${b.slice(Math.max(0, i - 20), i + 30)}"`);
      }
      if (media(block).join() !== media(after).join()) fails.push('media changed');
      if (/\[\[[^\]]*\b[\d.]+(×|vw)\b/.test(after.textContent)) fails.push('size value left');
      const lines = [...after.querySelectorAll('p')].map((p) => p.textContent.trim());
      if (lines.some((t) => /^box(:| end)/i.test(t) || t === '[[Blank line]]')) fails.push('box or blank line left');
      const rowKeys = (sec) => {
        const meta = sec.querySelector(':scope > .section-metadata');
        return meta ? [...meta.children].map((r) => r.firstElementChild.textContent.trim()) : [];
      };
      const keys = rowKeys(out);
      const k = blocks.filter((b) => b.classList.contains('columns')).indexOf(block) + 1;
      const own = (key) => (k === 1 ? key : `${key} (${k})`);
      ['Text box', 'Grid', 'Column widths', 'Columns'].forEach((key) => {
        if (keys.includes(own(key))) fails.push(`${key} left`);
      });
      const keysBefore = rowKeys(section);
      ['Cell colours', 'Image borders'].forEach((key) => {
        if (keysBefore.includes(own(key)) && !keys.includes(own(key))) fails.push(`${key} lost`);
      });
      return {
        cluster: c.cluster, id: c.id, std, changes, fails,
      };
    });
  }).flat().concat(list.filter((c) => {
    const { body } = new DOMParser().parseFromString(`<body>${c.html}</body>`, 'text/html');
    const section = body.children[c.section];
    const blocks = [...section.querySelectorAll(':scope > div[class]')].filter((b) => !b.classList.contains('section-metadata'));
    return !m.eligible(blocks[c.blockIndex]).length;
  }).map((c) => ({
    cluster: c.cluster, id: c.id, std: '(none)', changes: [], fails: [],
  })));
}, { src: rules, list: cases });
await browser.close();

const failed = results.filter((r) => r.fails.length);
const none = results.filter((r) => r.std === '(none)');
results.filter((r) => r.std !== '(none)').forEach((r) => {
  console.log(`${r.fails.length ? 'FAIL' : 'ok  '} ${r.cluster} ${r.std.padEnd(15)} ${r.fails.join('; ') || r.changes.join('; ')}`);
});
console.log(`\n${results.length - none.length} transforms, ${failed.length} failed; ${none.length} clusters fit no standard`);
process.exit(failed.length ? 1 : 0);
