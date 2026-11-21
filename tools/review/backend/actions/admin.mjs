/*
 * Action `admin` (private: not a web action, only callable with the project's credential).
 * params.op:
 *   setup                                   creates the signing key once (Files, never returned)
 *   invite { name, paths: [...], days, groups, results, role }  → { id, token, link, results link, expires }
 *     (groups: choices for all blocks like this, default on; results: the results page, default off;
 *     role: reviewer (default) or aoe: the AOE team, answers threads with a status, results on)
 *   answer { rows: [{ page, item, thread: comment|note, text, status: { state, release, reason }, by, sendBack }] }
 *                                           AOE messages in threads (set-status.mjs), role aoe;
 *                                           sendBack: also the page status "waiting for the customer"
 *   revoke { id }                           the invitation stops working at once
 *   invites                                 every invitation (no tokens)
 *   export                                  every entry, as rows (summary, apply, tests)
 *   status { rows: [{ page, item, kind, value }] }  AOE statuses (kind status:<kind>), signed AOE
 *   import { rows: [{ page, item, kind, value, reviewer, time, inv?, role? }] }  rows from elsewhere (e.g. a CSV), as they were
 *   rekey { page, moves: [{ from, to }] }  entries moved to another item name (e.g. position → block key)
 *   audit { date, page }                    the audit files of one day (default today), optionally one page
 *   purge-invite { id }                    removes every entry one invitation wrote (any page)
 *   purge-by { by }                         removes every entry written under a test name (status test …)
 *   purge-test { page }                     removes a test page's entries (pages under /test/ only)
 *                                           and test group choices (items group:test|…)
 */
