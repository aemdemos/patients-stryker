/*
 * Action `admin` (private: not a web action, only callable with the project's credential).
 * params.op:
 *   setup                                   creates the signing key once (Files, never returned)
 *   invite { name, paths: [...], days, groups }  → { id, token, link, expires }
 *   revoke { id }                           the invitation stops working at once
 *   invites                                 every invitation (no tokens)
 *   export                                  every entry, as rows (summary, apply, results)
 *   status { rows: [{ page, item, kind, value }] }  AOE statuses (kind status:<kind>), signed AOE
 *   import { rows: [{ page, item, kind, value, reviewer, time }] }  rows from the sheet, as they were
 *   purge-invite { id }                    removes every entry one invitation wrote (any page)
 *   purge-test { page }                     removes a test page's entries (pages under /test/ only)
 *                                           and test group choices (items group:test|…)
 */
import crypto from 'crypto';
import {
  open, secretOf, sign, readAll, saveChanges, entryKey, pagePattern, parseKey, TTL, TOOL,
} from '../lib/core.mjs';

const ok = (body) => ({ body });
const bad = (message) => ({ body: { error: { code: 'bad-request', message } } });

async function invites(state) {
  const out = [];
  const it = state.list({ match: 'i.*' });
  for (let r = await it.next(); !r.done; r = await it.next()) {
    const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
    got.forEach((g, i) => {
      if (g) out.push({ id: r.value.keys[i].slice(2), ...JSON.parse(g.value) });
    });
  }
  return out.sort((a, b) => (a.created < b.created ? -1 : 1));
}

export async function main(params) {
  const stores = await open();
  const { state, files } = stores;
  const op = params.op || '';
  try {
    if (op === 'setup') {
      await secretOf(files, true);
      return ok({ ready: true });
    }
    if (op === 'invite') {
      const name = String(params.name || '').trim().slice(0, 80);
      const paths = (Array.isArray(params.paths) ? params.paths : [params.paths]).filter((p) => typeof p === 'string' && p.startsWith('/'));
      const days = Math.min(Math.max(Number(params.days) || 30, 1), 365);
      if (!name || !paths.length) return bad('name and paths (one or more path prefixes, e.g. /us/en/foot-and-ankle) are needed');
      const id = crypto.randomBytes(9).toString('base64url');
      const exp = new Date(Date.now() + days * 86400000).toISOString();
      const scope = { paths, groups: params.groups !== false };
      const invite = {
        name, scope, exp, created: new Date().toISOString(), revoked: false,
      };
      await state.put(`i.${id}`, JSON.stringify(invite), { ttl: Math.min(TTL, days * 86400 + 86400) });
      const token = sign({ id, exp }, await secretOf(files));
      const page = typeof params.page === 'string' ? params.page : '';
      const link = `${TOOL}?${new URLSearchParams({ ...(page ? { page } : {}), invite: token })}`;
      return ok({
        id, name, scope, expires: exp, token, link,
      });
    }
    if (op === 'revoke') {
      const stored = await state.get(`i.${params.id}`);
      if (!stored) return bad('no such invitation');
      const invite = { ...JSON.parse(stored.value), revoked: true, revokedAt: new Date().toISOString() };
      await state.put(`i.${params.id}`, JSON.stringify(invite), { ttl: TTL });
      return ok({ revoked: params.id });
    }
    if (op === 'invites') return ok({ invites: await invites(state) });
    if (op === 'export') return ok({ at: new Date().toISOString(), rows: await readAll(state) });
    if (op === 'status') {
      const rows = Array.isArray(params.rows) ? params.rows : [];
      if (!rows.length || rows.some((r) => !String(r.kind || '').startsWith('status:') || !r.page || !r.item)) return bad('rows of kind status:<kind> with page and item');
      // a status has no rev check: the newest from the AOE team wins
      const changes = await Promise.all(rows.map(async (r) => {
        const stored = await state.get(entryKey(r.page, r.item, r.kind));
        return {
          page: r.page, item: r.item, kind: r.kind, value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value), rev: stored ? JSON.parse(stored.value).rev : 0,
        };
      }));
      return ok(await saveChanges(stores, {
        page: rows[0].page, changes, by: 'AOE', inv: 'admin',
      }));
    }
    if (op === 'import') {
      const rows = Array.isArray(params.rows) ? params.rows : [];
      let n = 0;
      for (const r of rows) {
        if (r.page && r.item && r.kind) {
          const key = entryKey(r.page, r.item, r.kind);
          const stored = await state.get(key);
          const current = stored ? JSON.parse(stored.value) : null;
          // (the newest row per entry wins, as in the sheet)
          if (!current || current.at < r.time) {
            await state.put(key, JSON.stringify({
              v: r.value, by: r.reviewer, at: r.time, rev: (current?.rev || 0) + 1, inv: 'sheet',
            }), { ttl: TTL });
            n += 1;
          }
        }
      }
      const at = new Date().toISOString();
      await files.write(`audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-import.json`, JSON.stringify({ at, by: 'import', rows }));
      return ok({ imported: n, of: rows.length });
    }
    if (op === 'purge-invite') {
      // every entry written with one invitation (e.g. a test reviewer's), on any page
      if (!params.id) return bad('id of the invitation');
      let deleted = 0;
      for (const match of ['p.*', 'g.*']) {
        const it = state.list({ match });
        for (let r = await it.next(); !r.done; r = await it.next()) {
          const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
          const mine = r.value.keys.filter((k, j) => got[j] && JSON.parse(got[j].value).inv === params.id);
          await Promise.all(mine.map((k) => state.delete(k)));
          deleted += mine.length;
        }
      }
      return ok({ deleted, invite: params.id });
    }
    if (op === 'purge-test') {
      const page = String(params.page || '');
      if (!page.startsWith('/test/')) return bad('only pages under /test/');
      const r = await state.deleteAll({ match: pagePattern(page) });
      // and test group choices (items `group:test|…`), which every page would show
      let groups = 0;
      const it = state.list({ match: 'g.*' });
      for (let g = await it.next(); !g.done; g = await it.next()) {
        const test = g.value.keys.filter((k) => parseKey(k)?.item.startsWith('group:test|'));
        await Promise.all(test.map((k) => state.delete(k)));
        groups += test.length;
      }
      return ok({ deleted: r.keys, groups, page });
    }
    return bad(`unknown op "${op}"`);
  } catch (e) {
    return { body: { error: { code: 'server', message: String(e.message || e).slice(0, 200) } } };
  }
}
