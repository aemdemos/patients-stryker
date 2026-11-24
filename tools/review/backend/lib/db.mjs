/*
 * App Builder Database (Data Services, Amazon DocumentDB with replica sets: every write kept on
 * several storage nodes) for the review backend. Its access token comes from the workspace's
 * OAuth Server-to-Server credential, set once by a developer as the package parameter
 * __ims_oauth_s2s (DATABASE.md); every action of the package receives it. Never logged or
 * returned.
 */
import libDb from '@adobe/aio-lib-db';
import { generateAccessToken } from '@adobe/aio-lib-core-auth';

const REGION = 'amer';
// every read from the primary: a replica may not have a write yet (measured 24 Nov 2026: a read
// right after its write missed it 9 of 40 and 94 of 200 times by default, never on the primary)
export const PRIMARY = { readPreference: 'primary' };
// a warm container keeps its client (the token library caches the token itself)
let clientP = null;

/** is the credential there (the package parameter), without reading it */
export const hasCredential = (params) => !!(params && params.__ims_oauth_s2s && typeof params.__ims_oauth_s2s === 'object');

/** a connected client of the workspace's database */
export async function dbClient(params) {
  if (clientP) {
    const c = await clientP.catch(() => null);
    if (c) return c;
  }
  clientP = (async () => {
    const token = await generateAccessToken(params);
    const db = await libDb.init({ token: token.access_token, region: REGION });
    return db.connect();
  })();
  return clientP;
}

/** a check of the database: connect, write, read, delete one test document → timings, or the error */
export async function dbCheck(params) {
  if (!hasCredential(params)) return { ok: false, reason: 'no credential: the package parameter __ims_oauth_s2s is not set (DATABASE.md)' };
  const t0 = Date.now();
  const timing = {};
  try {
    const client = await dbClient(params);
    timing.connect = Date.now() - t0;
    const col = client.collection('healthcheck');
    const id = `check-${Date.now()}`;
    await col.insertOne({ _id: id, at: new Date().toISOString() });
    timing.write = Date.now() - t0;
    const back = await col.findOne({ _id: id }, PRIMARY);
    timing.read = Date.now() - t0;
    await col.deleteOne({ _id: id });
    timing.delete = Date.now() - t0;
    // bulk: 200 documents in one call, read back, removed
    const many = Array.from({ length: 200 }, (_, i) => ({ _id: `${id}-${i}`, n: i }));
    await col.insertMany(many);
    timing.insert200 = Date.now() - t0;
    const count = await col.countDocuments({ _id: { $regex: `^${id}-` } }, PRIMARY);
    await col.deleteMany({ _id: { $regex: `^${id}-` } });
    timing.done = Date.now() - t0;
    return {
      ok: !!back && count === 200, readBack: !!back, counted: count, region: REGION, timing,
    };
  } catch (e) {
    clientP = null;
    // (the message only: never the parameters)
    return { ok: false, reason: String(e.message || e).replace(/[A-Za-z0-9_-]{30,}/g, '…').slice(0, 300), timing };
  }
}

/**
 * how often a read right after a write misses it (replica lag): n writes each read back at once,
 * by default and asking for the primary → { default: misses, primary: misses | error }
 */
export async function dbConsistency(params, n = 30) {
  const client = await dbClient(params);
  const col = client.collection('healthcheck');
  const run = async (opts) => {
    let misses = 0;
    for (let i = 0; i < n; i += 1) {
      const id = `lag-${Date.now()}-${i}`;
      await col.insertOne({ _id: id });
      const got = await col.findOne({ _id: id }, opts).catch(() => null);
      if (!got) misses += 1;
      await col.deleteOne({ _id: id }).catch(() => null);
    }
    return misses;
  };
  const out = { n, default: await run({}) };
  try {
    out.primary = await run({ readPreference: 'primary' });
  } catch (e) {
    out.primary = `option refused: ${String(e.message || e).slice(0, 160)}`;
  }
  return out;
}
