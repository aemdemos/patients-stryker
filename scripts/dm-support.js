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

// YouTube signatures (watch, short youtu.be, and privacy-friendly nocookie embeds)
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i;

// hls.js — lazy-loaded only when a DM video needs it (Chrome/Firefox lack native
// HLS). Pinned version, loaded from jsDelivr on demand. The Subresource
// Integrity hash pins the exact bytes: the browser refuses to run the script if
// the CDN response is tampered with (crossorigin is required for SRI on a
// cross-origin script). Regenerate on version bump:
//   curl -sL <HLS_JS_URL> | openssl dgst -sha384 -binary | openssl base64 -A
const HLS_JS_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
const HLS_JS_SRI = 'sha384-9v3HcdYrO3D+OPDTjZ40RXocgE4GtXVCd3/mCS62JsM93JXgI1afJVuwjFvsu6ni';
let hlsJsPromise;

/**
 * True when a URL points at a Dynamic Media asset (Scene7/OpenAPI image or DM
 * video). Blocks use this to leave DM elements untouched — dm-support.js has
 * already rendered them at native quality, so re-optimizing would degrade them.
 * @param {string} src the image/link/media URL
 * @returns {boolean}
 */
export function isDMSrc(src) {
  return !!src && (
    DM_SCENE7.test(src) || DM_OPENAPI.test(src) || DM_VIDEO.test(src) || VIDEO_EXT.test(src)
  );
}

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
  'a[href*="youtube.com"]',
  'a[href*="youtube-nocookie.com"]',
  'a[href*="youtu.be"]',
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
 * Transparent assets (a `$..._png$` preset or an explicit `fmt=png`) are served
 * as PNG so transparency is preserved — forcing jpeg would flatten it to white.
 */
function renderScene7(src, alt, eager) {
  // decode first so a percent-encoded preset ($..._png$ arrives as %24..._png%24
  // from a href) is matched as well as the literal form and an explicit fmt=png
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch { /* leave as-is on bad escape */ }
  const png = /\$[^$]*png[^$]*\$|fmt=png/i.test(decoded);
  const fmt = png ? 'png-alpha' : 'jpeg';
  const type = png ? 'image/png' : 'image/jpeg';
  const picture = document.createElement('picture');
  BREAKPOINTS.forEach((br, i) => {
    const srcset = withParams(src, { wid: br.width, fmt, fit: 'constrain' });
    if (i < BREAKPOINTS.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.media = br.media;
      source.type = type;
      source.srcset = srcset;
      picture.append(source);
    } else {
      const img = document.createElement('img');
      img.loading = eager ? 'eager' : 'lazy';
      img.alt = alt;
      img.src = withParams(src, { wid: br.width, fmt, fit: 'constrain' });
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
      script.integrity = HLS_JS_SRI;
      script.crossOrigin = 'anonymous';
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
  video.className = 'dm-video';
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  // sizing/appearance lives in CSS (.dm-video in styles/lazy-styles.css) so it
  // can be adjusted without touching this script
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
 * Extract the 11-char video id from any common YouTube URL shape
 * (watch?v=, youtu.be/ID, /embed/ID, /shorts/ID). Returns '' if none.
 * @param {string} src the authored YouTube URL
 * @returns {string}
 */
function youTubeId(src) {
  try {
    const url = new URL(src, window.location.href);
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const m = url.pathname.match(/\/(?:embed|shorts|v)\/([\w-]{11})|^\/([\w-]{11})$/);
    return (m && (m[1] || m[2])) || '';
  } catch {
    return '';
  }
}

/**
 * Build a click-to-load YouTube facade: a responsive 16:9 box showing the poster
 * thumbnail and a play button, with the real iframe injected only on activation.
 * This keeps YouTube's heavy player JS off the initial load (better performance
 * and privacy) while matching the reference's embedded-video layout.
 * @param {string} src the authored YouTube URL
 * @param {string} label optional accessible label (from link title/text)
 * @returns {HTMLElement}
 */
function renderYouTube(src, label) {
  const id = youTubeId(src);
  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';
  if (!id) return wrapper;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-embed-play';
  button.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');

  const poster = document.createElement('img');
  poster.className = 'video-embed-poster';
  poster.loading = 'lazy';
  poster.alt = label || '';
  poster.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  button.append(poster);

  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'video-embed-iframe';
    // nocookie host + autoplay on click; rel=0 limits related videos
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    // match YouTube's own recommended embed attributes so the player attributes
    // the embed to our origin (avoids some "confirm you're human" gates) and gets
    // the full capability set. `allow` grants fullscreen, so no allowfullscreen attr.
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.title = label || 'YouTube video player';
    wrapper.replaceChildren(iframe);
  });

  wrapper.append(button);
  return wrapper;
}

/**
 * Pick the renderer for a DM URL, or null if it isn't a DM asset.
 */
function dmRendererFor(src) {
  if (YOUTUBE.test(src)) return renderYouTube;
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

    // For links we support two authoring styles: a bare autolink whose visible
    // text is the URL, and a link with custom display text (e.g. "image1"). The
    // display text becomes the alt/label so authors can describe the asset
    // inline. Skip anchors that already wrap media (an authored <picture>/<img>/
    // <video>) — those are not "type the URL" DM embeds and converting would
    // destroy authored content.
    let displayText = '';
    if (el.tagName === 'A') {
      if (el.querySelector('picture, img, video, source')) return;
      const text = el.textContent.trim();
      if (text && text !== src) displayText = text;
    }

    if (render === renderVideo || render === renderYouTube) {
      el.replaceWith(render(src, el.getAttribute('title') || displayText));
      return;
    }
    const alt = el.getAttribute('alt') || el.getAttribute('title') || displayText;
    el.replaceWith(render(src, alt, false));
  });
}
