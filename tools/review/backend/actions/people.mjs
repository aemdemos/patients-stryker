/*
 * Web action `people` (27 Nov 2026, branch da-app-v3): the AOE team manages who takes part in its
 * own review (space), in the tool's People page (people.html), instead of invitation links.
 * Header x-review-invite: <review session> of an AOE member.
 * GET                                        → { me, space, people } (removed ones too)
 * POST { op: 'add', email, name, role, paths } → { person } (a removed person comes back)
 * POST { op: 'change', email, name?, role?, paths? } → { person }
 * POST { op: 'remove', email }               → { person } access ends at once (kept as removed)
 * One's own entry can't be removed or made a reviewer (the review keeps an AOE member who can
 * manage it). Every change goes into the space's audit (who, when, whom).
 */
import crypto from 'crypto';
import {
  open, checkInvite, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import {
  listPeople, getPerson, putPerson, removePerson, personProblem, cleanEmail,
} from '../lib/people.mjs';

const shown = (p, me) => ({
  email: p.email,
  name: p.name,
  role: p.role,
  paths: p.paths || ['/'],
  addedAt: p.addedAt,
  addedBy: p.addedBy?.name || '',
  changedAt: p.changedAt || '',
  removed: !!p.removed,
  removedAt: p.removedAt || '',
  removedBy: p.removedBy?.name || '',
  me: p.email === me,
});

async function audit(files, space, at, entry) {
  const dir = space === 'std' ? 'audit' : `${space}/audit`;
  await files.write(`${dir}/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-people-${crypto.randomBytes(3).toString('hex')}.json`, JSON.stringify({ at, ...entry }));
}

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  try {
    const stores = await open(params);
    const { state, files } = stores;
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'Your sign-in to the review has ended: sign in again.');
    if (invite.role !== 'aoe') return fail(params, 403, 'aoe-only', 'Only the AOE team manages the people of the review.');
    const space = spaceOf(invite.scope);
    const me = invite.email || '';
    const by = { name: invite.name, ...(me ? { email: me } : { inv: invite.id }) };
    const method = (params.__ow_method || 'get').toLowerCase();
    if (method === 'get') {
      return reply(params, 200, { me, space, people: (await listPeople(state, space)).map((p) => shown(p, me)) });
    }
    const op = String(params.op || '');
    const email = cleanEmail(params.email);
    const at = new Date().toISOString();
    if (op === 'add' || op === 'change') {
      const before = await getPerson(state, space, email);
      if (op === 'change' && (!before || before.removed)) return fail(params, 404, 'unknown', 'No such person in this review.');
      const fields = {
        email,
        name: params.name || before?.name,
        role: params.role,
        paths: params.paths,
      };
      const problem = personProblem(fields);
      if (problem) return fail(params, 400, 'bad-person', problem);
      if (email === me && params.role && params.role !== 'aoe') {
        return fail(params, 400, 'own-role', 'You can\'t make yourself a reviewer: another AOE member can.');
      }
      const person = await putPerson(state, space, fields, by);
      await audit(files, space, at, {
        op, by, email: person.email, role: person.role, paths: person.paths,
      });
      return reply(params, 200, { person: shown(person, me) });
    }
    if (op === 'remove') {
      if (email === me) return fail(params, 400, 'own-entry', 'You can\'t remove yourself: another AOE member can.');
      const person = await removePerson(state, space, email, by);
      if (!person) return fail(params, 404, 'unknown', 'No such person in this review.');
      await audit(files, space, at, { op, by, email });
      return reply(params, 200, { person: shown(person, me) });
    }
    return fail(params, 400, 'bad-op', 'op is add, change or remove');
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
