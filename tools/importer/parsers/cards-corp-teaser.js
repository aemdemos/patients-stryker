/* eslint-disable */
/* global WebImporter */

/**
 * Parser: www.stryker.com `.c-customizeable` related-content grid → `Cards Corp (teaser)`
 * (Block Library: "Cards Corp (teaser) – Related products"). The grid's "Related"
 * heading is kept as default content by news-detail-sections.js.
 *
 * Source shape (4 per row; 3 or 2 per row → three-up / two-up):
 *   .item
 *     .img-cont a > img
 *     .desc-container h3 > a, p, a.action-link "Learn more"
 * or a Latest News card (.c-latestnews): .item > img, h3, p.description, a.action-link
 *
 * Block table: 2 columns, one row per card —
 *   | <image> | <h3><a>title</a></h3> <p>description</p> <p><strong><a><u>Learn more</u></a></strong></p> |
 * The image is left unlinked (cards-corp links it to the card's CTA); the DM transformer
 * turns it into a Dynamic Media link with the alt text as link text. The CTA is a
 * bold + underline link (authoring convention → uppercase teal link with an arrow).
 */

function clean(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function link(document, source, text) {
  const a = document.createElement('a');
  a.setAttribute('href', source.getAttribute('href'));
  a.textContent = text;
  return a;
}

function imageCell(item, document) {
  const source = item.querySelector('.img-cont img, img');
  // a card without a picture (e.g. "Incontinence care" in the related products of the
  // incontinence prevalence article) keeps an empty image cell
  if (!source) return '';
  const img = document.createElement('img');
  img.setAttribute('src', source.getAttribute('src'));
  img.setAttribute('alt', source.getAttribute('alt') || '');
  return [img];
}

function textCell(item, document) {
  const body = [];
  const title = item.querySelector('h3');
  if (title && clean(title.textContent)) {
    const h3 = document.createElement('h3');
    const titleLink = title.querySelector('a[href]');
    if (titleLink) h3.append(link(document, titleLink, clean(titleLink.textContent)));
    else h3.textContent = clean(title.textContent);
    body.push(h3);
  }
  // the description (a Latest News card's p.description, e.g. the DE&I Summit's "Related
  // stories"; an empty one is skipped)
  item.querySelectorAll('.desc-container > p, :scope > p.description').forEach((source) => {
    if (!clean(source.textContent)) return;
    const p = document.createElement('p');
    p.textContent = clean(source.textContent);
    body.push(p);
  });
  const cta = item.querySelector('a.action-link[href]');
  if (cta && clean(cta.textContent)) {
    const a = link(document, cta, '');
    const u = document.createElement('u');
    u.textContent = clean(cta.textContent);
    a.append(u);
    const strong = document.createElement('strong');
    strong.append(a);
    const p = document.createElement('p');
    p.append(strong);
    body.push(p);
  }
  return body;
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.item')].filter((item) => item.querySelector('img, h3'));
  if (!items.length) return;
  const cells = items.map((item) => [imageCell(item, document), textCell(item, document)]);
  // the source grid's column width: 3 per row (col-sm-4, e.g. the pediatric virtual nursing
  // pilot's "Related") → three-up, 2 per row (col-sm-6) → two-up; otherwise 4 per row
  const cols = items[0].className;
  let variant = '';
  if (/\bcol-sm-4\b/.test(cols)) variant = ', three-up';
  else if (/\bcol-sm-6\b/.test(cols)) variant = ', two-up';
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: `Cards Corp (teaser${variant})`, cells }));
}
