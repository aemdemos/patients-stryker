/*
 * Web action `tile`: one tile of a source shot taken by the backend (capture action, stored in
 * Files), for the review tool's source pane (an <img>: no invitation header, so public; the
 * tiles are pictures of public stryker.com pages). Answers with a redirect to a short-lived
 * read-only link to the file. Older shots (in Document Authoring) don't come through here.
 * GET ?space=main&page=/us/en/…&version=s-YYYYMMDD-HHMMSS&vp=1440&file=0.jpg → 302
 */
import { open, fail, isPreflight, reply, SPACES } from '../lib/core.mjs';
import { movedMessage } from '../lib/move.mjs';
import { tileFile } from '../lib/capture-state.mjs';

export async function main(params) {
  if (isPreflight(params)) return reply(params, 204, '');
  if (movedMessage(params)) return fail(params, 410, 'moved', movedMessage(params));
  try {
    const space = SPACES[params.space] ? params.space : 'main';
    const page = String(params.page || '');
    const { version = '', vp = '', file = '' } = params;
    if (!page.startsWith('/') || page.length > 400 || !/^s-\d{8}-\d{6}$/.test(version)
      || !['1440', '860', '375'].includes(String(vp)) || !/^\d+\.jpg$/.test(file)) {
      return fail(params, 400, 'bad-tile', 'page, version, vp and file are needed');
    }
    const { files } = await open();
    const url = await files.generatePresignURL(tileFile(space, page, version, vp, file), { expiryInSeconds: 3600, permissions: 'r' });
    return { statusCode: 302, headers: { location: url, 'cache-control': 'private, max-age=3000' } };
  } catch (e) {
    return fail(params, 500, 'server', String(e.message || e).slice(0, 200));
  }
}
