/*
 * Web action `pages`: the pages of the review (lib/scope.mjs): the migration scope table (DA)
 * with each page's source, template and whether it is published (the live query index).
 * GET with header x-review-invite →
 *   reviewers: { pages } the published pages of the scope, within the invitation's pages
 *   the AOE team: { pages (every page of the scope, published or not), notInScope (published,
 *     not in the scope table), problems (rows of the table to correct), capture: { waiting
 *     (published, no shot yet, since), sources (sources to correct: 404, redirect), lastRun,
 *     health }, changes: { redirects, unreachable, lastRun } (the daily change check) }
 * Spaces without a scope table (std) answer { none: true }.
 * The scope table behind the site login (27 Nov 2026): when the backend can't read it, its copy
 * stands in (lib/scope.mjs); the AOE team's answer has scopeCopy { at, hash, used } and its
 * Status page, which can read the table, hands it over when it differs:
 * POST { op: 'scope-copy', data: [{ source, eds, template }] } (the AOE team) → { at, rows, hash }
 */
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import {
  pageList, readScopeCopy, writeScopeCopy, scopeRows,
} from '../lib/scope.mjs';
import { readCaptureState, pagesWithShots } from '../lib/capture-state.mjs';
import { readSite } from '../lib/changes.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  try {
    const stores = await open(params);
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const space = spaceOf(invite.scope);
    if ((params.__ow_method || 'get').toLowerCase() === 'post') {
      if (invite.role !== 'aoe') return fail(params, 403, 'aoe-only', 'Only the AOE team hands over the scope table.');
      if (params.op !== 'scope-copy' || !scopeRows(params.data).length) return fail(params, 400, 'bad-copy', 'op scope-copy with the table\'s rows (data) is needed');
      const copy = await writeScopeCopy(stores.files, space, params.data, { name: invite.name, inv: invite.id });
      await pageList(space, { fresh: true, files: stores.files }).catch(() => null);
      return reply(params, 200, copy);
    }
    // (?fresh=1: the AOE team's Refresh reads the scope and the live index again)
    const list = await pageList(space, { fresh: !!params.fresh && invite.role === 'aoe', files: stores.files });
    if (list.none) return reply(params, 200, { none: true, pages: [] });
    const mine = list.pages.filter((p) => inScope(invite.scope, p.path));
    if (invite.role !== 'aoe') return reply(params, 200, { pages: mine.filter((p) => p.published) });
    const [cs, shots, site, kept] = await Promise.all([readCaptureState(stores.files, space), pagesWithShots(stores.files, space), readSite(stores.files, space), readScopeCopy(stores.files, space)]);
    const waiting = mine.filter((p) => p.published && !shots.has(p.path))
      .map((p) => ({ path: p.path, source: p.source, since: cs.firstSeen[p.path] || null, problem: cs.problems[p.path] || null }));
    return reply(params, 200, {
      pages: mine.map((p) => ({ ...p, shot: shots.has(p.path) })),
      notInScope: list.notInScope,
      // the backend's copy of the scope table (used: the table itself couldn't be read)
      scopeCopy: { at: kept?.at || null, hash: kept?.hash || null, used: !!list.copy },
      problems: list.problems,
      capture: {
        waiting, lastRun: cs.lastRun, health: cs.health,
      },
      // the daily change check: sources that redirect, sources not reachable (within the invitation)
      changes: {
        redirects: Object.entries(site.sources?.redirects || {}).filter(([p]) => inScope(invite.scope, p)).map(([path, v]) => ({ path, ...v })),
        unreachable: Object.entries(site.sources?.unreachable || {}).filter(([p]) => inScope(invite.scope, p)).map(([path, v]) => ({ path, ...v })),
        lastRun: site.lastRun || null,
      },
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
