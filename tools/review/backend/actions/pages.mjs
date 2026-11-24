/*
 * Web action `pages`: the pages of the review (lib/scope.mjs): the migration scope table (DA)
 * with each page's source, template and whether it is published (the live query index).
 * GET with header x-review-invite →
 *   reviewers: { pages } the published pages of the scope, within the invitation's pages
 *   the AOE team: { pages (every page of the scope, published or not), notInScope (published,
 *     not in the scope table), problems (rows of the table to correct), capture: { waiting
 *     (published, no shot yet, since), sources (sources to correct: 404, redirect), lastRun,
 *     health } }
 * Spaces without a scope table (std) answer { none: true }.
 */
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { pageList } from '../lib/scope.mjs';
import { readCaptureState, pagesWithShots } from '../lib/capture-state.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  try {
    const stores = await open(params);
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const space = spaceOf(invite.scope);
    const list = await pageList(space);
    if (list.none) return reply(params, 200, { none: true, pages: [] });
    const mine = list.pages.filter((p) => inScope(invite.scope, p.path));
    if (invite.role !== 'aoe') return reply(params, 200, { pages: mine.filter((p) => p.published) });
    const [cs, shots] = await Promise.all([readCaptureState(stores.files, space), pagesWithShots(stores.files, space)]);
    const waiting = mine.filter((p) => p.published && !shots.has(p.path))
      .map((p) => ({ path: p.path, source: p.source, since: cs.firstSeen[p.path] || null, problem: cs.problems[p.path] || null }));
    return reply(params, 200, {
      pages: mine.map((p) => ({ ...p, shot: shots.has(p.path) })),
      notInScope: list.notInScope,
      problems: list.problems,
      capture: {
        waiting, lastRun: cs.lastRun, health: cs.health,
      },
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
