/*
 * Action `admin` (private: not a web action, only callable with the project's credential).
 * params.op:
 *   setup                                   creates the signing key once (Files, never returned) and,
 *                                           with the database's credential, the page index
 *   invite { name, paths: [...], days, groups, results, role }  → { id, token, link, results link, expires }
 *     (groups: choices for all blocks like this, default on; results: the results page, default off;
 *     role: reviewer (default) or aoe: the AOE team, answers threads with a status, results on)
 *   answer { rows: [{ page, item, thread: comment|note, text, status: { state, release, reason }, by, sendBack }] }
 *                                           AOE messages in threads (set-status.mjs), role aoe;
 *                                           sendBack: also the page status "waiting for the customer"
 *   revoke { id }                           the invitation stops working at once
 *   invites                                 every invitation (no tokens)
 *   forget-test-invites                     removes revoked test invitations (tool test …, zz-test-…, backend test …)
 *   schedule { cron, enabled }              the capture action every 15 minutes (cron), the live
 *                                           warm-up, the daily backup (or all off)
 *   backup                                  every key of both reviews to Files (backups/<day>), dated,
 *                                           kept
 *   backups                                 the days with a backup
 *   migrate-from-state { apply }            once: every key of the old State store into the database
 *                                           (apply false: only the comparison)
 *   files-list / files-presign { names }    moving: the files to copy, short-lived read links
 *   files-pull { items: [{ name, url }] }   moving: each link fetched and written under its name
 *   empty-moved { apply }                   a workspace the review has left (REVIEW_MOVED_TO set
 *                                           only): every document and file deleted
 *   empty-state { apply }                   the old State store: a final copy to Files
 *                                           (backups/state-final/), then every key deleted
 *   db-check                                the App Builder Database: credential there, connect, write,
 *                                           read, 200 at once (DATABASE.md)
 *   db-stats                                page documents per space, invitations (empty pages removed)
 *   restore-check { day }                   a backup against the store: keys missing now, changed since
 *   restore { day, only: [key prefixes] }   the keys of a backup missing now put back (never over one)
 *   capture-state                           the capture's record (first seen, sources to correct, runs)
 *   changes-scope { pages? }                the change check's pages (set them: [{ page, source, template }])
 *   changes-page { page } / changes-site    a page's change record / the check's runs
 *   schedule { only: ['check'], enabled }    the change check's own schedule (on or off) alone
 *   (invitations: lib/invites.mjs, shared with the AOE team's web action invites)
 *   export                                  every entry, as rows (summary, apply, tests)
 *   status { rows: [{ page, item, kind, value }] }  AOE statuses (kind status:<kind>), signed AOE
 *   import { rows: [{ page, item, kind, value, reviewer, time, inv?, role? }] }  rows from elsewhere (e.g. a CSV), as they were
 *   rekey { page, moves: [{ from, to }] }  entries moved to another item name (e.g. position → block key)
 *   audit { date, page }                    the audit files of one day (default today), optionally one page
 *   purge-invite { id }                    removes every entry one invitation wrote (any page), and its pictures
 *   purge-by { by }                         removes every entry written under a test name (status test …)
 *   shot-requests                           the open requests for new source shots (pending, failed)
 *   shot-history { page }                   a page's source shots (every version, with anchors)
 *   shot-add { items: [{ page, version }] } versions into the history (never replaced; closes the
 *                                           request a version names in version.request)
 *   shot-fail { page, reason }              a request that could not be done (shown in the tool)
 *   purge-test { page }                     removes a test page's entries (pages under /test/ only)
 *                                           and test group choices (items group:test|…)
 */
import crypto from 'crypto';
import {
  open, secretOf, readAll, saveChanges, entryKey, pagePattern, groupPattern, parseKey, replyProblem, SPACES,
  personKey,
} from '../lib/core.mjs';
import { createInvite, listInvites, revokeInvite } from '../lib/invites.mjs';
import { readScopeCopy, writeScopeCopy } from '../lib/scope.mjs';
import {
  listPeople, putPerson, removePerson, personProblem, issueSession, getPerson, cleanEmail,
} from '../lib/people.mjs';
import { schedule } from '../lib/runtime.mjs';
import { readCaptureState, tileFile } from '../lib/capture-state.mjs';
import {
  readScope, readSite, readPageState, writeJson, scopeFile, pageFile as changesPageFile, siteFile as changesSiteFile,
} from '../lib/changes.mjs';
import { dropSummary, rebuildSummary } from '../lib/summary.mjs';
import {
  backup, listBackups, restoreCheck, restore,
} from '../lib/backup.mjs';
import {
  dbCheck, dbConsistency, dbListTest, dbListChangeTest,
} from '../lib/db.mjs';
import { migrateFromState, emptyState } from '../lib/migrate.mjs';
import {
  filesList, filesPresign, filesPull, emptyMoved,
} from '../lib/move.mjs';

