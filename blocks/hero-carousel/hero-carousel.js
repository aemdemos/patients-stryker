/*
 * hero-carousel — the www.stryker.com c-autocarousel page hero: the first slide
 * visible, no slide rotation (static); a video slide autoplays muted and loops like
 * the live Scene7 hero. It is reconstructive: one authored row per slide.
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
  slide.classList.add('hero-carousel-slide');
  const cells = [...slide.children];
  const media = cells.find(isMediaCell);
  const text = cells.find((cell) => cell !== media);
  if (media) {
    media.classList.add('hero-carousel-media');
    const video = media.querySelector('video');
    const poster = media.querySelector('picture img, img');
    if (video) {
      slide.classList.add('hero-carousel-video');
      // live Scene7 hero: `muted autoplay loop preload=auto`, no native controls and
      // no play overlay or control bar (dm-support renders every DM video with them — undo it here)
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
  if (text) text.classList.add('hero-carousel-text');
}

/**
 * @param {Element} block the hero-carousel block
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
  block.classList.add(`hero-carousel-${slides.length}-slides`);
  // `copy` variant: the live overlay box geometry is authored as top-N / left-N / width-N
  // classes and the image column as media-left-N / media-width-N (percent of the slide),
  // exposed to the CSS as custom properties
  if (block.classList.contains('copy')) {
    [...block.classList].forEach((cls) => {
      const m = cls.match(/^(top|left|width|media-left|media-width)-(\d+)$/);
      if (m) block.style.setProperty(`--hero-copy-${m[1]}`, `${m[2]}%`);
    });
  }
}
