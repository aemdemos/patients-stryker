/*
 * Web action `results`: every saved entry the invitation may see, for the results page.
 * GET with header x-review-invite (an invitation with the results right) → { at, reviewer, rows }
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
    if (!invite.scope.results) return fail(params, 403, 'no-results', 'This review link does not include the results.');
    const rows = (await readAll(stores.state, spaceOf(invite.scope))).filter((r) => r.page === '*' || inScope(invite.scope, r.page));
    return reply(params, 200, { at: new Date().toISOString(), reviewer: invite.name, rows });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
