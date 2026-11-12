/**
 * Set up the corp image-slide hero from its authored rows.
 * @param {Element} block The hero-corp block
 */
// a video instead of the image (a slide with a Dynamic Media or YouTube video)
const VIDEO_LINK = /\.m3u8|\.mp4|\/is\/content\/|youtube\.com|youtu\.be/i;

/** A row's video: its player, or a link alone to a video (before dm-support renders it). */
function videoOf(cell) {
  const player = cell.querySelector('.dm-video-wrapper, video, iframe');
  if (player) return player.closest('.dm-video-wrapper') || player;
  const links = [...cell.querySelectorAll('a[href]')];
  if (links.length !== 1 || !VIDEO_LINK.test(links[0].href)) return null;
  return cell.textContent.trim() === links[0].textContent.trim() ? links[0] : null;
}

function setupHero(block) {
  let desktopPic = null;
  let mobilePic = null;
  let contentCell = null;
  const textCells = [];
  let video = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1 && !video && videoOf(cells[0])) {
      video = videoOf(cells[0]);
      return;
    }
    if (cells.length >= 2) {
      const label = cells[0].textContent.trim().toLowerCase();
      const pic = cells[1].querySelector('picture');
      if (label === 'mobile') mobilePic = pic || mobilePic;
      else desktopPic = pic || desktopPic;
    } else if (cells.length === 1) {
      const cell = cells[0];
      const pic = cell.querySelector('picture');
      if (pic && !cell.querySelector('h1, h2, h3, p')) {
        if (!desktopPic) desktopPic = pic;
        else if (!mobilePic) mobilePic = pic;
      } else if (cell.querySelector('h1, h2, h3, p')) {
        contentCell = cell;
        textCells.push(cell);
      } else if (!pic && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        cell.append(p);
        contentCell = cell;
        textCells.push(cell);
      }
    }
  });

  if (!desktopPic && !mobilePic && contentCell) {
    const pics = [...contentCell.querySelectorAll('picture')];
    [desktopPic, mobilePic] = pics;
    pics.forEach((pic) => {
      const wrapper = pic.closest('p, div');
      if (wrapper && wrapper.parentNode === contentCell) wrapper.remove();
      else pic.remove();
    });
  }

  if (!desktopPic && !mobilePic) {
    const pics = [...block.querySelectorAll('picture')];
    [desktopPic, mobilePic] = pics;
  }

  const imageDiv = document.createElement('div');
  if (video) {
    // with a video, a picture is the phone image (the video from 600px)
    video.classList.add('hero-video');
    imageDiv.append(video);
    if (!mobilePic && desktopPic) [mobilePic, desktopPic] = [desktopPic, null];
    if (mobilePic) mobilePic.classList.add('hero-image-mobile');
  }
  if (desktopPic && mobilePic) {
    desktopPic.classList.add('hero-image-desktop');
    mobilePic.classList.add('hero-image-mobile');

    // Put the visible crop first so the eager LCP image matches the current viewport.
    const desktopShown = window.matchMedia('(width >= 600px)').matches;
    const [lcpPic, otherPic] = desktopShown
      ? [desktopPic, mobilePic] : [mobilePic, desktopPic];
    const lcpImg = lcpPic.querySelector('img');
    const otherImg = otherPic.querySelector('img');
    if (lcpImg) {
      lcpImg.setAttribute('loading', 'eager');
      lcpImg.setAttribute('fetchpriority', 'high');
    }
    if (otherImg) {
      otherImg.setAttribute('loading', 'lazy');
      otherImg.removeAttribute('fetchpriority');
    }
    imageDiv.append(lcpPic, otherPic);
  } else if (desktopPic || mobilePic) {
    const only = desktopPic || mobilePic;
    imageDiv.append(only);
    const img = only.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    }
  }

  const contentDiv = document.createElement('div');
  // `Text box` (Section Metadata): the first text row in a coloured box, the other rows after it
  const boxed = block.dataset.textBox && textCells.length;
  textCells.forEach((cell, i) => {
    if (boxed && i === 0) {
      const box = document.createElement('div');
      box.className = 'hero-corp-text-box';
      box.append(...cell.childNodes);
      contentDiv.append(box);
    } else contentDiv.append(...cell.childNodes);
  });
  if (!textCells.length && contentCell) contentDiv.append(...contentCell.childNodes);

  block.replaceChildren(imageDiv, contentDiv);
}

