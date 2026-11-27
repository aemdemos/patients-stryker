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
 * True if the URL is a video this block can play (YouTube or Dynamic Media).
 * @param {string} src the authored URL
 * @returns {boolean}
 */
export function isVideoUrl(src) {
  return YOUTUBE.test(src) || isDMVideoSrc(src);
}

/**
 * Player for an authored video link (YouTube or Dynamic Media), labelled from the
 * link's title/text; null if the link isn't a supported video. Shared with cards-corp.
 * @param {HTMLAnchorElement} link the authored video link
 * @returns {HTMLElement|null}
 */
export function videoPlayerFor(link) {
  const label = cleanVideoLabel(link.getAttribute('title'), link.textContent.trim());
  return renderFor(link.getAttribute('href'), label);
}

/**
 * The playback options of a Dynamic Media video: `loop` repeats it; `autoplay` starts it
 * muted once it comes into view (as stryker.com's VideoPlayer.autoplay + mutevolume). The
 * control bar stays, so a visitor can pause or turn the sound on.
 * @param {Element} block The video block
 * @param {Element} player The rendered player
 */
function setPlayback(block, player) {
  const video = player.querySelector('video');
  if (!video) return;
  if (block.classList.contains('loop')) video.loop = true;
  if (!block.classList.contains('autoplay')) return;
  video.muted = true;
  video.setAttribute('muted', '');
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    // the play button attaches the streaming source before playing
    player.querySelector('.dm-video-play')?.click();
  });
  observer.observe(player);
}

/**
 * In review: a Dynamic Media video's frame takes the video's own shape (stryker.com shows a
 * 2.4:1 video at 2.4:1, not in a 16:9 frame with empty bars and the controls under them). The
 * shape comes from the poster image (the player loads no video data before playback when it
 * has a poster), or from the video itself once it knows its size.
 * @param {Element} block The video block
 */
function fitToVideo(block) {
  block.querySelectorAll('video.dm-video').forEach((video) => {
    const fit = (width, height) => {
      if (width > 0 && height > 0) video.style.aspectRatio = `${width} / ${height}`;
    };
    if (video.videoWidth) fit(video.videoWidth, video.videoHeight);
    video.addEventListener('loadedmetadata', () => fit(video.videoWidth, video.videoHeight), { once: true });
    const poster = video.getAttribute('poster');
    if (poster && !video.videoWidth) {
      const img = new Image();
      img.addEventListener('load', () => { if (!video.videoWidth) fit(img.naturalWidth, img.naturalHeight); }, { once: true });
      img.src = poster;
    }
  });
}

/**
 * loads and decorates the video block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const std = document.body.classList.contains('std-draft');
  // a Dynamic Media link is already a player (scripts/dm-support.js runs on the whole page)
  const rendered = !link && block.querySelector('.dm-video-wrapper');
  if (std && rendered) {
    setPlayback(block, rendered);
    fitToVideo(block);
    return;
  }
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

  const player = videoPlayerFor(link);
  if (!player) return;
  block.replaceChildren(player);
  // in review (docs/standardisation/video.md): the `autoplay` (muted) and `loop` options,
  // on draft pages only for now
  if (std) {
    setPlayback(block, player);
    fitToVideo(block);
  }
}
