/*
 * Web action `results`: every saved entry the invitation may see, for the summary page
 * (summary.html; the results page until 25 Nov 2026).
 * GET with header x-review-invite (any invitation, the customer's too, since 25 Nov 2026: the
 * results right is no longer needed) → { at, reviewer, role, rows }
 * rows: the pages in the invitation's scope and every group choice (page `*`), AOE statuses
 * among them; like the `state` rows.
 */
import {
  open, checkInvite, inScope, readAll, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  try {
    const stores = await open(params);
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const rows = (await readAll(stores.state, spaceOf(invite.scope))).filter((r) => r.page === '*' || inScope(invite.scope, r.page));
    return reply(params, 200, {
      at: new Date().toISOString(), reviewer: invite.name, role: invite.role || 'reviewer', rows,
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
