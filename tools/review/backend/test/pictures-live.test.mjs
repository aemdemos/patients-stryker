#!/usr/bin/env node
/*
 * Pictures in the chats (25 Nov 2026), against the backend (Stage by default; REVIEW_TARGET=
 * production for the smoke test): a picture uploaded in one part and in several (a request may
 * not be over 1 MB), kept byte for byte; refused: not a picture (SVG), a part too big, the parts
 * of someone else's upload; its link only for invitations whose review has its page; a message
 * with pictures only; bad picture lists refused; purge-invite removes the pictures too.
 * usage: node tools/review/backend/test/pictures-live.test.mjs
 */
import { randomBytes } from 'crypto';
import { TEST, LIVE, actionUrl, webBase } from '../target.mjs';

const T = process.env.REVIEW_TARGET === 'production' ? LIVE : TEST;
const SPACE = 'main';
const admin = async (p) => (await (await fetch(actionUrl(T.ns), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: SPACE, ...p }) })).json()).body;
let failed = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` ${String(detail).slice(0, 300)}`}`);
  if (!ok) failed += 1;
};
const ORIGIN = 'http://localhost:3220';
const api = async (token, path, body) => {
  const r = await fetch(`${webBase(T.ns)}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-review-invite': token, origin: ORIGIN, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const PART = 600 * 1024;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const send = async (token, page, buf, parts = PART) => {
  const total = Math.ceil(buf.length / parts);
  let id;
  for (let n = 0; n < total; n += 1) {
    const r = await api(token, 'images', {
      op: 'part', page, n, total, id, data: buf.subarray(n * parts, (n + 1) * parts).toString('base64'),
    });
    if (r.status !== 200) return r;
    id = r.body.id;
  }
  return { status: 200, body: { id } };
};

const PAGE = '/us/en/about/news/zz-pictures-test';
const rev = await admin({
  op: 'invite', name: 'tool test pictures reviewer', paths: ['/us/en/about'], days: 1,
});
const other = await admin({
  op: 'invite', name: 'tool test pictures other', paths: ['/us/en/trauma-and-extremities'], days: 1,
});
try {
  // 1. one part
  const small = Buffer.concat([PNG, randomBytes(2000)]);
  const one = await send(rev.token, PAGE, small);
  check('a small picture: one part, an id', one.status === 200 && /^img-[a-z0-9]{16}$/.test(one.body?.id || ''), JSON.stringify(one));
  // 2. several parts (1.4 MB: 3 parts), kept byte for byte
  const big = Buffer.concat([PNG, randomBytes(1400 * 1024)]);
  const three = await send(rev.token, PAGE, big);
  check('a big picture: three parts, an id', three.status === 200 && !!three.body?.id, JSON.stringify(three));
  const links = await api(rev.token, `images?ids=${one.body.id},${three.body.id}`);
  check('their links for the reviewer', links.status === 200 && !!links.body?.urls?.[one.body.id] && !!links.body?.urls?.[three.body.id], JSON.stringify(links.body).slice(0, 200));
  const got = Buffer.from(await (await fetch(links.body.urls[three.body.id])).arrayBuffer());
  check('… the big one comes back byte for byte', got.equals(big), `${got.length} vs ${big.length}`);
  // 3. refused
  const svg = await send(rev.token, PAGE, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
  check('an SVG is refused (only PNG, JPEG, WebP, GIF)', svg.status === 400 && svg.body?.error?.code === 'not-a-picture', JSON.stringify(svg));
  const tooBig = await api(rev.token, 'images', {
    op: 'part', page: PAGE, n: 0, total: 1, data: Buffer.concat([PNG, randomBytes(PART)]).toString('base64'),
  });
  check('a part over 600 KB is refused', tooBig.status === 400 && tooBig.body?.error?.code === 'bad-part', JSON.stringify(tooBig));
  const start = await api(rev.token, 'images', {
    op: 'part', page: PAGE, n: 0, total: 2, data: Buffer.concat([PNG, randomBytes(1000)]).toString('base64'),
  });
  const theirs = await api(other.token, 'images', {
    op: 'part', page: '/us/en/trauma-and-extremities/x', n: 1, total: 2, id: start.body?.id, data: randomBytes(100).toString('base64'),
  });
  check('someone else can\'t finish my upload', theirs.status === 403 || theirs.status === 400, JSON.stringify(theirs));
  const outside = await api(other.token, 'images', {
    op: 'part', page: PAGE, n: 0, total: 1, data: small.toString('base64'),
  });
  check('no upload for a page outside one\'s review', outside.status === 403 && outside.body?.error?.code === 'out-of-scope', JSON.stringify(outside));
  const notTheirs = await api(other.token, `images?ids=${one.body.id}`);
  check('no link for a picture of a page outside one\'s review', notTheirs.status === 200 && !notTheirs.body?.urls?.[one.body.id], JSON.stringify(notTheirs.body));
  // 4. a message with pictures only; bad lists refused
  const save = (value) => api(rev.token, 'save', { page: PAGE, changes: [{ item: 'page', kind: `reply:comment:${randomBytes(6).toString('hex')}`, value: JSON.stringify(value), rev: 0 }] });
  const msg = await save({ images: [{ id: one.body.id, w: 10, h: 10 }, { id: three.body.id }] });
  check('a message with pictures only is saved', msg.body?.results?.[0]?.ok === true, JSON.stringify(msg.body));
  const badId = await save({ images: [{ id: '../../secrets' }] });
  check('a picture id that is no id is refused', badId.status === 400, JSON.stringify(badId.body));
  const seven = await save({ images: Array.from({ length: 7 }, () => ({ id: one.body.id })) });
  check('more than 6 pictures in a message are refused', seven.status === 400, JSON.stringify(seven.body));
  // 5. purge-invite removes the pictures
  const purged = await admin({ op: 'purge-invite', id: rev.id });
  check('purge-invite removes the invitation\'s pictures', purged.images >= 2, JSON.stringify(purged));
  const after = await api(rev.token, `images?ids=${one.body.id}`);
  check('… then no link for them', after.status === 200 && !after.body?.urls?.[one.body.id], JSON.stringify(after.body));
} finally {
  for (const i of [rev, other]) {
    await admin({ op: 'purge-invite', id: i.id });
    await admin({ op: 'revoke', id: i.id });
  }
  await admin({ op: 'forget-test-invites' });
}
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
