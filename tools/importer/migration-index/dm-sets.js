#!/usr/bin/env node
/*
 * dm-sets — the members of every Dynamic Media set (image / media / spin set) that a
 * stryker.com mixedmediagallery shows, from Scene7 (<server>/is/image/<asset>?req=set,json),
 * into tools/importer/data/dm-sets.js for the importers (bundled): the gallery is drawn
 * client-side on the source, and the fast importer reads pages offline.
 * Run after a re-export or when a set changes on Scene7:  npm run build:dm-sets
 * Asset paths: the gallery's dynamic-media fileReference name under stryker/ (as the rendered
 * data-asset-path).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  DATA, XF_DIR, loadPages, writeModule, forEachNode,
} from './lib.js';

const SERVER = 'https://media-assets.stryker.com/is/image/';
const log = (line) => process.stdout.write(`${line}\n`);

// every mixedmediagallery in the page and XF exports: its asset path
const assets = new Set();
const visit = (node) => {
  if (!String(node['sling:resourceType'] || '').endsWith('/mixedmediagallery')) return;
  const ref = node['dynamic-media'] && node['dynamic-media'].fileReference;
  if (ref) assets.add(`stryker/${ref.split('/').pop()}`);
};
loadPages().forEach((page) => forEachNode(page.json, visit));
const manifest = JSON.parse(readFileSync(join(XF_DIR, '_manifest.json'), 'utf8'));
manifest.fragments.flatMap((f) => f.variations).forEach((v) => {
  try {
    forEachNode(JSON.parse(readFileSync(join(XF_DIR, v.file), 'utf8')), visit);
  } catch { /* an XF without an export */ }
});

const fetchSet = async (asset) => {
  const body = await (await fetch(`${SERVER}${asset}?req=set,json`)).text();
  const json = body.match(/s7jsonResponse\((\{.*\}),\s*""\);?\s*$/s);
  return json && JSON.parse(json[1]).set;
};
const sets = await Promise.all([...assets].sort()
  .map(async (asset) => [asset, await fetchSet(asset)]));
const SETS = {};
sets.forEach(([asset, set]) => {
  if (!set) {
    log(`no set: ${asset}`);
    return;
  }
  SETS[asset] = {
    type: set.type,
    members: [].concat(set.item || []).map((item) => ({
      name: decodeURIComponent((item.i || item.s || {}).n || ''),
      type: item.type || 'image',
      width: Number(item.dx) || null,
      height: Number(item.dy) || null,
    })).filter((m) => m.name),
  };
  log(`${asset}: ${set.type}, ${SETS[asset].members.length} members`);
});
writeModule(join(DATA, 'dm-sets.js'), [
  'Dynamic Media sets shown by mixedmediagallery (Scene7 req=set,json), members in set order.',
  'Built by tools/importer/migration-index/dm-sets.js (npm run build:dm-sets), not by index.js.',
], { SETS });
