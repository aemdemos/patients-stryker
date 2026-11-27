#!/usr/bin/env node
/*
 * Review tool: the new source shots the AOE team asked for in the tool ("Refresh source shot",
 * backend action shots). For each open (pending) request of the space:
 *   1. a new shot of the source page (the URL of the page's newest version) at every width, into
 *      <out>/<page>/<id>/<width>/ (shoot.mjs), id = s-YYYYMMDD-HHMMSS (UTC, the capture's start)
 *   2. the tiles to Document Authoring under <snapshots folder><page>/<id>/<width>/<n>.jpg: never
 *      over a file that is there already; each upload read back and its SHA-256 compared; then
 *      previewed on the branch (never published)
 *   3. the version into the page's shot history (admin shot-add, closing the request); the
 *      history keeps every earlier version, the first one included
 * A request that fails (source page gone, upload refused, …) is marked failed with the reason
 * (admin shot-fail), shown in the tool; the AOE team can ask again.
 * Writes to Document Authoring: run only when asked to. The DA and preview credentials are added
 * by the environment (Settings).
 *
 * usage: node tools/review/refresh-shots.mjs --out <dir> [--space main] [--ref <branch>]
 *          [--pages <eds path,…>] [--dry-run (capture only: no upload, no history)]
 */
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { join } from 'path';
import { REVIEW } from './config.js';
import {
  chromium, shoot, shotId, versionOf, admin,
} from './shoot.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const out = opt('--out');
const space = opt('--space', REVIEW.space);
const ref = opt('--ref', 'main');
const dry = args.includes('--dry-run');
const only = opt('--pages') ? opt('--pages').split(',') : null;
const ORG = 'strykerenterprise';
const SITE = 'stryker-com';
const FOLDER = REVIEW.snapshots.preview.replace(/^\//, '');
const WIDTHS = REVIEW.widths.map((w) => w.vp);
if (!out) {
  console.error('usage: refresh-shots.mjs --out <dir> [--space main] [--ref <branch>] [--pages …] [--dry-run]');
  process.exit(2);
}

// (curl, as upload-snapshots.sh: the environment adds the credentials to its requests)
const curl = (list, binary = false) => execFileSync('curl', ['-s', '--max-time', '120', ...list], {
  encoding: binary ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024,
});
const daSource = (path) => `https://admin.da.live/source/${ORG}/${SITE}/${path}`;

/** one tile into Document Authoring: refused if a file is there; read back and compared */
function uploadTile(file, path, sha) {
  const there = curl(['-o', '/dev/null', '-w', '%{http_code}', '-I', daSource(path)]);
  if (there !== '404') throw new Error(`${path} is in DA already (${there}): shots are never replaced`);
  const up = curl(['-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', '-F', `data=@${file};type=image/jpeg`, daSource(path)]);
  if (up !== '200' && up !== '201') throw new Error(`upload ${path}: ${up}`);
  const back = createHash('sha256').update(curl([daSource(path)], true)).digest('hex');
  if (back !== sha) throw new Error(`${path}: the copy in DA differs from the shot`);
  const pv = curl(['-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', `https://admin.hlx.page/preview/${ORG}/${SITE}/${ref}/${path}`]);
  if (pv !== '200') throw new Error(`preview ${path}: ${pv}`);
}

const { requests } = await admin({ op: 'shot-requests', space });
const pending = requests.filter((r) => r.status === 'pending' && (!only || only.includes(r.page)));
console.log(`${pending.length} pending request${pending.length === 1 ? '' : 's'} in ${space}${dry ? ' (dry run)' : ''}`);
const browser = await chromium.launch();
const done = [];
const failed = [];
await pending.reduce((chain, req) => chain.then(async () => {
  try {
    const history = await admin({ op: 'shot-history', space, page: req.page });
    const latest = history.versions[history.versions.length - 1];
    if (!latest) throw new Error('no first shot: new pages are added another way');
    const id = shotId(new Date().toISOString());
    const dirs = {};
    await WIDTHS.reduce((c, w) => c.then(async () => {
      dirs[w] = join(out, req.page, id, String(w));
      await shoot(browser, latest.url, w, dirs[w]);
    }), Promise.resolve());
    const version = {
      ...versionOf(dirs, {
        id, dir: `/${id}`, by: req.by, request: req.id,
      }),
      requestedAt: req.at,
    };
    if (dry) {
      done.push(`${req.page} ${id} (captured only)`);
      return;
    }
    Object.entries(version.widths).forEach(([w, s]) => s.tiles.forEach((t) => {
      uploadTile(join(dirs[w], t.file), `${FOLDER}${req.page}/${id}/${w}/${t.file}`, t.sha256);
    }));
    const r = await admin({ op: 'shot-add', space, items: [{ page: req.page, version }] });
    if (!r.added.length) throw new Error(`not recorded: ${r.refused[0]?.reason}`);
    done.push(`${req.page} ${id}`);
  } catch (e) {
    const reason = String(e.message || e).slice(0, 250);
    failed.push(`${req.page}: ${reason}`);
    if (!dry) await admin({ op: 'shot-fail', space, page: req.page, reason }).catch(() => null);
  }
}), Promise.resolve());
await browser.close();
console.log(`done: ${done.length} new shot${done.length === 1 ? '' : 's'}, ${failed.length} failed`);
done.forEach((d) => console.log(`  ${d}`));
failed.forEach((f) => console.log(`  FAILED ${f}`));
