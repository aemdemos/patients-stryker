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
    return status === 200 ? { versions: body.versions || [], request: body.request || null } : null;
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

/** a version's place in the history, for its label */
export const shotTag = (i, n) => [i === 0 ? 'first shot' : '', i === n - 1 && n > 1 ? 'newest' : '']
  .filter(Boolean).join(', ');
