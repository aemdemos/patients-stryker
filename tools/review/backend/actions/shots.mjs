/*
 * Web action `shots`: a page's source shots (every snapshot of its source page, kept for
 * evidence) and the requests for a new one (lib/shots.mjs).
 * GET ?page=/us/en/…            → { versions (oldest first; anchors only in the newest), request }
 * GET ?page=…&version=<id>      → { version } (with its anchors)
 * POST { page }                 → { request, already } a new shot of the page, the AOE team only;
 *                                 taken by refresh-shots.mjs, which adds it to the history
 * Any invitation reads (its space, its pages); header x-review-invite: <token>.
 */
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import {
  readHistory, readRequest, requestShot, withoutLeaves,
} from '../lib/shots.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  try {
    const stores = await open();
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const page = String(params.page || '');
    if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
    if (!inScope(invite.scope, page)) return fail(params, 403, 'out-of-scope', 'This page is not part of your review.');
    const space = spaceOf(invite.scope);
    const { files } = stores;
    const method = (params.__ow_method || 'get').toLowerCase();
    if (method === 'post') {
      if (invite.role !== 'aoe') return fail(params, 403, 'aoe-only', 'Only the AOE team asks for new source shots.');
      const history = await readHistory(files, space, page);
      if (!history.versions.length) {
        return fail(params, 409, 'no-first-shot', 'This page has no source shot yet: new pages are added another way.');
      }
      const result = await requestShot(files, space, page, { by: invite.name, role: invite.role, inv: invite.id });
      return reply(params, 200, result);
    }
    const history = await readHistory(files, space, page);
    if (params.version) {
      const version = history.versions.find((v) => v.id === params.version);
      if (!version) return fail(params, 404, 'no-version', 'No such shot of this page.');
      return reply(params, 200, { version });
    }
    const last = history.versions.length - 1;
    return reply(params, 200, {
      versions: history.versions.map((v, i) => (i === last ? v : withoutLeaves(v))),
      request: await readRequest(files, space, page),
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
