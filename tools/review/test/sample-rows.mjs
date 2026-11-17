#!/usr/bin/env node
/*
 * A realistic sample of review rows (made-up feedback on real standard pages, reviewers
 * "sample customer A / B", one AOE status row each kind) for testing summary.js: group and single
 * choices, a disagreement, a choice that no longer fits its block, block / section / page comments, QA notes on blocks, text and no anchor,
 * a resolved note. Note anchors are taken from the pages' own text, as the tool would save them.
 * usage: node tools/review/test/sample-rows.mjs [--base http://localhost:3000] [--out tools/review/test/sample-rows.csv]
 */
import { writeFileSync } from 'fs';
import { createRequire } from 'module';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt('--base', 'http://localhost:3000');
const out = opt('--out', 'tools/review/test/sample-rows.csv');

const P = {
  prophecy: '/us/en/foot-and-ankle/products/prophecy',
  ankle: '/us/en/foot-and-ankle/products/ankle-truss-system',
  toe: '/us/en/foot-and-ankle/products/smart-toe-ii',
  mask: '/us/en/surgical-technologies/products/procedural-oxygen-mask',
  cmf: '/us/en/craniomaxillofacial/products/3d-systems',
};
const A = 'sample customer A';
const B = 'sample customer B';
let minute = 0;
const at = () => {
  minute += 3;
  return new Date(Date.UTC(2026, 10, 14, 9, minute)).toISOString();
};
// a note: anchor = the page text (or image) starting with `find`, resolved in the browser
const note = (id, cat, text, find, extra = {}) => ({
  id: `sample-${id}`, created: '', vp: 1440, cat, text, status: 'open', find, at: { x: 400, y: 600 }, ...extra,
});
const spec = [
  // design decisions: groups (one disagreement on the serif titles), single blocks, a section
  ['*', 'group:columns|media-text|text,media', 'width', 'wide-first', A],
  ['*', 'group:section|text-serif-title', 'text', 'text-serif-subtitle', A],
  ['*', 'group:section|text-serif-title', 'text', 'text-serif', B],
  [P.prophecy, 's14b0', 'variant', 'resources', A],
  [P.cmf, 's5b1', 'variant', 'resources', A],
  [P.prophecy, 's16b0', 'width', 'wide-last', A],
  [P.ankle, 's6', 'text', 'text-large', A],
  [P.prophecy, 's0b0', 'variant', 'media-text', A],
  [P.prophecy, 's0b0', 'variant', 'feature-statement', B],
  // a choice saved before the page changed: s4b0 is a Statistics block now
  [P.prophecy, 's4b0', 'variant', 'card-grid', A],
  // saved under block keys (as the tool saves now): one on the page, one whose content changed
  [P.prophecy, 'key:s16b0', 'comment', 'Saved under the block key: should land on the 3D Viewer block.', B],
  [P.prophecy, 'b:columns:00000000', 'variant', 'image-row', B],
  // comments on blocks and text sections
  [P.prophecy, 's9b0', 'comment', 'The image is too small next to the text, the live page had it larger.', A],
  [P.prophecy, 's11b0', 'comment', 'Same as above: the image should be bigger.', A],
  [P.ankle, 's3b0', 'comment', 'The gap between the image and the text is too wide.', B],
  [P.prophecy, 's14b0', 'comment', 'The card titles look too heavy.', A],
  [P.mask, 's9b0', 'comment', 'The teaser text is cut off on the phone.', B],
  [P.toe, 's1', 'comment', 'This intro text is much larger than on the live page.', A],
  [P.prophecy, 's3', 'comment', 'Love the serif title here, keep it like this.', A],
  // page comments
  [P.cmf, 'page', 'comment', 'The two logos at the top of the live page are missing.', A],
  [P.toe, 'page', 'comment', 'The hero image from the live page is missing.', B],
  // QA notes
  [P.prophecy, 'note:sample-1', 'note', note(1, 'text', 'The trademark sign after Prophecy is missing.', 'The first patient specific instrumentation'), A],
  [P.ankle, 'note:sample-2', 'note', note(2, 'text', 'The footnote 1 should be superscript.', 'First of its kind fusion'), B],
  [P.cmf, 'note:sample-3', 'note', note(3, 'image', 'The image is cropped, the splints are cut off.', 'i:', { img: '1596738539_VSP03_Anatomical-Models-2' }), A],
  [P.cmf, 'note:sample-4', 'note', note(4, 'layout', 'These cards do not line up with the resources next to them.', 'Patient specific anatomical models'), A],
  [P.toe, 'note:sample-5', 'note', note(5, 'other', 'The cookie banner covers the form.', null, { vp: 375 }), B],
  [P.prophecy, 'note:sample-6', 'note', note(6, 'text', 'Wrong date in the citation.', 'Based on internal data', { status: 'resolved' }), A],
  [P.prophecy, 'note:sample-7', 'note', note(7, 'link', 'This link goes to the old brochure.', 'Discover a wealth of product resources'), B],
  [P.prophecy, 'page', 'reviewed', true, A],
  // a thread: the AOE team answers in the tool, the reviewer closes it; another one answered only
  [P.ankle, 'key:s3b0', 'reply:comment:sampleA1', { text: 'Narrowed the gap of media-text.', status: { state: 'done', release: 'r2' } }, 'sample AOE member', 'aoe'],
  [P.ankle, 'key:s3b0', 'reply:comment:sampleR1', { action: 'resolve', text: 'Looks right now.' }, B],
  [P.mask, 'key:s9b0', 'reply:comment:sampleA2', { text: 'Looking into the phone layout.', status: { state: 'progress' } }, 'sample AOE member', 'aoe'],
  // the AOE team's progress
  [P.prophecy, 's9b0', 'status:comment', {
    state: 'done', release: 'r1', reason: 'image column widened', workItem: 'variant:columns:media-text',
  }, 'AOE'],
  [P.ankle, 'note:sample-2', 'status:note', {
    state: 'wontdo', reason: 'superscript is authored in DA', workItem: 'conversion:columns:media-text',
  }, 'AOE'],
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/tools/review/pages.json`);
const pre = /localhost|127\.0\.0\.1/.test(base) ? '/content' : '';
const rows = await page.evaluate(async ({ list, prefix }) => {
  const { keyOf } = await import('/tools/review/sync.js');
  const blockKeys = await import('/tools/review/blockkeys.js');
  const docs = {};
  const docOf = async (path) => {
    if (!docs[path]) {
      const html = await (await fetch(`${prefix}/std${path}.plain.html`)).text();
      docs[path] = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    }
    return docs[path];
  };
  const result = [];
  for (const [p, given, kind, value, reviewer, role] of list) {
    let v = value;
    let item = given;
    // `key:<position>` → the block key of that position on the page
    if (item.startsWith('key:')) {
      const keys = blockKeys.keysOfHtml(await (await fetch(`${prefix}/std${p}.plain.html`)).text());
      item = blockKeys.toKey(item.slice(4), keys);
    }
    if (kind === 'note') {
      const { find, img, ...n } = value;
      let anchor = null;
      if (find) {
        const doc = await docOf(p);
        // an image: its file name, as keyOf gives it for the rendered <img>
        const el = img ? doc.querySelector(`a[href*="/${img}?"], a[title*="/${img}?"], img[src*="/${img}"]`)
          : [...doc.body.querySelectorAll('*')].filter((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(find)).pop();
        if (!el) throw new Error(`no anchor for ${find} on ${p}`);
        anchor = { key: img ? `i:${img}` : keyOf(el), fx: 0.5, fy: 0.5 };
      }
      v = { ...n, anchor };
    }
    result.push([p, item, kind, v, reviewer, role || (reviewer === 'AOE' ? 'aoe' : 'reviewer')]);
  }
  return result;
}, { list: spec, prefix: pre });
await browser.close();

const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const lines = ['__id__,page,item,kind,value,reviewer,time,role'];
rows.forEach(([p, item, kind, value, reviewer, role], i) => {
  const time = at();
  const v = kind === 'note' ? { ...value, created: time } : value;
  lines.push([`sample-${i + 1}`, p, item, kind, JSON.stringify(v), reviewer, time, role].map(q).join(','));
});
writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`${rows.length} sample rows → ${out}`);
