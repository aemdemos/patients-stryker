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
 * Returns true if text is a full http(s) URL.
 * @param {string} text candidate label text
 * @returns {boolean}
 */
function isUrlText(text) {
  try {
    const url = new URL(text, window.location.href);
    return /^https?:$/.test(url.protocol) && /^https?:\/\//i.test(text);
  } catch {
    return false;
  }
}

/**
 * Picks a human-friendly title for the facade, never a raw URL.
 * @param {string} titleAttr link title attribute
 * @param {string} textContent link text content
 * @returns {string}
 */
function cleanVideoLabel(titleAttr, textContent) {
  const candidates = [titleAttr, textContent]
    .map((value) => (value || '').trim())
    .filter(Boolean);
  const valid = candidates.find((value) => !isUrlText(value));
  return valid || 'Stryker patient animation';
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
 * Build a click-to-load YouTube facade: a 16:9 box with the poster thumbnail +
 * play button; the real iframe is injected on click and fills the same box.
 * @param {string} id the 11-char YouTube video id
 * @param {string} label optional accessible label (from link title/text)
 * @returns {HTMLElement}
 */
function renderYouTube(id, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';

  // Render native YouTube UI immediately so pre-play and post-play controls match.
  const iframe = document.createElement('iframe');
  iframe.className = 'video-embed-iframe';
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.title = label || 'YouTube video player';
  iframe.loading = 'lazy';

  wrapper.append(iframe);
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
  if (!link) {
    // In the EW canvas the block content (the video link) can be injected after
    // decorate() first runs, so there's no link yet. Watch for it to appear, then
    // decorate. No-op on the live site, where the link is present up front.
    const observer = new MutationObserver(() => {
      if (block.querySelector('a[href]')) {
        observer.disconnect();
        decorate(block);
      }
    });
    observer.observe(block, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    });
    return;
  }

  const src = link.getAttribute('href');
  const text = link.textContent.trim();
  const label = cleanVideoLabel(link.getAttribute('title'), text);

  const player = renderFor(src, label);
  if (player) block.replaceChildren(player);
}
