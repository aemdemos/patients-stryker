/*
 * Dynamic Media (DM) support — lightweight, in-repo, block-agnostic.
 *
 * Authors add a DM asset as a LINK to its URL (not an upload); this keeps Edge
 * Delivery from ingesting/rehosting it. On decoration we convert any such link
 * (or a bare DM <img>) into the right native element pointing at the original
 * external DM source:
 *   - images  -> responsive <picture>
 *   - videos  -> native <video> with controls (+ optional poster)
 *
 * Detection is host-independent — it matches DM URL path patterns rather than a
 * specific hostname, covering Scene7/classic DM and DM OpenAPI delivery.
 */

// host-independent DM image URL signatures
const DM_SCENE7 = /\/is\/image\//i;
const DM_OPENAPI = /\/adobe\/assets\//i;

// DM / streaming video signatures: Scene7 video delivery (/is/content/) and
// common video containers / streaming manifests
const DM_VIDEO = /\/is\/content\//i;
const VIDEO_EXT = /\.(m3u8|mpd|mp4|webm|mov)(\?|$)/i;

// hls.js — lazy-loaded only when a DM video needs it (Chrome/Firefox lack native
// HLS). Pinned version, loaded from jsDelivr on demand.
const HLS_JS_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
let hlsJsPromise;

// narrow selector so non-DM pages skip the work and DM pages only visit DM
// nodes (avoids iterating every anchor/image on the page)
const DM_SELECTOR = [
  'a[href*="/is/image/"]',
  'a[href*="/adobe/assets/"]',
  'a[href*="/is/content/"]',
  'a[href*=".m3u8"]',
  'a[href*=".mpd"]',
  'a[href*=".mp4"]',
  'a[href*=".webm"]',
  'a[href*=".mov"]',
  'img[src*="/is/image/"]',
  'img[src*="/adobe/assets/"]',
].join(',');

// responsive widths shared by both image renderers (desktop + mobile)
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
 * Best-effort MIME type for a <source>, so the browser can skip unplayable
 * sources. Empty string (Scene7 /is/content/ progressive) lets it sniff.
 */
function videoTypeFor(src) {
  if (/\.m3u8(\?|$)/i.test(src)) return 'application/vnd.apple.mpegurl';
  if (/\.mpd(\?|$)/i.test(src)) return 'application/dash+xml';
  if (/\.webm(\?|$)/i.test(src)) return 'video/webm';
  if (/\.mov(\?|$)/i.test(src)) return 'video/quicktime';
  if (/\.mp4(\?|$)/i.test(src)) return 'video/mp4';
  return '';
}

/**
 * Prefer an HLS (.m3u8) source: DASH (.mpd) cannot play in a native <video> in
 * any browser, and Scene7 serves the same asset as HLS at the same path. HLS
 * plays natively on Safari/iOS and via hls.js elsewhere.
 * @param {string} src media URL (poster already stripped)
 * @returns {string} an .m3u8 URL when the source is a Scene7 .mpd, else src
 */
function preferHls(src) {
  return src.replace(/\.mpd(\?|$)/i, '.m3u8$1');
}

/**
 * Lazy-load hls.js once, on demand.
 * @returns {Promise<any>} the Hls global (or null if it fails to load)
 */
function loadHlsJs() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (!hlsJsPromise) {
    hlsJsPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = HLS_JS_URL;
      script.async = true;
      script.onload = () => resolve(window.Hls || null);
      script.onerror = () => resolve(null);
      document.head.append(script);
    });
  }
  return hlsJsPromise;
}

/**
 * Attach an HLS source to a <video>: native playback where supported (Safari/
 * iOS), otherwise hls.js. Falls back to a plain <source> if hls.js is
 * unavailable so at least native-HLS browsers still work.
 * @param {HTMLVideoElement} video
 * @param {string} src an .m3u8 URL
 */
function attachHls(video, src) {
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
    return;
  }
  loadHlsJs().then((Hls) => {
    if (Hls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src; // last resort — lets native-HLS UAs still try
    }
  });
}

/**
 * Build a native <video> for a DM / streaming video URL.
 * An optional poster frame is supported via a `poster` query param on the
 * authored URL (its value is a poster image URL); it is applied to the
 * <video poster> and stripped from the media source.
 * @param {string} src the authored video URL
 * @param {string} label optional accessible label (from link title)
 * @returns {HTMLVideoElement}
 */
function renderVideo(src, label) {
  const url = new URL(src, window.location.href);
  const poster = url.searchParams.get('poster');
  if (poster) url.searchParams.delete('poster');
  const mediaSrc = url.toString();

  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  // Size the box from a fixed aspect ratio, not from the media's intrinsic size.
  // Otherwise the element sizes to the poster before play (e.g. 750x422) then
  // jumps to the video's intrinsic size on play (e.g. 640x360). object-fit
  // keeps the frame filling the box; block-agnostic (no external CSS needed).
  video.style.width = '100%';
  video.style.height = 'auto';
  video.style.aspectRatio = '16 / 9';
  video.style.objectFit = 'cover';
  if (poster) video.poster = poster;
  if (label) video.setAttribute('aria-label', label);

  const hlsSrc = preferHls(mediaSrc);
  if (/\.m3u8(\?|$)/i.test(hlsSrc)) {
    // HLS (incl. Scene7 .mpd rewritten to .m3u8): native or hls.js
    attachHls(video, hlsSrc);
  } else {
    // progressive/other container the browser can play directly
    const source = document.createElement('source');
    source.src = mediaSrc;
    const type = videoTypeFor(mediaSrc);
    if (type) source.type = type;
    video.append(source);
  }
  return video;
}

/**
 * Pick the renderer for a DM URL, or null if it isn't a DM asset.
 */
function dmRendererFor(src) {
  if (DM_VIDEO.test(src) || VIDEO_EXT.test(src)) return renderVideo;
  if (DM_OPENAPI.test(src)) return renderOpenAPI;
  if (DM_SCENE7.test(src)) return renderScene7;
  return null;
}

/**
 * Replace authored DM links/images anywhere in `main` with the matching native
 * element (<picture> for images, <video> for videos).
 * @param {Element} main the container to decorate
 */
export default function decorateDMAssets(main) {
  main.querySelectorAll(DM_SELECTOR).forEach((el) => {
    const src = el.tagName === 'A' ? el.getAttribute('href') : el.getAttribute('src');
    if (!src) return;
    const render = dmRendererFor(src);
    if (!render) return;
    // for links, only convert autolinks whose visible text is the URL itself
    if (el.tagName === 'A' && el.textContent.trim() !== src) return;

    if (render === renderVideo) {
      el.replaceWith(renderVideo(src, el.getAttribute('title') || ''));
      return;
    }
    const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
    el.replaceWith(render(src, alt, false));
  });
}
