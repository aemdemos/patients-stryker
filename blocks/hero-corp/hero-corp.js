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

  // a subtitle: one plain line (footnote marks allowed) right under a fully Bold title, and
  // nothing else (stryker.com "Look inside Stryker's iSuite" under "What does an operating
  // room look like?")
  const [title, subtitle, ...rest] = contentDiv.children;
  const bold = title && title.matches('h1, h2') && title.children.length === 1
    && title.firstElementChild.matches('strong')
    && !title.firstElementChild.querySelector(':scope > :not(br)')
    && title.textContent.trim() === title.firstElementChild.textContent.trim();
  if (bold && !rest.length && subtitle && subtitle.matches('p')
    && ![...subtitle.children].some((el) => !el.matches('sup, sub'))
    && subtitle.textContent.trim()) {
    subtitle.classList.add('hero-corp-subtitle');
  }

  block.replaceChildren(imageDiv, contentDiv);
}

function readSlideOptions(block) {
  [...block.classList].forEach((name) => {
    const match = name.match(/^(top|left|right|size|sub)-(\d+)(?:-(\d+))?$/);
    if (!match) return;
    const [, option, whole, fraction] = match;
    const value = Number(fraction ? `${whole}.${fraction}` : whole);
    if (option === 'size') block.style.setProperty('--hero-slide-text-size', value);
    else if (option === 'sub') block.style.setProperty('--hero-slide-subtitle-size', value);
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
 *   Text colour     the hero's text in white or light-gray (a slide over a dark image; a
 *                   purple, teal or blue box is always white; on phones a slide with its
 *                   text below the image keeps the text colour)
 *   Text colour on phones  one colour for all the text below 600px (dark-gray, black)
 *   Text width      the banner's text column in % ("33", "50", "67", "100")
 * The block itself is `Hero Corp` (the slide) or `Hero Corp (banner)`; news pages set the same
 * slide layout with option classes instead (`image-slide, top-15, left-56, right-10, …`).
 * Long-page-detail pages author none of these rows (variant-only rule, 2026-11-17): a placement
 * variant (`top-left`, `left`, `wide`, `bottom-left`, `right`), `half-text`, and the section
 * styles `white-text` / `light-gray-text` / `box-<colour>`; the rows stay readable for the
 * other corp templates.
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
  // `Text colour`: the colour of the hero's text (white, light-gray)
  const colour = (data.textColour || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (colour) block.dataset.textColour = colour;
  // `Text colour on phones`: one colour for all the text below 600px (dark-gray, black)
  const phoneColour = (data.textColourOnPhones || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (phoneColour) block.dataset.phoneText = phoneColour;
  // section styles (the variant-only rule, corp long-page-detail): `white-text` /
  // `light-gray-text` for the text colour, `box-<colour>` for the box around the first text row
  const styles = section ? [...section.classList] : [];
  const boxStyle = styles.find((name) => /^box-[a-z-]+$/.test(name));
  if (!box && boxStyle) block.dataset.textBox = boxStyle.slice(4);
  const colourStyle = styles.find((name) => /^(white|light-gray)-text$/.test(name));
  if (!colour && colourStyle) block.dataset.textColour = colourStyle.replace(/-text$/, '');
  // `phone-dark-gray-text` / `phone-black-text`: all the text in that colour below 600px, the
  // gold words and the button label too (stryker.com build-your-ASC on phones)
  const phoneStyle = styles.find((name) => /^phone-(dark-gray|black)-text$/.test(name));
  if (!phoneColour && phoneStyle) block.dataset.phoneText = phoneStyle.replace(/^phone-|-text$/g, '');
  // a banner with its text in the right half (`right`: bunion, total ankle replacement)
  if (block.classList.contains('banner') && block.classList.contains('right')) {
    block.classList.add('half-text');
  }
  const width = parseFloat(data.textWidth);
  if (!Number.isNaN(width)) block.style.setProperty('--hero-banner-text-width', `${width}%`);
  // a half-width (or narrower) text column: over the image from 900px only (CSS)
  if (!Number.isNaN(width) && width <= 50) block.classList.add('half-text');
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

// the slide's text placements (variants; the insets are in hero-corp.css); the `-over` forms
// keep the text over the phone image on phones too (CR hub, CLOUT, giving back: a phone image
// with room for the text)
const PLACEMENTS = ['top-left', 'left', 'wide', 'bottom-left', 'right'];
const OVER = { 'top-left-over': 'top-left', 'left-over': 'left' };

/**
 * A slide with a placement variant lays its text out on phones by itself: under its image
 * (the phone image, else the desktop one: ASC post-op, decided 2026-11-17; a video without a phone
 * image shows its video: instruments), alone only when the slide has no media.
 * @param {Element} block The hero-corp block
 */
function phoneLayout(block) {
  if (!block.classList.contains('image-slide')) return;
  const over = Object.keys(OVER).find((name) => block.classList.contains(name));
  if (over) {
    // the placement's insets on all widths, the text over the image on phones as well
    block.classList.add(OVER[over]);
    return;
  }
  if (!PLACEMENTS.some((name) => block.classList.contains(name))) return;
  block.classList.add('text-below');
  // (a video without a phone image shows on phones too: stryker.com instruments pages)
  const media = block.querySelector('.hero-image-mobile, .hero-video')
    || block.querySelector(':scope > div:first-child picture');
  if (!media) block.classList.add('text-alone');
  if (block.querySelector('.hero-video') && !block.querySelector('.hero-image-mobile')) {
    block.classList.add('video-on-phones');
  }
}

/**
 * A slide whose text over the image is taller than the image (build-your-ASC's title, subtitle
 * and button at about 1280px wide: the button below the image) gets a taller image, cropped
 * (`text-overflow`, `--hero-min-height`), so the text stays inside the hero with 30px below
 * it. Slides whose text fits keep the image's own height. From 600px (below it the text is
 * under or without the image).
 * @param {Element} block The hero-corp block
 */
function keepTextInside(block) {
  if (!block.classList.contains('image-slide')) return;
  const [media, text] = block.children;
  if (!media || !text || media === text) return;
  const fit = () => {
    // the image shown at this width (the desktop one, not the hidden phone crop)
    const img = [...media.querySelectorAll('img')].find((i) => i.offsetParent);
    if (!window.matchMedia('(width >= 600px)').matches || !img?.naturalWidth) {
      block.classList.remove('text-overflow');
      return;
    }
    // the image's own height at this width (not the stretched one)
    const own = (media.clientWidth * img.naturalHeight) / img.naturalWidth;
    // the text's top inset (% of the image's own height, kept when the image grows)
    const top = (own * (parseFloat(getComputedStyle(block).getPropertyValue('--hero-slide-top')) || 0)) / 100;
    const need = top + text.offsetHeight + 30;
    if (need > own + 1) {
      block.style.setProperty('--hero-min-height', `${Math.ceil(need)}px`);
      block.style.setProperty('--hero-text-top', `${Math.round(top)}px`);
      block.classList.add('text-overflow');
    } else block.classList.remove('text-overflow');
  };
  // the text's size follows the block width only (it is over the image), so watching it does
  // not loop when the image grows
  new ResizeObserver(fit).observe(text);
  media.querySelectorAll('img').forEach((img) => img.addEventListener('load', fit));
}

export default function decorate(block) {
  readSectionOptions(block);
  readSlideOptions(block);
  setupHero(block);
  phoneLayout(block);
  keepTextInside(block);
  autoplayVideo(block);

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}
