/*
 * Google map from a link: a paragraph holding only a link to
 * `https://www.google.com/maps?q=<address>` (link text = the address) becomes an embedded
 * map of that address, as www.stryker.com shows next to contact details. The embed needs
 * no API key. The authored link stays in the map box, under the frame: it shows while the map
 * loads (or when frames are off) and comes to the front when focused from the keyboard.
 * Used by blocks/columns (cells) and scripts/corp.js (default content).
 */

// source map zoom (www.stryker.com components.min.js: Maps Embed API `zoom=15`)
const ZOOM = '15';

/**
 * The address of a Google Maps search link, or '' when the link is not one.
 * @param {HTMLAnchorElement} a The link
 * @returns {string} The address (`q`)
 */
function mapsQuery(a) {
  try {
    const url = new URL(a.href);
    const isMaps = /^(www\.)?google\.com$/i.test(url.hostname)
      && url.pathname.replace(/\/+$/, '') === '/maps';
    return isMaps ? (url.searchParams.get('q') || '').trim() : '';
  } catch {
    return '';
  }
}

/**
 * Replaces each lone Google Maps link paragraph with an embedded map.
 * @param {Element} root The element to search
 * @param {string} selector The paragraphs to consider (default: any paragraph)
 */
export default function decorateMapLinks(root, selector = 'p') {
  root.querySelectorAll(selector).forEach((p) => {
    const a = p.querySelector(':scope > a[href]:only-child');
    if (!a || p.textContent.trim() !== a.textContent.trim()) return;
    const query = mapsQuery(a);
    if (!query) return;

    const src = new URL('https://maps.google.com/maps');
    src.searchParams.set('q', query);
    src.searchParams.set('z', ZOOM);
    src.searchParams.set('output', 'embed');

    const iframe = document.createElement('iframe');
    iframe.src = src.href;
    iframe.title = a.textContent.trim() || query;
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'no-referrer-when-downgrade';

    // a new <p> (not a div: in a section a classed div would be taken for a block) in place
    // of the authored one, so no editable mount point remains over the map
    const wrapper = document.createElement('p');
    wrapper.className = 'map-embed';
    wrapper.append(a, iframe);
    p.replaceWith(wrapper);
  });
}
