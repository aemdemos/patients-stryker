/*
 * Every file under a folder. Files' list answers 1,000 files at most, silently (aio-lib-files
 * 4.1.4 reads only the first page of its storage's listing, "a max limit of 1000 items
 * listed"; a name without a trailing / is taken as one file, so a folder can't be split by
 * name). Below the limit: list as it is. At the limit: every page of the same listing, through
 * the library's storage client (pinned version; an error, never a short list, when it changes).
 */
const LIMIT = 1000;

export async function listAll(files, folder = '') {
  const got = await files.list(folder || '/');
  if (got.length < LIMIT) return got;
  const prefix = folder.replace(/^\/+/, '');
  // (the private container: every file of the review; the probe name only picks the container)
  const props = typeof files._propsForPath === 'function' ? files._propsForPath(prefix || 'probe') : null;
  if (!props?.containerClient?.listBlobsFlat) throw new Error(`more than ${LIMIT} files under "${folder}" and no way to page through them (aio-lib-files changed)`);
  const out = [];
  for await (const page of props.containerClient.listBlobsFlat({ prefix }).byPage({ maxPageSize: LIMIT })) {
    page.segment.blobItems.forEach((item) => out.push({ name: item.name, contentLength: item.properties.contentLength }));
  }
  if (out.length < got.length) throw new Error(`paging "${folder}" found ${out.length} files, fewer than the first page's ${got.length}`);
  return out;
}
