/*
 * hero-corp, standardised (in review: draft pages only, body.std-draft; hero-corp.js loads this
 * module there, docs/standardisation/hero-corp.md). Layouts and options (hero-corp.css, the
 * body.corp.std-draft part):
 *   image-slide   a full-width slide (image, or a DM video playing muted and looping) with the
 *                 headline over it. Headline box box-white / -gold / -blue / -gray / -dark /
 *                 -gold-gradient / -purple-gradient / -blue-gradient; column text-left /
 *                 -right / -wide; height text-top / -upper / -middle / -lower; title-<colour> /
 *                 subline-<colour> (the colour of the bold / plain words); stripe-gold /
 *                 stripe-gradient; framed (in the page width with a soft shadow);
 *                 video-background; phones: mobile-below / mobile-above / mobile-text-black.
 *                 Without a mobile image, phones show the desktop image with the text below.
 *   page-hero     title, subhead and copy on the left, the image on the right, a grey rule
 *                 below; phones: the image under the text. no-image / no-rule / title-black.
 *   tagline-band  a gold band (purple-gradient, gold-gradient) with an h1 and an h2.
 *   large-header  the page title in Futura bold. long-text: copy beside an image, 50/50.
 * Text sizes, fonts and coloured words are Text style markers (scripts/span-markers.js).
 *
 * Rows (single-column, in any order): | desktop image, or a DM video link |, | mobile image |
 * (optional; or a | mobile | <image> | row), | headline / copy |.
 */

import { loadCSS } from '../../scripts/aem.js';
import decorateDMAssets from '../../scripts/dm-support.js';

// image-slide swaps its desktop / mobile crops at 600px
const CROSSOVER = '(width >= 600px)';

const BOX_SPACING = {
  mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft', pt: 'paddingTop', pr: 'paddingRight', pb: 'paddingBottom', pl: 'paddingLeft',
};

// the earlier names, read as the named choices
const ALIASES = {
  'gold-box': 'box-gold',
  'white-box': 'box-white',
  'blue-box': 'box-blue',
  'gray-box': 'box-gray',
  'dark-box': 'box-dark',
  'text-below': 'mobile-below',
};

/**
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell holds a rendered DM video and no copy
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
 * @param {Element} cell an authored cell
 * @returns {boolean} true when the cell holds only pictures (an editor keeps the <p> round a
 *   lone image, so a paragraph alone does not make a text cell)
 */
function isImageCell(cell) {
  if (!cell.querySelector('picture') || cell.querySelector('h1, h2, h3, h4, h5, h6')) return false;
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim() && !walker.currentNode.parentElement.closest('picture')) return false;
  }
  return true;
}

/**
 * Background video: muted autoplay loop without controls.
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

const eager = (pic) => {
  const img = pic && pic.querySelector('img');
  if (img) { img.setAttribute('loading', 'eager'); img.setAttribute('fetchpriority', 'high'); }
};
const lazy = (pic) => {
  const img = pic && pic.querySelector('img');
  if (img) { img.setAttribute('loading', 'lazy'); img.removeAttribute('fetchpriority'); }
};

/**
 * A media row that links to a fragment (stryker.com: each slide's image or video is an
 * Experience Fragment; the headline belongs to the page): the fragment's media takes the link's
 * place before the rows are sorted, so the slide always has its image when it lays out.
 * @param {Element} block the hero-corp block
 */
async function loadMediaFragments(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')].filter((cell) => {
    const links = cell.querySelectorAll('a[href*="/fragments/"]');
    return links.length === 1 && cell.textContent.trim() === links[0].textContent.trim();
  });
  await Promise.all(cells.map(async (cell) => {
    const link = cell.querySelector('a');
    const url = new URL(link.getAttribute('href'), window.location);
    try {
      const resp = await fetch(`${url.pathname}.plain.html`);
      if (!resp.ok) return;
      const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
      // images the fragment serves itself are relative to the fragment
      doc.querySelectorAll('img[src^="./media_"], source[srcset^="./media_"]').forEach((el) => {
        const attr = el.tagName === 'IMG' ? 'src' : 'srcset';
        el.setAttribute(attr, new URL(el.getAttribute(attr), url).href);
      });
      const media = [...doc.body.querySelectorAll(':scope > div > *')]
        .filter((node) => !node.matches('.section-metadata'));
      cell.replaceChildren(...media.map((node) => document.importNode(node, true)));
      decorateDMAssets(cell);
    } catch {
      // the link stays; the slide shows without that image
    }
  }));
}

