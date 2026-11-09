import decorateDMAssets, { isDMVideoSrc, renderVideo } from '../../scripts/dm-support.js';
import { parseSpacing, spaceBlock } from '../../scripts/corp-spacing.js';
import fetchPlainHtml from '../../scripts/plain-html.js';

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
        : await fetchPlainHtml(path).then((resp) => (resp.ok ? resp.text() : null));
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

/**
 * A slide row authored as a Dynamic Media video link (rendered as a player by
 * decorateDMAssets) is a video slide: the muted, looping background video, as a video slide
 * fragment gives (resolveFragmentImages).
 * @param {Element} block The hero-corp block
 */
function backgroundVideos(block) {
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const player = cell.querySelector('.dm-video-wrapper:not(.dm-video-background)');
    if (!player || !player.dataset.dmSrc) return;
    const label = player.querySelector('video')?.getAttribute('aria-label') || '';
    cell.replaceChildren(renderVideo(player.dataset.dmSrc, label, { background: true }));
  });
}

/**
 * A text box over (or beside) the image that is taller than the image would run over the next
 * section (and under the sticky jump bar): the hero grows to hold it. Kept in step as the box
 * or the image resizes (fonts, image load, viewport).
 * @param {Element} block The hero-corp block
 */
function fitBox(block) {
  const box = block.lastElementChild;
  if (!box || box === block.firstElementChild) return;
  const fit = () => {
    block.style.minHeight = '';
    const style = getComputedStyle(box);
    if (style.position !== 'absolute') return;
    // its top-<n> inset is a % of the slide's height, the image's on the source: in px of the
    // slide before it grows, so the text stays where the source puts it (arise-1000-ex at 860px:
    // the h1 45px down, 18% of the 249px image). Not for a box anchored at the bottom. (Written
    // only when it changes: this runs on the box's style changes)
    const inset = getComputedStyle(block).getPropertyValue('--hero-slide-top').trim();
    if (block.dataset.slideAnchor !== 'bottom' && inset.endsWith('%')) {
      const top = `${Math.round((parseFloat(inset) * block.clientHeight) / 10) / 10}px`;
      if (box.style.top !== top) box.style.top = top;
    }
    // the box's own bottom margin (its margin-bottom-<n> spacing) is room it keeps below it;
    // a few passes until it fits
    for (let pass = 0; pass < 4; pass += 1) {
      const below = parseFloat(getComputedStyle(box).marginBottom) || 0;
      const needed = box.offsetTop + box.offsetHeight + below;
      if (needed <= block.clientHeight + 1) return;
      block.style.minHeight = `${Math.ceil(needed)}px`;
    }
  };
  const later = () => window.requestAnimationFrame(fit);
  // the box (fonts, wrapping, spacing) and the image row (loading, viewport); not the block
  // itself, whose height this sets
  const observer = new ResizeObserver(later);
  observer.observe(box);
  observer.observe(block.firstElementChild);
  // its margins (spacing options, set in px by corp-spacing.js) do not resize it
  new MutationObserver(later).observe(box, { attributes: true, attributeFilter: ['style'] });
}

export default async function decorate(block) {
  readSlideOptions(block);
  backgroundVideos(block);
  await resolveFragmentImages(block);
  setupHero(block);

  if (!block.querySelector(':scope > div:first-child :is(picture, .dm-video-background)')) {
    block.classList.add('no-image');
  }
  // the text box's AEM padding / margin (spacing options, e.g. padding-top-4). A product
  // hero's bottom margin is its rich text's on the source, above the button (a CTA of its own
  // in the slide overlay): the button's top margin, in % of the box width (arise-1000-ex
  // margin-bottom-7: 24 / 26 / 43px at 375 / 860 / 1440px, collapsing with the copy's 15px)
  const box = block.lastElementChild;
  const copyGap = block.classList.contains('image-right')
    && box?.lastElementChild?.classList.contains('button-wrapper')
    && parseSpacing([...block.classList]).find((s) => s.prop === 'marginBottom' && s.unit === '%');
  if (copyGap) block.style.setProperty('--hero-copy-gap', `${copyGap.value}%`);
  spaceBlock(block, box, copyGap ? ['marginBottom'] : []);
  fitBox(block);
}
