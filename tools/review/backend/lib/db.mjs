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

/**
 * list reads that must see their own writes: n trials per way of reading; in each, a new entry
 * of a test page is written, then the page's entries are listed at once and the new one looked
 * for → misses per way (0 = read-your-writes), and how long the default list lags behind
 */
export async function dbListTest(params, n = 40) {
  const client = await dbClient(params);
  const col = client.collection('listtest');
  const pages = client.collection('listtest_pages');
  const run = async (name, read) => {
    const page = `page-${name}-${Date.now()}`;
    let misses = 0;
    let error = null;
    for (let i = 0; i < n && !error; i += 1) {
      const id = `${page}-${i}`;
      try {
        const seen = await read(page, id, i);
        if (!seen) misses += 1;
      } catch (e) {
        error = String(e.message || e).slice(0, 160);
      }
    }
    await col.deleteMany({ page }).catch(() => null);
    await pages.deleteMany({ _id: page }).catch(() => null);
    return error ? `refused: ${error}` : misses;
  };
  const write = (page, id) => col.insertOne({ _id: id, page });
  const has = (list, id) => list.some((d) => d._id === id);
  const out = { n };
  out.findDefault = await run('fd', async (p, id) => { await write(p, id); return has(await col.find({ page: p }).toArray(), id); });
  out.findMajority = await run('fm', async (p, id) => { await write(p, id); return has(await col.find({ page: p }, { readConcern: { level: 'majority' } }).toArray(), id); });
  out.findLocal = await run('fl', async (p, id) => { await write(p, id); return has(await col.find({ page: p }, { readConcern: { level: 'local' } }).toArray(), id); });
  out.aggregate = await run('ag', async (p, id) => { await write(p, id); return has(await col.aggregate([{ $match: { page: p } }]).toArray(), id); });
  out.countPrimary = await run('cp', async (p, id, i) => { await write(p, id); return (await col.countDocuments({ page: p }, PRIMARY)) === i + 1; });
  // one document per page: its entries in it, written in place, read with a single primary read
  out.pageDocument = await run('pd', async (p, id) => {
    await pages.updateOne({ _id: p }, { $set: { [`entries.${id}`]: { at: Date.now() } } }, { upsert: true });
    const doc = await pages.findOne({ _id: p }, PRIMARY);
    return !!doc?.entries?.[id];
  });
  // how long the default list lags: after a write, list every 25 ms until the entry is there
  const lags = [];
  const page = `page-lag-${Date.now()}`;
  for (let i = 0; i < 15; i += 1) {
    const id = `${page}-${i}`;
    const t = Date.now();
    await write(page, id);
    const t1 = Date.now();
    for (let k = 0; k < 80; k += 1) {
      if (has(await col.find({ page }).toArray(), id)) break;
      await new Promise((r) => { setTimeout(r, 25); });
    }
    lags.push(Date.now() - t1);
    if (Date.now() - t > 5000) break;
  }
  await col.deleteMany({ page }).catch(() => null);
  out.defaultLagMs = { max: Math.max(...lags), median: lags.sort((a, b) => a - b)[Math.floor(lags.length / 2)] };
  return out;
}

/** list reads after changes and deletions (n each): the changed value / the deletion seen at once? */
export async function dbListChangeTest(params, n = 150) {
  const col = (await dbClient(params)).collection('listtest');
  const page = `page-chg-${Date.now()}`;
  const out = { n };
  // inserts, seen by the default list
  let miss = 0;
  for (let i = 0; i < n; i += 1) {
    await col.insertOne({ _id: `${page}-i${i}`, page, v: 0 });
    if (!(await col.find({ page, _id: `${page}-i${i}` }).toArray()).length) miss += 1;
  }
  out.insertThenList = miss;
  // the same entry changed n times, each value looked for at once
  miss = 0;
  await col.insertOne({ _id: `${page}-u`, page, v: -1 });
  for (let i = 0; i < n; i += 1) {
    await col.updateOne({ _id: `${page}-u` }, { $set: { v: i } });
    const got = (await col.find({ _id: `${page}-u` }).toArray())[0];
    if (!got || got.v !== i) miss += 1;
  }
  out.updateThenList = miss;
  // deletions: an entry deleted, the list must not show it any more
  miss = 0;
  for (let i = 0; i < n; i += 1) {
    await col.deleteOne({ _id: `${page}-i${i}` });
    if ((await col.find({ page, _id: `${page}-i${i}` }).toArray()).length) miss += 1;
  }
  out.deleteThenList = miss;
  // and the single read by default, for comparison (known to lag)
  miss = 0;
  for (let i = 0; i < 40; i += 1) {
    await col.updateOne({ _id: `${page}-u` }, { $set: { v: 1000 + i } });
    const got = await col.findOne({ _id: `${page}-u` }).catch(() => null);
    if (!got || got.v !== 1000 + i) miss += 1;
  }
  out.updateThenFindOneDefault = `${miss} of 40`;
  await col.deleteMany({ page }).catch(() => null);
  return out;
}
