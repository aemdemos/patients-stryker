/*
 * Web action `state`: a page's saved review state for the review tool.
 * GET ?page=/us/en/… with header x-review-invite: <token> → { reviewer, scope, rows }
 * rows: { page, item, kind, value (JSON string), reviewer, time, rev }, the
 * page's own and every group choice (page `*`), AOE statuses among them (kind `status:*`).
 */
import {
  open, checkInvite, inScope, readPage, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  try {
    const stores = await open();
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const page = String(params.page || '');
    if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
    if (!inScope(invite.scope, page)) return fail(params, 403, 'out-of-scope', 'This page is not part of your review.');
    const rows = await readPage(stores.state, page, spaceOf(invite.scope));
    return reply(params, 200, {
      reviewer: invite.name, role: invite.role, scope: invite.scope, expires: invite.exp, rows,
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
