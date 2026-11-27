/*
 * Web action `images` (25 Nov 2026): the pictures in the chats (a screenshot of what a page shows
 * after a click, on the migrated or the source page). Header x-review-invite on every call.
 *
 * Upload, in parts (a request may not be over 1 MB): the tool shrinks a big picture first, then
 *   POST { op: 'part', page, n, total, id? , data (base64, ≤ 600 KB of picture) }
 *   part 0 comes without id and gets one; the last part puts the picture together, checks that it
 *   is a PNG, JPEG, WebP or GIF (by its bytes: never SVG), ≤ 8 MB, and keeps it in Files:
 *   <space>/images/<id>.<ext> with <id>.json (page, who, when). → { id } (then { id, ok, ext })
 * Show: GET ?ids=img-…,img-… → { urls: { id: short-lived read link } } for pictures of pages in
 *   the invitation's review (others are left out). An <img> can't send the invitation, so the
 *   tool asks for the links (a page's come with its messages: state action) and keeps each
 *   picture in the browser (a picture never changes).
 * The message that shows a picture holds its id (save action, core.mjs replyProblem); a withdrawn
 * message hides it, the picture itself is kept (as the audit keeps the text).
 */
import { randomBytes } from 'crypto';
import {
  open, checkInvite, inScope, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';

export const IMAGE_ID = /^img-[a-z0-9]{16}$/;
const MAX_PART = 600 * 1024;
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_PARTS = Math.ceil(MAX_IMAGE / MAX_PART);

/** the picture's type from its first bytes (never from what the browser says) */
export function sniff(buf) {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (buf.length > 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString('latin1'))) return 'gif';
  return null;
}

const imageFile = (space, id, ext) => `${space}/images/${id}.${ext}`;
const metaFile = (space, id) => `${space}/images/${id}.json`;
const partFile = (space, id, n) => `${space}/uploads/${id}/${n}`;

async function upload(params, stores, invite) {
  const space = spaceOf(invite.scope);
  const page = String(params.page || '');
  if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
  if (!inScope(invite.scope, page)) return fail(params, 403, 'out-of-scope', 'This page is not part of your review.');
  const n = Number(params.n);
  const total = Number(params.total);
  if (!Number.isInteger(total) || total < 1 || total > MAX_PARTS || !Number.isInteger(n) || n < 0 || n >= total) {
    return fail(params, 400, 'bad-part', `a picture comes in 1 to ${MAX_PARTS} parts`);
  }
  if (n > 0 && !IMAGE_ID.test(String(params.id || ''))) return fail(params, 400, 'bad-part', 'the parts after the first carry its id');
  const data = typeof params.data === 'string' ? Buffer.from(params.data, 'base64') : null;
  if (!data?.length || data.length > MAX_PART) return fail(params, 400, 'bad-part', 'a part is up to 600 KB');
  const id = n === 0 ? `img-${randomBytes(12).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').padEnd(16, '0').slice(0, 16)}` : params.id;
  const { files } = stores;
  if (n < total - 1) {
    // (a later part of someone else's upload is refused: the first part says whose it is)
    if (n > 0) {
      const first = await files.read(partFile(space, id, 'who')).catch(() => null);
      if (!first || first.toString() !== invite.id) return fail(params, 403, 'not-yours', 'This upload is not yours.');
    } else await files.write(partFile(space, id, 'who'), invite.id);
    await files.write(partFile(space, id, n), data);
    return reply(params, 200, { id });
  }
  // the last part: the whole picture
  let whole = data;
  if (total > 1) {
    const first = await files.read(partFile(space, id, 'who')).catch(() => null);
    if (!first || first.toString() !== invite.id) return fail(params, 403, 'not-yours', 'This upload is not yours.');
    const parts = await Promise.all(Array.from({ length: total - 1 }, (_, i) => files.read(partFile(space, id, i)).catch(() => null)));
    if (parts.some((p) => !p)) return fail(params, 400, 'bad-part', 'a part is missing: send the picture again');
    whole = Buffer.concat([...parts, data]);
  }
  await files.delete(`${space}/uploads/${id}/`).catch(() => null);
  if (whole.length > MAX_IMAGE) return fail(params, 400, 'too-big', 'A picture may be up to 8 MB.');
  const ext = sniff(whole);
  if (!ext) return fail(params, 400, 'not-a-picture', 'Only PNG, JPEG, WebP and GIF pictures.');
  await files.write(imageFile(space, id, ext), whole);
  await files.write(metaFile(space, id), JSON.stringify({
    id, ext, page, by: invite.name, inv: invite.id, role: invite.role, at: new Date().toISOString(), bytes: whole.length,
  }));
  return reply(params, 200, { id, ok: true, ext, bytes: whole.length });
}

/**
 * short-lived read links of pictures, for an invitation (only pictures of pages in its review)
 * → { id: url } (also used by the state action: the links come with a page's messages)
 */
export async function pictureLinks(files, invite, ids) {
  const space = spaceOf(invite.scope);
  const urls = {};
  await Promise.all([...new Set(ids)].filter((id) => IMAGE_ID.test(id)).slice(0, 200).map(async (id) => {
    const meta = await files.read(metaFile(space, id)).then((b) => JSON.parse(b.toString())).catch(() => null);
    if (!meta || !inScope(invite.scope, meta.page)) return;
    urls[id] = await files.generatePresignURL(imageFile(space, id, meta.ext), { expiryInSeconds: 3600, permissions: 'r' });
  }));
  return urls;
}

async function links(params, stores, invite) {
  const ids = [...new Set(String(params.ids || '').split(','))].filter((id) => IMAGE_ID.test(id)).slice(0, 60);
  if (!ids.length) return fail(params, 400, 'bad-ids', 'ids: picture ids, comma separated');
  const urls = await pictureLinks(stores.files, invite, ids);
  return reply(params, 200, { urls, expires: new Date(Date.now() + 3600 * 1000).toISOString() });
}

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  try {
    const stores = await open(params);
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const method = (params.__ow_method || '').toLowerCase();
    if (method === 'post' && params.op === 'part') return upload(params, stores, invite);
    if (method === 'get') return links(params, stores, invite);
    return fail(params, 400, 'bad-op', 'POST op part, or GET ids');
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
