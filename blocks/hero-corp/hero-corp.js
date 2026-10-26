/*
 * hero-corp — the stryker.com hero. Variants: image-slide, tagline-band, large-header,
 * long-text (styles and authoring rules in hero-corp.css).
 *
 * Authoring model (single-column rows, in any order):
 *   | <desktop image, or a Scene7 video link> |
 *   | <mobile image> |                         (optional; or a | mobile | <image> | row)
 *   | <headline / copy> |
 * The block is rebuilt into [media][content]; the CSS lays the variants out from there.
 * Scene7 video links are already native <video>s here: scripts.js runs dm-support over
 * <main> before any block decorates.
 */

// image-slide swaps its desktop / mobile crops at 600px; the other variants have one image
const CROSSOVER = '(width >= 600px)';

const BOX_SPACING = {
  mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft', pt: 'paddingTop', pr: 'paddingRight', pb: 'paddingBottom', pl: 'paddingLeft',
};

/**
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell holds a rendered DM video and no copy (the video
 *   wrapper's control labels and a leftover link text are not copy)
 */
function isVideoCell(cell) {
  if (!cell.querySelector('.dm-video-wrapper, video')) return false;
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  let copy = '';
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement.closest('a, .dm-video-wrapper')) copy += walker.currentNode.textContent;
  }
  return copy.trim() === '';
}

/**
 * Background video: muted autoplay loop without controls (dm-support adds controls and a
 * play overlay to every DM video; they are removed here).
 * @param {Element} wrapper the rendered video (or its .dm-video-wrapper)
 */
function playAsBackground(wrapper) {
  const video = wrapper.tagName === 'VIDEO' ? wrapper : wrapper.querySelector('video');
  if (!video) return;
  video.controls = false;
  video.removeAttribute('controls');
  video.muted = true;
  video.setAttribute('muted', '');
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';
  wrapper.querySelectorAll('.dm-video-overlay, .dm-video-controls').forEach((ui) => ui.remove());
  const play = () => video.play().catch(() => { /* autoplay blocked: the poster stays */ });
  video.addEventListener('canplay', play, { once: true });
  play();
}

/**
 * Sorts the authored rows into media (desktop picture or video, mobile picture) and the
 * content cell, then rebuilds the block as [media][content]. Desktop and mobile stay
 * separate pictures, each with its own alt.
 * @param {Element} block the hero-corp block
 */
function setupRows(block) {
  let desktopPic = null;
  let mobilePic = null;
  let contentCell = null;
  let video = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const label = cells[0].textContent.trim().toLowerCase();
      const pic = cells[1].querySelector('picture');
      if (label === 'mobile') mobilePic = pic || mobilePic;
      else desktopPic = pic || desktopPic;
      return;
    }
    const [cell] = cells;
    if (!cell) return;
    const pic = cell.querySelector('picture');
    if (!video && isVideoCell(cell)) {
      video = cell.querySelector('.dm-video-wrapper') || cell.querySelector('video');
    } else if (pic && !cell.querySelector('h1, h2, h3, p')) {
      if (!desktopPic) desktopPic = pic;
      else if (!mobilePic) mobilePic = pic;
    } else if (cell.querySelector('h1, h2, h3, p')) {
      contentCell = cell;
    }
  });

  // DM images authored inside the copy cell (dm-support renders them where the link was)
  if (!desktopPic && !mobilePic && !video && contentCell) {
    const pics = [...contentCell.querySelectorAll('picture')];
    [desktopPic, mobilePic] = pics;
    pics.forEach((pic) => {
      const wrapper = pic.closest('p, div');
      if (wrapper && wrapper.parentNode === contentCell) wrapper.remove();
      else pic.remove();
    });
  }

  // next to a video, the one picture is the mobile image
  if (video && desktopPic && !mobilePic) {
    mobilePic = desktopPic;
    desktopPic = null;
  }

  const media = document.createElement('div');
  if (video) {
    playAsBackground(video);
    media.append(video);
  }
  const desktopShown = window.matchMedia(CROSSOVER).matches;
  const eager = (pic) => {
    const img = pic && pic.querySelector('img');
    if (img) { img.setAttribute('loading', 'eager'); img.setAttribute('fetchpriority', 'high'); }
  };
  const lazy = (pic) => {
    const img = pic && pic.querySelector('img');
    if (img) { img.setAttribute('loading', 'lazy'); img.removeAttribute('fetchpriority'); }
  };
  if (mobilePic) mobilePic.classList.add('hero-corp-image-mobile');
  // the image shown at the current width is the LCP candidate: first in DOM order, eager and
  // high priority; the hidden one is lazy, so it is never fetched. An image-slide hides its
  // desktop image (or video) on phones, so a lone desktop image is lazy there.
  const hidesDesktop = block.classList.contains('image-slide') && !desktopShown;
  if (desktopPic && mobilePic) {
    const [shown, hidden] = hidesDesktop ? [mobilePic, desktopPic] : [desktopPic, mobilePic];
    eager(shown);
    lazy(hidden);
    media.append(shown, hidden);
  } else if (desktopPic) {
    if (hidesDesktop) lazy(desktopPic);
    else eager(desktopPic);
    media.append(desktopPic);
  } else if (mobilePic) {
    if (desktopShown) lazy(mobilePic);
    else eager(mobilePic);
    media.append(mobilePic);
  }

  const content = document.createElement('div');
  if (contentCell) content.append(...contentCell.childNodes);
  block.replaceChildren(media, content);
}

/**
 * image-slide: the headline lines go in a box (`.hero-corp-headline`), the button
 * paragraphs after it. Block options: box-white / -gold / -blue / -gray / -dark colour the
 * box, box-mt-N … box-pl-N set its margin / padding in percent (`n` = negative: box-mt-n4)
 * as the source's inline box styles, and top-N / left-N / right-N (percent of the slide)
 * place it.
 * @param {Element} block the hero-corp block
 */
function setupImageSlide(block) {
  const content = block.lastElementChild;
  const lines = [...content.children].filter((el) => !el.classList.contains('button-wrapper'));
  if (lines.length) {
    const box = document.createElement('div');
    box.className = 'hero-corp-headline';
    box.append(...lines);
    content.prepend(box);
    [...block.classList].forEach((opt) => {
      if (/^box-(white|gold|blue|gray|dark)$/.test(opt)) box.classList.add(opt);
      const m = opt.match(/^box-(mt|mr|mb|ml|pt|pr|pb|pl)-(n?)(\d+)$/);
      if (m) box.style[BOX_SPACING[m[1]]] = `${m[2] ? '-' : ''}${m[3]}%`;
    });
  }
  [...block.classList].forEach((cls) => {
    const m = cls.match(/^(top|left|right)-(\d+)$/);
    if (m) block.style.setProperty(`--hero-box-${m[1]}`, `${m[2]}%`);
  });
}

/**
 * @param {Element} block the hero-corp block
 */
export default function decorate(block) {
  setupRows(block);
  if (block.classList.contains('image-slide')) setupImageSlide(block);
}