// operations that change entries: the review's summary is built again after them
const WRITES = ['migrate-from-state', 'status', 'import', 'answer', 'rekey', 'purge-invite', 'purge-by', 'purge-test', 'restore'];
import {
  listRequests, readHistory, addVersions, failRequest, historyFile, requestFile,
} from '../lib/shots.mjs';
import { listAll } from '../lib/listall.mjs';

const ok = (body) => ({ body });
const bad = (message) => ({ body: { error: { code: 'bad-request', message } } });

export async function main(params) {
  const out = await run(params);
  // (built again now, so no reader waits for it)
  if (WRITES.includes(params.op)) {
    const stores = await open(params);
    const space = SPACES[params.space] ? params.space : 'std';
    await rebuildSummary(stores, space).catch(() => dropSummary(stores.files, space));
  }
  return out;
}

async function run(params) {
  const stores = await open(params);
  const { state, files } = stores;
  const op = params.op || '';
  // the review this call works in (std when none is named); its keys' prefix and audit folder
  const space = SPACES[params.space] ? params.space : 'std';
  const pre = space === 'std' ? '' : `${space}.`;
  const auditDir = space === 'std' ? 'audit' : `${space}/audit`;
  try {
    if (op === 'setup') {
      // a workspace's first step: the signing key; with the database's credential, its page index
      await secretOf(files, true);
      if (!stores.client) return ok({ ready: true, database: 'no credential yet (DATABASE.md, 1.)' });
      await stores.client.collection('pages').createIndex({ space: 1 });
      return ok({ ready: true, database: 'ready (index on space)' });
    }
    if (op === 'invite') {
      const name = String(params.name || '').trim().slice(0, 80);
      const paths = (Array.isArray(params.paths) ? params.paths : [params.paths]).filter((x) => typeof x === 'string' && x.startsWith('/'));
      if (!name || !paths.length) return bad('name and paths (one or more path prefixes, e.g. /us/en/foot-and-ankle) are needed');
      return ok(await createInvite(stores, {
        space,
        name,
        paths,
        days: params.days,
        role: params.role,
        results: params.results,
        groups: params.groups,
        page: params.page,
        host: params.host,
        createdBy: { name: 'admin' },
      }));
    }
    if (op === 'revoke') {
      const revoked = await revokeInvite(state, params.id, { name: 'admin' });
      if (!revoked) return bad('no such invitation');
      return ok({ revoked: params.id });
    }
    if (op === 'schedule') {
      return ok({
        steps: await schedule({
          cron: params.cron, enabled: params.enabled !== false, space: params.space || 'main', only: Array.isArray(params.only) ? params.only : null,
        }),
      });
    }
    if (op === 'capture-state') return ok(await readCaptureState(files, space));
    // the daily source change check (lib/changes.mjs)
    if (op === 'scope-copy') {
      // the backend's copy of the scope table (lib/scope.mjs): written with data, else read
      if (Array.isArray(params.data)) return ok(await writeScopeCopy(files, space, params.data, { name: 'developers (admin)' }));
      const kept = await readScopeCopy(files, space);
      return ok(kept ? { at: kept.at, by: kept.by, hash: kept.hash, rows: kept.data.length } : { none: true });
    }
    if (op === 'changes-scope') {
      if (Array.isArray(params.pages)) {
        const pages = params.pages.filter((p) => p && typeof p.page === 'string' && /^https:\/\/www\.stryker\.com\//.test(p.source || ''))
          .map((p) => ({ page: p.page, source: p.source, template: p.template || '' }));
        await writeJson(files, scopeFile(space === 'std' ? 'main' : space), { at: new Date().toISOString(), pages });
      }
      return ok(await readScope(files, space === 'std' ? 'main' : space));
    }
    if (op === 'changes-page') return ok(await readPageState(files, space === 'std' ? 'main' : space, String(params.page || '')));
    if (op === 'changes-site') return ok(await readSite(files, space === 'std' ? 'main' : space));
    if (op === 'backup') {
      return ok(await backup(stores));
    }
    if (op === 'migrate-from-state') return ok(await migrateFromState(state, { apply: params.apply === true }));
    if (op === 'empty-state') return ok(await emptyState(files, { apply: params.apply === true }));
    // moving the review to another workspace (lib/move.mjs, backend/move.mjs)
    if (op === 'files-list') return ok({ files: await filesList(files) });
    if (op === 'files-presign') return ok({ links: await filesPresign(files, [].concat(params.names || [])) });
    if (op === 'files-pull') return ok(await filesPull(files, [].concat(params.items || [])));
    if (op === 'empty-moved') return ok(await emptyMoved(params, stores, { apply: params.apply === true }));
    if (op === 'db-check') return ok(await dbCheck(params));
    if (op === 'db-stats') {
      // the documents per space and invitations; pages left without entries removed
      const pages = state.client.collection('pages');
      const emptied = await pages.deleteMany({ e: {} });
      const docs = await pages.find({}, { projection: { space: 1 } }).toArray();
      const bySpace = {};
      docs.forEach((d) => { bySpace[d.space] = (bySpace[d.space] || 0) + 1; });
      return ok({ pages: bySpace, invites: await state.client.collection('invites').countDocuments({}), emptyRemoved: emptied?.deletedCount ?? emptied });
    }
    if (op === 'db-listchange') return ok(await dbListChangeTest(params, Number(params.n) || 150));
    if (op === 'db-listtest') return ok(await dbListTest(params, Number(params.n) || 40));
    if (op === 'db-consistency') return ok(await dbConsistency(params, Number(params.n) || 30));
    if (op === 'backups') return ok({ days: await listBackups(files) });
    if (op === 'restore-check') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.day || '')) return bad('day: YYYY-MM-DD (admin backups lists them)');
      return ok(await restoreCheck(stores, params.day));
    }
    if (op === 'restore') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.day || '')) return bad('day: YYYY-MM-DD');
      return ok(await restore(stores, params.day, { only: Array.isArray(params.only) ? params.only : null }));
    }
    if (op === 'rebuild-summary') {
      const s = await rebuildSummary(stores, space);
      return ok({ space, built: s.built, pages: Object.keys(s.pages).length });
    }
    if (op === 'forget-test-invites') {
      // revoked test invitations (names "tool test …", "zz-test-…") out of the lists for good;
      // never anyone else's
      const test = (await listInvites(state)).filter((i) => i.revoked && /^(tool test |zz-test-|backend test( \(|$))/.test(i.name || ''));
      await Promise.all(test.map((i) => state.delete(`i.${i.id}`)));
      return ok({ forgotten: test.length });
    }
    // the people of a review (the DA sign-in, branch da-app-v3): list, add or change, remove
    if (op === 'people') return ok({ space, people: await listPeople(state, space) });
    if (op === 'person-put') {
      const fields = {
        email: params.email, name: params.name, role: params.role, paths: params.paths,
      };
      const problem = personProblem(fields);
      if (problem) return bad(problem);
      return ok({ person: await putPerson(state, space, fields, { name: 'developers (admin)' }) });
    }
    if (op === 'person-remove') {
      const person = await removePerson(state, space, cleanEmail(params.email), { name: 'developers (admin)' });
      return person ? ok({ person }) : bad('no such person');
    }
    if (op === 'person-forget') {
      // a test person out of the list for good (emails @example.com only)
      const email = cleanEmail(params.email);
      if (!/@example\.com$/.test(email)) return bad('only test people (@example.com) are forgotten');
      await state.delete(personKey(space, email));
      return ok({ forgotten: email });
    }
    if (op === 'test-session') {
      // a review session without the Adobe sign-in, for the tests: on Stage only, for a person
      // of the list (real Adobe tokens can't be made in a test)
      if (!/-stage$/.test(process.env.__OW_NAMESPACE || '')) return bad('test sessions are made on Stage only');
      const person = await getPerson(state, space, params.email);
      if (!person || person.removed) return bad('no such person (add them first: person-put)');
      return ok({ ...(await issueSession(files, space, person.email)), person });
    }
    if (op === 'invites') {
      // (the invitations of every space, each with its space)
      const all = await listInvites(state);
      return ok({ invites: params.space ? all.filter((i) => i.space === space) : all });
    }
    if (op === 'export') return ok({ at: new Date().toISOString(), space, rows: await readAll(state, space) });
    if (op === 'status') {
      const rows = Array.isArray(params.rows) ? params.rows : [];
      if (!rows.length || rows.some((r) => !String(r.kind || '').startsWith('status:') || !r.page || !r.item)) return bad('rows of kind status:<kind> with page and item');
      // a status has no rev check: the newest from the AOE team wins
      const changes = await Promise.all(rows.map(async (r) => {
        const stored = await state.get(entryKey(r.page, r.item, r.kind, space));
        return {
          page: r.page, item: r.item, kind: r.kind, value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value), rev: stored ? JSON.parse(stored.value).rev : 0,
        };
      }));
      return ok(await saveChanges(stores, {
        page: rows[0].page, changes, by: 'AOE', inv: 'admin', space,
      }));
    }
    if (op === 'import') {
      const rows = Array.isArray(params.rows) ? params.rows : [];
      let n = 0;
      for (const r of rows) {
        if (r.page && r.item && r.kind) {
          const key = entryKey(r.page, r.item, r.kind, space);
          const stored = await state.get(key);
          const current = stored ? JSON.parse(stored.value) : null;
          // (the newest row per entry wins)
          if (!current || current.at < r.time) {
            await state.put(key, JSON.stringify({
              v: r.value, by: r.reviewer, at: r.time, rev: (current?.rev || 0) + 1, inv: r.inv || 'import', role: r.role === 'aoe' ? 'aoe' : 'reviewer',
            }));
            n += 1;
          }
        }
      }
      const at = new Date().toISOString();
      await files.write(`${auditDir}/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-import.json`, JSON.stringify({ at, by: 'import', rows }));
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
            const stored = await state.get(entryKey(r.page, 'page', 'state', space));
            changes.push({
              item: 'page', kind: 'state', value: JSON.stringify('waiting-customer'), rev: stored ? JSON.parse(stored.value).rev : 0,
            });
          }
          const saved = await saveChanges(stores, {
            page: r.page, changes, by: String(r.by || 'AOE').slice(0, 80), inv: 'admin', role: 'aoe', space,
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
      const it = state.list({ match: pagePattern(page, space) });
      for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
      const done = [];
      for (const key of keys) {
        const e = parseKey(key);
        const move = moves.find((m) => m.from === e?.item);
        if (move && move.to && move.to !== move.from) {
          const value = JSON.parse((await state.get(key)).value);
          const target = entryKey(page, move.to, e.kind, space);
          const there = await state.get(target);
          if (!there || JSON.parse(there.value).at < value.at) await state.put(target, JSON.stringify(value));
          await state.delete(key);
          done.push({ from: e.item, to: move.to, kind: e.kind });
        }
      }
      const at = new Date().toISOString();
      await files.write(`${auditDir}/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-rekey.json`, JSON.stringify({
        at, by: 'rekey', page, moved: done,
      }));
      return ok({ moved: done });
    }
    if (op === 'audit') {
      // the audit files of one day (UTC date, default today), oldest first; optionally one page
      const day = /^\d{4}-\d{2}-\d{2}$/.test(params.date || '') ? params.date : new Date().toISOString().slice(0, 10);
      const list = (await listAll(files, `${auditDir}/${day}/`)).map((f) => f.name).sort();
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
      for (const match of [`${pre}p.*`, groupPattern(space)]) {
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
      const it = state.list({ match: `${pre}p.*` });
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
      // and the pictures that invitation uploaded (images action)
      let images = 0;
      const metas = (await listAll(files, `${space}/images/`)).filter((f) => f.name.endsWith('.json'));
      for (const f of metas) {
        const meta = await files.read(f.name).then((x) => JSON.parse(x.toString())).catch(() => null);
        if (meta?.inv === params.id) {
          await files.delete(`${space}/images/${meta.id}.${meta.ext}`).catch(() => null);
          await files.delete(f.name);
          images += 1;
        }
      }
      return ok({
        deleted, statuses, images, invite: params.id,
      });
    }
    if (op === 'purge-by') {
      // every entry written under a test name (written by the admin action, so no invitation of
      // their own): names that start with one of the tests' prefixes only
      const by = String(params.by || '');
      if (!/^(status test|tool test|backend test) /.test(by)) return bad('test writer names only (status test …, tool test …, backend test …)');
      let deleted = 0;
      const it = state.list({ match: `${pre}p.*` });
      for (let r = await it.next(); !r.done; r = await it.next()) {
        const got = await Promise.all(r.value.keys.map((k) => state.get(k)));
        const theirs = r.value.keys.filter((k, j) => got[j] && JSON.parse(got[j].value).by === by);
        await Promise.all(theirs.map((k) => state.delete(k)));
        deleted += theirs.length;
      }
      return ok({ deleted, by });
    }
    if (op === 'shot-requests') return ok({ space, requests: await listRequests(files, space) });
    // the first shots, kept in Document Authoring (served by the branch preview only), copied into
    // Files so the published site shows them too (the DA sign-in, 27 Nov 2026): upload links for a
    // version's tiles, then the version marked as stored in Files once every tile is there (the
    // tiles' SHA-256 checked against the history before the upload, by the uploader)
    if (op === 'tiles-upload' || op === 'tiles-mark') {
      const page = String(params.page || '');
      const h = page.startsWith('/') ? await readHistory(files, space, page) : null;
      const v = h?.versions.find((x) => x.id === params.id);
      if (!v) return bad('no such version of the page');
      if (v.store === 'files') return ok({ already: true });
      const names = Object.entries(v.widths || {}).flatMap(([vp, w]) => (w.tiles || []).map((t) => ({ vp, file: t.file })));
      if (op === 'tiles-upload') {
        return ok({
          links: await Promise.all(names.map(async ({ vp, file }) => ({
            vp, file, url: await files.generatePresignURL(tileFile(space, page, v.id, vp, file), { expiryInSeconds: 900, permissions: 'w' }),
          }))),
        });
      }
      const missing = [];
      await Promise.all(names.map(async ({ vp, file }) => {
        const props = await files.getProperties(tileFile(space, page, v.id, vp, file)).catch(() => null);
        if (!props) missing.push(`${vp}/${file}`);
      }));
      if (missing.length) return bad(`not in Files yet: ${missing.join(', ')}`);
      const at = new Date().toISOString();
      const versions = h.versions.map((x) => (x.id === v.id ? { ...x, store: 'files', storedAt: at } : x));
      await files.write(historyFile(space, page), JSON.stringify({ page, versions }));
      return ok({ marked: true, tiles: names.length });
    }
    if (op === 'shot-history') {
      if (!String(params.page || '').startsWith('/')) return bad('page');
      return ok(await readHistory(files, space, params.page));
    }
    if (op === 'shot-add') {
      const items = Array.isArray(params.items) ? params.items : [];
      if (!items.length || items.length > 100) return bad('items: 1 to 100 { page, version }');
      return ok(await addVersions(files, space, items));
    }
    if (op === 'shot-fail') {
      if (!String(params.page || '').startsWith('/')) return bad('page');
      const failed = await failRequest(files, space, params.page, params.reason);
      return failed ? ok({ request: failed }) : bad('no open request for this page');
    }
    if (op === 'purge-test') {
      const page = String(params.page || '');
      if (!page.startsWith('/test/')) return bad('only pages under /test/');
      const r = await state.deleteAll({ match: pagePattern(page, space) });
      // and test group choices (items `group:test|…`), which every page would show
      let groups = 0;
      const it = state.list({ match: groupPattern(space) });
      for (let g = await it.next(); !g.done; g = await it.next()) {
        const test = g.value.keys.filter((k) => parseKey(k)?.item.startsWith('group:test|'));
        await Promise.all(test.map((k) => state.delete(k)));
        groups += test.length;
      }
      // and its source shots and request (test pages only: real pages' shots are never removed)
      const shots = [historyFile(space, page), requestFile(space, page)];
      await Promise.all(shots.map((f) => files.delete(f).catch(() => null)));
      // and the tiles the backend took of it
      const tiles = await files.list(`${space === 'std' ? '' : `${space}/`}shot-tiles/${Buffer.from(page).toString('base64url')}/`);
      await Promise.all(tiles.map((f) => files.delete(f.name).catch(() => null)));
      // and its record in the daily change check, and its place in the check's lists
      const csp = space === 'std' ? 'main' : space;
      await files.delete(changesPageFile(csp, page)).catch(() => null);
      const site = await readSite(files, csp);
      if (site.sources && ['redirects', 'unreachable'].some((k) => site.sources[k]?.[page])) {
        ['redirects', 'unreachable'].forEach((k) => { if (site.sources[k]) delete site.sources[k][page]; });
        await writeJson(files, changesSiteFile(csp), site);
      }
      return ok({ deleted: r.keys, groups, page });
    }
    return bad(`unknown op "${op}"`);
  } catch (e) {
    return { body: { error: { code: 'server', message: String(e.message || e).slice(0, 200) } } };
  }
}
