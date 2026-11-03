import decorateDMAssets, { dmThumbnailSrc } from '../../scripts/dm-support.js';

/*
 * Gallery Corp: a Dynamic Media image / media set (www.stryker.com mixedmediagallery,
 * Scene7 MixedMediaViewer / FlyoutViewer) as a main stage with a thumbnail strip below.
 * One authored row per set member: a DM image link (link text = alt) or a DM video link.
 * dm-support.js renders the links as <picture> / DM video; this block arranges them.
 */

// thumbnails are drawn in a 56px box (source swatch); request 2x for dense screens
const THUMB_RENDITION = 112;
// minimum horizontal travel (px) of a touch swipe on the stage
const SWIPE_MIN = 40;

function memberLabel(media, index, total) {
  const position = `${index + 1} of ${total}`;
  if (media.classList.contains('dm-video-wrapper')) {
    const label = media.querySelector('video')?.getAttribute('aria-label');
    return label ? `Video ${position}: ${label}` : `Video ${position}`;
  }
  const alt = media.querySelector('img')?.alt;
  return alt ? `Image ${position}: ${alt}` : `Image ${position}`;
}

function buildThumb(media, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gallery-corp-thumb';
  button.setAttribute('aria-label', label);
  const video = media.querySelector('video');
  const src = video ? video.getAttribute('poster') : media.querySelector('img')?.getAttribute('src');
  if (video) button.classList.add('is-video');
  if (src) {
    const img = document.createElement('img');
    img.src = dmThumbnailSrc(src, THUMB_RENDITION) || src;
    img.alt = '';
    img.loading = 'lazy';
    img.width = THUMB_RENDITION;
    img.height = THUMB_RENDITION;
    button.append(img);
  }
  return button;
}

function scrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `gallery-corp-scroll ${direction}`;
  button.setAttribute('aria-label', direction === 'prev' ? 'Scroll thumbnails left' : 'Scroll thumbnails right');
  return button;
}

function fullscreenButton(stage) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gallery-corp-fullscreen';
  const sync = () => {
    const on = document.fullscreenElement === stage;
    button.setAttribute('aria-label', on ? 'Exit full screen' : 'View full screen');
    button.classList.toggle('is-active', on);
  };
  sync();
  button.addEventListener('click', () => {
    if (document.fullscreenElement === stage) document.exitFullscreen();
    else stage.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', sync);
  return button;
}

/**
 * Loads and decorates the block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // the canvas re-renders fields from source, so convert the DM links here too (idempotent)
  decorateDMAssets(block);

  const members = [...block.children]
    .map((row) => row.querySelector('picture, .dm-video-wrapper'))
    .filter(Boolean);
  if (!members.length) return;

  const total = members.length;
  const stage = document.createElement('div');
  stage.className = 'gallery-corp-stage';
  const slides = members.map((media, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-corp-slide';
    // the media is lifted out of the authored cell so the canvas can't re-render over it
    slide.append(media);
    // only the active slide is displayed; lazy images in hidden slides load when shown
    const img = media.querySelector('img');
    if (img && i > 0) img.loading = 'lazy';
    slide.hidden = i > 0;
    return slide;
  });
  stage.append(...slides);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'gallery');
  block.setAttribute('aria-label', 'Media gallery');
  if (document.fullscreenEnabled) stage.append(fullscreenButton(stage));

  if (total === 1) {
    block.replaceChildren(stage);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'gallery-corp-thumbs';
  const thumbs = members.map((media, i) => {
    const li = document.createElement('li');
    const thumb = buildThumb(media, memberLabel(media, i, total));
    li.append(thumb);
    list.append(li);
    return thumb;
  });

  const prev = scrollButton('prev');
  const next = scrollButton('next');
  const nav = document.createElement('div');
  nav.className = 'gallery-corp-nav';
  nav.append(prev, list, next);

  const updateScroll = () => {
    const max = list.scrollWidth - list.clientWidth;
    nav.classList.toggle('is-scrollable', max > 1);
    prev.disabled = list.scrollLeft <= 1;
    next.disabled = list.scrollLeft >= max - 1;
  };

  // keep the active thumbnail inside the strip without scrolling the page
  const revealThumb = (thumb) => {
    const li = thumb.parentElement;
    const left = li.offsetLeft - list.offsetLeft;
    const right = left + li.offsetWidth;
    if (left < list.scrollLeft) list.scrollTo({ left, behavior: 'smooth' });
    else if (right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: right - list.clientWidth, behavior: 'smooth' });
    }
  };

  let active = 0;
  const show = (index) => {
    const target = (index + total) % total;
    slides.forEach((slide, i) => {
      if (i !== target) slide.querySelector('video')?.pause();
      slide.hidden = i !== target;
    });
    thumbs.forEach((thumb, i) => {
      const on = i === target;
      if (on) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
      thumb.tabIndex = on ? 0 : -1;
    });
    active = target;
    revealThumb(thumbs[target]);
  };

  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)));
  list.addEventListener('keydown', (e) => {
    const keys = {
      ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: total - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    show(keys[e.key]);
    thumbs[active].focus();
  });

  const page = (dir) => list.scrollBy({ left: dir * (list.clientWidth - thumbs[0].offsetWidth), behavior: 'smooth' });
  prev.addEventListener('click', () => page(-1));
  next.addEventListener('click', () => page(1));
  list.addEventListener('scroll', updateScroll, { passive: true });
  new ResizeObserver(updateScroll).observe(list);

  // swipe on touch: a mostly horizontal drag on the stage steps to the next/previous member
  let start = null;
  stage.addEventListener('pointerdown', (e) => {
    const onControls = e.target.closest('.dm-video-controls, button, input');
    start = e.pointerType !== 'mouse' && !onControls ? { x: e.clientX, y: e.clientY } : null;
  });
  stage.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) show(active + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', () => { start = null; });

  block.replaceChildren(stage, nav);
  show(0);
}
