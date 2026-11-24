/*
 * Web action `invites`: the AOE team manages the invitations of its own review (space), in the
 * tool's Invitations page (invites.html). AOE invitations only; header x-review-invite: <token>.
 * GET                                   → { me, space, invites } every invitation of the space
 *                                         (no tokens: a link is shown once, when it is created)
 * POST { op: 'create', name, role, paths, days, results }
 *                                       → { invite: { id, name, scope, expires, link, results } }
 *   role reviewer (default) or aoe; paths: only pages the AOE's own invitation covers (default:
 *   the same as its own); days 1–365 (default 90); the link to the tool on the host the page was
 *   opened on (a branch preview before the merge)
 * POST { op: 'revoke', id }             → { invite } the invitation stops working at once; any of
 *   the space's except one's own
 * Every create and revoke goes into the space's audit (who, when, which invitation; no token).
 */
import crypto from 'crypto';
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import {
  createInvite, listInvites, revokeInvite, inviteProblem,
} from '../lib/invites.mjs';

const stateOf = (i) => {
  if (i.revoked) return 'revoked';
  return Date.parse(i.exp) < Date.now() ? 'expired' : 'active';
};
const shown = (i, me) => ({
  id: i.id,
  name: i.name,
  role: i.scope?.role === 'aoe' ? 'aoe' : 'reviewer',
  paths: i.scope?.paths || [],
  results: !!i.scope?.results,
  created: i.created,
  createdBy: i.createdBy?.name || '',
  expires: i.exp,
  state: stateOf(i),
  revokedAt: i.revokedAt || '',
  revokedBy: i.revokedBy?.name || '',
  me: i.id === me,
});

async function audit(files, space, at, entry) {
  const dir = space === 'std' ? 'audit' : `${space}/audit`;
  await files.write(`${dir}/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-invites-${crypto.randomBytes(3).toString('hex')}.json`, JSON.stringify({ at, ...entry }));
}

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  try {
    const stores = await open(params);
    const { state, files } = stores;
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    if (invite.role !== 'aoe') return fail(params, 403, 'aoe-only', 'Only the AOE team manages the invitations.');
    const space = spaceOf(invite.scope);
    const by = { name: invite.name, inv: invite.id };
    const method = (params.__ow_method || 'get').toLowerCase();
    if (method === 'get') {
      const all = (await listInvites(state)).filter((i) => i.space === space);
      return reply(params, 200, { me: invite.id, space, invites: all.map((i) => shown(i, invite.id)).reverse() });
    }
    if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
    const at = new Date().toISOString();
    if (params.op === 'create') {
      const name = String(params.name || '').trim();
      const paths = Array.isArray(params.paths) && params.paths.length ? params.paths : invite.scope.paths;
      const problem = inviteProblem({ name, paths });
      if (problem) return fail(params, 400, 'bad-invite-fields', problem);
      const outside = paths.find((p) => !inScope(invite.scope, p));
      if (outside) return fail(params, 403, 'out-of-scope', `${outside} is not part of your own invitation's pages.`);
      // (the link to the tool where the AOE works: the origin's host, a branch preview before the merge)
      const origin = params.__ow_headers?.origin || '';
      const created = await createInvite(stores, {
        space,
        name,
        paths,
        days: Number(params.days) || 90,
        role: params.role === 'aoe' ? 'aoe' : 'reviewer',
        results: params.results === true,
        host: origin.replace(/^https:\/\//, ''),
        createdBy: by,
      });
      await audit(files, space, at, {
        by: by.name, inv: by.inv, op: 'create', invite: { id: created.id, name: created.name, scope: created.scope, expires: created.expires },
      });
      const { token, ...rest } = created;
      return reply(params, 200, { invite: rest });
    }
    if (params.op === 'revoke') {
      const id = String(params.id || '');
      if (id === invite.id) return fail(params, 409, 'own-invite', 'You can\'t revoke your own invitation here.');
      const target = (await listInvites(state)).find((i) => i.id === id);
      if (!target || target.space !== space) return fail(params, 404, 'no-invite', 'No such invitation in this review.');
      const revoked = await revokeInvite(state, id, by);
      await audit(files, space, at, {
        by: by.name, inv: by.inv, op: 'revoke', invite: { id, name: target.name },
      });
      return reply(params, 200, { invite: shown({ ...revoked, id }, invite.id) });
    }
    return fail(params, 400, 'bad-op', 'op: create or revoke');
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
