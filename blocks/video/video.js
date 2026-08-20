/*
 * Video block. Authored as a single cell holding a link to the video; the block
 * detects the source from the URL and renders the matching player:
 *   - YouTube → click-to-load nocookie iframe facade.
 *   - Dynamic Media / video file → native <video>, via dm-support's renderVideo.
 */

import { isDMVideoSrc, renderVideo } from '../../scripts/dm-support.js';

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
 * Build a click-to-load YouTube facade: a 16:9 box with the poster thumbnail +
 * play button; the real iframe is injected on click and fills the same box.
 * @param {string} id the 11-char YouTube video id
 * @param {string} label optional accessible label (from link title/text)
 * @returns {HTMLElement}
 */
function renderYouTube(id, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';

  // poster thumbnail
  const poster = document.createElement('img');
  poster.className = 'video-embed-poster';
  poster.loading = 'lazy';
  poster.alt = ''; // decorative — the play button and watch link convey purpose
  poster.width = 1280;
  poster.height = 720;
  // fallback chain maxres → sd → hq: advance on a load error, or on the 120×90
  // grey placeholder YouTube serves (with a 200) for a missing size
  const posterFallbacks = ['sddefault', 'hqdefault'];
  const advance = () => {
    const next = posterFallbacks.shift();
    if (next) poster.src = `https://i.ytimg.com/vi/${id}/${next}.jpg`;
  };
  poster.addEventListener('error', advance);
  poster.addEventListener('load', () => {
    if (poster.naturalWidth && poster.naturalWidth <= 120) advance();
  });
  poster.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-embed-play';
  button.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');

  // load the real player on click
  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'video-embed-iframe';
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.title = label || 'YouTube video player';
    wrapper.replaceChildren(iframe);
  });

  // "Watch on YouTube" corner link
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
 * Pick a renderer for an authored video URL, or null if unsupported.
 * @param {string} src the authored video URL
 * @param {string} label optional accessible label
 * @returns {HTMLElement|null}
 */
function renderFor(src, label) {
  if (YOUTUBE.test(src)) {
    const id = youTubeId(src);
    return id ? renderYouTube(id, label) : null;
  }
  if (isDMVideoSrc(src)) return renderVideo(src, label);
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
  // accessible label: prefer the link title, else its display text — but never a
  // bare URL (a plain autolink's text is the URL itself, which shouldn't leak into
  // alt/aria)
  const text = link.textContent.trim();
  const isUrlText = (() => {
    try { return /^https?:$/.test(new URL(text, window.location.href).protocol) && /^https?:\/\//i.test(text); } catch { return false; }
  })();
  const label = link.getAttribute('title') || (text && !isUrlText ? text : '');

  const player = renderFor(src, label);
  if (player) block.replaceChildren(player);
}
