/*
 * Dynamic Media (DM) support — lightweight, in-repo, block-agnostic.
 *
 * Authors add a DM asset as a LINK to its URL (not an upload); this keeps Edge
 * Delivery from ingesting/rehosting it. On decoration we convert any such link
 * (or a bare DM <img>) into the right native element pointing at the original
 * external DM source:
 *   - images  -> responsive <picture>
 *   - videos  -> native <video> with custom controls (+ optional poster)
 *
 * Detection is host-independent — it matches DM URL path patterns rather than a
 * specific hostname, covering Scene7/classic DM and DM OpenAPI delivery.
 *
 * Publish-path images (AEM DAM delivery, `…/content/dam/….png|jpg|jpeg|gif|webp|svg`,
 * incl. PDF cover renditions `….pdf.thumb.319.319.png`) follow the same model
 * (2026-10-06, "original links" decision): authored as a LINK to the original URL,
 * rendered here as a <picture> with the same markup / loading hints. Unlike DM
 * links they are only converted when the link stands alone in its paragraph or
 * cell (a `/content/dam/x.jpg` link inside running text or a list is a document
 * link, not an embedded image). Publish-path images and the media hints below are
 * www.stryker.com (corp) behaviour: they apply only on `body.corp` pages, so other
 * pages keep the original rendering.
 */

import addVideoControls from './video-controls.js';

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

// publish-path (AEM DAM) image delivery: /content/dam/<path>.<image ext>
const PUBLISH_IMAGE = /\/content\/dam\/[^?#]+\.(png|jpe?g|gif|webp|svg)([?#]|$)/i;

/** corp (www.stryker.com) page: scripts/corp.js marks <body> before decoration */
const isCorpPage = () => document.body.classList.contains('corp');

/**
 * True when a URL is a publish-path DAM image (`/content/dam/….png` etc.).
 * @param {string} src the link/image URL
 * @returns {boolean}
 */
export function isPublishImageSrc(src) {
  return !!src && PUBLISH_IMAGE.test(src) && isCorpPage();
}

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
 * video) or a publish-path DAM image. Blocks use this to leave these elements
 * untouched — dm-support.js has already rendered them from the original source,
 * so re-optimizing (media-bus `?width=` URLs) would degrade or break them.
 * @param {string} src the image/link/media URL
 * @returns {boolean}
 */
