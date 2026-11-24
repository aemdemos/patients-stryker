/*
 * Web action `overview`: the review state of every page with entries in the invitation's scope,
 * for the status page (lib/states.mjs). Any valid invitation (reviewers and the AOE team).
 * GET with header x-review-invite → { at, reviewer, role, scope, pages: [{ page, state, threads,
 * choices, reviewed, reviewers, last, lastAoe }] }; pages without entries are not listed (the
 * status page shows them as not reviewed yet).
 */
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { withGroupApproval } from '../lib/states.mjs';
import { summaryFor } from '../lib/summary.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  try {
    const stores = await open();
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    // (the review's summary: one file instead of every entry; rebuild=1 builds it again)
    const summary = await summaryFor(stores, spaceOf(invite.scope), { rebuild: params.rebuild === '1' });
    const pages = Object.values(summary.pages).filter((p) => inScope(invite.scope, p.page))
      .map(({ _at, ...p }) => p);
    return reply(params, 200, {
      at: new Date().toISOString(), built: summary.built, reviewer: invite.name, role: invite.role, scope: invite.scope, pages: withGroupApproval(pages),
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
