/*
 * The source shots of the pages: every snapshot ever taken of a page's source, kept for evidence
 * (never changed, never removed), and the requests for a new one.
 *
 * Kept in Files, not in State: State entries expire (a year at most), the history must not.
 * - history: <space>/shots/<page b64url>.json = { page, versions: [version, …] } (oldest first)
 * - requests: <space>/shot-requests/<page b64url>.json = one open request per page
 * (std's files have no space folder: shots/…, shot-requests/…)
 *
 * A version (one capture of the page at every width):
 *   { id: 's-YYYYMMDD-HHMMSS' (UTC, the capture's start), dir: '' (the first shots, at their old
 *     place) or '/<id>', url (the source page), captured (ISO, the first width's), recorded (ISO,
 *     when it came into the history), by ('first capture' or the requester), request (the
 *     request it answers, if any),
 *     widths: { <vp>: { captured, width, height, status, finalUrl,
 *       tiles: [{ y, h, file, sha256 }], leaves: [{ key, y }] } } }
 * The tiles are in Document Authoring under <snapshots folder><page><dir>/<vp>/<file>; their
 * SHA-256 here shows they are the ones captured then.
 */
import crypto from 'crypto';

export const WIDTHS = [1440, 860, 375];
export const SHOT_ID = /^s-\d{8}-\d{6}$/;
const HEX64 = /^[0-9a-f]{64}$/;

const b64 = (s) => Buffer.from(String(s)).toString('base64url');
const pre = (space) => (!space || space === 'std' ? '' : `${space}/`);
export const historyFile = (space, page) => `${pre(space)}shots/${b64(page)}.json`;
export const requestFile = (space, page) => `${pre(space)}shot-requests/${b64(page)}.json`;
const auditName = (space, at, what) => `${pre(space)}audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-${what}-${crypto.randomBytes(3).toString('hex')}.json`;

async function readJson(files, name) {
  try {
    return JSON.parse((await files.read(name)).toString());
  } catch (e) {
    return null;
  }
}

/** a page's shot history ({ page, versions }, versions oldest first) */
export async function readHistory(files, space, page) {
  const h = await readJson(files, historyFile(space, page));
  return h && Array.isArray(h.versions) ? h : { page, versions: [] };
}

/** the open request of a page (pending or failed), or null */
export const readRequest = (files, space, page) => readJson(files, requestFile(space, page));

/** every open request of a space */
export async function listRequests(files, space) {
  const list = await files.list(`${pre(space)}shot-requests/`);
  const got = await Promise.all(list.map((f) => readJson(files, f.name)));
  return got.filter(Boolean).sort((a, b) => (a.at < b.at ? -1 : 1));
}

/** what is wrong with a version, or null */
export function versionProblem(v) {
  if (!v || typeof v !== 'object') return 'a version is an object';
  if (!SHOT_ID.test(v.id || '')) return 'id: s-YYYYMMDD-HHMMSS';
  if (v.dir !== '' && v.dir !== `/${v.id}`) return 'dir: "" (the first shots) or "/<id>"';
  if (typeof v.url !== 'string' || !/^https:\/\//.test(v.url)) return 'url: the source page';
  if (!v.captured || Number.isNaN(Date.parse(v.captured))) return 'captured: an ISO date';
  const widths = Object.keys(v.widths || {});
  if (!widths.length || widths.some((w) => !WIDTHS.includes(Number(w)))) return `widths: some of ${WIDTHS.join(', ')}`;
  const bad = widths.find((w) => {
    const s = v.widths[w];
    return !s || !Array.isArray(s.tiles) || !s.tiles.length || !Number.isFinite(s.height)
      || s.tiles.some((t) => !HEX64.test(t.sha256 || '') || !/^\d+\.jpg$/.test(t.file || ''))
      || !Array.isArray(s.leaves);
  });
  return bad ? `width ${bad}: height, tiles [{ y, h, file, sha256 }] and leaves are needed` : null;
}

/**
 * Adds versions to the history (never replaces one: an id already there is refused) and closes
 * the requests they answer. → { added, refused: [{ page, id, reason }] }
 */
export async function addVersions(files, space, items) {
  const at = new Date().toISOString();
  const added = [];
  const refused = [];
  for (const { page, version } of items) {
    const problem = typeof page !== 'string' || !page.startsWith('/') ? 'page must be a path' : versionProblem(version);
    if (problem) {
      refused.push({ page, id: version?.id, reason: problem });
    } else {
      const h = await readHistory(files, space, page);
      if (h.versions.some((v) => v.id === version.id)) {
        refused.push({ page, id: version.id, reason: 'already in the history (versions are never replaced)' });
      } else {
        const v = { ...version, recorded: at };
        h.versions = [...h.versions, v].sort((a, b) => (a.captured < b.captured ? -1 : 1));
        await files.write(historyFile(space, page), JSON.stringify({ page, versions: h.versions }));
        const req = await readRequest(files, space, page);
        if (req && version.request && version.request === req.id) await files.delete(requestFile(space, page));
        added.push({ page, id: v.id });
      }
    }
  }
  if (added.length) await files.write(auditName(space, at, 'shots'), JSON.stringify({ at, by: 'admin', shots: added }));
  return { added, refused };
}

/** a request for a new shot (one open request per page: an open pending one is returned as is) */
export async function requestShot(files, space, page, { by, role, inv }) {
  const open = await readRequest(files, space, page);
  if (open && open.status === 'pending') return { request: open, already: true };
  const at = new Date().toISOString();
  const request = {
    id: `r-${crypto.randomBytes(6).toString('base64url')}`, page, by, role, inv, at, status: 'pending',
  };
  await files.write(requestFile(space, page), JSON.stringify(request));
  await files.write(auditName(space, at, 'shot-request'), JSON.stringify({
    at, by, inv, role, request, before: open,
  }));
  return { request, already: false };
}

/** a request that could not be done: kept, failed, with the reason (shown in the tool) */
export async function failRequest(files, space, page, reason) {
  const req = await readRequest(files, space, page);
  if (!req) return null;
  const failed = {
    ...req, status: 'failed', reason: String(reason || '').slice(0, 300), failedAt: new Date().toISOString(),
  };
  await files.write(requestFile(space, page), JSON.stringify(failed));
  return failed;
}

/** a version without its anchors (the history list: the anchors only of the one shown) */
export const withoutLeaves = (v) => ({
  ...v,
  widths: Object.fromEntries(Object.entries(v.widths).map(([w, s]) => {
    const { leaves, ...rest } = s;
    return [w, { ...rest, leaves: leaves.length }];
  })),
});
