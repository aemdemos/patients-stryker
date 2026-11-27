#!/usr/bin/env node
/*
 * The first source shots into the backend's Files (the DA sign-in, 27 Nov 2026): they were kept
 * in Document Authoring (/review-snapshots-main), which only the branch preview serves, so the
 * published site (the reviewers' host since the DA sign-in) couldn't show them. For each page:
 * its first-shot versions (not yet in Files) from the history; each tile from the local capture
 * folder (capture-snapshots.mjs), its SHA-256 checked against the history (the same picture that
 * was captured, or nothing is copied); uploaded through short-lived write links (admin op
 * tiles-upload); then the version marked as stored in Files (tiles-mark: every tile there).
 * Pages one after the other, a few tiles at a time; a page that fails is reported and left as it
 * was (its tiles keep coming from Document Authoring).
 * usage: node tools/review/backend/tiles-to-files.mjs <stage|production> <capture folder>
 *   <scope table, JSON (the DA sheet)> [--limit N] [--page /us/en/…]
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { actionUrl, WORKSPACES } from './target.mjs';

const [where = 'stage', folder = '', table = ''] = process.argv.slice(2);
const opt = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};
if (!WORKSPACES[where] || !folder || !existsSync(folder) || !existsSync(table)) {
  console.log('usage: tiles-to-files.mjs <stage|production> <capture folder> <scope table JSON> [--limit N] [--page /us/en/…]');
  process.exit(2);
}
const ns = WORKSPACES[where].ns;
const admin = async (p) => (await (await fetch(actionUrl(ns), {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: 'main', ...p }),
})).json()).body;

// the local folder of a page: its path without the slashes at either end
const dirOf = (page) => join(folder, page.replace(/^\/+|\/+$/g, ''));
// the scope's pages with a local capture (the first shots were taken of those)
const rows = JSON.parse(readFileSync(table, 'utf8')).data || [];
let pages = opt('--page') ? [opt('--page')]
  : [...new Set(rows.map((r) => String(r.eds || '').trim()).filter((p) => p.startsWith('/')))]
    .filter((p) => existsSync(join(dirOf(p), '1440', 'meta.json')));
console.log(`${pages.length} pages with a local capture`);
const limit = Number(opt('--limit')) || pages.length;
pages = pages.slice(0, limit);
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
let copied = 0;
let skipped = 0;
const failed = [];
for (const page of pages) {
  const h = await admin({ op: 'shot-history', page });
  const first = (h?.versions || []).filter((v) => v.store !== 'files' && !v.dir);
  if (!first.length) {
    skipped += 1;
    continue;
  }
  try {
    for (const v of first) {
      // the local tiles, checked against the history
      const tiles = Object.entries(v.widths || {}).flatMap(([vp, w]) => (w.tiles || []).map((t) => ({ vp, ...t })));
      const local = tiles.map((t) => {
        const file = join(dirOf(page), String(t.vp), t.file);
        if (!existsSync(file)) throw new Error(`no local tile ${t.vp}/${t.file}`);
        const buf = readFileSync(file);
        if (t.sha256 && sha(buf) !== t.sha256) throw new Error(`${t.vp}/${t.file}: SHA-256 differs from the history`);
        return { ...t, buf };
      });
      const { links, already } = await admin({ op: 'tiles-upload', page, id: v.id });
      if (already) continue;
      if (!links) throw new Error('no upload links');
      for (let i = 0; i < local.length; i += 4) {
        await Promise.all(local.slice(i, i + 4).map(async (t) => {
          const link = links.find((l) => String(l.vp) === String(t.vp) && l.file === t.file);
          const r = await fetch(link.url, {
            method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': 'image/jpeg' }, body: t.buf,
          });
          if (!r.ok) throw new Error(`${t.vp}/${t.file}: upload ${r.status}`);
        }));
      }
      const m = await admin({ op: 'tiles-mark', page, id: v.id });
      if (!m?.marked && !m?.already) throw new Error(`not marked: ${JSON.stringify(m).slice(0, 200)}`);
      copied += 1;
    }
  } catch (e) {
    failed.push({ page, error: String(e.message || e) });
  }
  if ((copied + skipped + failed.length) % 25 === 0) console.log(`… ${copied} copied, ${skipped} already / none, ${failed.length} failed`);
}
console.log(`${where}: ${copied} versions copied, ${skipped} pages with none to copy, ${failed.length} failed`);
failed.slice(0, 20).forEach((f) => console.log(`  ${f.page}: ${f.error}`));
process.exit(failed.length ? 1 : 0);
