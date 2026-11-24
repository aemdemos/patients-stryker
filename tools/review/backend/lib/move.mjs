/*
 * Moving the review between workspaces (Stage → Production, 24 Nov 2026), with the admin action:
 * - the old one lists its files (filesList) and gives short-lived read links for them
 *   (filesPresign); the new one fetches each link and writes the file under the same name
 *   (filesPull). File contents never pass through the machine that runs the move, only links.
 *   Copied: everything but the Live copies (a few minutes' cache) and the capture's lock.
 * - the entries and invitations go with the old workspace's backup (backups/<day>/state.json,
 *   copied like any file) and the new one's restore.
 * - once moved, the old workspace refuses writes (movedReply: the package parameter
 *   REVIEW_MOVED_TO, set by tools/review/backend/move.mjs): a reviewer still on the old tool is
 *   told to reload, nothing is written where nobody reads it any more.
 */
import { listAll } from './listall.mjs';

const SKIP = [/(^|\/)live\//, /(^|\/)capture\/lock\.json$/];

/** every file worth copying: { name, size } */
export async function filesList(files) {
  const all = await listAll(files, '');
  return all.filter((f) => !SKIP.some((re) => re.test(f.name)))
    .map((f) => ({ name: f.name, size: f.contentLength ?? f.size ?? null }));
}

/** short-lived read links (10 minutes) for the named files */
export async function filesPresign(files, names) {
  const out = [];
  for (let i = 0; i < names.length; i += 20) {
    out.push(...await Promise.all(names.slice(i, i + 20).map(async (name) => ({
      name, url: await files.generatePresignURL(name, { expiryInSeconds: 600, permissions: 'r' }),
    }))));
  }
  return out;
}

/** each { name, url } fetched and written under its name → counts (the names of failures) */
export async function filesPull(files, items) {
  const failed = [];
  let bytes = 0;
  for (let i = 0; i < items.length; i += 10) {
    await Promise.all(items.slice(i, i + 10).map(async ({ name, url }) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(String(resp.status));
        const buf = Buffer.from(await resp.arrayBuffer());
        await files.write(name, buf);
        bytes += buf.length;
      } catch (e) {
        failed.push({ name, error: String(e.message || e).slice(0, 80) });
      }
    }));
  }
  return { written: items.length - failed.length, bytes, failed };
}

/** the answer of a writing web action in a workspace the review has left (else null) */
export function movedMessage(params) {
  return params.REVIEW_MOVED_TO ? 'The review has moved: reload the page to continue (nothing was saved).' : null;
}
