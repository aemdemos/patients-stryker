/* global WebImporter */
/*
 * The stryker.com ProCare tile of product pages (`.c-tiles .c-cross-promotional-tile`): a
 * template part of the product-detail template, the same on every page of a business unit
 * (Isolibrium and Prime Series show the same Acute Care tile). On EDS it is page metadata
 * (stryker-aemcoder-package decisions: "ProCare tiles are page metadata"): `procare: <unit>`
 * names the unit, and templates/product-detail shows that unit's shared ProCare tile fragment.
 *   procareUnit(document)  the unit of the page's tile ('' without one), from the tile's
 *                          "Learn More" link (/us/en/<unit>/services/procare.html)
 *   procareTile(document)  the fragment content: the tile image, then the pop-up (underlined
 *                          title, contacts, coverage table, text, the Learn More button)
 */

const text = (el) => (el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '');

const TILE = '.c-cross-promotional-tile';

/**
 * The business unit of the page's ProCare tile.
 * @param {Document} document The source document
 * @returns {string} e.g. 'acute-care', or '' when the page has no ProCare tile
 */
export function procareUnit(document) {
  const tile = document.querySelector(TILE);
  if (!tile || !tile.querySelector('.c-procare-tile')) return '';
  const link = tile.querySelector('.c-procare-tile-info a.btn[href]');
  const m = link && link.getAttribute('href').match(/\/us\/en\/([^/]+)\/services\/procare/i);
  return m ? m[1].toLowerCase() : '';
}

/** The fragment path of a unit's ProCare tile (`base`: the fragments folder). */
export function procareTilePath(unit, base = '/us/en/fragments/') {
  return `${base}stryker/${unit}/en/procare-tile`;
}

// a label line ("Toll free (USA only):") in bold, its value on the next line
function contactPara(document, label, value) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = text(label);
  p.append(strong, document.createElement('br'));
  const link = value.querySelector('a[href]');
  if (link) {
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = text(link);
    p.append(a);
  } else {
    p.append(document.createTextNode(text(value)));
  }
  return p;
}

/**
 * The ProCare tile fragment: section 1 the tile image (its "ProCare Services" lettering and
 * "Read more" bar are in the image), section 2 the pop-up.
 * @param {Document} document The source document
 * @returns {Node[]} The fragment's nodes ([] without a tile)
 */
export function procareTile(document) {
  const tile = document.querySelector(TILE);
  if (!tile) return [];
  const out = [];
  const img = tile.querySelector('.c-procare-tile-image, img');
  if (img) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = img.getAttribute('src');
    a.textContent = img.getAttribute('alt') || '';
    p.append(a);
    out.push(p, document.createElement('hr'));
  }
  const info = tile.querySelector('.c-procare-tile-info');
  if (!info) return out;
  // the title: an underlined heading (stryker.com draws a grey line under it)
  const title = info.querySelector('.c-procare-tile-title');
  if (text(title)) {
    const h2 = document.createElement('h2');
    const u = document.createElement('u');
    u.textContent = text(title);
    h2.append(u);
    out.push(h2);
  }
  // the contacts: two columns of label + value
  const columns = [...info.querySelectorAll('.c-procare-tile-contact > div')].map((col) => {
    const cell = document.createElement('div');
    col.querySelectorAll('.c-procare-tile-contact-group > div').forEach((pair) => {
      const label = pair.querySelector('.c-procare-tile-contact-label');
      const value = pair.querySelector('p');
      if (label && value) cell.append(contactPara(document, label, value));
    });
    return cell;
  }).filter((cell) => cell.childNodes.length);
  if (columns.length) {
    out.push(WebImporter.Blocks.createBlock(document, {
      name: columns.length > 1 ? 'Columns (columns-50-50)' : 'Columns',
      cells: [columns],
    }));
  }
  // the coverage table: the first row is the header
  const table = info.querySelector('table');
  if (table) {
    const rows = [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((cell) => text(cell)));
    if (rows.length) out.push(WebImporter.Blocks.createBlock(document, { name: 'Table', cells: rows }));
  }
  // the text: the bold title line, then the copy
  info.querySelectorAll('.c-procare-tile-addinfo p').forEach((para) => {
    if (!text(para)) return;
    const p = document.createElement('p');
    const bold = para.querySelector('strong, b');
    if (bold && text(bold) === text(para)) {
      const strong = document.createElement('strong');
      strong.textContent = text(para);
      p.append(strong);
    } else {
      p.textContent = text(para);
    }
    out.push(p);
  });
  // the Learn More button: a bold link alone on its line (the teal button)
  const button = info.querySelector('a.btn[href]');
  if (button) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = button.getAttribute('href');
    a.textContent = text(button);
    strong.append(a);
    p.append(strong);
    out.push(p);
  }
  return out;
}
