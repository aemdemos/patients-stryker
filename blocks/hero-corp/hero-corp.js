import decorateDMAssets, { isDMVideoSrc, renderVideo } from '../../scripts/dm-support.js';

// a slide's media: its picture, or its background video (a video slide)
const MEDIA = 'picture, .dm-video-background';

/**
 * A row cell that only links to a fragment document (a slide image kept as its own
 * fragment, e.g. /us/en/fragments/…/hero-image/master): the link, or null.
 */
function fragmentLinkOf(cell) {
  if (cell.querySelector('picture, img')) return null;
  const links = cell.querySelectorAll('a[href]');
  if (links.length !== 1 || cell.textContent.trim() !== links[0].textContent.trim()) return null;
  const url = new URL(links[0].getAttribute('href'), window.location.href);
  return url.origin === window.location.origin && url.pathname.includes('/fragments/') ? links[0] : null;
}

/**
 * Slide image rows that link to fragment documents: the cell is replaced by the first image
 * of its fragment (fetched as .plain.html, its Dynamic Media links decorated), so the rows read
 * like authored image rows (the whole cell: the page's button decoration may already have
 * wrapped the lone link in a paragraph). A fragment that holds a video instead (a video
 * slide, e.g. its Video block) gives a muted, looping background video, as live; the same
 * video for desktop and mobile plays once. All fragments are fetched in parallel; a fragment
 * that cannot be loaded leaves its row empty.
 * @param {Element} block The hero-corp block
 */
async function resolveFragmentImages(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')].filter(fragmentLinkOf);
  const found = await Promise.all(cells.map(async (cell) => {
    const link = fragmentLinkOf(cell);
    const path = new URL(link.getAttribute('href'), window.location.href).pathname.replace(/\/$/, '');
    try {
      // started early by scripts/corp.js (prefetchHeroFragments) for the first heroes
      const pending = window.hlx && window.hlx.heroFragments && window.hlx.heroFragments.get(path);
      const html = pending ? await pending
        : await fetch(`${path}.plain.html`).then((resp) => (resp.ok ? resp.text() : null));
      if (!html) return {};
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const video = [...doc.body.querySelectorAll('a[href]')]
        .find((a) => isDMVideoSrc(a.getAttribute('href')));
      decorateDMAssets(doc.body);
      const image = doc.body.querySelector('picture') || doc.body.querySelector('img');
      if (image) return { image: document.importNode(image, true) };
      return video ? { video: video.getAttribute('href'), label: video.textContent.trim() } : {};
    } catch {
      return {};
    }
  }));
  const videos = new Set();
  cells.forEach((cell, i) => {
    const { image, video, label } = found[i];
    let media = image || null;
    if (media && media.tagName === 'IMG') {
      media = document.createElement('picture');
      media.append(image);
    }
    if (video && !videos.has(video)) {
      videos.add(video);
      media = renderVideo(video, label, { background: true });
    }
    if (media) cell.replaceChildren(media);
    else cell.replaceChildren();
  });
}

/**
 * Set up the corp image-slide hero from its authored rows.
 * @param {Element} block The hero-corp block
 */
function setupHero(block) {
  let desktopPic = null;
  let mobilePic = null;
  let contentCell = null;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const label = cells[0].textContent.trim().toLowerCase();
      const pic = cells[1].querySelector(MEDIA);
      if (label === 'mobile') mobilePic = pic || mobilePic;
      else desktopPic = pic || desktopPic;
    } else if (cells.length === 1) {
      const cell = cells[0];
      const pic = cell.querySelector(MEDIA);
      if (pic && !cell.querySelector('h1, h2, h3, p')) {
        if (!desktopPic) desktopPic = pic;
        else if (!mobilePic) mobilePic = pic;
      } else if (cell.querySelector('h1, h2, h3, p')) {
        contentCell = cell;
      } else if (!pic && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        cell.append(p);
        contentCell = cell;
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
    const pics = [...block.querySelectorAll(MEDIA)];
    [desktopPic, mobilePic] = pics;
  }

  const imageDiv = document.createElement('div');
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
  if (contentCell) while (contentCell.firstChild) contentDiv.append(contentCell.firstChild);

  block.replaceChildren(imageDiv, contentDiv);
}

/**
 * The image-slide options top-/bottom-/left-/right-<n> (inset in % of the image, 7-5 = 7.5)
 * size-<n> (vw headline size) and copy-size-<n> (vw size of the lines after the headline,
 * data-copy-size) as CSS variables on the block. A bottom-<n> box without a top-<n> is
 * anchored to the image bottom (data-slide-anchor="bottom").
 * @param {Element} block The hero-corp block
 */
function readSlideOptions(block) {
  const options = new Set();
  [...block.classList].forEach((name) => {
    const match = name.match(/^(top|bottom|left|right|size|copy-size)-(\d+)(?:-(\d+))?$/);
    if (!match) return;
    const [, option, whole, fraction] = match;
    const value = Number(fraction ? `${whole}.${fraction}` : whole);
    options.add(option);
    if (option === 'size') {
      block.style.setProperty('--hero-slide-text-size', value);
      block.dataset.textSize = value;
    } else if (option === 'copy-size') {
      block.style.setProperty('--hero-slide-copy-size', value);
      block.dataset.copySize = value;
    } else block.style.setProperty(`--hero-slide-${option}`, `${value}%`);
  });
  if (options.has('bottom') && !options.has('top')) {
    block.style.setProperty('--hero-slide-top', 'auto');
    block.dataset.slideAnchor = 'bottom';
  }
}

export default async function decorate(block) {
  readSlideOptions(block);
  await resolveFragmentImages(block);
  setupHero(block);

  if (!block.querySelector(':scope > div:first-child :is(picture, .dm-video-background)')) {
    block.classList.add('no-image');
  }
}
