/*
 * Web action `state`: a page's saved review state for the review tool.
 * GET ?page=/us/en/… with header x-review-invite: <token> → { reviewer, scope, rows, pictures }
 * pictures: { id: short-lived read link } of the pictures in the page's messages (and their
 * thumbnails), so the tool shows them without asking again
 * rows: { page, item, kind, value (JSON string), reviewer, time, rev }, the
 * page's own and every group choice (page `*`), AOE statuses among them (kind `status:*`).
 */
import {
  open, checkInvite, inScope, readPage, reply, fail, isPreflight, inviteOf, spaceOf,
} from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import { pictureLinks } from './images.mjs';

/** the picture ids in a page's rows (messages with images: { id, t? }) */
const pictureIds = (rows) => rows.flatMap((r) => {
  if (!/"images"/.test(r.value || '')) return [];
  try {
    const v = JSON.parse(r.value);
    return Array.isArray(v?.images) ? v.images.flatMap((i) => [i?.id, i?.t]).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
});

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  try {
    const stores = await open(params);
    const { invite, error } = await checkInvite(stores, inviteOf(params));
    if (error) return fail(params, 401, error, 'This review link is not valid (any more): ask for a new one.');
    const page = String(params.page || '');
    if (!page.startsWith('/') || page.length > 400) return fail(params, 400, 'bad-page', 'page must be a path');
    if (!inScope(invite.scope, page)) return fail(params, 403, 'out-of-scope', 'This page is not part of your review.');
    const rows = await readPage(stores.state, page, spaceOf(invite.scope));
    const ids = pictureIds(rows);
    const pictures = ids.length ? await pictureLinks(stores.files, invite, ids) : {};
    return reply(params, 200, {
      reviewer: invite.name, role: invite.role, scope: invite.scope, expires: invite.exp, rows, pictures,
    });
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
