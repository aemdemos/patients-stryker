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
    const back = await col.findOne({ _id: id });
    timing.read = Date.now() - t0;
    await col.deleteOne({ _id: id });
    timing.delete = Date.now() - t0;
    // bulk: 200 documents in one call, read back, removed
    const many = Array.from({ length: 200 }, (_, i) => ({ _id: `${id}-${i}`, n: i }));
    await col.insertMany(many);
    timing.insert200 = Date.now() - t0;
    const count = await col.countDocuments({ _id: { $regex: `^${id}-` } });
    await col.deleteMany({ _id: { $regex: `^${id}-` } });
    timing.done = Date.now() - t0;
    return {
      ok: !!back && count === 200, region: REGION, timing,
    };
  } catch (e) {
    clientP = null;
    // (the message only: never the parameters)
    return { ok: false, reason: String(e.message || e).replace(/[A-Za-z0-9_-]{30,}/g, '…').slice(0, 300), timing };
  }
}
