/*
 * Web action `save`: a reviewer's changes.
 * POST { page, changes: [{ page?, item, kind, value (JSON string), rev }] } with header
 * x-review-invite → { at, results: [{ page, item, kind, ok, rev, conflict? }] }
 * The reviewer's name comes from the invitation, never from the request. A change whose stored
 * rev differs from the one it started from is refused (conflict: someone else changed it).
 * A change's own `page` is `*` for a group choice (needs the invitation's group right).
 * Messages (kind `reply:<comment|note>:<id>`) are written once (rev 0); their value is checked for
 * the writer's role (core.mjs replyProblem); page statuses per side (stateProblem); Done marks.
 * Withdrawing (25 Nov 2026): a message, or a comment's own text, written by this invitation
 * may become { withdrawn: true } (its rev, the author only: the stored entry's invitation); the
 * audit keeps the original.
 */
import {
  open, checkInvite, inScope, saveChanges, reply, fail, isPreflight, inviteOf,
  REVIEW_KINDS, MAX_VALUE, MAX_CHANGES, MAX_ORG_CHANGES, REPLY_KIND, replyProblem, stateProblem, doneProblem, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import { updateSummary, readSummary } from '../lib/summary.mjs';
import { ORG_KINDS, orgProblem, isWithdrawn } from '../../threads.js';
import { entryOf } from '../lib/dbstate.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  if ((params.__ow_method || '').toLowerCase() !== 'post') return fail(params, 405, 'method', 'POST only');
  try {
    const stores = await open(params);
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const page = String(params.page || '');
    const changes = Array.isArray(params.changes) ? params.changes : [];
    if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
    // (organisation entries may name other pages: a batch marks many pages in one save)
    const org = (c) => ORG_KINDS.includes(c.kind);
    const max = changes.every(org) ? MAX_ORG_CHANGES : MAX_CHANGES;
    if (!changes.length || changes.length > max) return fail(params, 400, 'bad-changes', `1 to ${max} changes`);
    const bad = changes.find((c) => typeof c.item !== 'string' || !c.item || c.item.length > 300
      || !(REVIEW_KINDS.includes(c.kind) || REPLY_KIND.test(c.kind || ''))
      || typeof c.value !== 'string' || c.value.length > MAX_VALUE
      || (c.page !== undefined && c.page !== '*' && c.page !== page
        && !(org(c) && typeof c.page === 'string' && c.page.startsWith('/') && c.page.length <= 400)));
    if (bad) return fail(params, 400, 'bad-change', `not allowed: ${JSON.stringify(bad).slice(0, 120)}`);
    // a withdrawal: a message (or a comment's own text) already there becomes { withdrawn: true }
    const withdrawal = (c) => (REPLY_KIND.test(c.kind) || c.kind === 'comment') && (c.rev ?? 0) > 0 && isWithdrawn(c.value);
    const badReply = changes.filter((c) => REPLY_KIND.test(c.kind) && !withdrawal(c))
      .map((c) => ({ c, problem: (c.rev ?? 0) !== 0 ? 'a reply is written once' : replyProblem(c.value, invite.role) }))
      .find((x) => x.problem);
    if (badReply) return fail(params, 400, 'bad-reply', badReply.problem);
    // (only its author withdraws a message: the invitation that wrote it)
    const withdrawals = changes.filter(withdrawal);
    if (withdrawals.length) {
      const space0 = spaceOf(invite.scope);
      const stored = await Promise.all(withdrawals.map((c) => entryOf(stores.client, space0, c.page || page, c.item, c.kind)));
      if (stored.some((e) => !e || e.inv !== invite.id)) return fail(params, 403, 'not-yours', 'Only its author can withdraw a message.');
    }
    const badState = changes.filter((c) => c.kind === 'state')
      .map((c) => (c.item !== 'page' ? 'a page state is on item page' : stateProblem(c.value, invite.role)))
      .find(Boolean);
    if (badState) return fail(params, 400, 'bad-state', badState);
    const badDone = changes.filter((c) => c.kind.startsWith('done:')).map((c) => doneProblem(c.value)).find(Boolean);
    if (badDone) return fail(params, 400, 'bad-done', badDone);
    // batches, groups, representatives: the AOE team's, on the page item
    const orgChanges = changes.filter(org);
    if (orgChanges.length && invite.role !== 'aoe') return fail(params, 403, 'aoe-only', 'Only the AOE team organises the pages.');
    const badOrg = orgChanges.map((c) => (c.item !== 'page' ? `a ${c.kind} is on item page` : orgProblem(c.kind, c.value))).find(Boolean);
    if (badOrg) return fail(params, 400, 'bad-org', badOrg);
    orgChanges.forEach((c) => Object.assign(c, { org: true }));
    const pages = [...new Set(changes.map((c) => c.page || page))];
    const outside = pages.find((p) => !inScope(invite.scope, p));
    if (outside) return fail(params, 403, 'out-of-scope', outside === '*' ? 'Choices for all pages are not part of your review.' : 'This page is not part of your review.');
    const space = spaceOf(invite.scope);
    // organisation changes: their values before from the review's summary (not read one by one)
    const summary = orgChanges.length ? await readSummary(stores.files, space) : null;
    const orgBefore = summary ? (p, kind) => {
      const s = summary.pages[p];
      if (!s) return null;
      return kind === 'representative' ? !!s.representative : s[kind] ?? null;
    } : null;
    const result = await saveChanges(stores, {
      page, changes, by: invite.name, inv: invite.id, role: invite.role, space, orgBefore,
    });
    // the review's summary (the overview reads it): what was saved
    await updateSummary(stores, space, changes.filter((c, i) => result.results[i]?.ok)
      .map((c) => ({ page: c.page || page, kind: c.kind, value: c.value })))
      .catch(() => null);
    return reply(params, 200, result);
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