/**
 * Sorts the rows into media (desktop picture or video, mobile picture) and the content cell,
 * then rebuilds the block as [media][content].
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
    } else if (pic && isImageCell(cell)) {
      if (!desktopPic) desktopPic = pic;
      else if (!mobilePic) mobilePic = pic;
    } else if (cell.querySelector('h1, h2, h3, h4, p')) {
      contentCell = cell;
    } else if (!pic && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      cell.append(p);
      contentCell = cell;
    }
  });

  // DM images authored inside the copy cell
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

  const slide = block.classList.contains('image-slide');
  // without a mobile image, phones show the desktop image (or the video), the text below it
  if (slide && !mobilePic && (desktopPic || video)) block.classList.add('hero-corp-phone-desktop');

  const media = document.createElement('div');
  if (video) {
    playAsBackground(video);
    media.append(video);
  }
  const desktopShown = window.matchMedia(CROSSOVER).matches;
  if (mobilePic) mobilePic.classList.add('hero-corp-image-mobile');
  if (desktopPic && mobilePic) {
    const phone = slide && !desktopShown;
    const [shown, hidden] = phone ? [mobilePic, desktopPic] : [desktopPic, mobilePic];
    eager(shown);
    lazy(hidden);
    media.append(shown, hidden);
  } else if (desktopPic || mobilePic) {
    const only = desktopPic || mobilePic;
    if (mobilePic && desktopShown && slide) lazy(only);
    else eager(only);
    media.append(only);
  }

  const content = document.createElement('div');
  if (contentCell) content.append(...contentCell.childNodes);
  block.replaceChildren(media, content);
  if (!media.children.length) block.classList.add('hero-corp-no-media');
}

/**
 * Wraps each text run of the headline in a span with its role, title (bold) or subline
 * (plain), for the title / subline colour options; a space keeps the role before it.
 * @param {Element} box the .hero-corp-headline box
 */
function markTextRoles(box) {
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let last = 'subline';
  nodes.forEach((node) => {
    const space = !node.textContent.trim();
    if (space && !node.textContent) return;
    let role = last;
    if (!space) role = node.parentElement.closest('strong, b') ? 'title' : 'subline';
    last = role;
    const span = document.createElement('span');
    span.className = `hero-corp-${role}`;
    node.replaceWith(span);
    span.append(node);
  });
}

/**
 * image-slide: the headline lines go in a box (`.hero-corp-headline`, coloured by box-*),
 * the button paragraphs after it.
 * @param {Element} block the hero-corp block
 */
function setupImageSlide(block) {
  const content = block.lastElementChild;
  const lines = [...content.children].filter((el) => !el.classList.contains('button-wrapper'));
  if (!lines.length) return;
  const box = document.createElement('div');
  box.className = 'hero-corp-headline';
  box.append(...lines);
  content.prepend(box);
  markTextRoles(box);
  [...block.classList].forEach((opt) => {
    if (/^box-(white|gold|blue|gray|dark|(gold|purple|blue)-gradient)$/.test(opt)) box.classList.add(opt);
    const m = opt.match(/^box-(mt|mr|mb|ml|pt|pr|pb|pl)-(n?)(\d+)$/);
    if (m) box.style[BOX_SPACING[m[1]]] = `${m[2] ? '-' : ''}${m[3]}%`;
  });
}

/**
 * page-hero: the copy first, the image beside it (on phones under it); no image = no-image.
 * @param {Element} block the hero-corp block
 */
function setupPageHero(block) {
  const [media, content] = block.children;
  if (!media.children.length) {
    block.classList.add('no-image');
    media.remove();
    return;
  }
  block.append(media);
  if (block.classList.contains('no-image')) media.remove();
  else content.classList.add('hero-corp-copy');
}

/**
 * @param {Element} block the hero-corp block
 */
export default async function decorate(block) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/hero-corp/hero-corp-std.css`);
  Object.entries(ALIASES).forEach(([old, name]) => {
    if (block.classList.contains(old)) block.classList.add(name);
  });
  await loadMediaFragments(block);
  setupRows(block);
  if (block.classList.contains('image-slide')) setupImageSlide(block);
  if (block.classList.contains('page-hero')) setupPageHero(block);
}
