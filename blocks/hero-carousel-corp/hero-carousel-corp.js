/*
 * hero-carousel-corp — corp page hero: the first slide is shown, slides don't rotate;
 * a video slide autoplays muted and loops. One authored row per slide.
 *
 * Authoring model (per row):
 *   | media cell | text cell |
 *   media cell — a picture, or a Scene7 `media-assets.stryker.com/is/content/...`
 *                video link plus a poster picture (the runtime's dm-support turns
 *                the link into a native <video>; the picture becomes its poster)
 *   text cell  — the overlay headline (h1 on the page hero, h2 elsewhere) whose
 *                two-tone lines are authored as <em>light line</em> <strong>bold
 *                line</strong>, and an optional CTA paragraph
 *
 * EW contract: authored nodes are never rebuilt — the row and cell <div>s become
 * the layout wrappers (classes only); nothing is cloned or synthesized.
 */

/**
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell holds media and no copy
 */
function isMediaCell(cell) {
  if (!cell.querySelector('picture, img, video, a[href*="/is/content/"]')) return false;
  // a Scene7 video link's visible text is its URL, and a rendered DM video's wrapper carries
  // its control labels (time, buttons) — neither is copy
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  let copy = '';
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement.closest('a, .dm-video-wrapper')) copy += walker.currentNode.textContent;
  }
  return copy.trim() === '';
}

/**
 * @param {Element} slide the slide row
 */
function decorateSlide(slide) {
  slide.classList.add('hero-carousel-corp-slide');
  const cells = [...slide.children];
  const media = cells.find(isMediaCell);
  const text = cells.find((cell) => cell !== media);
  if (media) {
    media.classList.add('hero-carousel-corp-media');
    const video = media.querySelector('video');
    const poster = media.querySelector('picture img, img');
    if (video) {
      slide.classList.add('hero-carousel-corp-video');
      // background video: muted autoplay loop, no controls (dm-support adds controls
      // and a play overlay to every DM video — removed here)
      video.controls = false;
      video.removeAttribute('controls');
      video.muted = true;
      video.setAttribute('muted', '');
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      if (poster && !video.poster) video.poster = poster.currentSrc || poster.src;
      media.querySelectorAll('.dm-video-overlay, .dm-video-controls').forEach((ui) => ui.remove());
      const play = () => video.play().catch(() => { /* autoplay blocked: poster stays */ });
      video.addEventListener('canplay', play, { once: true });
      play();
    }
  }
  if (text) text.classList.add('hero-carousel-corp-text');
}

/**
 * @param {Element} block the hero-carousel-corp block
 */
export default function decorate(block) {
  // Scene7 video links are already native <video> here: scripts.js runs
  // dm-support's decorateDMAssets over <main> before any block decorates
  const slides = [...block.children];
  slides.forEach((slide, i) => {
    decorateSlide(slide);
    if (i > 0) slide.setAttribute('aria-hidden', 'true');
  });
  if (slides[0]) slides[0].classList.add('active');
  block.classList.add(`hero-carousel-corp-${slides.length}-slides`);
  // `copy` variant: overlay position classes top-N / left-N / width-N and image column
  // classes media-left-N / media-width-N (percent of the slide) become CSS custom properties
  if (block.classList.contains('copy')) {
    [...block.classList].forEach((cls) => {
      const m = cls.match(/^(top|left|width|media-left|media-width)-(\d+)$/);
      if (m) block.style.setProperty(`--hero-copy-${m[1]}`, `${m[2]}%`);
    });
  }
}
