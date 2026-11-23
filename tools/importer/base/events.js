/* global WebImporter */
// www.stryker.com empty archive pages and 2018/2019 event pages (#527), built like the legal pages
// (long-page-detail-corp builder) with the page title and the hero carousel of the event pages.
import { preprocess, transformPage } from './legal.js';

const text = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

// .c-hero-large-header h1 → the page title the builder takes (`.h1-title h1`)
function heroTitle(document) {
  document.querySelectorAll('.c-hero-large-header').forEach((header) => {
    const h1 = header.querySelector('h1');
    const title = document.createElement('div');
    title.className = 'h1-title';
    if (h1 && text(h1)) {
      const heading = document.createElement('h1');
      heading.textContent = text(h1);
      title.append(heading);
    }
    (header.closest('.hero-large-carousel') || header).before(title);
    if (!header.closest('.hero-large-carousel')) header.remove();
  });
}

// A newly opened link keeps the `#_blank` author marker (scripts.js decorateLinkTargets).
function linkOf(source, document) {
  const a = document.createElement('a');
  const href = source.getAttribute('href') || '';
  const newTab = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  a.href = newTab && !href.includes('#') ? `${href}#_blank` : href;
  return a;
}

// Each slide of .c-hero-large-carousel → its own section: Columns (columns-50-50) on the dark band,
// product image (linked as on the source) | title (H2) and its link (bold + underline). The
// rotation is lost; a carousel with no slide is dropped.
function carousel(document) {
  document.querySelectorAll('.c-hero-large-carousel').forEach((component) => {
    const slides = [...component.querySelectorAll('.slide-container')].map((slide) => {
      const image = slide.querySelector('.slide-image img');
      const imageLink = slide.querySelector('.slide-image a');
      const title = slide.querySelector('.slide-title');
      const link = slide.querySelector('a.slide-link');
      const first = [];
      if (image) {
        const img = image.cloneNode(true);
        const p = document.createElement('p');
        p.append(img);
        first.push(p);
        // the link alone on the line after the image makes it clickable (Columns media-pair)
        if (imageLink) {
          const a = linkOf(imageLink, document);
          a.textContent = (img.getAttribute('alt') || '').trim() || text(imageLink) || (title ? text(title) : '') || a.getAttribute('href');
          const line = document.createElement('p');
          line.append(a);
          first.push(line);
        }
      }
      const second = [];
      if (title && text(title)) {
        const h2 = document.createElement('h2');
        h2.textContent = text(title);
        second.push(h2);
      }
      if (link && text(link)) {
        const a = linkOf(link, document);
        a.textContent = text(link);
        const strong = document.createElement('strong');
        const u = document.createElement('u');
        u.append(a);
        strong.append(u);
        const p = document.createElement('p');
        p.append(strong);
        second.push(p);
      }
      const block = WebImporter.Blocks.createBlock(document, {
        name: `Columns (columns-50-50${first.length > 1 ? ', media-pair' : ''})`,
        cells: [[first, second]],
      });
      block.setAttribute('data-keep', 'section');
      block.setAttribute('data-no-merge', '');
      block.setAttribute('data-section-style', 'bg-dark-gray');
      return block;
    });
    const holder = component.closest('.hero-large-carousel') || component;
    if (slides.length) slides[0].setAttribute('data-title-before', '');
    holder.replaceWith(...slides);
  });
}

// Source typos (not names or medical terms) corrected on import.
const TYPOS = [[/\bModerater\b/g, 'Moderator']];

function fixTypos(document) {
  const walker = document.createTreeWalker(document.body, 4);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    TYPOS.forEach(([pattern, fix]) => {
      node.nodeValue = node.nodeValue.replace(pattern, fix);
    });
  }
}

