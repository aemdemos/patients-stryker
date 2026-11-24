#!/usr/bin/env node
/*
 * Moves the review's backend from one workspace to another (done 24 Nov 2026, Stage →
 * Production; lib/move.mjs). Each step prints counts only: no file contents, links or
 * credentials. The new workspace must have the backend deployed and set up (DATABASE.md).
 *   1. both workspaces reachable, the new one empty (no entries, no invitations)
 *   2. the old one's schedules off (capture, live warm-up, backup)
 *   3. the old one frozen: package parameter REVIEW_MOVED_TO (its other parameters kept), so
 *      saves, shot requests and invitation changes answer 410 "moved: reload"
 *   4. the old one's backup of every entry and invitation, today's (backups/<day>/state.json)
 *   5. every file copied (lib/move.mjs filesList: all but Live copies and the capture's lock),
 *      the signing key with them (invitation links keep working), by short-lived links
 *   6. the new one's restore of that backup, then counted against the old one per review
 *   7. the summaries built again on the new one, its schedules on
 * usage: node tools/review/backend/move.mjs [--from stage] [--to production] [--apply]
 *   (without --apply: steps 1 and the file list only)
 */
import { WORKSPACES, actionUrl, apiOf, webBase } from './target.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const FROM = WORKSPACES[opt('--from', 'stage')];
const TO = WORKSPACES[opt('--to', 'production')];
const apply = args.includes('--apply');
const log = (...a) => console.log(...a);

async function admin(w, p) {
  const resp = await fetch(actionUrl(w.ns), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${w.ns} ${p.op}: ${resp.status} ${text.slice(0, 200)}`);
  const { body } = JSON.parse(text);
  if (body?.error) throw new Error(`${w.ns} ${p.op}: ${JSON.stringify(body.error).slice(0, 200)}`);
  return body;
}
async function api(w, method, path, body) {
  const resp = await fetch(`https://${apiOf(w.ns)}/api/v1/namespaces/${w.ns}${path}`, {
    method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${method} ${path}: ${resp.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
const countsOf = async (w) => {
  const s = await admin(w, { op: 'db-stats' });
  const rows = {};
  for (const space of ['std', 'main']) rows[space] = ((await admin(w, { op: 'export', space })).rows || []).length;
  return { pages: s.pages, invites: s.invites, rows };
};

// 1.
for (const w of [FROM, TO]) {
  const seen = await (await fetch(`https://${apiOf(w.ns)}/api/v1/namespaces`)).json();
  if (!seen.includes(w.ns)) throw new Error(`${w.ns} is not open to the key of ${apiOf(w.ns)}`);
}
const before = { from: await countsOf(FROM), to: await countsOf(TO) };
log('1. from', FROM.ns, JSON.stringify(before.from));
log('   to  ', TO.ns, JSON.stringify(before.to));
if (before.to.invites || Object.keys(before.to.pages).length) throw new Error(`${TO.ns} is not empty: nothing done`);
const { files } = await admin(FROM, { op: 'files-list' });
const bytes = files.reduce((n, f) => n + (f.size || 0), 0);
const byTop = {};
files.forEach((f) => {
  const top = f.name.split('/').slice(0, f.name.startsWith('main/') ? 2 : 1).join('/');
  byTop[top] = (byTop[top] || 0) + 1;
});
log(`   files to copy: ${files.length} (${(bytes / 1048576).toFixed(1)} MB)`, JSON.stringify(byTop));
if (!apply) process.exit(0);

// 2.
const off = await admin(FROM, { op: 'schedule', enabled: false });
log('2. schedules off on', FROM.ns, JSON.stringify(off.steps.map(([, s]) => s)));
// 3.
const pkg = await api(FROM, 'GET', '/packages/std-review');
const params = (pkg.parameters || []).filter((p) => p.key !== 'REVIEW_MOVED_TO');
params.push({ key: 'REVIEW_MOVED_TO', value: webBase(TO.ns) });
await api(FROM, 'PUT', '/packages/std-review?overwrite=true', { publish: false, parameters: params });
const kept = (await api(FROM, 'GET', '/packages/std-review')).parameters.map((p) => p.key);
log('3. frozen; package parameters now', JSON.stringify(kept));
// 4.
const b = await admin(FROM, { op: 'backup' });
log('4. backup', b.day, b.keys, 'keys');
// 5. (listed again: the backup is a new file)
const all = (await admin(FROM, { op: 'files-list' })).files;
let written = 0;
let copied = 0;
const failed = [];
for (let i = 0; i < all.length; i += 40) {
  const { links } = await admin(FROM, { op: 'files-presign', names: all.slice(i, i + 40).map((f) => f.name) });
  const r = await admin(TO, { op: 'files-pull', items: links });
  written += r.written;
  copied += r.bytes;
  failed.push(...r.failed);
}
log(`5. files copied: ${written} of ${all.length} (${(copied / 1048576).toFixed(1)} MB), failed ${failed.length}`, failed.slice(0, 5));
if (failed.length) throw new Error('files missing on the new workspace: stopped before the restore');
// 6.
const r = await admin(TO, { op: 'restore', day: b.day });
log('6. restored', r.restored, 'keys');
const after = { from: await countsOf(FROM), to: await countsOf(TO) };
log('   from', JSON.stringify(after.from));
log('   to  ', JSON.stringify(after.to));
const same = JSON.stringify(after.from) === JSON.stringify(after.to);
log('   the same:', same);
if (!same) throw new Error('counts differ: schedules not started on the new workspace');
// 7.
for (const space of ['std', 'main']) await admin(TO, { op: 'rebuild-summary', space });
const on = await admin(TO, { op: 'schedule', enabled: true });
log('7. summaries built; schedules on', TO.ns, JSON.stringify(on.steps.map(([, s]) => s)));
