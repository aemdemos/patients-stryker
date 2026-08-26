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

// Scene7 /is/content/ also serves still/animated IMAGES (e.g. GIFs) when
// addressed with an image sizing preset ($..width..$) or a .gif extension,
// rather than a video manifest/extension. These must render as <img> (which
// preserves GIF animation) instead of <video>. Kept separate so genuine DM
// video handling below is unchanged.
const DM_IMAGE_PRESET = /\$[^$]*width[^$]*\$/i;

/** Decode a percent-encoded href/src ($..$ presets arrive encoded from anchors). */
function decodeSrc(src) {
  try { return decodeURIComponent(src); } catch { return src; }
}

/**
 * True when a /is/content/ URL is actually an image (e.g. a GIF) — identified by
 * an image sizing preset or a .gif extension, and the absence of a video
 * extension. Used to route these to the image renderer instead of <video>.
 * @param {string} src the link/media URL
 * @returns {boolean}
 */
function isDMContentImage(src) {
  if (!DM_VIDEO.test(src) || VIDEO_EXT.test(src)) return false;
  const decoded = decodeSrc(src);
  return DM_IMAGE_PRESET.test(decoded) || /\.gif(\?|$)/i.test(decoded);
}

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

/**
 * True when a URL is a DM / streaming VIDEO (Scene7 /is/content/ or a video
 * container/manifest). The video block uses this to route DM video URLs to the
 * native <video> renderer (issue #98's unified handling), while dm-support.js
 * still converts bare DM autolinks elsewhere on the page.
 * @param {string} src the link/media URL
 * @returns {boolean}
 */
