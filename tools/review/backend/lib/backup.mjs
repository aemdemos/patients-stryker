/*
 * Backups of the review's entries and invitations (App Builder Database: Adobe restores only
 * best-effort): every day (the admin action's backup, scheduled) the backend writes a full copy
 * of every entry and invitation of both reviews to Files, dated, kept, in the backend's
 * key–value naming (lib/dbstate.mjs kv):
 *   backups/<YYYY-MM-DD>/state.json = { at, keys: { <key>: { value, expiration } } }
 * restoreCheck compares a backup with the store; restore puts back the keys missing now, never
 * over a key that exists.
 */
const fileOf = (day) => `backups/${day}/state.json`;

async function allKeys(state) {
  const keys = [];
  const it = state.list({ match: '*' });
  for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
  return keys;
}

/** every key with its value (the key–value view's entries: two lists, one pass) */
export async function readEverything(state) {
  if (state.entries) return state.entries();
  const keys = await allKeys(state);
  const out = {};
  for (let i = 0; i < keys.length; i += 25) {
    const part = keys.slice(i, i + 25);
    const got = await Promise.all(part.map((k) => state.get(k)));
    part.forEach((k, j) => {
      if (got[j]) out[k] = { value: got[j].value, expiration: got[j].expiration };
    });
  }
  return out;
}

/** the day's backup (written again if run twice a day) → counts */
export async function backup({ state, files }) {
  const at = new Date().toISOString();
  const keys = await readEverything(state);
  const day = at.slice(0, 10);
  await files.write(fileOf(day), JSON.stringify({ at, keys }));
  const bytes = JSON.stringify(keys).length;
  return {
    day, keys: Object.keys(keys).length, bytes,
  };
}

/** the backups kept (days) */
export async function listBackups(files) {
  const list = await files.list('backups/');
  return [...new Set(list.map((f) => f.name.split('/')[1]).filter(Boolean))].sort();
}

async function readBackup(files, day) {
  return JSON.parse((await files.read(fileOf(day))).toString());
}

/** a backup against the store now: keys missing now, keys whose value changed since */
export async function restoreCheck({ state, files }, day) {
  const b = await readBackup(files, day);
  const now = await readEverything(state);
  const missing = Object.keys(b.keys).filter((k) => !now[k]);
  const changed = Object.keys(b.keys).filter((k) => now[k] && now[k].value !== b.keys[k].value);
  return {
    day, backupAt: b.at, inBackup: Object.keys(b.keys).length, now: Object.keys(now).length, missing: missing.length, changed: changed.length, missingSample: missing.slice(0, 20),
  };
}

/** the keys of a backup missing now, put back (never over an existing key) → counts */
export async function restore({ state, files }, day, { only = null } = {}) {
  const b = await readBackup(files, day);
  const now = new Set(await allKeys(state));
  const back = Object.keys(b.keys).filter((k) => !now.has(k) && (!only || only.some((p) => k.startsWith(p))));
  for (let i = 0; i < back.length; i += 20) {
    await Promise.all(back.slice(i, i + 20).map((k) => state.put(k, b.keys[k].value)));
  }
  const at = new Date().toISOString();
  await files.write(`audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-restore.json`, JSON.stringify({ at, by: 'restore', day, keys: back }));
  return { day, restored: back.length };
}
