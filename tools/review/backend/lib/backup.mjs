/*
 * Backups of the review's entries (State): State keeps a key a year at most and has no backups of
 * its own, so every day (the admin action's backup, scheduled) the backend writes a full copy of
 * every key of both reviews (entries, invitations) to Files, dated, kept:
 *   backups/<YYYY-MM-DD>/state.json = { at, keys: { <key>: { value, expiration } } }
 * and gives entries that would expire within 90 days their full year again (invitations keep
 * their own end: their record ends with their link). restoreCheck compares a backup with the
 * store; restore puts back the keys missing now, never over a key that exists.
 */
import { TTL } from './core.mjs';

const RENEW_MS = 90 * 86400 * 1000;
const fileOf = (day) => `backups/${day}/state.json`;

async function allKeys(state) {
  const keys = [];
  const it = state.list({ match: '*' });
  for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
  return keys;
}

/** every key with its value and expiration, 25 at a time */
export async function readEverything(state) {
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

/** the day's backup (written again if run twice a day) and the renewals → counts */
export async function backup({ state, files }) {
  const at = new Date().toISOString();
  const keys = await readEverything(state);
  const day = at.slice(0, 10);
  await files.write(fileOf(day), JSON.stringify({ at, keys }));
  // entries close to their end: their full year again (same value)
  const soon = Object.entries(keys).filter(([k, v]) => !k.startsWith('i.') && Date.parse(v.expiration) - Date.now() < RENEW_MS);
  for (let i = 0; i < soon.length; i += 20) {
    await Promise.all(soon.slice(i, i + 20).map(([k, v]) => state.put(k, v.value, { ttl: TTL })));
  }
  const bytes = JSON.stringify(keys).length;
  return {
    day, keys: Object.keys(keys).length, renewed: soon.length, bytes, all: keys,
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
    await Promise.all(back.slice(i, i + 20).map((k) => state.put(k, b.keys[k].value, { ttl: TTL })));
  }
  const at = new Date().toISOString();
  await files.write(`audit/${at.slice(0, 10)}/${at.replace(/[:.]/g, '-')}-restore.json`, JSON.stringify({ at, by: 'restore', day, keys: back }));
  return { day, restored: back.length };
}
