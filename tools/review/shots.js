/*
 * Review tool: a page's source shots (every snapshot of its source page, kept for evidence,
 * backend action shots) and the AOE team's requests for a new one. Without the backend (no
 * invitation) the tool falls back to the first shots committed with it (snapshot-meta/).
 */
import { call } from './store.js';

/** a page's history: { versions (oldest first), request } or null (no backend) */
export async function loadShots(page) {
  try {
    const { status, body } = await call(`shots?page=${encodeURIComponent(page)}`);
    return status === 200 ? { versions: body.versions || [], request: body.request || null, changes: body.changes || null } : null;
  } catch (e) {
    return null;
  }
}

/** one version with its anchors (the history list has them only in the newest) */
export async function loadVersion(page, id) {
  try {
    const { status, body } = await call(`shots?page=${encodeURIComponent(page)}&version=${encodeURIComponent(id)}`);
    return status === 200 ? body.version : null;
  } catch (e) {
    return null;
  }
}

/** a new shot of the page, the AOE team only → { request } or { error } */
export async function requestShot(page) {
  try {
    const { status, body } = await call('shots', { method: 'POST', body: JSON.stringify({ page }) });
    return status === 200 ? body : { error: body?.error?.message || `error ${status}` };
  } catch (e) {
    return { error: 'The review backend could not be reached.' };
  }
}

/** why the daily change check took a version (its `by`), for its label */
const WHY = {
  'change history: start': 'change history starts',
  'change history: changed': 'source changed',
  'change history: site design changed': 'site design changed',
};

/** a version's place in the history and why it was taken, for its label */
export const shotTag = (i, n, v = null) => [i === 0 ? 'first shot' : '', i === n - 1 && n > 1 ? 'newest' : '', WHY[v?.by] || '']
  .filter(Boolean).join(', ');

/** the daily change check's record of a page, in a sentence (empty: not checked) */
export function changesText(c) {
  if (!c?.since) return '';
  const changed = c.changes.filter((x) => x.result === 'changed').length;
  const last = c.last ? {
    unchanged: 'unchanged', variant: 'unchanged', baseline: 'its history started', changed: 'changed (a new shot was taken)', unreachable: `not reachable (${c.last.reason || 'tried again tomorrow'})`, gone: 'gone (not reachable for 3 days in a row)',
  }[c.last.result] || c.last.result : '';
  return `The source is checked every day since ${c.since}${last ? `; on ${c.last.day} it was ${last}` : ''}. ${changed ? `${changed} change${changed > 1 ? 's' : ''} recorded, each with its shot.` : 'No change recorded so far.'}`;
}
