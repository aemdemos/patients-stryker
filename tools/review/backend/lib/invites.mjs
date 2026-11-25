/*
 * Invitations: created, listed and revoked by the admin action (the developers) and by the web
 * action `invites` (the AOE team, in its own space). An invitation is a State entry i.<id>
 * { name, scope: { paths, groups, results, role, space? }, exp, created, createdBy?, revoked,
 * revokedAt?, revokedBy? }; its token (<payload>.<HMAC>, core.mjs sign) is given once, at
 * creation, and never stored or listed.
 */
import crypto from 'crypto';
import {
  secretOf, sign, SPACES,
} from './core.mjs';

const HOST = /^[a-z0-9-]+--stryker-com--strykerenterprise\.aem\.page$/;

/** the space's tool, on another preview host when given (a branch before its merge) */
export function toolOf(space, host) {
  const tool = SPACES[space]?.tool || SPACES.std.tool;
  return typeof host === 'string' && HOST.test(host) ? tool.replace(/^https:\/\/[^/]+/, `https://${host}`) : tool;
}

/** what is wrong with an invitation's fields, or null */
export function inviteProblem({ name, paths }) {
  if (!String(name || '').trim()) return 'a name is needed';
  if (!Array.isArray(paths) || !paths.length || paths.some((p) => typeof p !== 'string' || !p.startsWith('/') || p.length > 300)) {
    return 'one or more page paths are needed (e.g. / or /us/en/joint-replacement)';
  }
  return null;
}

/**
 * a new invitation → { id, name, scope, expires, token, link, results }
 * (role reviewer or aoe; results: the results page, always for the AOE team; groups default on)
 */
export async function createInvite({ state, files }, {
  space = 'std', name, paths, days, role, results, groups, page, host, createdBy,
}) {
  const id = crypto.randomBytes(9).toString('base64url');
  const d = Math.min(Math.max(Number(days) || 30, 1), 365);
  const exp = new Date(Date.now() + d * 86400000).toISOString();
  const r = role === 'aoe' ? 'aoe' : 'reviewer';
  const scope = {
    paths, groups: groups !== false, results: results === true || r === 'aoe', role: r, ...(space === 'std' ? {} : { space }),
  };
  const invite = {
    name: String(name).trim().slice(0, 80), scope, exp, created: new Date().toISOString(), revoked: false, ...(createdBy ? { createdBy } : {}),
  };
  await state.put(`i.${id}`, JSON.stringify(invite));
  const token = sign({ id, exp }, await secretOf(files));
  const tool = toolOf(space, host);
  // (made on Stage, the test workspace: the link opens the tool on Stage's backend, whatever host)
  const stage = /-stage$/.test(process.env.__OW_NAMESPACE || '');
  const backend = stage ? { backend: 'stage' } : {};
  const link = `${tool}?${new URLSearchParams({ ...(typeof page === 'string' && page ? { page } : {}), ...backend, invite: token })}`;
  const summary = `${tool.replace('index.html', 'summary.html')}?${new URLSearchParams({ ...backend, invite: token })}`;
  return {
    id,
    name: invite.name,
    scope,
    expires: exp,
    token,
    link,
    // the summary page, for every invitation since 25 Nov 2026 (`results`: the same, older callers)
    summary,
    results: summary,
  };
}

/** every invitation (no tokens), oldest first, each with its space */
export async function listInvites(state) {
  const out = [];
  const it = state.list({ match: 'i.*' });
  for (let r = await it.next(); !r.done; r = await it.next()) {
    const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
    got.forEach((g, i) => {
      if (g) {
        const inv = JSON.parse(g.value);
        out.push({ id: r.value.keys[i].slice(2), ...inv, space: inv.scope?.space || 'std' });
      }
    });
  }
  return out.sort((a, b) => (a.created < b.created ? -1 : 1));
}

/** an invitation stops working at once (kept, marked revoked) → the invitation, or null */
export async function revokeInvite(state, id, revokedBy) {
  const stored = await state.get(`i.${id}`);
  if (!stored) return null;
  const before = JSON.parse(stored.value);
  if (before.revoked) return before;
  const invite = {
    ...before, revoked: true, revokedAt: new Date().toISOString(), ...(revokedBy ? { revokedBy } : {}),
  };
  await state.put(`i.${id}`, JSON.stringify(invite));
  return invite;
}
