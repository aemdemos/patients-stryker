/*
 * Review backend (App Builder): what the actions share. Entries in the State store (the live
 * state, renewed on every change), the durable record in Files (one audit file per save batch,
 * the signing key), invitation tokens, CORS. See tools/review/backend-plan.md.
 *
 * An entry: key `p.<page>.<item>.<kind>` (page `*`, a group's choice: `g.<item>.<kind>`), the
 * parts base64url-encoded (keys allow letters, digits, - _ . only); value JSON
 * { v: <the tool's value, a JSON string>, by, at, rev, inv, role }. Invitations: `i.<id>`.
 * Threads: a comment or QA note opens one; every reply is its own entry, kind
 * `reply:<comment|note>:<id>`, value { text, action?: 'resolve', status?: { state, release } },
 * written once. Roles: `reviewer` (the customer) and `aoe` (the AOE team), from the invitation.
 */
import crypto from 'crypto';
import stateLib from '@adobe/aio-lib-state';
import filesLib from '@adobe/aio-lib-files';

export const TTL = stateLib.MAX_TTL;
export const SECRET_FILE = 'secrets/signing.json';
// what reviewers may save; `status:*` rows are the AOE team's (admin action only)
export const REVIEW_KINDS = ['variant', 'width', 'background', 'text', 'comment', 'reviewed', 'note'];
export const MAX_VALUE = 20000;
export const REPLY_KIND = /^reply:(comment|note):[A-Za-z0-9_-]{6,40}$/;
export const ROLES = ['reviewer', 'aoe'];
const ANSWER_STATES = ['progress', 'done', 'wontdo', 'open'];

/**
 * A reply's value, checked for the writer's role: reviewers may close a thread (`resolve`), only
 * the AOE team gives a status; a reply has text, an action or a status. → error text or null
 */
