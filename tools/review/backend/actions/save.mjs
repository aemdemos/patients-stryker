/*
 * Web action `save`: a reviewer's changes.
 * POST { page, changes: [{ page?, item, kind, value (JSON string), rev }] } with header
 * x-review-invite → { at, results: [{ page, item, kind, ok, rev, conflict? }] }
 * The reviewer's name comes from the invitation, never from the request. A change whose stored
 * rev differs from the one it started from is refused (conflict: someone else changed it).
 * A change's own `page` is `*` for a group choice (needs the invitation's group right).
 */
import {
  open, checkInvite, inScope, saveChanges, reply, fail, isPreflight, inviteOf,
  REVIEW_KINDS, MAX_VALUE, MAX_CHANGES,
} from '../lib/core.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if ((params.__ow_method || '').toLowerCase() !== 'post') return fail(params, 405, 'method', 'POST only');
  try {
    const stores = await open();
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const page = String(params.page || '');
    const changes = Array.isArray(params.changes) ? params.changes : [];
    if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
    if (!changes.length || changes.length > MAX_CHANGES) return fail(params, 400, 'bad-changes', `1 to ${MAX_CHANGES} changes`);
    const bad = changes.find((c) => typeof c.item !== 'string' || !c.item || c.item.length > 300
      || !REVIEW_KINDS.includes(c.kind) || typeof c.value !== 'string' || c.value.length > MAX_VALUE
      || (c.page !== undefined && c.page !== '*' && c.page !== page));
    if (bad) return fail(params, 400, 'bad-change', `not allowed: ${JSON.stringify(bad).slice(0, 120)}`);
    const pages = [...new Set(changes.map((c) => c.page || page))];
    const outside = pages.find((p) => !inScope(invite.scope, p));
    if (outside) return fail(params, 403, 'out-of-scope', outside === '*' ? 'Choices for all pages are not part of your review.' : 'This page is not part of your review.');
    const result = await saveChanges(stores, {
      page, changes, by: invite.name, inv: invite.id,
    });
    return reply(params, 200, result);
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
