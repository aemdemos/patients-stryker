/*
 * The root of the readable-settings approach (user, 2026-11-07): until the approach is approved,
 * its pages and fragment documents live under ROOT (/rs/us/en/…, /rs/us/en/fragments/…), next to
 * the class-form documents at the real paths, which they never overwrite. The fragment paths
 * keep the agreed rule (xf-fragment-path.js, corp-modal-path.js) under the root. Links to pages
 * keep their real paths. On approval one move strips the root from the documents and from the
 * fragment links.
 */
export const ROOT = '/rs';

/** A document path under the root. */
export const rooted = (path) => (path.startsWith(`${ROOT}/`) ? path : `${ROOT}${path}`);

const FRAGMENT = /^\/us\/en\/fragments\//;

/**
 * Links to fragment documents (Fragment blocks, slides, modals) → under the root; a link that
 * shows its address shows the new one.
 * @param {Element} main the document body
 */
export function rootFragmentLinks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!FRAGMENT.test(href)) return;
    if (a.textContent.trim() === href) a.textContent = rooted(href);
    a.setAttribute('href', rooted(href));
  });
}