export function isDMVideoSrc(src) {
  return !!src && (DM_VIDEO.test(src) || VIDEO_EXT.test(src));
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
 * Reserve layout space (prevent CLS) by giving an <img> intrinsic width/height
 * attributes derived from the DM URL, when the dimensions are encoded there:
 *   - a Scene7 sizing preset "$preset_666_392$"  → 666 x 392
 *   - a filename dimension suffix "…-1024x576"    → 1024 x 576
 * The browser uses width/height only for the aspect-ratio box it reserves; the
 * global `main img { width: auto; height: auto; max-width: 100% }` rule keeps the
 * image fully responsive, so these attributes never distort or hard-size it.
 * No-op when no reliable dimensions can be parsed.
 * @param {HTMLImageElement} img the image to annotate
 * @param {string} src the DM URL the dimensions are read from
 */
function setIntrinsicSize(img, src) {
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch { /* leave as-is */ }
  // Scene7 preset: $preset_<W>_<H>$ (dimensions given as width_height)
  let m = /\$preset_(\d+)_(\d+)\$/i.exec(decoded);
  // filename dimension suffix: <W>x<H> before any query/preset (e.g. -1024x576)
  if (!m) m = /[_-](\d{2,5})x(\d{2,5})(?:[^\d]|$)/i.exec(decoded.split('?')[0]);
  if (m) {
    const w = Number(m[1]);
    const h = Number(m[2]);
    if (w && h) {
      img.setAttribute('width', String(w));
      img.setAttribute('height', String(h));
      return;
    }
  }
  // Fallback for URLs that don't encode dimensions (e.g. $max_width_1440$): once
  // the image loads, stamp its intrinsic size so the aspect-ratio box is locked
  // for any later layout pass. This can't prevent the first paint's shift, but it
  // avoids extra pre-load network calls (the Scene7 image API would add one per
  // image). Skip if a load already set natural dimensions synchronously.
  const stamp = () => {
    if (img.naturalWidth && img.naturalHeight && !img.hasAttribute('width')) {
      img.setAttribute('width', String(img.naturalWidth));
      img.setAttribute('height', String(img.naturalHeight));
    }
  };
  if (img.complete && img.naturalWidth) stamp();
  else img.addEventListener('load', stamp, { once: true });
}

/**
 * Append a single `key=value` pair to a URL's query string verbatim, without
 * parsing/re-serializing the rest of it. Scene7 preset flags (e.g.
 * `$max_width_png$`, a bare key with no `=`) get corrupted by a `URL`/
 * `URLSearchParams` round trip — `$` is percent-encoded to `%24` and the
 * valueless key is normalized to `key=`. A plain string append leaves the
 * authored query string untouched.
 * @param {string} src base image URL
 * @param {string} key param name
 * @param {string} value param value
 * @returns {string} the URL string with the param appended
 */
function appendParam(src, key, value) {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}${key}=${value}`;
}

/**
 * Build a <picture> for a Scene7 / classic DM URL, using the authored URL
 * unchanged so the asset renders exactly as linked (no forced resizing/format).
 * The one exception: a transparent asset (a `$..._png$` preset or an explicit
 * `fmt=png`) gets `fmt=png-alpha` appended — Scene7's default delivery format
 * otherwise flattens transparency to a white background.
 */
function renderScene7(src, alt, eager) {
  // decode first so a percent-encoded preset ($..._png$ arrives as %24..._png%24
  // from a href) is matched as well as the literal form and an explicit fmt=png
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch { /* leave as-is on bad escape */ }
  const png = /\$[^$]*png[^$]*\$|fmt=png/i.test(decoded);
  const finalSrc = png ? appendParam(src, 'fmt', 'png-alpha') : src;
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.loading = eager ? 'eager' : 'lazy';
  img.alt = alt;
  img.src = finalSrc;
  setIntrinsicSize(img, decoded);
  picture.append(img);
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
      setIntrinsicSize(img, src);
      picture.append(img);
    }
  });
  return picture;
}

/**
 * Build a <picture> for a Scene7 /is/content/ IMAGE (e.g. an animated GIF).
 * The original URL is used unchanged so GIF animation is preserved — unlike the
 * Scene7 renderer, this never forces jpeg/png (which would freeze the animation)
 * and never rewrites the sizing preset.
 * @param {string} src the authored image URL
 * @param {string} alt accessible text
 * @param {boolean} eager whether to eager-load
 * @returns {HTMLPictureElement}
 */
function renderContentImage(src, alt, eager) {
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.loading = eager ? 'eager' : 'lazy';
  img.alt = alt;
  img.src = src;
  setIntrinsicSize(img, src);
  picture.append(img);
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
 * Attach an HLS source to a <video>.
 *
 * Prefer hls.js (software demux + JS-controlled ABR) wherever it's supported —
 * including Safari/iOS, which also has native HLS. Native HLS on macOS Safari
 * hands decoding to VideoToolbox, which can hard-fail on certain Scene7
 * renditions (PIPELINE_ERROR_DECODE / VTDecompressionOutputCallback -12909),
 * stalling playback a few seconds in; hls.js decodes in software and avoids that
 * path. Native HLS is kept only as the fallback for browsers where hls.js can't
 * run (e.g. older iOS Safari, which lacks Media Source Extensions).
 * @param {HTMLVideoElement} video
 * @param {string} src an .m3u8 URL
 */
function attachHls(video, src) {
  loadHlsJs().then((Hls) => {
    if (Hls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // no MSE / hls.js unavailable — fall back to the browser's native HLS
      video.src = src;
    }
  });
}

/**
 * Build a native <video> (wrapped with a centered play-icon overlay) for a DM /
 * streaming video URL. An optional poster frame is supported via a `poster` query
 * param on the authored URL (its value is a poster image URL); it is applied to the
 * <video poster> and stripped from the media source.
 * @param {string} src the authored video URL
 * @param {string} label optional accessible label (from link title)
 * @returns {HTMLElement} a wrapper div containing the <video> and the play overlay
 */
export function renderVideo(src, label) {
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

  // wrap the video with a centered play-icon overlay (with or without a poster):
  // it sits over the frame before playback and fades out/in as the video is
  // played/paused, mirroring the source's Scene7 viewer. The overlay layer itself
  // is click-through (pointer-events:none) so the native controls stay usable; only
  // the centered button captures clicks. Styling lives in styles/lazy-styles.css.
  const wrapper = document.createElement('div');
  wrapper.className = 'dm-video-wrapper';

  const overlay = document.createElement('div');
  overlay.className = 'dm-video-overlay';
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'dm-video-play';
  play.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');
  play.addEventListener('click', () => { video.play(); });
  overlay.append(play);

  // toggle the overlay from the video's own state, so it also responds when the
  // user plays/pauses via the native controls or keyboard
  video.addEventListener('play', () => wrapper.classList.add('is-playing'));
  video.addEventListener('pause', () => wrapper.classList.remove('is-playing'));
  video.addEventListener('ended', () => wrapper.classList.remove('is-playing'));

  wrapper.append(video, overlay);
  return wrapper;
}

/**
 * Pick the renderer for a DM URL, or null if it isn't a DM asset.
 */
function dmRendererFor(src) {
  // a /is/content/ image (GIF etc.) must be checked before the video branch,
  // since it shares the /is/content/ path but is not a video
  if (isDMContentImage(src)) return renderContentImage;
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

    if (render === renderVideo) {
      el.replaceWith(renderVideo(src, el.getAttribute('title') || displayText));
      return;
    }
    const alt = el.getAttribute('alt') || el.getAttribute('title') || displayText;
    el.replaceWith(render(src, alt, false));
  });
}
