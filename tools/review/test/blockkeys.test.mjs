#!/usr/bin/env node
/*
 * Test of the block keys (blockkeys.js) on real standard pages: what a conversion re-run does to a
 * page (a section removed at the top, a section added, a block's variant changed, whitespace as
 * Document Authoring stores it) must not change any block's key, only its position; a text fix
 * gives that block a new key; identical blocks get #1, #2.
 * usage: node tools/review/test/blockkeys.test.mjs [--base http://localhost:3000]
 */
import { createRequire } from 'module';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const i = args.indexOf('--base');
const base = i >= 0 ? args[i + 1] : 'http://localhost:3000';
const PAGES = [
  '/us/en/foot-and-ankle/products/prophecy',
  '/us/en/foot-and-ankle/products/dartfire-edge',
  '/us/en/craniomaxillofacial/products/3d-systems',
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/tools/review/pages.json`);
const results = await page.evaluate(async (paths) => {
  const k = await import('/tools/review/blockkeys.js');
  const out = [];
  const parse = (h) => new DOMParser().parseFromString(`<body>${h}</body>`, 'text/html').body;
  for (const p of paths) {
    const html = await (await fetch(`/content/std${p}.plain.html`)).text();
    const before = k.pageKeys(parse(html));
    const blockIds = Object.keys(before.byId).filter((id) => id.includes('b'));

    // a re-run: the first section removed … then a new section at the top, a variant changed,
    // line breaks between all elements (as Document Authoring stores the page)
    const body = parse(html);
    const first = body.firstElementChild;
    const firstIds = Object.keys(before.byId).filter((id) => id === 's0' || id.startsWith('s0b'));
    first.remove();
    ['A new title line the conversion now puts in its own section', 'And a second new section'].reverse().forEach((text) => {
      const added = body.ownerDocument.createElement('div');
      added.append(body.ownerDocument.createElement('p'));
      added.firstElementChild.textContent = text;
      body.prepend(added);
    });
    const block = body.querySelector('div.columns');
    if (block) block.classList.add('wide-first', 'card-grid');
    const spaced = parse(body.innerHTML.replace(/></g, '>\n  <'));
    const after = k.pageKeys(spaced);
    const kept = blockIds.filter((id) => !firstIds.includes(id));
    const stable = kept.filter((id) => k.toPosition(before.byId[id], after));
    const moved = stable.filter((id) => k.toPosition(before.byId[id], after) !== id).length;

    // a text fix in one block: that block gets a new key, the others keep theirs
    const fixed = parse(html);
    const target = fixed.querySelector('div.columns p, div.cards-corp p, div[class] p');
    if (target) target.textContent = `${target.textContent} (fixed)`;
    const afterFix = k.pageKeys(fixed);
    const changed = blockIds.filter((id) => afterFix.byId[id] !== before.byId[id]).length;

    const unstable = kept.filter((id) => !k.toPosition(before.byId[id], after)).map((id) => `${id} ${before.byId[id]}`);
    out.push({
      unstable,
      page: p.split('/').pop(),
      blocks: kept.length,
      stable: stable.length,
      moved,
      textFixChanged: changed,
      numbered: Object.values(before.byId).filter((x) => x.includes('#')).length,
    });
  }
  return out;
}, PAGES);
await browser.close();

let failures = 0;
results.forEach((r) => {
  const ok = r.stable === r.blocks && r.moved > 0 && r.textFixChanged === 1;
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.page}: ${r.stable} of ${r.blocks} blocks keep their key while ${r.moved} change position; a text fix changes ${r.textFixChanged} key${r.numbered ? `; ${r.numbered} numbered (identical content)` : ''}${r.unstable.length ? ` · not kept: ${r.unstable.join(', ')}` : ''}`);
});
console.log(failures ? `${failures} failures` : 'all passed');
process.exit(failures ? 1 : 0);
