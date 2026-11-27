/*
 * The people of a review (27 Nov 2026, branch da-app-v3: the DA sign-in instead of invitation
 * links). A person is an entry u.<space>.<email, base64url> (the database's people collection) { email, name, role (aoe |
 * reviewer), paths, addedAt, addedBy?, changedAt?, changedBy?, removed, removedAt?, removedBy? };
 * removed people stay listed (who had access, until when).
 *
 * Signing in: the user's Adobe token from Document Authoring (adobeId: checked with Adobe IMS),
 * then a review session: a token of the backend's own (core.mjs sign, the invitations' secret)
 * { k: 's', sp: space, e: email, exp }, 12 hours. checkInvite takes it like an invitation and
 * reads the person on every call (core.mjs sessionIdentity), so a removed person is refused at once.
 */
import { sign, secretOf, personKey } from './core.mjs';

export const SESSION_HOURS = 12;
const IMS = 'https://ims-na1.adobelogin.com';
// the apps whose Adobe tokens count as a sign-in: Document Authoring
const CLIENTS = ['darkalley'];

const keyOf = personKey;
export const cleanEmail = (email) => String(email || '').trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** what is wrong with a person's fields, or null */
export function personProblem({ email, name, role, paths }) {
  if (!EMAIL.test(cleanEmail(email)) || cleanEmail(email).length > 200) return 'a valid email is needed';
  if (!String(name || '').trim()) return 'a name is needed';
  if (role && !['aoe', 'reviewer'].includes(role)) return 'the role is aoe or reviewer';
  if (paths !== undefined && (!Array.isArray(paths) || !paths.length
    || paths.some((p) => typeof p !== 'string' || !p.startsWith('/') || p.length > 300))) {
    return 'one or more page paths are needed (e.g. / or /us/en/joint-replacement)';
  }
  return null;
}

/** a person of the space (removed ones too), or null */
export async function getPerson(state, space, email) {
  const stored = await state.get(keyOf(space, email));
  return stored ? JSON.parse(stored.value) : null;
}

/** every person of the space, removed ones too, by name */
export async function listPeople(state, space) {
  const out = [];
  const it = state.list({ match: `u.${space}.*` });
  for (let r = await it.next(); !r.done; r = await it.next()) {
    const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
    got.forEach((g) => { if (g) out.push(JSON.parse(g.value)); });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * adds a person or changes one (name, role, paths; a removed one comes back) → the person.
 * by: { name, email? } of who did it.
 */
export async function putPerson(state, space, {
  email, name, role, paths,
}, by) {
  const e = cleanEmail(email);
  const at = new Date().toISOString();
  const before = await getPerson(state, space, e);
  const person = before && !before.removed
    ? {
      ...before,
      ...(name ? { name: String(name).trim().slice(0, 80) } : {}),
      ...(role ? { role } : {}),
      ...(paths ? { paths } : {}),
      changedAt: at,
      changedBy: by,
    }
    : {
      email: e,
      name: String(name).trim().slice(0, 80),
      role: role === 'aoe' ? 'aoe' : 'reviewer',
      paths: paths || ['/'],
      addedAt: at,
      addedBy: by,
      removed: false,
      ...(before ? { before: { addedAt: before.addedAt, removedAt: before.removedAt } } : {}),
    };
  await state.put(keyOf(space, e), JSON.stringify(person));
  return person;
}

/** a person loses access at once (kept, marked removed) → the person, or null */
export async function removePerson(state, space, email, by) {
  const before = await getPerson(state, space, email);
  if (!before) return null;
  if (before.removed) return before;
  const person = {
    ...before, removed: true, removedAt: new Date().toISOString(), removedBy: by,
  };
  await state.put(keyOf(space, email), JSON.stringify(person));
  return person;
}

/** a review session for a person of the space → { session, expires } */
export async function issueSession(files, space, email) {
  const exp = new Date(Date.now() + SESSION_HOURS * 3600000).toISOString();
  return { session: sign({ k: 's', sp: space, e: cleanEmail(email), exp }, await secretOf(files)), expires: exp };
}

/** the token's claims, read only to see which app it was issued to (Adobe checks the rest) */
function claimsOf(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString());
  } catch (e) {
    return {};
  }
}

/**
 * who an Adobe token from Document Authoring belongs to, as Adobe IMS says
 * → { email, name } or { error: { status, code, message } }. The token is used for this one call.
 */
export async function adobeId(token) {
  if (!token) return { error: { status: 401, code: 'no-token', message: 'Open the review from Document Authoring: no Adobe sign-in came with the request.' } };
  if (!CLIENTS.includes(claimsOf(token).client_id)) {
    return { error: { status: 401, code: 'other-app', message: 'This Adobe sign-in was not made by Document Authoring.' } };
  }
  try {
    const resp = await fetch(`${IMS}/ims/profile/v1`, { headers: { authorization: `Bearer ${token}` } });
    if (!resp.ok) return { error: { status: 401, code: 'not-accepted', message: `Adobe did not accept the sign-in (${resp.status}).` } };
    const p = await resp.json();
    if (!p.email) return { error: { status: 401, code: 'no-email', message: 'Adobe gave no email for this sign-in.' } };
    return { email: cleanEmail(p.email), name: p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') };
  } catch (e) {
    return { error: { status: 502, code: 'ims', message: 'Adobe could not be asked just now: try again in a moment.' } };
  }
}
