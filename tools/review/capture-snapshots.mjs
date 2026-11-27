#!/usr/bin/env node
/*
 * Review tool: the first source shots of the pages (www.stryker.com) for the review's source
 * layer, per page and width in <out>/<eds path>/<width>/ (shoot.mjs: tiles, anchors, meta.json
 * with each tile's SHA-256). One page at a time; pages already captured are skipped
 * (resumable). Then: upload-snapshots.sh (the tiles to Document Authoring), record-shots.mjs
 * (the first version of each page's shot history). New shots of pages that have one:
 * refresh-shots.mjs.
 *
 * usage: node tools/review/capture-snapshots.mjs --map <eds path → source URL json> --out <dir>
 *          [--pages <eds path,…>] [--widths 1440,860,375] [--limit N]
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { chromium, shoot } from './shoot.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const map = JSON.parse(readFileSync(opt('--map'), 'utf8'));
const out = opt('--out');
const widths = (opt('--widths') || '1440,860,375').split(',').map(Number);
const limit = Number(opt('--limit') || 0);
let pages = opt('--pages') ? opt('--pages').split(',') : Object.keys(map);
if (limit) pages = pages.slice(0, limit);

const browser = await chromium.launch();
let done = 0;
let skipped = 0;
const failed = [];
const started = Date.now();
const jobs = pages.flatMap((path) => widths.map((width) => ({ path, width })));
// one shot after the other (memory: one page open at a time)
await jobs.reduce((chain, { path, width }) => chain.then(async () => {
  const dir = join(out, path, String(width));
  if (existsSync(join(dir, 'meta.json'))) {
    skipped += 1;
    return;
  }
  try {
    await shoot(browser, map[path], width, dir);
    done += 1;
  } catch (e) {
    failed.push(`${path} ${width}: ${e.message.slice(0, 100)}`);
  }
  if ((done + failed.length) % 10 === 0) {
    const s = Math.round((Date.now() - started) / 1000);
    console.log(`${done} captured, ${failed.length} failed, ${skipped} already there, ${s}s`);
  }
}), Promise.resolve());
await browser.close();
console.log(`done: ${done} captured, ${failed.length} failed, ${skipped} already there, ${Math.round((Date.now() - started) / 1000)}s`);
if (failed.length) console.log(failed.join('\n'));
