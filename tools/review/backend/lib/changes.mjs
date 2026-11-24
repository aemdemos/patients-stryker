/*
 * The daily source change check (pilot on Stage from 24 Nov 2026; backend README, "Source change
 * history"): every day each source page in the check's list is loaded once, gently, and three
 * signals tell whether it changed: its content fingerprint (lib/fingerprint.mjs), its images'
 * dates (Last-Modified, asked with HEAD: no download) and the site's code (the CSS / JS files,
 * by release stamp and size). Screenshots only for a confirmed change. In Files:
 *   <space>/changes/scope.json            { pages: [{ page, source, template }] }: the pages checked
 *   <space>/changes/pages/<b64 page>.json { page, source, known: [part hashes seen], images:
 *        { <image>: <last-modified> }, day, misses, log: [{ day, at, result, … }] }
 *   <space>/changes/site.json             { code: { <file>: { stamp, size } }, log, lastRun, pendingShots }
 * A page's log results: baseline (the history starts: 3 loads, every version of a part seen is
 * known), unchanged, variant (a part seen once and not on the confirming load: dynamic, learned),
 * changed { parts, images, shot, unsteady }, unreachable { reason }, gone (3 days unreachable).
 */
export const pre = (space) => (!space || space === 'std' ? '' : `${space}/`);
export const scopeFile = (space) => `${pre(space)}changes/scope.json`;
export const pageFile = (space, page) => `${pre(space)}changes/pages/${Buffer.from(page).toString('base64url')}.json`;
export const siteFile = (space) => `${pre(space)}changes/site.json`;
export const checkLockFile = (space) => `${pre(space)}changes/lock.json`;
export const dayOf = (iso = new Date().toISOString()) => iso.slice(0, 10);
export const GONE_AFTER = 3;

export async function readJson(files, name, fallback) {
  try {
    return JSON.parse((await files.read(name)).toString());
  } catch (e) {
    return fallback;
  }
}
export const writeJson = (files, name, value) => files.write(name, JSON.stringify(value));

export const readScope = (files, space) => readJson(files, scopeFile(space), { pages: [] });
export const readSite = (files, space) => readJson(files, siteFile(space), { code: {}, log: [], pendingShots: [] });
export const readPageState = (files, space, page) => readJson(files, pageFile(space, page), null);

/**
 * a CSS / JS file of the site → its key (the release stamp out: clientlibs-<n>) and version:
 * the stamp and the size (the first part of the Apache ETag "size-mtime": the mtime part
 * differs from server to server for the same file)
 */
export function codeVersion(url, etag) {
  const u = new URL(url);
  const stamp = (u.pathname.match(/clientlibs-(\d+)/) || [])[1] || null;
  const size = String(etag || '').replace(/^W\//, '').replace(/"/g, '').split('-')[0] || null;
  return { key: u.pathname.replace(/clientlibs-\d+/, 'clientlibs-*'), stamp, size };
}

/** a page's record and one load → the parts never seen and the images whose date changed */
export function differences(state, fp, images) {
  const known = new Set(state?.known || []);
  return {
    parts: fp.parts.filter((p) => !known.has(p.hash)),
    images: Object.keys(images).filter((u) => state?.images?.[u] && images[u] && state.images[u] !== images[u]),
  };
}

/**
 * the first load's differences against a confirming load → what is confirmed: a part whose new
 * content is the same on both loads; an image whose new date is the same on both; unsteady: a
 * part (same position) new on both loads but different each time (changed, and moving)
 */
export function confirm(first, fp2, images2, state) {
  const second = new Set(fp2.parts.map((p) => p.hash));
  const known = new Set(state?.known || []);
  const parts = first.parts.filter((p) => second.has(p.hash));
  const unsteady = first.parts.filter((p) => !second.has(p.hash)
    && fp2.parts.some((q) => q.key === p.key && !known.has(q.hash) && q.hash !== p.hash));
  const images = first.images.filter((u) => images2[u] && images2[u] !== state.images[u]);
  return { parts, unsteady, images };
}

/** a log line (one per day per page; the newest kept last) */
export function addLog(state, entry) {
  const log = (state.log || []).filter((l) => l.day !== entry.day || l.result === 'changed' || entry.result === 'changed');
  log.push(entry);
  return { ...state, log, day: entry.day };
}

/** a page's history for the tool: since when it is checked, the last check, every change */
export function historyOf(state) {
  if (!state) return null;
  const log = state.log || [];
  const last = log[log.length - 1] || null;
  return {
    since: log[0]?.day || null,
    last: last && { day: last.day, result: last.result, reason: last.reason || null },
    changes: log.filter((l) => l.result === 'changed' || l.result === 'baseline').map((l) => ({
      day: l.day, at: l.at, result: l.result, parts: l.parts?.length || 0, images: l.images?.length || 0, shot: l.shot || null, unsteady: !!l.unsteady, site: l.site || null,
    })),
    unreachable: state.misses || 0,
    gone: log.some((l) => l.result === 'gone') && last?.result !== 'unchanged',
  };
}
