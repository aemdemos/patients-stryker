#!/usr/bin/env node
/*
 * Standardise pilot: pre-selection. Every pilot Columns block is rendered as it is and in each
 * standard it fits (the transfer rules), on the fork's preview, at desktop (1440) and phone (375)
 * width, and the two are compared: the box of each cell, image, heading, paragraph, list item and
 * link (relative to the block) and their font, colour and background. A standard that matches
 * at both widths is pre-selected: reviewers see it as "looks the same as today" and only confirm.
 * It also records the standards each block fits (the group boards list only groups that fit one).
 * usage: node preselect.mjs --base http://localhost:3001/content --candidates <candidates.json>
 *          --out <preselect.json> [--tolerance 4] [--only <instance id>]
 */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base');
const out = opt('--out');
const tolerance = Number(opt('--tolerance', 4));
const only = opt('--only');
const data = JSON.parse(readFileSync(opt('--candidates'), 'utf8'));
const seen = new Set();
const instances = Object.values(data.pages).flatMap((p) => p.instances)
  .filter((i) => !seen.has(i.id) && seen.add(i.id))
  .filter((i) => !only || i.id === only);
const WIDTHS = [1440, 375];

// in the page: render a section on its own in <main>, measure its block, remove it
const MEASURE = async ({
  doc, sectionIndex, blockIndex, standard,
}) => {
  // (the page's own modules: scripts.js is the instance the page already runs)
  const at = window.location.origin;
  const rules = await import(`${at}/tools/importer/standardise/rules/columns.js`);
  const { decorateMain } = await import(`${at}/scripts/scripts.js`);
  const { loadSections } = await import(`${at}/scripts/aem.js`);
  window.stdDocs = window.stdDocs || {};
  if (!window.stdDocs[doc]) {
    const res = await fetch(`/content${doc}.plain.html`);
    window.stdDocs[doc] = res.ok ? await res.text() : '';
  }
  const { body } = new DOMParser().parseFromString(`<body>${window.stdDocs[doc]}</body>`, 'text/html');
  const section = body.children[sectionIndex];
  if (!section) return { error: 'no section' };
  const blocks = [...section.querySelectorAll(':scope > div[class]')]
    .filter((b) => !b.classList.contains('section-metadata'));
  const block = blocks[blockIndex];
  if (!block) return { error: 'no block' };
  const eligible = rules.eligible(block);
  let source = section;
  if (standard) {
    const { section: result, ok } = rules.transform(section, blockIndex, standard);
    if (!ok) return { error: 'does not fit', eligible };
    source = result;
  }
  const main = document.querySelector('main');
  main.replaceChildren();
  const wrap = document.createElement('main');
  wrap.append(document.importNode(rules.isolate(source, blockIndex), true));
  decorateMain(wrap);
  main.append(...wrap.children);
  await loadSections(main);
  const col = main.querySelector('.columns');
  if (!col) return { error: 'not rendered', eligible };
  await Promise.all([...col.querySelectorAll('img')].map((img) => {
    img.loading = 'eager';
    return img.complete ? null : new Promise((r) => {
      img.addEventListener('load', r);
      img.addEventListener('error', r);
      setTimeout(r, 8000);
    });
  }));
  await new Promise((r) => { setTimeout(r, 300); });
  const origin = col.getBoundingClientRect();
  const norm = (s) => s.replace(/\[\[[^\]]*\]|\]/g, ' ').replace(/\s+/g, ' ').trim();
  const items = [...col.querySelectorAll(':scope > div > div, img, h1, h2, h3, h4, h5, h6, p, li, a')]
    .filter((e) => e.getClientRects().length)
    .map((e) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return {
        tag: e.tagName.toLowerCase(),
        text: e.tagName === 'IMG' ? e.getAttribute('src').split('?')[0] : norm(e.textContent).slice(0, 60),
        box: [r.left - origin.left, r.top - origin.top, r.width, r.height].map(Math.round),
        style: [s.fontFamily, s.fontSize, s.fontWeight, s.color, s.backgroundColor, s.borderTopWidth, s.borderTopColor].join('|'),
      };
    });
  return {
    eligible, height: Math.round(origin.height), width: Math.round(origin.width), items,
  };
};

