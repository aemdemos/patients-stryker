#!/usr/bin/env node
/*
 * Page tags generator: the AEM `cq:tags` of every page on the scope sheet tab "Pages to migrate"
 * → page-tags.json ({ "/us/en/...": ["stryker:business-unit/SAGE", ...] }, pages with tags only).
 * The importers read the map and write the `tags` metadata row.
 *
 *   node tools/importer/page-tags.mjs [--export <dir>] [--sheet <xlsx>] [--out <json>]
 *
 * Every page of the sheet is listed, whatever its template.
 * <dir> is the AEM export's `xf-mapping` folder: <AEM page path>.json is the page's jcr:content.
 * AEM page names can differ from the published URL (a leading `-` or `_`, `_` for `-`), so every
 * URL segment is matched with the names normalised (see `normalise`). The xlsx is read with the
 * system `unzip` (no dependencies).
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync, readdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STRYKER = join(homedir(), 'git/eds/projects/stryker');
const SHEET_TAB = 'Pages to migrate';

/** A page or folder name as aem.live serves it: no leading `-` / `_`, `_` → `-`, lowercase. */
export function normalise(name) {
  return String(name).replace(/\.json$/, '').replace(/^[-_]+/, '').replace(/_/g, '-')
    .toLowerCase();
}

/**
 * The export file of a source URL path, matched segment by segment on normalised names.
 * @param {string} root export folder
 * @param {string} urlPath e.g. /us/en/about/patents/Spine-patents
 * @returns {string|null} file path
 */
export function findExportFile(root, urlPath) {
  const segments = urlPath.split('/').filter(Boolean).map(normalise);
  let dir = root;
  for (let i = 0; i < segments.length; i += 1) {
    const entries = readdirSync(dir);
    const last = i === segments.length - 1;
    const hit = entries.find((e) => (last ? e.endsWith('.json') : !e.endsWith('.json'))
      && normalise(e) === segments[i]);
    if (!hit) return null;
    dir = join(dir, hit);
  }
  return dir;
}

/** The cq:tags of a source URL path ([] when the page has none or is not in the export). */
export function tagsFor(root, urlPath) {
  const file = findExportFile(root, urlPath);
  if (!file) return [];
  const tags = JSON.parse(readFileSync(file, 'utf8'))['cq:tags'];
  return Array.isArray(tags) ? tags : [];
}

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Column A (below the header) of a sheet tab of an xlsx, as source URL paths. */
export function sheetPaths(xlsx, tab = SHEET_TAB) {
  const read = (name) => execFileSync('unzip', ['-p', xlsx, name], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const workbook = read('xl/workbook.xml');
  const rid = workbook.match(new RegExp(`<sheet name="${tab}"[^>]*r:id="([^"]+)"`))[1];
  const rels = read('xl/_rels/workbook.xml.rels');
  const target = rels.match(new RegExp(`<Relationship [^>]*Id="${rid}"[^>]*Target="([^"]+)"`)
    || new RegExp(`<Relationship [^>]*Target="([^"]+)"[^>]*Id="${rid}"`))[1];
  const strings = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map((m) => decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const sheet = read(`xl/${target}`);
  const paths = [];
  [...sheet.matchAll(/<c r="A(\d+)"([^>]*)>(?:<v>([^<]*)<\/v>)?/g)].forEach((m) => {
    if (Number(m[1]) === 1 || m[3] === undefined) return;
    const value = /t="s"/.test(m[2]) ? strings[Number(m[3])] : m[3];
    const path = new URL(value.trim(), 'https://www.stryker.com').pathname.replace(/\.html?$/, '');
    if (path.startsWith('/')) paths.push(path);
  });
  return paths;
}

/** The tags of every page path that has any: { path: [tags] }, sorted by path. */
export function buildTagMap(root, paths) {
  const map = {};
  paths.forEach((path) => {
    const tags = tagsFor(root, path);
    if (tags.length) map[path] = tags;
  });
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
}

function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };
  const root = opt('export', join(STRYKER, 'aem-export/x/export-anon/xf-mapping'));
  const sheet = opt('sheet', join(STRYKER, 'Stryker-com-EDS-migration-scope.xlsx'));
  const out = opt('out', join(HERE, 'page-tags.json'));
  [root, sheet].forEach((p) => {
    if (!existsSync(p)) throw new Error(`Not found: ${p}`);
  });
  const paths = sheetPaths(sheet);
  const map = buildTagMap(root, paths);
  writeFileSync(out, `${JSON.stringify(map, null, 2)}\n`);
  console.log(`${Object.keys(map).length} tagged of ${paths.length} sheet pages → ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
