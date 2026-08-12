/*
 * YouTube support — lightweight, in-repo, block-agnostic.
 *
 * Authors add a YouTube video as a LINK to its URL (watch, youtu.be, or embed).
 * On decoration we convert any such link into a click-to-load facade: a 16:9 box
 * showing the poster thumbnail + a play button, with the real player iframe
 * injected only on click. This keeps YouTube's heavy player JS (and its cookies)
 * off the initial page load — better performance and privacy — while matching
 * the reference site's embedded-video layout.
 *
 * Runs as a global pass (from scripts.js) so a YouTube link works in any block or
 * section, not just columns. Styling lives in styles/lazy-styles.css (.video-embed).
 */

// YouTube link signatures (watch, short youtu.be, and nocookie embeds)
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i;

// narrow selector so non-video pages skip the work and video pages only visit
// the YouTube anchors
const YOUTUBE_SELECTOR = [
  'a[href*="youtube.com"]',
  'a[href*="youtube-nocookie.com"]',
  'a[href*="youtu.be"]',
].join(',');

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
 * Build a click-to-load YouTube facade for a video id.
 * @param {string} id the 11-char YouTube video id
 * @param {string} label optional accessible label (from link title/text)
 * @returns {HTMLElement}
 */
function renderYouTube(id, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';

  // poster thumbnail; its intrinsic 4:3 hqdefault letterbox is cropped to 16:9
  // by CSS (object-fit: cover)
  const poster = document.createElement('img');
  poster.className = 'video-embed-poster';
  poster.loading = 'lazy';
  poster.alt = label || '';
  poster.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-embed-play';
  button.setAttribute('aria-label', label ? `Play video: ${label}` : 'Play video');

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

  wrapper.append(poster, button);
  return wrapper;
}

/**
 * Replace authored YouTube links anywhere in `main` with a click-to-load facade.
 * @param {Element} main the container to decorate
 */
export default function decorateYouTube(main) {
  main.querySelectorAll(YOUTUBE_SELECTOR).forEach((a) => {
    const src = a.getAttribute('href');
    if (!src || !YOUTUBE.test(src)) return;
    const id = youTubeId(src);
    if (!id) return;

    // Skip anchors that already wrap media — those aren't "type the URL" embeds
    // and converting them would destroy authored content.
    if (a.querySelector('picture, img, video, iframe, source')) return;

    // A bare autolink's text is the URL; custom display text becomes the label so
    // authors can describe the video inline.
    const text = a.textContent.trim();
    const label = a.getAttribute('title') || (text && text !== src ? text : '');
    a.replaceWith(renderYouTube(id, label));
  });
}
