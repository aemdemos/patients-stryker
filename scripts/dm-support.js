/*
 * Dynamic Media (DM) image support — lightweight, in-repo, block-agnostic.
 *
 * Authors add a DM image as a LINK to its URL (not an image upload); this keeps
 * Edge Delivery from ingesting/rehosting it. On decoration we convert any such
 * link (or a bare DM <img>) into a responsive <picture> that points at the
 * original external DM source.
 *
 * Detection is host-independent — it matches DM URL path patterns rather than a
 * specific hostname, covering both Scene7/classic DM and DM OpenAPI delivery.
 */

// host-independent DM URL signatures
const DM_SCENE7 = /\/is\/image\//i;
const DM_OPENAPI = /\/adobe\/assets\//i;

/**
 * True when a URL points at a Dynamic Media asset (Scene7 or OpenAPI delivery).
 * Blocks use this to leave DM <picture> elements untouched — dm-support.js has
 * already rendered them at native quality, so re-optimizing would degrade them.
 * @param {string} src the image/link URL
 * @returns {boolean}
 */
export function isDMSrc(src) {
  return !!src && (DM_SCENE7.test(src) || DM_OPENAPI.test(src));
}

// narrow selector so non-DM pages skip the work and DM pages only visit DM
// nodes (avoids iterating every anchor/image on the page)
const DM_SELECTOR = [
  'a[href*="/is/image/"]',
  'a[href*="/adobe/assets/"]',
  'img[src*="/is/image/"]',
  'img[src*="/adobe/assets/"]',
].join(',');

// responsive widths shared by both renderers (desktop + mobile)
const BREAKPOINTS = [
  { media: '(min-width: 600px)', width: 2000 },
  { width: 750 },
];

/**
 * Append query params to a DM URL without dropping existing ones.
 * @param {string} src base image URL
 * @param {Record<string, string|number>} params params to set
 * @returns {string} the URL string with params applied
 */
function withParams(src, params) {
  const url = new URL(src, window.location.href);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

/**
 * Build a <picture> for a Scene7 / classic DM URL.
 * fit=constrain keeps the image proportional (Scene7 otherwise upscales width
 * and clips height to the asset's native box, distorting the aspect ratio).
 */
function renderScene7(src, alt, eager) {
  const picture = document.createElement('picture');
  BREAKPOINTS.forEach((br, i) => {
    const srcset = withParams(src, { wid: br.width, fmt: 'jpeg', fit: 'constrain' });
    if (i < BREAKPOINTS.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.media = br.media;
      source.type = 'image/jpeg';
      source.srcset = srcset;
      picture.append(source);
    } else {
      const img = document.createElement('img');
      img.loading = eager ? 'eager' : 'lazy';
      img.alt = alt;
      img.src = withParams(src, { wid: br.width, fit: 'constrain' });
      picture.append(img);
    }
  });
  return picture;
}

/**
 * Build a <picture> for a DM OpenAPI delivery URL (avif, width param).
 */
function renderOpenAPI(src, alt, eager) {
  const picture = document.createElement('picture');
  BREAKPOINTS.forEach((br, i) => {
    const srcset = withParams(src, { width: br.width });
    if (i < BREAKPOINTS.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.media = br.media;
      source.type = 'image/avif';
      source.srcset = srcset;
      picture.append(source);
    } else {
      const img = document.createElement('img');
      img.loading = eager ? 'eager' : 'lazy';
      img.alt = alt;
      img.src = srcset;
      picture.append(img);
    }
  });
  return picture;
}

/**
 * Pick the renderer for a DM URL, or null if it isn't a DM image.
 */
function dmRendererFor(src) {
  if (DM_OPENAPI.test(src)) return renderOpenAPI;
  if (DM_SCENE7.test(src)) return renderScene7;
  return null;
}

/**
 * Replace authored DM links/images anywhere in `main` with optimized <picture>.
 * @param {Element} main the container to decorate
 */
export default function decorateDMImages(main) {
  main.querySelectorAll(DM_SELECTOR).forEach((el) => {
    const src = el.tagName === 'A' ? el.getAttribute('href') : el.getAttribute('src');
    if (!src) return;
    const render = dmRendererFor(src);
    if (!render) return;
    // for links, only convert autolinks whose visible text is the URL itself
    if (el.tagName === 'A' && el.textContent.trim() !== src) return;

    const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
    el.replaceWith(render(src, alt, false));
  });
}
