/*
 * The review's entries and invitations in App Builder Database (DATABASE.md), page documents:
 * - collection `pages`: one document per page of a space, `_id` = `<space>|<page>` (page `*`: the
 *   group choices), its entries as fields of `e`, one per item + kind (the names base64url,
 *   `<item>~<kind>`): { v, by, at, rev, inv, role }. A page is read with one findOne from the
 *   primary (always the newest write); an entry is written in place, the rev check inside the
 *   write (saveEntry).
 * - collection `invites`: one document per invitation, `_id` = its id, `value` its record (JSON).
 * The rest of the backend keeps its key–value view (`p.<page>.<item>.<kind>`, `g.…`, `i.<id>`,
 * the space as prefix): kv(client) gives it get / put / delete / deleteAll / list on these
 * documents; the paths that matter (a page's rows, every row of a space, a save) have their own
 * functions here.
 */
import { PRIMARY } from './db.mjs';

const b64 = (s) => Buffer.from(String(s)).toString('base64url');
const unb64 = (s) => Buffer.from(s, 'base64url').toString();
export const pageId = (space, page) => `${space || 'std'}|${page}`;
export const fieldOf = (item, kind) => `${b64(item)}~${b64(kind)}`;
const unfield = (f) => {
  const [i, k] = f.split('~');
  return { item: unb64(i), kind: unb64(k) };
};
const spaceOfPrefix = (key) => {
  const [first] = key.split('.');
  return ['main'].includes(first) ? { space: first, rest: key.slice(first.length + 1) } : { space: 'std', rest: key };
};

/** a key of the key–value view → where it lives */
function where(key) {
  if (key.startsWith('i.')) return { coll: 'invites', id: key.slice(2) };
  const { space, rest } = spaceOfPrefix(key);
  const parts = rest.split('.');
  if (parts[0] === 'p' && parts.length === 4) {
    return {
      coll: 'pages', id: pageId(space, unb64(parts[1])), field: `${parts[2]}~${parts[3]}`, space, page: unb64(parts[1]),
    };
  }
  if (parts[0] === 'g' && parts.length === 3) {
    return {
      coll: 'pages', id: pageId(space, '*'), field: `${parts[1]}~${parts[2]}`, space, page: '*',
    };
  }
  return null;
}
const keyOf = (space, page, field) => {
  const pre = space === 'std' ? '' : `${space}.`;
  const [i, k] = field.split('~');
  return page === '*' ? `${pre}g.${i}.${k}` : `${pre}p.${b64(page)}.${i}.${k}`;
};

/** an entry as the rows the rest of the backend reads ({ page, item, kind, value, reviewer, … }) */
const rowOf = (page, field, e) => ({
  page, ...unfield(field), value: e.v, reviewer: e.by, time: e.at, rev: e.rev, role: e.role || (e.by === 'AOE' ? 'aoe' : 'reviewer'),
});
const rowsOfDoc = (doc) => (doc ? Object.entries(doc.e || {}).map(([f, e]) => rowOf(doc.page, f, e)) : []);

// two upserts of one new page document at the same moment: the second fails with a duplicate
// key (the first created it); the same write again then updates it ($set: done twice = once)
const DUP = /duplicate key|E11000/i;
async function once(write) {
  try {
    return await write();
  } catch (e) {
    if (!DUP.test(String(e.message))) throw e;
    return write();
  }
}

/** a page's own rows (from the primary: always the newest) */
export async function pageRows(client, space, page) {
  return rowsOfDoc(await client.collection('pages').findOne({ _id: pageId(space, page) }, PRIMARY).catch(() => null));
}

/** one stored entry as it is ({ v, by, at, rev, inv, role }), from the primary; null when none */
export async function entryOf(client, space, page, item, kind) {
  const doc = await client.collection('pages').findOne({ _id: pageId(space, page) }, PRIMARY).catch(() => null);
  return doc?.e?.[fieldOf(item, kind)] || null;
}

/** every row of a space (a list: may be a moment behind; for exports, summaries, backups) */
export async function allRows(client, space) {
  const docs = await client.collection('pages').find({ space: space || 'std' }).toArray();
  return docs.flatMap(rowsOfDoc);
}

/**
 * one entry written: rev the rev it started from (null: the newest wins, organisation) →
 * { ok, rev, before } or { ok: false, conflict: true, rev, by, at }
 */