export function replyProblem(value, role) {
  let v;
  try {
    v = JSON.parse(value);
  } catch (e) {
    return 'a reply is JSON';
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return 'a reply is an object';
  if (v.text !== undefined && (typeof v.text !== 'string' || v.text.length > MAX_VALUE)) return 'text: a string';
  if (v.action !== undefined && v.action !== 'resolve') return 'action: resolve only';
  if (v.action === 'resolve' && role !== 'reviewer') return 'only reviewers close a thread';
  if (v.status !== undefined) {
    if (role !== 'aoe') return 'only the AOE team gives a status';
    if (!v.status || !ANSWER_STATES.includes(v.status.state)) return `status.state: ${ANSWER_STATES.join(', ')}`;
  }
  if (!v.text && !v.action && !v.status) return 'a reply needs text, an action or a status';
  return null;
}
export const MAX_CHANGES = 100;
export const TOOL = 'https://standardise-v3--stryker-com--strykerenterprise.aem.page/tools/review/index.html';
const ORIGINS = [
  /^https:\/\/[a-z0-9-]+--stryker-com--strykerenterprise\.aem\.page$/,
  /^https:\/\/preview-aemcoder\.adobe\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
];

const b64 = (s) => Buffer.from(String(s)).toString('base64url');
const unb64 = (s) => Buffer.from(s, 'base64url').toString();

export function entryKey(page, item, kind) {
  return page === '*' ? `g.${b64(item)}.${b64(kind)}` : `p.${b64(page)}.${b64(item)}.${b64(kind)}`;
}
export const pagePattern = (page) => `p.${b64(page)}.*`;
export const GROUP_PATTERN = 'g.*';

export function parseKey(key) {
  const parts = key.split('.');
  if (parts[0] === 'g' && parts.length === 3) return { page: '*', item: unb64(parts[1]), kind: unb64(parts[2]) };
  if (parts[0] === 'p' && parts.length === 4) return { page: unb64(parts[1]), item: unb64(parts[2]), kind: unb64(parts[3]) };
  return null;
}

/* ---------- invitation tokens: <payload>.<HMAC-SHA256>, both base64url ---------- */

export function sign(payload, secret) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

/** the payload of a token with a valid signature, else null (expiry and revocation: checkInvite) */
export function verify(token, secret) {
  if (typeof token !== 'string' || token.length > 2000 || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const want = crypto.createHmac('sha256', secret).update(body).digest();
  let got;
  try {
    got = Buffer.from(mac, 'base64url');
  } catch (e) {
    return null;
  }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    return JSON.parse(unb64(body));
  } catch (e) {
    return null;
  }
}

/** may an invitation's scope touch this page (`*` = group choices) */
export function inScope(scope, page) {
  if (page === '*') return scope.groups !== false;
  return (scope.paths || []).some((p) => page === p || page.startsWith(p.endsWith('/') ? p : `${p}/`) || p === '/');
}

/* ---------- storage ---------- */

export async function open() {
  const [state, files] = await Promise.all([stateLib.init(), filesLib.init()]);
  return { state, files };
}

/** the signing key (created once by the admin action's `setup`, never leaves the project) */
export async function secretOf(files, create = false) {
  try {
    const buf = await files.read(SECRET_FILE);
    return JSON.parse(buf.toString()).key;
  } catch (e) {
    if (!create) throw new Error('not set up: run the admin action with op "setup"');
    const key = crypto.randomBytes(32).toString('base64url');
    await files.write(SECRET_FILE, JSON.stringify({ key, created: new Date().toISOString() }));
    return key;
  }
}

/** an invitation token → its reviewer, or an error code */
export async function checkInvite({ state, files }, token) {
  if (!token) return { error: 'no-invite' };
  const payload = verify(token, await secretOf(files));
  if (!payload) return { error: 'bad-invite' };
  if (payload.exp && Date.parse(payload.exp) < Date.now()) return { error: 'expired' };
  const stored = await state.get(`i.${payload.id}`);
  const invite = stored && JSON.parse(stored.value);
  if (!invite || invite.revoked) return { error: 'revoked' };
  const role = ROLES.includes(invite.scope?.role) ? invite.scope.role : 'reviewer';
  return {
    invite: {
      id: payload.id, name: invite.name, scope: invite.scope, exp: invite.exp, role,
    },
  };
}

const decodeEntry = (key, stored) => {
  const where = parseKey(key);
  if (!where || !stored) return null;
  const e = JSON.parse(stored.value);
  return {
    ...where, value: e.v, reviewer: e.by, time: e.at, rev: e.rev, role: e.role || (e.by === 'AOE' ? 'aoe' : 'reviewer'),
  };
};

async function keysOf(state, match) {
  const keys = [];
  // (the library returns an async iterator of key batches)
  const it = state.list({ match });
  for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
  return keys;
}

async function readKeys(state, keys) {
  const out = [];
  for (let i = 0; i < keys.length; i += 25) {
    const batch = keys.slice(i, i + 25);
    // (a batch at a time: the store allows a limited number of parallel requests)
    const got = await Promise.all(batch.map((k) => state.get(k)));
    batch.forEach((k, j) => {
      const e = decodeEntry(k, got[j]);
      if (e) out.push(e);
    });
  }
  return out;
}

/** a page's entries and every group choice, as rows ({ page, item, kind, value, reviewer, time, rev }) */
export async function readPage(state, page) {
  const [own, groups] = await Promise.all([keysOf(state, pagePattern(page)), keysOf(state, GROUP_PATTERN)]);
  return readKeys(state, [...own, ...groups]);
}

/** every entry (the admin export) */
export async function readAll(state) {
  const [pages, groups] = await Promise.all([keysOf(state, 'p.*'), keysOf(state, GROUP_PATTERN)]);
  return readKeys(state, [...pages, ...groups]);
}

/**
 * Saves changes: each one only when the stored rev is the rev it started from (else a conflict:
 * someone else changed it). One audit file per batch (the durable record).
 */
export async function saveChanges({ state, files }, {
  page, changes, by, inv, role = 'reviewer',
}) {
  const at = new Date().toISOString();
  const results = [];
  const audit = [];
  for (const c of changes) {
    const p = c.page || page;
    const key = entryKey(p, c.item, c.kind);
    const stored = await state.get(key);
    const current = stored ? JSON.parse(stored.value) : null;
    const rev = current ? current.rev : 0;
    if ((c.rev ?? 0) !== rev) {
      results.push({
        page: p, item: c.item, kind: c.kind, ok: false, conflict: true, rev, by: current?.by, at: current?.at,
      });
    } else {
      const next = {
        v: c.value, by, at, rev: rev + 1, inv, role,
      };
      await state.put(key, JSON.stringify(next), { ttl: TTL });
      results.push({
        page: p, item: c.item, kind: c.kind, ok: true, rev: next.rev,
      });
      audit.push({
        page: p, item: c.item, kind: c.kind, before: current ? { v: current.v, by: current.by, at: current.at } : null, after: c.value, rev: next.rev,
      });
    }
  }
  if (audit.length) {
    const name = `audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}.json`;
    await files.write(name, JSON.stringify({
      at, by, inv, role, changes: audit,
    }));
  }
  return { at, results };
}

/* ---------- web responses ---------- */

export function cors(params) {
  const origin = params.__ow_headers?.origin || '';
  if (!ORIGINS.some((re) => re.test(origin))) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-review-invite',
    'access-control-max-age': '600',
    vary: 'origin',
  };
}

export const reply = (params, statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors(params) },
  body,
});
export const fail = (params, statusCode, code, message) => reply(params, statusCode, { error: { code, message } });
export const isPreflight = (params) => (params.__ow_method || '').toLowerCase() === 'options';
export const inviteOf = (params) => params.__ow_headers?.['x-review-invite'] || '';
