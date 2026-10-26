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
 * Set up the hero from its authored rows.
 *
 * Authoring model (single-column rows):
 *   | <desktop image> |
 *   | <mobile image>  |  (optional)
 *   | <heading + supporting copy> |
 *
 * Keeps desktop + mobile as SEPARATE pictures (each with its own alt) so authors
 * can describe each crop distinctly, matching the source site. CSS toggles their
 * visibility at the 900px crossover (.hero-image-desktop / .hero-image-mobile).
 * The block is rebuilt into an [image][content] structure the CSS overlays.
 * A Scene7 video link in an image row is already a native <video> here (scripts.js runs
 * dm-support over <main> before blocks decorate); it plays as the hero background.
 * @param {Element} block the hero block
 */
function setupHero(block) {
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
    } else if (cells.length === 1) {
      const cell = cells[0];
      const pic = cell.querySelector('picture');
      if (!video && isVideoCell(cell)) {
        video = cell.querySelector('.dm-video-wrapper') || cell.querySelector('video');
      } else if (pic && !cell.querySelector('h1, h2, h3, p')) {
        if (!desktopPic) desktopPic = pic;
        else if (!mobilePic) mobilePic = pic;
      } else if (cell.querySelector('h1, h2, h3, p')) {
        contentCell = cell;
      }
    }
  });

  // If no dedicated image rows found, look for pictures inside the content cell
  // (DM links converted to <picture> by dm-support.js live alongside the heading)
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

  // next to a video, the one picture is the mobile image
  if (video && desktopPic && !mobilePic) {
    mobilePic = desktopPic;
    desktopPic = null;
    mobilePic.classList.add('hero-image-mobile');
  }

  const imageDiv = document.createElement('div');
  // image-slide swaps its crops at 600px (hero-corp.css); the other variants at 900px
  const crossover = block.classList.contains('image-slide') ? 600 : 900;
  if (video) {
    playAsBackground(video);
    imageDiv.append(video);
  }
  // keep both pictures (each with its own alt); CSS shows one per breakpoint.
  // When only one is authored it carries no toggle class and always shows.
  if (desktopPic && mobilePic) {
    desktopPic.classList.add('hero-image-desktop');
    mobilePic.classList.add('hero-image-mobile');

    // The hero image is the LCP element on every breakpoint, and aem.js's
    // waitForFirstImage eager-loads only the FIRST <img> in DOM order. With the
    // desktop crop first, on mobile the visible mobile crop was left lazy and its
    // fetch deferred — the cause of the poor mobile LCP. Order the crop shown at
    // the CURRENT breakpoint (crossover per variant, see above) FIRST so it is the
    // eager LCP candidate and mark it high priority; the hidden crop is
    // display:none and set lazy, so it never enters the viewport and its fetch is
    // skipped (no double download competing for the mobile connection).
    const desktopShown = window.matchMedia(`(width >= ${crossover}px)`).matches;
    const [lcpPic, otherPic] = desktopShown
      ? [desktopPic, mobilePic] : [mobilePic, desktopPic];
    const lcpImg = lcpPic.querySelector('img');
    const otherImg = otherPic.querySelector('img');
    if (lcpImg) { lcpImg.setAttribute('loading', 'eager'); lcpImg.setAttribute('fetchpriority', 'high'); }
    if (otherImg) { otherImg.setAttribute('loading', 'lazy'); otherImg.removeAttribute('fetchpriority'); }
    imageDiv.append(lcpPic, otherPic);
  } else if (desktopPic || mobilePic) {
    const only = desktopPic || mobilePic;
    imageDiv.append(only);
    const img = only.querySelector('img');
    // an image-slide's only image is the desktop crop, hidden on phones (hero-corp.css):
    // lazy there, so it is never fetched
    const hidden = block.classList.contains('image-slide')
      && !window.matchMedia(`(width >= ${crossover}px)`).matches;
    if (img && hidden) img.setAttribute('loading', 'lazy');
    else if (img) { img.setAttribute('loading', 'eager'); img.setAttribute('fetchpriority', 'high'); }
  }

  const contentDiv = document.createElement('div');
  if (contentCell) while (contentCell.firstChild) contentDiv.append(contentCell.firstChild);

  block.replaceChildren(imageDiv, contentDiv);
}

const BOX_SPACING = {
  mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft', pt: 'paddingTop', pr: 'paddingRight', pb: 'paddingBottom', pl: 'paddingLeft',
};

/**
 * image-slide: the headline lines go in a box (`.hero-headline`), the button paragraphs
 * after it. Block options: box-white / -gold / -blue / -gray / -dark colour the box,
 * box-mt-N … box-pl-N set its margin / padding in percent (`n` = negative: box-mt-n4) as the
 * source's inline box styles, and top-N / left-N / right-N (percent of the slide) place it.
 * @param {Element} block the hero block
 */
function setupImageSlide(block) {
  const content = block.lastElementChild;
  const lines = [...content.children].filter((el) => !el.classList.contains('button-wrapper'));
  if (lines.length) {
    const box = document.createElement('div');
    box.className = 'hero-headline';
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

export default function decorate(block) {
  setupHero(block);
  if (block.classList.contains('image-slide')) setupImageSlide(block);

  // Fullbleed variant: split the two-tone headline (lead sentence in light serif,
  // remainder in Futura bold via an accent span). The poster modifier keeps the
  // headline as a single serif style (matches the stroke-awareness banner), so
  // skip the split there.
  if (block.classList.contains('fullbleed') && !block.classList.contains('poster')) {
    const h1 = block.querySelector('h1');
    if (h1 && (h1.childElementCount === 0
      || (h1.childElementCount === 1 && h1.querySelector(':scope > strong')))) {
      const text = h1.textContent.trim();
      const match = text.match(/^(.*?[.!?])\s+(.+)$/s);
      if (match) {
        const [, lead, rest] = match;
        h1.textContent = `${lead} `;
        const accent = document.createElement('span');
        accent.className = 'hero-headline-accent';
        accent.textContent = rest;
        h1.append(accent);
      }
    }
  }

  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // stroke headline: the published pipeline drops the space before the inline
  // gold accent ("Understanding<em>stroke</em>") while the editor keeps it.
  // Restore it when missing so the gap is one space in both — no margin hack
  // that would double the gap in the editor.
  if (block.closest('.hero-stroke')) {
    block.querySelectorAll('h1 em').forEach((em) => {
      const prev = em.previousSibling;
      if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent
        && !/\s$/.test(prev.textContent)) {
        prev.textContent += ' ';
      }
    });
  }
}