export async function saveEntry(client, {
  space, page, item, kind, entry, rev,
}) {
  const col = client.collection('pages');
  const f = `e.${fieldOf(item, kind)}`;
  const id = pageId(space, page);
  const set = { $set: { [f]: entry, space: space || 'std', page } };
  if (rev === null) {
    await once(() => col.updateOne({ _id: id }, set, { upsert: true }));
    return { ok: true, rev: entry.rev, before: undefined };
  }
  // the rev check inside the write: only when the entry is still the one it started from
  const filter = rev === 0 ? { _id: id, [f]: { $exists: false } } : { _id: id, [`${f}.rev`]: rev };
  try {
    const before = await col.findOneAndUpdate(filter, set, { upsert: rev === 0, projection: { [f]: 1 } });
    if (before || rev === 0) return { ok: true, rev: entry.rev, before: before ? before.e?.[fieldOf(item, kind)] || null : null };
  } catch (e) {
    // (rev 0 and the entry there already: the upsert collides with the page's document)
    if (!DUP.test(String(e.message))) throw e;
  }
  const now = await col.findOne({ _id: id }, PRIMARY).catch(() => null);
  const cur = now?.e?.[fieldOf(item, kind)];
  return {
    ok: false, conflict: true, rev: cur ? cur.rev : 0, by: cur?.by, at: cur?.at,
  };
}

/** organisation entries (the newest wins) for many pages at once: 500 a call */
export async function saveMany(client, items) {
  const col = client.collection('pages');
  for (let i = 0; i < items.length; i += 500) {
    const part = items.slice(i, i + 500);
    await once(() => col.bulkWrite(part.map(({
      space, page, item, kind, entry,
    }) => ({
      updateOne: {
        filter: { _id: pageId(space, page) },
        update: { $set: { [`e.${fieldOf(item, kind)}`]: entry, space: space || 'std', page } },
        upsert: true,
      },
    }))));
  }
}

const globRe = (glob) => new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

/** the key–value view on the documents (what the admin operations, invitations and backups use) */
export function kv(client) {
  const coll = (name) => client.collection(name);
  const allKeys = async () => {
    const [pages, invites] = await Promise.all([coll('pages').find({}).toArray(), coll('invites').find({}, { projection: { _id: 1 } }).toArray()]);
    return [
      ...pages.flatMap((d) => Object.keys(d.e || {}).map((f) => keyOf(d.space, d.page, f))),
      ...invites.map((d) => `i.${d._id}`),
    ];
  };
  return {
    // every key with its value, as State's backups held them ({ value, expiration })
    async entries() {
      const [pages, invites] = await Promise.all([coll('pages').find({}).toArray(), coll('invites').find({}).toArray()]);
      const out = {};
      pages.forEach((doc) => Object.entries(doc.e || {}).forEach(([f, e]) => {
        out[keyOf(doc.space, doc.page, f)] = { value: JSON.stringify(e), expiration: null };
      }));
      invites.forEach((doc) => { out[`i.${doc._id}`] = { value: doc.value, expiration: null }; });
      return out;
    },
    async get(key) {
      const w = where(key);
      if (!w) return undefined;
      if (w.coll === 'invites') {
        const d = await coll('invites').findOne({ _id: w.id }, PRIMARY).catch(() => null);
        return d ? { value: d.value, expiration: null } : undefined;
      }
      const d = await coll('pages').findOne({ _id: w.id }, PRIMARY).catch(() => null);
      const e = d?.e?.[w.field];
      return e ? { value: JSON.stringify(e), expiration: null } : undefined;
    },
    async put(key, value) {
      const w = where(key);
      if (!w) throw new Error(`not a review key: ${key}`);
      if (w.coll === 'invites') {
        await once(() => coll('invites').replaceOne({ _id: w.id }, { _id: w.id, value }, { upsert: true }));
      } else {
        await once(() => coll('pages').updateOne({ _id: w.id }, { $set: { [`e.${w.field}`]: JSON.parse(value), space: w.space, page: w.page } }, { upsert: true }));
      }
      return key;
    },
    async delete(key) {
      const w = where(key);
      if (!w) return null;
      if (w.coll === 'invites') await coll('invites').deleteOne({ _id: w.id });
      else {
        await coll('pages').updateOne({ _id: w.id }, { $unset: { [`e.${w.field}`]: '' } });
        // (a page without entries any more: its document gone too)
        await coll('pages').deleteOne({ _id: w.id, e: {} });
      }
      return key;
    },
    async deleteAll({ match }) {
      const re = globRe(match);
      const keys = (await allKeys()).filter((k) => re.test(k));
      await Promise.all(keys.map((k) => this.delete(k)));
      return { keys: keys.length };
    },
    // (the same shape as State's list: an async iterator of { keys } batches)
    list({ match }) {
      let done = false;
      return {
        next: async () => {
          if (done) return { done: true };
          done = true;
          const re = globRe(match);
          return { done: false, value: { keys: (await allKeys()).filter((k) => re.test(k)) } };
        },
      };
    },
  };
}