export function isDMSrc(src) {
  return !!src && (
    DM_SCENE7.test(src) || DM_OPENAPI.test(src) || DM_VIDEO.test(src) || VIDEO_EXT.test(src)
    || isPublishImageSrc(src)
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

/**
 * A small square rendition of a Scene7 image (`/is/image/`), for thumbnails: the asset
 * path with its preset/query replaced by `fit=constrain,1&wid=<size>&hei=<size>` (the
 * request the source Scene7 viewers make for their swatches), keeping transparency for
 * PNG presets. Other URLs (OpenAPI, publish-path, video) return null.
 * @param {string} src the authored DM image URL
 * @param {number} size the box edge in px
 * @returns {string|null}
 */
export function dmThumbnailSrc(src, size) {
  if (!src || !DM_SCENE7.test(src) || DM_VIDEO.test(src)) return null;
  const [path, query = ''] = src.split('?');
  const png = /\$[^$]*png[^$]*\$|fmt=png/i.test(decodeSrc(query));
  return `${path}?fit=constrain,1&wid=${size}&hei=${size}&fmt=${png ? 'png-alpha' : 'jpg'}`;
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
  'a[href*="/content/dam/"]',
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

/**
 * Perf (P4-quality, 2026-10-04): DM presets of the form $preset_W_H$ carry the rendered box —
 * set width/height so the browser reserves the space before the image loads (CLS from the
 * link → picture swap). The first DM image decorated in <main> is the LCP candidate on most
 * templates: load it eagerly with high fetch priority instead of lazily (Lighthouse: LCP
 * 3.3–4.9 s mobile on hero/tile pages while the image was lazy and discovered after JS).
 */
let firstMediaDone = false;
function applyMediaHints(img, src, eager) {
  if (!isCorpPage()) {
    img.loading = eager ? 'eager' : 'lazy';
    return;
  }
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch { /* keep */ }
  const m = decoded.match(/\$preset_(\d+)_(\d+)\$/i);
  if (m) { img.width = Number(m[1]); img.height = Number(m[2]); }
  const first = !firstMediaDone && !eager;
  if (eager || first) {
    img.loading = 'eager';
    img.setAttribute('fetchpriority', 'high');
  } else {
    img.loading = 'lazy';
  }
  firstMediaDone = true;
}

function renderScene7(src, alt, eager) {
  // decode first so a percent-encoded preset ($..._png$ arrives as %24..._png%24
  // from a href) is matched as well as the literal form and an explicit fmt=png
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch { /* leave as-is on bad escape */ }
  const png = /\$[^$]*png[^$]*\$|fmt=png/i.test(decoded);
  const finalSrc = png ? appendParam(src, 'fmt', 'png-alpha') : src;
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  applyMediaHints(img, src, eager);
  img.alt = alt;
  img.src = finalSrc;
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
      applyMediaHints(img, src, eager);
      img.alt = alt;
      img.src = srcset;
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
  applyMediaHints(img, src, eager);
  img.alt = alt;
  img.src = src;
  picture.append(img);
  return picture;
}

/**
 * Build a <picture> for a publish-path DAM image, using the original URL
 * unchanged (no resizing params — the publish host serves the authored rendition).
 * @param {string} src the authored image URL
 * @param {string} alt accessible text
 * @param {boolean} eager whether to eager-load
 * @returns {HTMLPictureElement}
 */
function renderPublishImage(src, alt, eager) {
  return renderContentImage(src, alt, eager);
}

const INLINE_WRAPPERS = new Set(['STRONG', 'EM', 'B', 'I', 'U', 'SPAN']);

/**
 * True when a link is the only content of its paragraph / cell (through inline
 * wrappers) — the authored form of an embedded image.
 * @param {HTMLAnchorElement} a the link
 * @returns {boolean}
 */
function isStandaloneLink(a) {
  let box = a.parentElement;
  while (box && INLINE_WRAPPERS.has(box.tagName)) box = box.parentElement;
  if (!box || (box.tagName !== 'P' && box.tagName !== 'DIV')) return false;
  return box.textContent.trim() === a.textContent.trim();
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
 * Wire up an HLS source on a <video> once hls.js is available.
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
 * @returns {Promise<void>} resolves once a playable source is attached
 */
function initHls(video, src) {
  return loadHlsJs().then((Hls) => {
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
 * Attach an HLS source to a <video>, on demand only.
 *
 * hls.js is ~123KB of script that parses a manifest and spins up a demuxer, and
 * none of it produces anything visible — the poster frame is what the user sees
 * until they press play. So nothing is loaded until playback is actually
 * requested: the play overlay, a pointer/keyboard interaction with the native
 * controls, or a `play` event. A page full of videos therefore costs nothing at
 * all until one is played.
 * @param {HTMLVideoElement} video
 * @param {string} src an .m3u8 URL
 * @returns {() => Promise<void>} starts the (idempotent) attach and resolves when
 * the video has a playable source
 */
function attachHls(video, src) {
  let ready;
  const start = () => {
    if (!ready) ready = initHls(video, src);
    return ready;
  };

  // interacting with the player means playback is imminent
  ['pointerdown', 'keydown'].forEach((type) => {
    video.addEventListener(type, start, { once: true });
  });
  // a play attempt that lands before the source is attached fails silently, so
  // re-issue it once the attach completes
  video.addEventListener('play', () => {
    const pending = !ready;
    start().then(() => {
      if (pending && video.paused) video.play().catch(() => {});
    });
  });

  return start;
}

/**
 * Read an HLS stream's total length from its playlists (a couple of KB of text,
 * no hls.js), so the controls can show "0:00 / 2:16" before playback the way the
 * source viewer does. Follows the first variant of a master playlist.
 * @param {string} src an .m3u8 URL
 * @returns {Promise<number>} duration in seconds, or NaN if it can't be read
 */
function hlsDuration(src) {
  const text = (url) => fetch(url).then((res) => (res.ok ? res.text() : ''));
  const sum = (playlist) => [...playlist.matchAll(/#EXTINF:([\d.]+)/g)]
    .reduce((total, [, seconds]) => total + Number(seconds), 0) || NaN;
  return text(src).then((playlist) => {
    if (playlist.includes('#EXTINF:')) return sum(playlist);
    const variant = playlist.split('\n').map((line) => line.trim())
      .find((line) => line && !line.startsWith('#'));
    return variant ? text(new URL(variant, src).href).then(sum) : NaN;
  }).catch(() => NaN);
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
  let poster = url.searchParams.get('poster');
  if (poster) url.searchParams.delete('poster');
  // a poster URL with its own query (`…/image?fit=constrain,1&wid=909&hei=511`) is
  // authored unencoded, so its `&wid…` params split off as video params: when the
  // poster value has a `?`, everything after `poster=` belongs to the poster
  if (poster?.includes('?')) {
    const at = src.search(/[?&]poster=/);
    poster = src.slice(src.indexOf('=', at) + 1);
    const rest = new URL(src.slice(0, at), window.location.href);
    url.search = rest.search;
  }
  const mediaSrc = url.toString();

  const video = document.createElement('video');
  video.className = 'dm-video';
  video.playsInline = true;
  // with a poster there is nothing to show before playback, so skip the metadata
  // fetch entirely; without one, `metadata` gives the browser a first frame
  video.preload = poster ? 'none' : 'metadata';
  // sizing/appearance lives in CSS (.dm-video in styles/lazy-styles.css) so it
  // can be adjusted without touching this script
  if (poster) video.poster = poster;
  if (label) video.setAttribute('aria-label', label);

  const hlsSrc = preferHls(mediaSrc);
  let startMedia = () => Promise.resolve();
  let loadDuration = null;
  if (/\.m3u8(\?|$)/i.test(hlsSrc)) {
    // HLS (incl. Scene7 .mpd rewritten to .m3u8): native or hls.js
    startMedia = attachHls(video, hlsSrc);
    loadDuration = () => hlsDuration(hlsSrc);
  } else {
    // progressive/other container the browser can play directly
    const source = document.createElement('source');
    source.src = mediaSrc;
    const type = videoTypeFor(mediaSrc);
    if (type) source.type = type;
    video.append(source);
  }

  // the HLS source is attached lazily, so make sure it is there before playing
  const playVideo = () => startMedia().then(() => video.play().catch(() => {}));

  // wrap the video with a centered play-icon overlay (with or without a poster):
  // it sits over the frame before playback and fades out/in as the video is
  // played/paused, mirroring the source's Scene7 viewer. The overlay layer itself
  // is click-through (pointer-events:none) so clicks reach the video; only the
  // centered button captures them. Styling lives in styles/lazy-styles.css.
  const wrapper = document.createElement('div');
  wrapper.className = 'dm-video-wrapper';

  const overlay = document.createElement('div');
  overlay.className = 'dm-video-overlay';
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'dm-video-play';
  play.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');
  play.addEventListener('click', playVideo);
  overlay.append(play);

  // toggle the overlay from the video's own state, so it also responds when the
  // user plays/pauses via the control bar or keyboard
  video.addEventListener('play', () => wrapper.classList.add('is-playing'));
  video.addEventListener('pause', () => wrapper.classList.remove('is-playing'));
  video.addEventListener('ended', () => wrapper.classList.remove('is-playing'));

  wrapper.append(video, overlay);
  // Scene7-style control bar in place of the browser's native controls
  addVideoControls(wrapper, video, playVideo, loadDuration);
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
  if (isPublishImageSrc(src)) return renderPublishImage;
  return null;
}

/**
 * Replace authored DM links/images within `root` with the matching native
 * element (<picture> for images, <video> for videos). Idempotent, so blocks can
 * re-run it on their own subtree (decorateMain runs it once page-wide).
 * @param {Element} root the container to decorate
 */
export default function decorateDMAssets(root) {
  root.querySelectorAll(DM_SELECTOR).forEach((el) => {
    // skip an <img> already in a <picture> (converted on an earlier pass) —
    // re-converting would double-append preset params like fmt=png-alpha
    if (el.tagName === 'IMG' && el.closest('picture')) return;

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
      if (render === renderPublishImage && !isStandaloneLink(el)) return;
      const text = el.textContent.trim();
      if (text && text !== src) displayText = text;
    }

    let replacement;
    if (render === renderVideo) {
      const label = el.getAttribute('title') || displayText;
      replacement = renderVideo(src, label);
    } else {
      // alt precedence: an authored alt/title, then the link's display text
      // (authors describe hero/cards images by using the alt as the link text).
      const alt = el.getAttribute('alt') || el.getAttribute('title') || displayText;
      replacement = render(src, alt, false);
    }

    el.replaceWith(replacement);
  });
}

/**
 * Move a standalone default-content DM media into a fresh <p>, so the EW canvas
 * editor (which re-renders authored elements from source) can't revert it to the
 * raw link — as cards/columns do for blocks. Identical markup on the live site.
 * @param {Element} main the container to decorate
 */
export function liftDefaultContentDMMedia(main) {
  main.querySelectorAll('picture, .dm-video-wrapper').forEach((media) => {
    if (media.tagName === 'PICTURE' && !isDMSrc(media.querySelector('img')?.getAttribute('src'))) return;
    // the authored <p> must hold only this media (runs before the editor mounts)
    const wrapper = media.parentElement;
    if (!wrapper || wrapper.tagName !== 'P' || wrapper.childElementCount !== 1
      || wrapper.textContent.trim() !== '') return;
    // only default content: the <p> must sit directly in a section
    const container = wrapper.parentElement;
    if (!container || !(container.parentElement === main
      || container.classList.contains('default-content-wrapper'))) return;
    const p = document.createElement('p');
    p.append(media);
    wrapper.replaceWith(p);
  });
}

/*
 * Experience Workspace (DA canvas) preview. The canvas re-runs decoration, then swaps
 * every authored text node for a ProseMirror editor built from the SOURCE node — for a
 * DM image that is the raw link, so the <picture> rendered above disappears. In quick-edit
 * mode only, keep the link editable (it is the image's source) and render a non-editable
 * preview of the image right before its editor, re-synced whenever the editor changes.
 * The published page never runs this.
 */
const QE_PREVIEW = 'dm-qe-preview';
const QE_LINK = 'dm-qe-link';
let qeObserver;

/**
 * @returns {boolean} true inside the DA canvas / quick-edit iframe
 */
export function isQuickEdit() {
  return new URLSearchParams(window.location.search).get('quick-edit') === 'on'
    || document.body.classList.contains('quick-edit');
}

/**
 * The DM image URL an editor holds when its only content is one DM image link.
 * @param {Element} editor a `.prosemirror-editor`
 * @returns {string|null}
 */
function editorDMImageSrc(editor) {
  const links = editor.querySelectorAll('a[href]');
  if (links.length !== 1) return null;
  const src = links[0].getAttribute('href');
  const render = dmRendererFor(src);
  if (!render || render === renderVideo) return null;
  // the link must be the whole content (an inline DM link inside prose stays a link)
  const text = editor.textContent.trim();
  return text === links[0].textContent.trim() ? src : null;
}

function syncDMEditorPreviews() {
  document.querySelectorAll(`picture.${QE_PREVIEW}`).forEach((pic) => {
    const editor = pic.nextElementSibling;
    if (!editor?.classList.contains('prosemirror-editor')
      || editorDMImageSrc(editor) !== pic.dataset.src) pic.remove();
  });
  document.querySelectorAll('main .prosemirror-editor').forEach((editor) => {
    const src = editorDMImageSrc(editor);
    editor.classList.toggle(QE_LINK, !!src);
    if (!src || editor.previousElementSibling?.dataset?.src === src) return;
    const link = editor.querySelector('a');
    const text = link.textContent.trim();
    const picture = dmRendererFor(src)(src, text !== src ? text : '', false);
    picture.classList.add(QE_PREVIEW);
    picture.dataset.src = src;
    picture.setAttribute('contenteditable', 'false');
    editor.before(picture);
  });
}

/**
 * Starts (once) the canvas preview for DM image links. Observes <body> because the
 * canvas replaces <main> on every body sync.
 */
export function previewDMLinkEditors() {
  if (qeObserver || !isQuickEdit()) return;
  let queued = false;
  qeObserver = new MutationObserver((records) => {
    // ignore our own preview insertions/removals
    const ownChange = (r) => r.type === 'childList'
      && [...r.addedNodes, ...r.removedNodes].every((n) => n.classList?.contains(QE_PREVIEW));
    if (records.every(ownChange)) return;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncDMEditorPreviews();
    });
  });
  qeObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}
