/*
 * Web action `signin` (27 Nov 2026, branch da-app-v3): the DA sign-in. The tool's start page,
 * opened as a Document Authoring app, sends the user's Adobe token (authorization: Bearer …) and
 * the review (?space=main); Adobe IMS says whose token it is (people.mjs adobeId), the review's
 * people list says whether that email may review and how; a review session of 12 hours comes back
 * (people.mjs issueSession), the Adobe token is not kept.
 * GET ?space=… → { session, expires, email, name, role, paths }
 *   401 the sign-in not accepted · 403 { error: not-in-review, email } signed in, not on the list
 */
import {
  open, reply, fail, isPreflight, SPACES,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import { adobeId, getPerson, issueSession } from '../lib/people.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  const space = String(params.space || 'main');
  if (!SPACES[space]) return fail(params, 400, 'bad-space', 'No such review.');
  const token = String(params.__ow_headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const who = await adobeId(token);
  if (who.error) return fail(params, who.error.status, who.error.code, who.error.message);
  try {
    const stores = await open(params);
    const person = await getPerson(stores.state, space, who.email);
    if (!person || person.removed) {
      return reply(params, 403, {
        email: who.email,
        error: { code: 'not-in-review', message: `You're signed in as ${who.email}, which isn't part of this review: ask the AOE team to add it.` },
      });
    }
    const { session, expires } = await issueSession(stores.files, space, who.email);
    return reply(params, 200, {
      session, expires, email: person.email, name: person.name, role: person.role, paths: person.paths,
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