// the differences between the block as it is and a candidate (empty: they look the same)
function compare(a, b) {
  const diffs = [];
  if (Math.abs(a.height - b.height) > tolerance) diffs.push(`height ${a.height} → ${b.height}`);
  const key = (i) => `${i.tag}:${i.text}`;
  const rest = [...b.items];
  a.items.forEach((x) => {
    const at = rest.findIndex((y) => key(y) === key(x));
    if (at < 0) {
      diffs.push(`${key(x)} missing`);
      return;
    }
    const [y] = rest.splice(at, 1);
    if (x.box.some((v, i) => Math.abs(v - y.box[i]) > tolerance)) diffs.push(`${key(x)} moved ${x.box} → ${y.box}`);
    if (x.style !== y.style) diffs.push(`${key(x)} style ${x.style} → ${y.style}`);
  });
  rest.forEach((y) => diffs.push(`${key(y)} added`));
  return diffs;
}

const browser = await chromium.launch();
const result = {};
await WIDTHS.reduce((chain, width) => chain.then(async () => {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(60000);
  await page.route(/altcha|captcha/, (r) => r.abort());
  // the dev server reloads the page when a file changes: no live reload during the run
  await page.route(/livereload/, (r) => r.abort());
  // the local preview serves no doctype (quirks mode): add it, as the real pages have it
  await page.route((u) => u.pathname.startsWith('/content/') && !/\.\w+$/.test(u.pathname), async (r) => {
    const res = await r.fetch();
    r.fulfill({ response: res, body: `<!DOCTYPE html>${await res.text()}` });
  });
  const open = async () => {
    await page.goto(`${base}/std/drafts/standards`, { waitUntil: 'load' });
    await page.waitForSelector('main .section', { timeout: 60000 });
    await page.waitForTimeout(2000);
  };
  await open();
  // a measurement, once more on a fresh page if the page went away (a reload)
  const measure = (arg) => page.evaluate(MEASURE, arg)
    .catch(() => open().then(() => page.evaluate(MEASURE, arg)));
  await instances.reduce((c2, inst) => c2.then(async () => {
    const at = { doc: inst.doc, sectionIndex: inst.section, blockIndex: inst.block };
    const original = await measure({ ...at, standard: null });
    const entry = result[inst.id] || { eligible: original.eligible || [], widths: {} };
    result[inst.id] = entry;
    if (original.error) {
      entry.error = original.error;
      return;
    }
    await (original.eligible || []).reduce((c3, standard) => c3.then(async () => {
      const candidate = await measure({ ...at, standard });
      const diffs = candidate.error ? [candidate.error] : compare(original, candidate);
      entry.widths[width] = entry.widths[width] || {};
      entry.widths[width][standard] = diffs;
    }), Promise.resolve());
  }), Promise.resolve());
  await page.close();
  console.log(`${width}px: ${instances.length} blocks measured`);
}), Promise.resolve());
await browser.close();

// pre-selected: the standard with no difference at either width (the first, if several)
Object.values(result).forEach((entry) => {
  const same = entry.eligible.filter((s) => WIDTHS.every((w) => (entry.widths[w]?.[s] || ['?']).length === 0));
  entry.same = same[0] || null;
});
writeFileSync(out, `${JSON.stringify(result, null, 1)}\n`);
const n = Object.values(result);
const fit = n.filter((e) => e.eligible.length).length;
const same = n.filter((e) => e.same).length;
console.log(`${n.length} blocks: ${fit} fit a standard, ${same} look the same in one (pre-selected) → ${out}`);