// The source alt of some images is double-escaped (`Power&amp;nbsp;Tool`): a literal "&nbsp;".
function decodeAlts(document) {
  document.querySelectorAll('img[alt*="&nbsp;"]').forEach((img) => {
    img.setAttribute('alt', img.getAttribute('alt').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
  });
}

const assetOf = (url) => (url || '').split('?')[0];

// A full-width image whose desktop and phone versions are the same asset in two presets is one
// image: the new pages have no rules to show one of two.
function singleFullWidthImages(document) {
  document.querySelectorAll('.imgBoxId.full-width-img').forEach((box) => {
    const source = box.querySelector('source[srcset]');
    const img = box.querySelector('img');
    if (!source || !img || assetOf(source.getAttribute('srcset')) !== assetOf(img.getAttribute('src'))) return;
    img.setAttribute('src', source.getAttribute('srcset'));
    source.remove();
  });
}

// A related-content grid (.c-customizeable: heading, then product image + title + text + link
// per item) as the existing components: a section title, then one Columns row with a cell per item
// (a linked image, the link on the line after it, Columns media-pair, and the text).
function relatedProducts(document) {
  document.querySelectorAll('.c-customizeable').forEach((grid) => {
    const parts = [];
    const heading = grid.querySelector('h2');
    if (heading && text(heading)) {
      const title = document.createElement('div');
      title.className = 'c-title';
      const h2 = document.createElement('h2');
      h2.textContent = text(heading);
      title.append(h2);
      parts.push(title);
    }
    const cells = [...grid.querySelectorAll('.item')].map((item) => {
      const cell = [];
      const img = item.querySelector('img');
      const h3 = item.querySelector('h3');
      if (img) {
        const p = document.createElement('p');
        p.append(img.cloneNode(true));
        cell.push(p);
        // the link alone on the line after the image makes it clickable (Columns media-pair)
        const link = item.querySelector('.img-cont a[href]');
        if (link) {
          const a = linkOf(link, document);
          a.textContent = text(h3 || link) || (img.getAttribute('alt') || '').trim() || a.getAttribute('href');
          const line = document.createElement('p');
          line.append(a);
          cell.push(line);
        }
      }
      if (h3 && text(h3)) {
        const heading3 = document.createElement('h3');
        const target = h3.querySelector('a[href]');
        if (target) {
          const a = linkOf(target, document);
          a.textContent = text(h3);
          heading3.append(a);
        } else {
          heading3.textContent = text(h3);
        }
        cell.push(heading3);
      }
      item.querySelectorAll('.desc-container > p').forEach((source) => {
        if (!text(source)) return;
        const p = document.createElement('p');
        p.textContent = text(source);
        cell.push(p);
      });
      const cta = item.querySelector('a.action-link[href]');
      if (cta && text(cta)) {
        const a = linkOf(cta, document);
        const u = document.createElement('u');
        u.textContent = text(cta);
        a.append(u);
        const strong = document.createElement('strong');
        strong.append(a);
        const p = document.createElement('p');
        p.append(strong);
        cell.push(p);
      }
      return cell;
    });
    if (cells.length) {
      // the items side by side from 600px, stacked on phones, as the source grid
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'Columns (media-pair)',
        cells: [cells],
      });
      block.setAttribute('data-keep', 'flow');
      parts.push(block);
    }
    (grid.closest('.customizable') || grid).replaceWith(...parts);
  });
}

// The page title stays where the source has it (before the first slide of the hero carousel),
// not at the top the builder puts it.
function placeTitle(main) {
  const marker = main.querySelector('[data-title-before]');
  if (!marker) return;
  const title = [];
  let node = main.firstChild;
  while (node && node.nodeName !== 'HR') {
    title.push(node);
    node = node.nextSibling;
  }
  if (!node || !title.some((n) => n.nodeName === 'H1' || n.querySelector?.('h1'))) return;
  title.push(node);
  let start = marker;
  while (start.parentElement !== main) start = start.parentElement;
  while (start.previousSibling && start.previousSibling.nodeName !== 'HR') start = start.previousSibling;
  if (title.includes(start)) return;
  title.forEach((n) => main.insertBefore(n, start));
  marker.removeAttribute('data-title-before');
}

export default {
  preprocess,
  transform: (payload) => {
    const { document } = payload;
    decodeAlts(document);
    fixTypos(document);
    singleFullWidthImages(document);
    relatedProducts(document);
    heroTitle(document);
    carousel(document);
    const result = transformPage(payload, 'events');
    placeTitle(result[0].element);
    return result;
  },
};
