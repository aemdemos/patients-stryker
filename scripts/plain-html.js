/**
 * Fetches a document's .plain.html (fragments, hero slides).
 *
 * In the local preview, imported pages are served under /content/ while their fragment links
 * keep the site paths (/us/en/fragments/…), as they are in Document Authoring. On such a page
 * the document is read from /content/ first, then from its own path. On the site (no
 * /content/ prefix) this is a plain fetch of the path.
 * @param {string} path The document path (root-relative, without .plain.html)
 * @returns {Promise<Response>} The response
 */
export default async function fetchPlainHtml(path) {
  const local = window.location.pathname.startsWith('/content/')
    && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/content/');
  if (local) {
    const resp = await fetch(`/content${path}.plain.html`);
    if (resp.ok) return resp;
  }
  return fetch(`${path}.plain.html`);
}
