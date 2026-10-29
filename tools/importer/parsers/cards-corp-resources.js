/* global WebImporter */

/**
 * Parser: www.stryker.com `.c-resourcesanddownload` → `Cards Corp (resources)` block,
 * as in the corp Block Library ("Cards Corp (resources) – Downloads").
 *
 * Two columns, one row per download (card):
 *   cell 1 (image): the PDF cover image, as the Library authors it: a link to its image
 *     URL (…/file.pdf.thumb.319.319.png), which the block renders as the cover picture
 *   cell 2 (text): a Heading 5 whose text is a plain link to the file (the source title)
 * Files stay on www.stryker.com (absolute links); a link that opens in a new tab on the
 * source, or a PDF, gets the `#_blank` marker (as in the news-detail import).
 * The source grid shows 6 per row on desktop (col-md-2) → `six-up`; otherwise the
 * variant's 4 per row.
 */

const SOURCE_ORIGIN = 'https://www.stryker.com';

function text(el) {
  return (el && el.textContent ? el.textContent : '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function absolute(href) {
  return href && href.startsWith('/') && !href.startsWith('//') ? `${SOURCE_ORIGIN}${href}` : href;
}

function newTab(source, href) {
  if (!href || href.includes('#')) return href;
  const isPdf = /\.pdf(\?|$)/i.test(href);
  const blank = (source.getAttribute('target') || '').toLowerCase() === '_blank';
  return isPdf || blank ? `${href}#_blank` : href;
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.item')];
  const rows = items.map((item) => {
    const title = item.querySelector('.title, h5, h4');
    const link = (title && title.closest('a[href]')) || item.querySelector('a[href]');
    const img = item.querySelector('img');
    if (!link || !img) return null;
    const src = absolute(img.getAttribute('src'));
    const cover = document.createElement('a');
    cover.href = src;
    cover.textContent = src;
    const h5 = document.createElement('h5');
    const a = document.createElement('a');
    a.href = newTab(link, absolute(link.getAttribute('href')));
    a.textContent = text(title) || text(link);
    h5.append(a);
    return [cover, h5];
  }).filter(Boolean);
  if (!rows.length) {
    element.remove();
    return;
  }
  const sixUp = items.some((item) => /\bcol-md-2\b/.test(item.className));
  const name = sixUp ? 'Cards Corp (resources, six-up)' : 'Cards Corp (resources)';
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
}
