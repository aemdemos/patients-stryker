/*
 * Web action `overview`: the review state of every page with entries in the invitation's scope,
 * for the status page (lib/states.mjs). Any valid invitation (reviewers and the AOE team).
 * GET with header x-review-invite → { at, reviewer, role, scope, pages: [{ page, state, threads,
 * choices, reviewed, reviewers, last, lastAoe }] }; pages without entries are not listed (the
 * status page shows them as not reviewed yet).
 */
import {
  open, checkInvite, inScope, readAll, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { pageStates } from '../lib/states.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  try {
    const stores = await open();
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const rows = (await readAll(stores.state, spaceOf(invite.scope))).filter((r) => r.page !== '*' && inScope(invite.scope, r.page));
    return reply(params, 200, {
      at: new Date().toISOString(), reviewer: invite.name, role: invite.role, scope: invite.scope, pages: pageStates(rows),
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
