/* global WebImporter */

/**
 * Parser: www.stryker.com `.fullWidthImageHero` (a page hero: image with a text box on
 * one half) → `Hero Corp (image-slide …)`, one column, the same rows as the carousel
 * slide parser (hero-image-slide.js) and the corp Block Library samples:
 *   | Hero Corp (image-slide, top-4, left-1, right-50, size-5-5) |
 *   | <desktop image> |   background image (picture > source, from 840px)
 *   | <mobile image>  |   (picture > img)
 *   | <headline>      |   title: the source H1 (bold = span.futura-bold), then its subline
 * Variant options: the text box half (col-sm-6 pull-left → right-50, pull-right →
 * left-50), the box inset measured on the source (20px of the 1380 x 476px image: top-4,
 * left-1 / right-1) and size-<n> from the headline's fontsize-<n>-vw class.
 * Image alt text is copied as-is.
 */

function text(el) {
  return (el && el.textContent ? el.textContent : '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function image(src, alt, document) {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('alt', alt || '');
  return img;
}

/** A source headline line → its inline content: bold as <strong>, line breaks kept. */
function inline(source, document) {
  const out = [];
  source.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      if (node.textContent.trim()) out.push(document.createTextNode(node.textContent.replace(/\u00a0/g, ' ')));
    } else if (node.nodeName === 'BR') {
      out.push(document.createElement('br'));
    } else if (node.nodeType === 1 && node.classList.contains('futura-bold')) {
      const strong = document.createElement('strong');
      strong.textContent = text(node);
      out.push(strong);
    } else if (node.nodeType === 1) {
      out.push(...inline(node, document));
    }
  });
  return out;
}

export default function parse(element, { document }) {
  const picture = element.querySelector('.imgBoxId picture');
  const mobile = picture && picture.querySelector('img');
  const desktop = picture && picture.querySelector('source[srcset]');
  const box = element.querySelector('.textBoxId');
  const rows = [];
  if (desktop) {
    const src = desktop.getAttribute('srcset').split(/\s+/)[0];
    rows.push([image(src, mobile && mobile.getAttribute('alt'), document)]);
  }
  if (mobile) rows.push([image(mobile.getAttribute('src'), mobile.getAttribute('alt'), document)]);

  const content = [];
  const headline = box && box.querySelector('.c-largeheadline');
  if (headline) {
    const line1 = headline.querySelector('.line1');
    const heading = line1 && line1.querySelector('h1, h2, h3');
    if (line1 && text(line1)) {
      const h = document.createElement(heading ? heading.tagName.toLowerCase() : 'p');
      h.append(...inline(heading || line1, document));
      content.push(h);
    }
    const line2 = headline.querySelector('.line2');
    if (line2 && text(line2)) {
      const p = document.createElement('p');
      p.append(...inline(line2, document));
      content.push(p);
    }
  }
  if (content.length) rows.push([content]);

  if (!rows.length) {
    element.remove();
    return;
  }
  const options = ['image-slide'];
  if (box) {
    const right = /\bpull-right\b/.test(box.className);
    options.push('top-4', right ? 'left-50' : 'left-1', right ? 'right-1' : 'right-50');
  }
  const sized = headline && headline.querySelector('[class*="fontsize-"][class*="-vw"]');
  const m = sized && sized.className.match(/fontsize-(\d+(?:-\d+)?)-vw/);
  if (m) options.push(`size-${m[1]}`);
  const name = `Hero Corp (${options.join(', ')})`;
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
}
