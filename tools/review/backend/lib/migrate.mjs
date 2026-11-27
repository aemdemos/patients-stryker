/*
 * The old State store (until 24 Nov 2026), test data only:
 * - migrateFromState: every key (entries, invitations of both reviews) into the database's
 *   documents (lib/dbstate.mjs), then counted and compared key by key (done 24 Nov 2026).
 * - emptyState: a final copy of every key to Files (backups/state-final/<at>.json, kept: the
 *   way back), then every key deleted and the store listed again (done 24 Nov 2026).
 */
import stateLib from '@adobe/aio-lib-state';

async function stateKeys(state) {
  const keys = [];
  const it = state.list({ match: '*' });
  for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
  return keys;
}

async function readState(state) {
  const keys = await stateKeys(state);
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

/** State → the database (kv: the key–value view of lib/dbstate.mjs) → counts and differences */
export async function migrateFromState(db, { apply = false } = {}) {
  // (a space's documents listed by space: its index, made once; nothing happens when it is there)
  if (apply) await db.client.collection('pages').createIndex({ space: 1 });
  const all = await readState(await stateLib.init());
  const old = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.value]));
  const keys = Object.keys(old);
  if (apply) {
    for (let i = 0; i < keys.length; i += 20) {
      await Promise.all(keys.slice(i, i + 20).map((k) => db.put(k, old[k])));
    }
  }
  // every key read back from the database (the primary) and compared
  const missing = [];
  const different = [];
  for (let i = 0; i < keys.length; i += 25) {
    const part = keys.slice(i, i + 25);
    const got = await Promise.all(part.map((k) => db.get(k)));
    part.forEach((k, j) => {
      if (!got[j]) missing.push(k);
      else if (k.startsWith('i.') ? got[j].value !== old[k] : JSON.stringify(JSON.parse(got[j].value)) !== JSON.stringify(JSON.parse(old[k]))) different.push(k);
    });
  }
  return {
    state: keys.length, copied: apply ? keys.length : 0, missing: missing.length, different: different.length, sample: [...missing, ...different].slice(0, 10),
  };
}

/**
 * State emptied: apply false → only what it holds and where the copy would go; apply true → the
 * copy written to Files and read back (same keys), then every key deleted, then State listed again
 */
export async function emptyState(files, { apply = false } = {}) {
  const state = await stateLib.init();
  const all = await readState(state);
  const at = new Date().toISOString();
  const file = `backups/state-final/${at.replace(/[:.]/g, '-')}.json`;
  const count = Object.keys(all).length;
  if (!apply) return { keys: count, wouldCopyTo: file };
  await files.write(file, JSON.stringify({ at, from: 'App Builder State (no longer used)', keys: all }));
  const back = JSON.parse((await files.read(file)).toString());
  if (Object.keys(back.keys).length !== count) throw new Error(`the copy in ${file} is incomplete: nothing deleted`);
  const r = await state.deleteAll({ match: '*' });
  const left = await stateKeys(state);
  return {
    copiedTo: file, copied: count, deleted: r?.keys ?? r, left: left.length,
  };
}
