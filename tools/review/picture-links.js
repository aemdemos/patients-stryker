/*
 * The pictures' short-lived read links (25 Nov 2026), shared by store.js (a page's links come
 * with its messages: state action) and pictures.js (which asks for the others). id → { url, until }
 */
export const links = new Map();
// (the backend's links work an hour: used for 50 minutes)
const KEEP_MS = 50 * 60 * 1000;

/** links from the backend: { id: url } */
export function rememberLinks(urls) {
  const until = Date.now() + KEEP_MS;
  Object.entries(urls || {}).forEach(([id, url]) => {
    if (url) links.set(id, { url, until });
  });
}

/** a link still good (or null) */
export function knownLink(id) {
  const l = links.get(id);
  return l?.until > Date.now() ? l.url : null;
}
