#!/usr/bin/env node
/*
 * Checks the live example pages of the property table (data/catalog/properties.json) and
 * records the ones that are not live (status ≠ 200) in data/catalog/example-status.json, so
 * property-table.js links a live example per value.
 * Run: node tools/importer/migration-index/check-examples.js (then property-table.js again)
 */
import { join } from 'path';
import { existsSync } from 'fs';
import { DATA, readJson, writeJson } from './lib.js';

const FILE = join(DATA, 'catalog/example-status.json');
const { properties } = readJson(join(DATA, 'catalog/properties.json'));
const known = existsSync(FILE) ? readJson(FILE) : {};
const urls = [...new Set(properties.filter((p) => p.kind === 'styling')
  .flatMap((p) => p.values.flatMap((v) => v.examples)))].filter((u) => !(u in known));

const check = async (url) => {
  try {
    const r = await fetch(url, { redirect: 'manual' });
    await r.body?.cancel();
    return r.status;
  } catch {
    return 0;
  }
};
// eight at a time, one batch after the other
const batches = [];
for (let i = 0; i < urls.length; i += 8) batches.push(urls.slice(i, i + 8));
await batches.reduce((previous, batch) => previous.then(async () => {
  const statuses = await Promise.all(batch.map(check));
  batch.forEach((u, j) => { known[u] = statuses[j]; });
}), Promise.resolve());
writeJson(FILE, known);
const dead = Object.entries(known).filter(([, s]) => s !== 200);
process.stdout.write(`checked ${urls.length} new, ${Object.keys(known).length} known, ${dead.length} not live\n`);
