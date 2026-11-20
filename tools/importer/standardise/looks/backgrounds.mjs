#!/usr/bin/env node
/*
 * How light each instance's background is on the original (desktop): the share of near-white
 * pixels (all channels above 235) in its clip of the page's full-page tiles (measure.mjs --tiles),
 * read through the looks page's own data. A hero whose image sits behind the text but is a
 * product picture on a light background looks like the product hero; a photo behind the text
 * doesn't. Writes { "<page>#<n>": { light: <percent> } }, read by group.mjs --notes.
 * usage: node tools/importer/standardise/looks/backgrounds.mjs <data name, e.g. hero-source>
 *   [--base http://localhost:3000] [--out tools/looks/data/<name>-backgrounds.json]
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';

const S = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const { chromium } = createRequire(`${S}/package.json`)('playwright');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const name = args[0];
if (!name) {
  console.error('usage: backgrounds.mjs <data name>');
  process.exit(2);
}
const base = opt('--base', 'http://localhost:3000');
const out = opt('--out', `tools/looks/data/${name}-backgrounds.json`);

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(15000);
await page.goto(`${base}/tools/looks/index.html?type=${name}`, { waitUntil: 'domcontentloaded' });
const result = await page.evaluate(async (type) => {
  const data = await (await fetch(`./data/${type}.json`)).json();
  const tiles = await (await fetch('./data/tiles.json')).json();
  const items = data.groups.flatMap((g) => g.items || []);
  const found = {};
  // (one tile at a time, the clip's first one: a hero sits at the top of its page)
  await items.reduce((prev, it) => prev.then(async () => {
    const c = it.clip?.d;
    const t = tiles[it.page]?.['1440'];
    if (!c || !t || c[2] < 2 || c[3] < 2) return;
    const i = Math.floor(c[1] / t.tile);
    const img = new Image();
    img.src = `/looks-shots/pages/1440${it.page}/${i}.jpg`;
    await img.decode().catch(() => null);
    if (!img.naturalWidth) return;
    const cv = document.createElement('canvas');
    cv.width = 144;
    cv.height = 40;
    const ctx = cv.getContext('2d');
    const y = c[1] - i * t.tile;
    ctx.drawImage(img, c[0], y, c[2], Math.min(c[3], t.tile - y), 0, 0, 144, 40);
    const px = ctx.getImageData(0, 0, 144, 40).data;
    let white = 0;
    for (let p = 0; p < px.length; p += 4) {
      if (px[p] > 235 && px[p + 1] > 235 && px[p + 2] > 235) white += 1;
    }
    found[`${it.page}#${it.n}`] = { light: Math.round((white / (144 * 40)) * 100) };
  }), Promise.resolve());
  return found;
}, name);
await browser.close();
writeFileSync(out, `${JSON.stringify(result, null, 1)}\n`);
console.log(`${Object.keys(result).length} measured → ${out}`);
