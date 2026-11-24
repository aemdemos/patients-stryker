/*
 * Once (24 Nov 2026): every key of the old State store (entries, invitations of both reviews)
 * into the database's documents (lib/dbstate.mjs), then counted and compared key by key. State
 * held test data only; it is no longer read or written after this.
 */
import stateLib from '@adobe/aio-lib-state';

async function readState() {
  const state = await stateLib.init();
  const keys = [];
  const it = state.list({ match: '*' });
  for (let r = await it.next(); !r.done; r = await it.next()) keys.push(...r.value.keys);
  const out = {};
  for (let i = 0; i < keys.length; i += 25) {
    const part = keys.slice(i, i + 25);
    const got = await Promise.all(part.map((k) => state.get(k)));
    part.forEach((k, j) => {
      if (got[j]) out[k] = got[j].value;
    });
  }
  return out;
}

/** State → the database (kv: the key–value view of lib/dbstate.mjs) → counts and differences */
export async function migrateFromState(db, { apply = false } = {}) {
  // (a space's documents listed by space: its index, made once; nothing happens when it is there)
  if (apply) await db.client.collection('pages').createIndex({ space: 1 });
  const old = await readState();
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
