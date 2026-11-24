#!/usr/bin/env node
/*
 * Stage, the test workspace, gets Production's source shots: the shot history of every page,
 * the tiles the backend took and the capture's record, so the tool and the tests on Stage show
 * real pages with their shots. No entries, no invitations, no audit: Stage's review data stays
 * test data. Run again to bring Stage's shots up to date (a file is written again only when its
 * size changed). Prints counts only (lib/move.mjs: by short-lived links).
 * usage: node tools/review/backend/seed-stage.mjs
 */
import { WORKSPACES, actionUrl } from './target.mjs';

const FROM = WORKSPACES.production.ns;
const TO = WORKSPACES.stage.ns;
const KEEP = [/^main\/shots\//, /^main\/shot-tiles\//, /^main\/capture\/state\.json$/];

async function admin(ns, p) {
  const resp = await fetch(actionUrl(ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${ns} ${p.op}: ${resp.status} ${text.slice(0, 200)}`);
  const { body } = JSON.parse(text);
  if (body?.error) throw new Error(`${ns} ${p.op}: ${JSON.stringify(body.error).slice(0, 200)}`);
  return body;
}

const prod = (await admin(FROM, { op: 'files-list' })).files.filter((f) => KEEP.some((re) => re.test(f.name)));
const there = new Map((await admin(TO, { op: 'files-list' })).files.map((f) => [f.name, f.size]));
const todo = prod.filter((f) => there.get(f.name) !== f.size);
console.log(`production shots: ${prod.length} files; on stage already: ${prod.length - todo.length}; to copy: ${todo.length}`);
let written = 0;
for (let i = 0; i < todo.length; i += 40) {
  const { links } = await admin(FROM, { op: 'files-presign', names: todo.slice(i, i + 40).map((f) => f.name) });
  const r = await admin(TO, { op: 'files-pull', items: links });
  if (r.failed.length) throw new Error(`failed: ${JSON.stringify(r.failed.slice(0, 3))}`);
  written += r.written;
}
console.log(`copied ${written}`);