import crypto from 'crypto';
import {
  open, secretOf, sign, readAll, saveChanges, entryKey, pagePattern, parseKey, TTL, TOOL, replyProblem,
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
      const role = params.role === 'aoe' ? 'aoe' : 'reviewer';
      const scope = {
        paths, groups: params.groups !== false, results: params.results === true || role === 'aoe', role,
      };
      const invite = {
        name, scope, exp, created: new Date().toISOString(), revoked: false,
      };
      await state.put(`i.${id}`, JSON.stringify(invite), { ttl: Math.min(TTL, days * 86400 + 86400) });
      const token = sign({ id, exp }, await secretOf(files));
      const page = typeof params.page === 'string' ? params.page : '';
      const link = `${TOOL}?${new URLSearchParams({ ...(page ? { page } : {}), invite: token })}`;
      const results = scope.results ? `${TOOL.replace('index.html', 'results.html')}?invite=${encodeURIComponent(token)}` : undefined;
      return ok({
        id, name, scope, expires: exp, token, link, results,
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
          // (the newest row per entry wins)
          if (!current || current.at < r.time) {
            await state.put(key, JSON.stringify({
              v: r.value, by: r.reviewer, at: r.time, rev: (current?.rev || 0) + 1, inv: r.inv || 'import', role: r.role === 'aoe' ? 'aoe' : 'reviewer',
            }), { ttl: TTL });
            n += 1;
          }
        }
      }
      const at = new Date().toISOString();
      await files.write(`audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-import.json`, JSON.stringify({ at, by: 'import', rows }));
      return ok({ imported: n, of: rows.length });
    }
    if (op === 'answer') {
      const rows = Array.isArray(params.rows) ? params.rows : [];
      if (!rows.length) return bad('rows: [{ page, item, thread, text, status }]');
      const results = [];
      for (const r of rows) {
        const value = JSON.stringify({ text: r.text || undefined, status: r.status || undefined });
        const problem = !r.page || !r.item || !['comment', 'note'].includes(r.thread) ? 'page, item and thread (comment or note)' : replyProblem(value, 'aoe');
        if (problem) results.push({ ...r, ok: false, error: problem });
        else {
          const kind = `reply:${r.thread}:${crypto.randomBytes(9).toString('base64url')}`;
          const changes = [{ item: r.item, kind, value, rev: 0 }];
          if (r.sendBack) {
            const stored = await state.get(entryKey(r.page, 'page', 'state'));
            changes.push({
              item: 'page', kind: 'state', value: JSON.stringify('waiting-customer'), rev: stored ? JSON.parse(stored.value).rev : 0,
            });
          }
          const saved = await saveChanges(stores, {
            page: r.page, changes, by: String(r.by || 'AOE').slice(0, 80), inv: 'admin', role: 'aoe',
          });
          results.push({ page: r.page, item: r.item, kind, ok: saved.results.every((x) => x.ok) });
        }
      }
      return ok({ results });
    }
    if (op === 'rekey') {
      // entries saved under one item name moved to another, every kind (e.g. a position → its
      // block key); a newer entry already under the new name stays
      const page = String(params.page || '');
      const moves = Array.isArray(params.moves) ? params.moves : [];
      if (!page.startsWith('/') || !moves.length) return bad('page and moves: [{ from, to }]');
      const keys = [];
      const it = state.list({ match: pagePattern(page) });
      for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
      const done = [];
      for (const key of keys) {
        const e = parseKey(key);
        const move = moves.find((m) => m.from === e?.item);
        if (move && move.to && move.to !== move.from) {
          const value = JSON.parse((await state.get(key)).value);
          const target = entryKey(page, move.to, e.kind);
          const there = await state.get(target);
          if (!there || JSON.parse(there.value).at < value.at) await state.put(target, JSON.stringify(value), { ttl: TTL });
          await state.delete(key);
          done.push({ from: e.item, to: move.to, kind: e.kind });
        }
      }
      const at = new Date().toISOString();
      await files.write(`audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-rekey.json`, JSON.stringify({
        at, by: 'rekey', page, moved: done,
      }));
      return ok({ moved: done });
    }
    if (op === 'audit') {
      // the audit files of one day (UTC date, default today), oldest first; optionally one page
      const day = /^\d{4}-\d{2}-\d{2}$/.test(params.date || '') ? params.date : new Date().toISOString().slice(0, 10);
      const list = (await files.list(`audit/${day}/`)).map((f) => f.name).sort();
      const out = [];
      for (const name of list) {
        const batch = JSON.parse((await files.read(name)).toString());
        if (!params.page || (batch.changes || batch.rows || []).some((c) => c.page === params.page)) out.push({ file: name, ...batch });
      }
      return ok({ day, batches: out });
    }
    if (op === 'purge-invite') {
      // every entry written with one invitation (e.g. a test reviewer's), on any page
      if (!params.id) return bad('id of the invitation');
      let deleted = 0;
      const gone = new Set();
      for (const match of ['p.*', 'g.*']) {
        const it = state.list({ match });
        for (let r = await it.next(); !r.done; r = await it.next()) {
          const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
          const mine = r.value.keys.filter((k, j) => got[j] && JSON.parse(got[j].value).inv === params.id);
          mine.forEach((k) => {
            const e = parseKey(k);
            gone.add(`${e.page}|${e.item}|${e.kind}`);
          });
          await Promise.all(mine.map((k) => state.delete(k)));
          deleted += mine.length;
        }
      }
      // and the AOE statuses and thread replies on those entries
      let statuses = 0;
      const it = state.list({ match: 'p.*' });
      for (let r = await it.next(); !r.done; r = await it.next()) {
        const on = r.value.keys.filter((k) => {
          const e = parseKey(k);
          if (!e) return false;
          // AOE statuses and every reply in the threads those entries opened
          if (e.kind.startsWith('status:')) return gone.has(`${e.page}|${e.item}|${e.kind.slice(7)}`);
          if (e.kind.startsWith('reply:')) return gone.has(`${e.page}|${e.item}|${e.kind.split(':')[1]}`);
          return false;
        });
        await Promise.all(on.map((k) => state.delete(k)));
        statuses += on.length;
      }
      return ok({ deleted, statuses, invite: params.id });
    }
    if (op === 'purge-by') {
      // every entry written under a test name (written by the admin action, so no invitation of
      // their own): names that start with one of the tests' prefixes only
      const by = String(params.by || '');
      if (!/^(status test|tool test|backend test) /.test(by)) return bad('test writer names only (status test …, tool test …, backend test …)');
      let deleted = 0;
      const it = state.list({ match: 'p.*' });
      for (let r = await it.next(); !r.done; r = await it.next()) {
        const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
        const theirs = r.value.keys.filter((k, j) => got[j] && JSON.parse(got[j].value).by === by);
        await Promise.all(theirs.map((k) => state.delete(k)));
        deleted += theirs.length;
      }
      return ok({ deleted, by });
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
