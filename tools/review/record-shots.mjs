#!/usr/bin/env node
/*
 * Review tool: the first shots of a capture (capture-snapshots.mjs, <dir>/<eds path>/<width>/)
 * into the backend's shot history, as each page's first version (dir '', the tiles at
 * <snapshots folder><page>/<width>/ in Document Authoring, uploaded by upload-snapshots.sh).
 * The tile hashes are computed again from the files on disk; with --verify <json> (path → sha256
 * of the originals in Document Authoring) a page whose tiles differ from DA is left out. Pages
 * whose history has the version already are refused by the backend (never replaced).
 *
 * usage: node tools/review/record-shots.mjs --dir <capture dir> --space main
 *          [--pages <eds path,…>] [--verify <json>] [--dry-run]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { versionOf, admin } from './shoot.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const root = opt('--dir');
const space = opt('--space', 'main');
const dry = args.includes('--dry-run');
const verify = opt('--verify') ? JSON.parse(readFileSync(opt('--verify'), 'utf8')).sha256 : null;
const WIDTHS = ['1440', '860', '375'];

// the pages of the capture: folders with at least one <width>/meta.json
const pages = [];
const walk = (d) => readdirSync(d).forEach((name) => {
  const p = join(d, name);
  if (!statSync(p).isDirectory()) return;
  if (WIDTHS.includes(name) && existsSync(join(p, 'meta.json'))) {
    const page = `/${relative(root, d)}`;
    if (!pages.includes(page)) pages.push(page);
  } else walk(p);
});
walk(join(root, 'us'));
const only = opt('--pages') ? opt('--pages').split(',') : null;
const chosen = pages.filter((p) => !only || only.includes(p)).sort();

const items = [];
const left = [];
chosen.forEach((page) => {
  const dirs = Object.fromEntries(WIDTHS.map((w) => [w, join(root, page, w)])
    .filter(([, d]) => existsSync(join(d, 'meta.json'))));
  const version = versionOf(dirs, { dir: '', by: 'first capture' });
  const differ = verify && Object.entries(version.widths).flatMap(([w, s]) => s.tiles
    .filter((t) => verify[`${page.slice(1)}/${w}/${t.file}`] !== t.sha256).map((t) => `${w}/${t.file}`));
  if (differ && differ.length) left.push(`${page}: not as in DA (${differ.join(', ')})`);
  else items.push({ page, version });
});
console.log(`${items.length} pages to record${left.length ? `, ${left.length} left out` : ''}`);
left.forEach((l) => console.log(`  ${l}`));
if (dry) process.exit(0);

// in batches under the action's payload limit (the anchors make a version tens of KB)
const batches = [];
let batch = [];
let size = 0;
items.forEach((it) => {
  const s = JSON.stringify(it).length;
  if (batch.length && (size + s > 600000 || batch.length >= 50)) {
    batches.push(batch);
    batch = [];
    size = 0;
  }
  batch.push(it);
  size += s;
});
if (batch.length) batches.push(batch);
let added = 0;
const refused = [];
await batches.reduce((chain, part) => chain.then(async () => {
  const r = await admin({ op: 'shot-add', space, items: part });
  added += r.added.length;
  refused.push(...r.refused);
  console.log(`${added} recorded, ${refused.length} refused`);
}), Promise.resolve());
console.log(`done: ${added} recorded, ${refused.length} refused`);
refused.forEach((r) => console.log(`  ${r.page} ${r.id}: ${r.reason}`));
