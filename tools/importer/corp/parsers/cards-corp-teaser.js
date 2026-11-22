/* eslint-disable */
/* global WebImporter */

/**
 * Parser: www.stryker.com `.c-customizeable` related-content grid → `Cards Corp (teaser)`
 * (Block Library: "Cards Corp (teaser) – Related products"). The grid's "Related"
 * heading is kept as default content by the cardList handler (corp-component-handlers.js).
 *
 * Source shape (4 per row):
 *   .item
 *     .img-cont a > img
 *     .desc-container h3 > a, p, a.action-link "Learn more"
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
    // a title authored in Futura bold (h3.futura-bold, 3 card lists: tpx-hd, bpx) → Bold,
    // Futura bold on corp pages; the others keep the light serif title
    if (title.classList.contains('futura-bold') || title.querySelector('.futura-bold')) {
      const strong = document.createElement('strong');
      strong.append(...h3.childNodes);
      h3.append(strong);
    }
    body.push(h3);
  }
  // the description with its links and line breaks (services-and-solutions OnSite "Contact your
  // local Endoscopy Sales Representative", a link on its own line); other markup as its text
  item.querySelectorAll('.desc-container > p').forEach((source) => {
    if (!clean(source.textContent)) return;
    const p = document.createElement('p');
    const copy = (node) => {
      if (node.nodeType === 3) {
        p.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      } else if (node.nodeName === 'BR') {
        p.append(document.createElement('br'));
      } else if (node.nodeName === 'A' && node.getAttribute('href') && clean(node.textContent)) {
        p.append(link(document, node, clean(node.textContent)));
      } else if (node.nodeType === 1) {
        node.childNodes.forEach(copy);
      }
    };
    source.childNodes.forEach(copy);
    // (no spaces at the ends, nor around the line breaks)
    p.normalize();
    if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.trimStart();
    if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.trimEnd();
    p.querySelectorAll('br').forEach((br) => {
      [br.previousSibling, br.nextSibling].forEach((n, i) => {
        if (n && n.nodeType === 3) n.textContent = i ? n.textContent.trimStart() : n.textContent.trimEnd();
      });
    });
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
  const items = [...element.querySelectorAll('.item')].filter((item) => item.querySelector('img'));
  if (!items.length) return;
  const cells = items.map((item) => [imageCell(item, document), textCell(item, document)]);
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards Corp (teaser)', cells }));
}