function readSlideOptions(block) {
  [...block.classList].forEach((name) => {
    const match = name.match(/^(top|left|right|size)-(\d+)(?:-(\d+))?$/);
    if (!match) return;
    const [, option, whole, fraction] = match;
    const value = Number(fraction ? `${whole}.${fraction}` : whole);
    if (option === 'size') block.style.setProperty('--hero-slide-text-size', value);
    else block.style.setProperty(`--hero-slide-${option}`, `${value}%`);
  });
}

/**
 * The layout from the hero section's Section Metadata (corp long-page-detail):
 *   Text position   the slide's text box: top, left and right inset, % of the image
 *                   ("12, 10, 50")
 *   Text on phones  `over` (default) or `below` the image, or `alone` (no image on phones)
 *   Text box        the colour of a box around the first text row (gold, white, purple, teal,
 *                   blue, dark-purple-gradient)
 *   Text colour on phones  one colour for all the text below 600px (dark-gray, black)
 *   Text width      the banner's text column in % ("33", "50", "67", "100")
 * The block itself is `Hero Corp` (the slide) or `Hero Corp (banner)`; news pages set the same
 * slide layout with option classes instead (`image-slide, top-15, left-56, right-10, …`).
 */
function readSectionOptions(block) {
  const section = block.closest('.section');
  const data = section ? section.dataset : {};
  if (!block.classList.contains('banner')) block.classList.add('image-slide');
  const [top, left, right] = (data.textPosition || '').split(',').map((v) => parseFloat(v));
  [['top', top], ['left', left], ['right', right]].forEach(([side, value]) => {
    if (value !== undefined && !Number.isNaN(value)) {
      block.style.setProperty(`--hero-slide-${side}`, `${value}%`);
    }
  });
  const phones = (data.textOnPhones || '').trim().toLowerCase();
  if (phones === 'below') block.classList.add('text-below');
  // `alone`: on phones the text without the image (a slide that has no phone image)
  if (phones === 'alone') block.classList.add('text-below', 'text-alone');
  const box = (data.textBox || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (box) block.dataset.textBox = box;
  // `Text colour on phones`: one colour for all the text below 600px (dark-gray, black)
  const phoneColour = (data.textColourOnPhones || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (phoneColour) block.dataset.phoneText = phoneColour;
  const width = parseFloat(data.textWidth);
  if (!Number.isNaN(width)) block.style.setProperty('--hero-banner-text-width', `${width}%`);
}

/**
 * A hero's Dynamic Media video plays on its own, muted and looping, as the stryker.com slide
 * viewer does (VideoPlayer.autoplay / mutevolume / loop: environmental programs, ThermaClear,
 * 1788), once the hero is in view; not with reduced motion. The video may only be rendered
 * after the block (dm-support), so it is looked for until it is there.
 * @param {Element} block The hero-corp block
 */
function autoplayVideo(block) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = (video) => {
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    // a background video: no control bar or play button (CSS); a click still pauses / plays it
    // (the player's own click toggle)
    const wrapper = video.closest('.dm-video-wrapper');
    if (wrapper) wrapper.classList.add('hero-autoplay');
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      video.play().catch(() => {});
    });
    observer.observe(block);
  };
  const found = block.querySelector('.hero-video video, video.hero-video');
  if (found) {
    start(found);
    return;
  }
  if (!block.querySelector('.hero-video')) return;
  const watch = new MutationObserver(() => {
    const video = block.querySelector('.hero-video video, video.hero-video');
    if (!video) return;
    watch.disconnect();
    start(video);
  });
  watch.observe(block, { childList: true, subtree: true });
}

export default function decorate(block) {
  readSectionOptions(block);
  readSlideOptions(block);
  setupHero(block);
  autoplayVideo(block);

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
