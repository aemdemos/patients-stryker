#!/usr/bin/env node
/*
 * Review tool: the groups of "blocks like this" over all standard pages (tools/review/groups.json):
 * per group its label and how many blocks on how many pages, from the pages' authored markup and
 * groups.js (the same rules the page's switcher uses). Runs against the workspace preview.
 * usage: node tools/review/build-groups.mjs [--base http://localhost:3000] [--out tools/review/groups.json]
 */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
const out = opt('--out', 'tools/review/groups.json');
const { pages } = JSON.parse(readFileSync('tools/review/pages.json', 'utf8'));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/tools/review/pages.json`);
const groups = await page.evaluate(async (paths) => {
  const { groupKey, groupLabel, sectionGroupKey } = await import('/tools/review/groups.js');
  const all = {};
  for (const path of paths) {
    const resp = await fetch(`/content/std${path}.plain.html`);
    if (resp.ok) {
      const doc = new DOMParser().parseFromString(`<body>${await resp.text()}</body>`, 'text/html');
      [...doc.body.children].forEach((section) => {
        const skey = sectionGroupKey(section);
        if (skey) {
          all[skey] = all[skey] || { label: groupLabel(skey), blocks: 0, pages: new Set() };
          all[skey].blocks += 1;
          all[skey].pages.add(path);
        }
        [...section.children].filter((c) => c.matches('div[class]') && !c.matches('.section-metadata, .metadata'))
          .forEach((block) => {
            const key = groupKey(block);
            if (!key) return;
            all[key] = all[key] || { label: groupLabel(key), blocks: 0, pages: new Set() };
            all[key].blocks += 1;
            all[key].pages.add(path);
          });
      });
    }
  }
  return Object.fromEntries(Object.entries(all)
    .sort((a, b) => b[1].blocks - a[1].blocks)
    .map(([k, g]) => [k, { label: g.label, blocks: g.blocks, pages: g.pages.size }]));
}, pages.map((p) => p.path));
await browser.close();
writeFileSync(out, JSON.stringify({ generated: 'tools/review/build-groups.mjs', groups }, null, 1));
const list = Object.entries(groups);
console.log(`${list.length} groups, ${list.reduce((n, [, g]) => n + g.blocks, 0)} blocks → ${out}`);
list.slice(0, 12).forEach(([, g]) => console.log(`  ${g.blocks} blocks on ${g.pages} pages: ${g.label}`));
