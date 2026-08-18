/*
 * Video block — unified video handling (issue #98).
 *
 * Authoring: a single cell holding a LINK to the video. The block detects the
 * source from the URL and renders the matching player, all behind a lightweight
 * click-to-load facade (poster + play button) so no heavy player JS or cookies
 * load until the user presses play.
 *
 * Source dispatch (see renderFor):
 *   - YouTube (youtube.com / youtu.be / youtube-nocookie.com) → nocookie iframe
 *     facade. IMPLEMENTED (this PR — the sinusitis page's only video).
 *   - Scene7 Dynamic Media (/is/content/) → native <video>/HLS. NOT YET here:
 *     that path still lives in scripts/dm-support.js (renderVideo, with hls.js).
 *     The seam below is where it plugs in when #98's DM consolidation lands, so
 *     the block can own both without a redesign. Until then dm-support keeps it.
 *
 * DOM APIs only (Hard Rule #1). Styling lives in blocks/video/video.css.
 */

// YouTube link signatures (watch, short youtu.be, and nocookie embeds).
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i;

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
 * Build a click-to-load YouTube facade for a video id: a 16:9 box with the poster
 * thumbnail + play button; the real player iframe is injected only on click and
 * fills the same box, so there is no layout shift.
 * @param {string} id the 11-char YouTube video id
 * @param {string} label optional accessible label (from link title/text)
 * @returns {HTMLElement}
 */
function renderYouTube(id, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';

  // poster thumbnail — prefer the native 16:9 maxresdefault (1280×720) so it fills
  // the 16:9 box crisply; not every video has maxres, so fall back to sddefault
  // (640×480) then hqdefault (480×360) on load error. The 4:3 fallbacks are cropped
  // to 16:9 by CSS (object-fit: cover).
  const poster = document.createElement('img');
  poster.className = 'video-embed-poster';
  poster.loading = 'lazy';
  // decorative: always empty alt. The play button ("Play video…") and the "Watch on
  // YouTube" link already convey purpose, so the poster adds no information — an
  // empty alt is the correct a11y treatment and avoids echoing the label/URL.
  poster.alt = '';
  // intrinsic 16:9 size of maxresdefault; the poster is absolutely positioned (out
  // of flow) so it can't cause CLS, but explicit dimensions keep the aspect ratio
  // intrinsic and satisfy the unsized-image lint/audit
  poster.width = 1280;
  poster.height = 720;
  // graceful fallback chain: maxres → sd → hq. Missing sizes fail two ways:
  // a network error, OR (for maxresdefault) a 200 response carrying a 120×90 grey
  // placeholder. So advance on either an error event or a suspiciously tiny natural
  // width once the image has loaded.
  const posterFallbacks = ['sddefault', 'hqdefault'];
  const advance = () => {
    const next = posterFallbacks.shift();
    if (next) poster.src = `https://i.ytimg.com/vi/${id}/${next}.jpg`;
  };
  poster.addEventListener('error', advance);
  poster.addEventListener('load', () => {
    // 120px wide is YouTube's "not available" placeholder — keep falling back
    if (poster.naturalWidth && poster.naturalWidth <= 120) advance();
  });
  poster.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-embed-play';
  button.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');

  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'video-embed-iframe';
    // nocookie host + autoplay on click; rel=0 limits related videos
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    // match YouTube's recommended embed attributes; `allow` grants fullscreen so
    // no separate allowfullscreen attribute is needed
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.title = label || 'YouTube video player';
    wrapper.replaceChildren(iframe);
  });

  // static "Watch on [YouTube logo]" corner link, mirroring the native player's
  // chrome — a plain anchor, no data/network cost, opens on YouTube
  const watch = document.createElement('a');
  watch.className = 'video-embed-watch';
  watch.href = `https://www.youtube.com/watch?v=${id}`;
  watch.target = '_blank';
  watch.rel = 'noopener';
  const watchText = document.createElement('span');
  watchText.className = 'video-embed-watch-text';
  watchText.textContent = 'Watch on';
  const logo = document.createElement('img');
  logo.className = 'video-embed-watch-logo';
  logo.src = `${window.hlx.codeBasePath}/icons/youtube.svg`;
  logo.alt = 'YouTube';
  logo.loading = 'lazy';
  watch.append(watchText, logo);

  wrapper.append(poster, button, watch);
  return wrapper;
}

/**
 * Pick a renderer for an authored video URL. Returns the rendered element, or
 * null if the URL isn't a video source this block handles yet.
 * @param {string} src the authored video URL
 * @param {string} label optional accessible label
 * @returns {HTMLElement|null}
 */
function renderFor(src, label) {
  if (YOUTUBE.test(src)) {
    const id = youTubeId(src);
    return id ? renderYouTube(id, label) : null;
  }
  // SEAM: Scene7 DM (/is/content/) → native <video>/HLS goes here when #98's
  // DM-video consolidation moves it out of scripts/dm-support.js. Dispatching on
  // src keeps that a pure addition (no restructure of the YouTube path above).
  return null;
}

/**
 * loads and decorates the video block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;

  const src = link.getAttribute('href');
  // Derive an accessible label: prefer an explicit title, else custom display
  // text. A bare autolink's text is the URL itself — never use a URL as the label
  // (it would leak the href into alt/aria). Compare normalized hrefs, and reject
  // any text that parses as an http(s) URL, so entity/encoding differences between
  // textContent and the href attribute can't slip a raw URL through.
  const text = link.textContent.trim();
  const isUrlText = (() => {
    try { return /^https?:$/.test(new URL(text, window.location.href).protocol) && /^https?:\/\//i.test(text); } catch { return false; }
  })();
  const label = link.getAttribute('title') || (text && !isUrlText ? text : '');

  const player = renderFor(src, label);
  if (player) block.replaceChildren(player);
}
