/*
 * The move to App Builder Database, step 1 (DATABASE.md): the database as a second copy of State.
 * - Every write the backend makes to State (put, delete, deleteAll), once it succeeded there, is
 *   made in the database too (collection `kv`, one document per State key: _id = the key, value =
 *   State's value as it is, and the key's parts for later queries). State stays what everything
 *   reads; a database write that fails is recorded (Files mirror/failures/<day>/…) and never
 *   fails the request.
 * - compareAndRepair: every State key against the database, key by key; the database put right
 *   from State (State is the source until the move's last step). Run every day after the backup,
 *   and on request (admin db-sync / db-compare).
 * Single reads from the database ask for the primary (db.mjs PRIMARY); list reads can't (the
 * service refuses the option for find), so a repair reads the key from State again first.
 */
import { hasCredential, dbClient } from './db.mjs';

const COLLECTION = 'kv';
const unb64 = (s) => {
  try {
    return Buffer.from(s, 'base64url').toString();
  } catch (e) {
    return '';
  }
};

/** the document of a State key: the key, its value, its parts (space, type, page, item, kind) */
export function docOf(key, value) {
  let parts = key.split('.');
  let space = 'std';
  if (['main'].includes(parts[0])) {
    [space] = parts;
    parts = parts.slice(1);
  }
  const doc = { _id: key, value, space };
  if (parts[0] === 'i') return { ...doc, space: 'any', type: 'invite' };
  if (parts[0] === 'p' && parts.length === 4) {
    return {
      ...doc, type: 'entry', page: unb64(parts[1]), item: unb64(parts[2]), kind: unb64(parts[3]),
    };
  }
  if (parts[0] === 'g' && parts.length === 3) {
    return {
      ...doc, type: 'group', page: '*', item: unb64(parts[1]), kind: unb64(parts[2]),
    };
  }
  return { ...doc, type: 'other' };
}

const globToRegex = (glob) => `^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`;

async function recordFailure(files, op, key, e) {
  const at = new Date().toISOString();
  await files.write(`mirror/failures/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}.json`, JSON.stringify({
    at, op, key, error: String(e?.message || e).slice(0, 300),
  })).catch(() => null);
}

/** State, with every successful write also made in the database (when the credential is there) */
export function mirrored(state, files, params) {
  if (!hasCredential(params)) return state;
  const col = async () => (await dbClient(params)).collection(COLLECTION);
  const after = (op, key, work) => work().catch((e) => recordFailure(files, op, key, e));
  return new Proxy(state, {
    get(target, prop) {
      if (prop === 'put') {
        return async (key, value, opts) => {
          const r = await target.put(key, value, opts);
          await after('put', key, async () => (await col()).replaceOne({ _id: key }, docOf(key, value), { upsert: true }));
          return r;
        };
      }
      if (prop === 'delete') {
        return async (key) => {
          const r = await target.delete(key);
          await after('delete', key, async () => (await col()).deleteOne({ _id: key }));
          return r;
        };
      }
      if (prop === 'deleteAll') {
        return async (o) => {
          const r = await target.deleteAll(o);
          await after('deleteAll', o?.match, async () => (await col()).deleteMany({ _id: { $regex: globToRegex(o.match) } }));
          return r;
        };
      }
      const v = target[prop];
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
}

/**
 * every State key against the database: missing there, different, there but gone from State;
 * repair: the database put right from State (500 at a time). The report in Files
 * mirror/compare/<day>.json. stateKeys: { key: { value } } (the backup's read, if at hand).
 */
export async function compareAndRepair(params, files, stateKeys, { repair = true, state = null } = {}) {
  if (!hasCredential(params)) return { skipped: 'no database credential' };
  const col = (await dbClient(params)).collection(COLLECTION);
  // (a list can't ask for the primary: it may lag a moment behind; a repair reads the key again)
  const inDb = new Map((await col.find({}, { readConcern: { level: 'majority' }, projection: { _id: 1, value: 1 } }).toArray())
    .map((d) => [d._id, d.value]));
  const missing = [];
  const different = [];
  Object.entries(stateKeys).forEach(([k, v]) => {
    if (!inDb.has(k)) missing.push(k);
    else if (inDb.get(k) !== v.value) different.push(k);
  });
  const extra = [...inDb.keys()].filter((k) => !stateKeys[k]);
  let repaired = 0;
  if (repair) {
    // every key to put right read from State again now: its value now, or gone
    const fresh = new Map();
    const todo = [...missing, ...different, ...extra];
    for (let i = 0; i < todo.length; i += 25) {
      const part = todo.slice(i, i + 25);
      const got = state ? await Promise.all(part.map((k) => state.get(k))) : part.map((k) => (stateKeys[k] ? { value: stateKeys[k].value } : null));
      part.forEach((k, j) => fresh.set(k, got[j] ? got[j].value : null));
    }
    const ops = todo.map((k) => (fresh.get(k) === null
      ? { deleteOne: { filter: { _id: k } } }
      : { replaceOne: { filter: { _id: k }, replacement: docOf(k, fresh.get(k)), upsert: true } }));
    for (let i = 0; i < ops.length; i += 500) {
      await col.bulkWrite(ops.slice(i, i + 500));
      repaired += Math.min(500, ops.length - i);
    }
  }
  const at = new Date().toISOString();
  const report = {
    at, state: Object.keys(stateKeys).length, database: inDb.size, missing: missing.length, different: different.length, extra: extra.length, repaired, sample: { missing: missing.slice(0, 10), different: different.slice(0, 10), extra: extra.slice(0, 10) },
  };
  await files.write(`mirror/compare/${at.slice(0, 10)}.json`, JSON.stringify(report)).catch(() => null);
  return report;
}

/** the recorded failures of mirrored writes (a day's) */
export async function mirrorFailures(files, day) {
  const list = await files.list(`mirror/failures/${day}/`).catch(() => []);
  return list.length;
}
