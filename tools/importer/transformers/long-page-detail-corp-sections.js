/* global WebImporter */

/**
 * Transformer: www.stryker.com long-page-detail pages (template long-page-detail-corp) and
 * their shared Experience Fragments — page structure (#469).
 *
 * The pages use the same stryker.com components as the news articles, so beforeTransform
 * prepares the long-page-detail parts and then rebuilds <body> with the template's own copy
 * of the news-detail article builder (long-page-detail-corp-article.js → buildArticle):
 *   1. Experience Fragment slots (.experiencefragment): an empty slot is dropped. The slot
 *      shows the page's XF (long-page-detail-corp-xf.js, from the customer's export). An XF
 *      that the export lists on 2 or more pages is shared: a `Fragment` block in a section
 *      of its own, at the common XF → fragment path (xf-fragment-path.js); any other XF is
 *      imported inline. The same XF shown twice is imported once.
 *   2. section titles (.c-section-title, e.g. the Virtual Learning Center video title): the
 *      title as an underlined Heading 2 (the grey rule below it, authoring conventions),
 *      then its description (Heading 3) as on the source.
 *   3. a video caption (.c-standalone-video .desc-content) follows the video as a paragraph.
 *   4. Resources & downloads (.c-resourcesanddownload) stay in the article section for the
 *      cards-corp-resources parser; their title ("Brochures") is an underlined Heading 2
 *      before them.
 *   5. the source back link (.c-back-button) is not content and is not migrated (no back
 *      link on the corp pages).
 *   6. components the source sets in the centred AEM grid column (offset 1, 10 or 11 of 12
 *      columns: the Virtual Learning Center video item) get the `column-10-12` section
 *      style (the template CSS sets the 10/12 column and the 11/12 downloads row).
 *   7. a video whose asset is a plain DAM file (data-asset-path /content/dam/…), not a
 *      Dynamic Media video, renders nothing on stryker.com: it is dropped instead of becoming
 *      a broken player (e.g. Introducing Blueprint® Mixed Reality).
 *   8. an address written right after a colon ("found at:https://…") gets a space after the
 *      colon: EDS reads `:https:` as an icon and the text would disappear.
 * The H1 title, rich text, separators and the small print (`disclaimer`) are built as in
 * the news articles. No `spacer` section follows the title.
 */

import buildArticle, {
  richTextNodes, imageNodes, buttonNodes, headlineNodes, titleHeading, absoluteAsset, newTabHref,
} from './long-page-detail-corp-article.js';
import { videoLink } from '../parsers/video.js';
import { convertBeforeRows, convertAfterRows } from './long-page-detail-corp-components.js';
import PAGE_XF_SLOTS from '../long-page-detail-corp-xf-slots.js';
import { xfToFragmentPath } from '../xf-fragment-path.js';
import PAGE_XFS from '../long-page-detail-corp-xf.js';

const TEMPLATES = ['long-page-detail-corp', 'long-page-detail-corp-fragments'];

// the shared XFs: on 2 or more long-page-detail pages in the export
const XF_PAGES = Object.values(PAGE_XFS).flat().reduce((counts, xf) => {
  counts[xf] = (counts[xf] || 0) + 1;
  return counts;
}, {});

/**
 * The fragment document path of a shared XF, or null when the XF is imported inline.
 * @param {string} xf XF path (as in the export, no .html)
 * @returns {string|null}
 */
export function sharedFragmentPath(xf) {
  return XF_PAGES[xf] > 1 ? xfToFragmentPath(xf) : null;
}

/**
 * Run as the import's `preprocess`, before the importer drops empty paragraphs: an empty
 * paragraph in a Large Headline line with text after it (biologics: an &nbsp; paragraph
 * between "Coming soon!" and the intro) is a blank line on the source, so it becomes line
 * breaks (headlineNodes keeps them).
 * @param {Document} document
 */
export function keepHeadlineBlankLines(document) {
  const blank = (node) => !(node.textContent || '').replace(/\u00a0/g, ' ').trim()
    && !(node.nodeType === 1 && node.querySelector('img, picture, iframe'));
  const textBeside = (node, dir) => {
    for (let n = node[dir]; n; n = n[dir]) {
      if (!blank(n)) return true;
    }
    return false;
  };
  document.querySelectorAll('.c-largeheadline .line p').forEach((p) => {
    if (!blank(p) || !textBeside(p, 'nextSibling')) return;
    // between two text paragraphs: the line break that ends the first one as well
    const breaks = textBeside(p, 'previousSibling') ? 2 : 1;
    p.replaceWith(...Array.from({ length: breaks }, () => document.createElement('br')));
  });
}

// pages whose blank rich-text paragraphs are kept as space (blankLineSpacers), page by page
const BLANK_LINE_PAGES = new Set([
  '/us/en/training-and-education/orthopaedics/joint-replacement/Mako_surgeon_campaign.html',
]);

/**
 * Run as the import's `preprocess` as well: on the BLANK_LINE_PAGES, a blank paragraph
 * (&nbsp;) between two parts of a rich text is about 34px of space on the source (Mako
 * surgeon campaign: before "Cut less", around "Turn data into insights", two after the
 * "**Patient satisfaction" note). The rich text is split there, with an empty Large Headline
 * per blank line between the parts and after the last one, which the article builder makes
 * a `spacer` section. Not in tabs or accordion panels.
 * @param {Document} document
 * @param {string} url the source page URL
 */
export function blankLineSpacers(document, url) {
  if (!BLANK_LINE_PAGES.has(new URL(url).pathname)) return;
  const blank = (node) => node.nodeType !== 1 || (node.tagName === 'P'
    && !node.textContent.replace(/\u00a0/g, ' ').trim() && !node.querySelector('img, picture, iframe'));
  document.querySelectorAll('.text.parbase > .c-rich-text-editor > div').forEach((box) => {
    const component = box.parentElement.parentElement;
    // text in tabs and accordion panels keeps its own spacing
    if (component.closest('.c-tabs, .panel, .c-accordion')) return;
    // the text parts and blank lines in order (blank lines before the first text dropped)
    const items = [];
    [...box.childNodes].forEach((node) => {
      const prev = items[items.length - 1];
      if (node.nodeType === 1 && blank(node)) {
        if (items.length) items.push(null);
      } else if (prev) prev.push(node);
      else if (!blank(node) || items.length) items.push([node]);
    });
    if (!items.includes(null)) return;
    const parts = items.filter(Boolean);
    box.replaceChildren(...parts[0]);
    let last = component;
    items.slice(items.indexOf(parts[0]) + 1).forEach((item) => {
      if (!item) {
        const spacer = document.createElement('div');
        spacer.className = 'largeheadline';
        const headline = document.createElement('div');
        headline.className = 'c-largeheadline page-section container';
        spacer.append(headline);
        last.after(spacer);
        last = spacer;
        return;
      }
      if (!item.some((node) => !blank(node))) return;
      const copy = component.cloneNode(true);
      copy.querySelector('.c-rich-text-editor > div').replaceChildren(...item);
      last.after(copy);
      last = copy;
    });
  });
}

/**
 * Run after the shared cleanup's link rewrite (which drops `.html`): a link to a site page
 * (root-relative, not an asset) points to the page's EDS document path, cleaned as the
 * imported pages' paths are (WebImporter.FileUtils.sanitizePath, e.g.
 * `/…/medical-and-surgical-equipment--/…` → `/…/medical-and-surgical-equipment/…`,
 * `Medical_Education_Landing_Page` → `medical-education-landing-page`). Query, #hash and
 * the trailing slash of an index page are kept. For this template only.
 * @param {Element} main
 */
export function edsLinkPaths(main) {
  main.querySelectorAll('a[href^="/"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.startsWith('//') || href.startsWith('/content/')) return;
    const [, path, suffix = ''] = href.match(/^([^?#]*)([?#].*)?$/);
    const slash = path.length > 1 && path.endsWith('/') ? '/' : '';
    const bare = path.replace(/\/$/, '');
    if (!bare) return;
    const clean = WebImporter.FileUtils.sanitizePath(bare);
    if (clean && clean !== bare) a.setAttribute('href', `${clean}${slash}${suffix}`);
  });
}

// the centred AEM grid column of the Virtual Learning Center video item
const CENTRED_COLUMN = ':is(.aem-GridColumn--default--10, .aem-GridColumn--default--11).aem-GridColumn--offset--default--1';

function columnStyle(component) {
  if (component.closest(CENTRED_COLUMN)) return 'column-10-12';
  // a coloured Large Headline box in the 2/3 column of a row whose other column is empty
  // (ispies event titles, source cols2_2-3_1-3): `column-8-12`, the box 2/3 wide
  const col = component.matches('.c-largeheadline') && component.querySelector('.has-background:not(.bg-white)')
    && component.closest('[class*="col-sm-8"]');
  const row = col && col.parentElement;
  const empty = (c) => !c.textContent.trim() && !c.querySelector('img, iframe, [data-asset-path]');
  if (row && [...row.children].every((c) => c === col || empty(c))) {
    return 'column-8-12';
  }
  return '';
}

function text(el) {
  return (el.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function sourcePath(payload) {
  try {
    return new URL(payload.params.originalURL).pathname;
  } catch {
    return '';
  }
}

/** A rich-text component (as on the source) holding the given nodes. */
function richText(doc, nodes) {
  const box = doc.createElement('div');
  box.className = 'c-rich-text-editor';
  const inner = doc.createElement('div');
  inner.append(...nodes);
  box.append(inner);
  return box;
}

/** The columns of an AEM column row (.colctrl > .row > .col-*). */
function rowColumns(colctrl) {
  const row = colctrl.querySelector(':scope > .row');
  return row ? [...row.children].filter((el) => /\bcol-(xs|sm|md)-\d+/.test(el.className)) : [];
}

/** Where a slot sits, as in long-page-detail-corp-xf-slots.js: "<row>:<column>" or "". */
function slotSignature(slot) {
  const colctrl = slot.closest('.colctrl');
  if (!colctrl) return '';
  const row = (colctrl.parentElement.className.match(/\bcols[\w-]*/) || [''])[0].replace(/-/g, '_');
  const column = rowColumns(colctrl).findIndex((col) => col.contains(slot)) + 1;
  return `${row}:${column}`;
}

function fragmentBlock(doc, path) {
  const a = doc.createElement('a');
  a.href = path;
  a.textContent = path;
  return WebImporter.Blocks.createBlock(doc, { name: 'Fragment', cells: [[a]] });
}

function experienceFragments(main, doc, xfs, slots) {
  const filled = [...main.querySelectorAll('.experiencefragment')]
    .filter((slot) => !slot.parentElement.closest('.experiencefragment'))
    .filter((slot) => {
      if (text(slot) || slot.querySelector('img, [data-asset-path], iframe')) return true;
      slot.remove();
      return false;
    });
  if (!filled.length) return;
  // the export gives a page's XFs, not their order: one XF → every slot shows it; two or
  // more → each slot is matched by its position (long-page-detail-corp-xf-slots.js). A
  // slot that matches nothing is imported inline and the page is marked for the report.
  const seen = new Set();
  filled.forEach((slot) => {
    let xf = xfs.length === 1 ? xfs[0] : null;
    if (!xf && slots) {
      const signature = slotSignature(slot);
      xf = Object.keys(slots).find((key) => slots[key] === signature) || null;
    }
    if (!xf) {
      main.ownerDocument.body.setAttribute('data-xf-unresolved', String(xfs.length));
      return;
    }
    // the same XF shown twice is imported once
    if (seen.has(xf)) {
      slot.remove();
      return;
    }
    seen.add(xf);
    const path = sharedFragmentPath(xf);
    if (!path) return;
    const block = fragmentBlock(doc, path);
    block.setAttribute('data-keep', 'section');
    slot.replaceWith(block);
  });
}

function sectionTitles(main, doc) {
  main.querySelectorAll('.c-section-title, .c-title').forEach((title) => {
    const nodes = [];
    const heading = title.querySelector('h2');
    if (heading && text(heading)) {
      const h2 = doc.createElement('h2');
      const u = doc.createElement('u');
      u.textContent = text(heading);
      h2.append(u);
      nodes.push(h2);
    }
    const container = title.querySelector('.title-container') || title;
    [...container.children].filter((el) => el !== heading && text(el)).forEach((el) => {
      nodes.push(el.cloneNode(true));
    });
    // an empty section title (a jump bar anchor, OR staff: before each band) is its 30px
    // bottom margin on the source, as an empty Large Headline: one for the article builder
    // (a `spacer` section)
    if (!nodes.length) {
      const spacer = doc.createElement('div');
      spacer.className = 'c-largeheadline';
      title.replaceWith(spacer);
      return;
    }
    title.replaceWith(richText(doc, nodes));
  });
}

/**
 * The title of a Resources & downloads component ("Brochures", "Clinical articles" on the
 * endoscopy medical-education pages: Futura bold with a grey rule below) as an underlined
 * Heading 2 before the downloads (authoring conventions; as the section titles).
 */
function downloadTitles(main, doc) {
  main.querySelectorAll('.c-resourcesanddownload').forEach((downloads) => {
    const title = downloads.querySelector('.title-container :is(h2, h3, h4)');
    if (!title || !text(title)) return;
    const h2 = doc.createElement('h2');
    const u = doc.createElement('u');
    u.textContent = text(title);
    h2.append(u);
    (downloads.closest('.resourcesanddownload') || downloads).before(richText(doc, [h2]));
    title.remove();
  });
}

function videoCaptions(main, doc) {
  main.querySelectorAll('.c-standalone-video').forEach((video) => {
    const caption = video.querySelector('.desc-content');
    if (!caption) return;
    if (text(caption)) {
      const copy = caption.cloneNode(true);
      (video.closest('.standalonevideo') || video).after(richText(doc, [...copy.childNodes]));
    }
    caption.remove();
  });
}

/**
 * The source local navigation (.localpagenavigation nav: the parent page link, then the
 * links of its section) → `Local Nav` block: row 1 the parent link, row 2 the list of
 * links. Removed from the page; null when the page has none.
 */
function localNav(main, doc) {
  const nav = main.querySelector('.localpagenavigation nav');
  if (!nav) return null;
  const parent = nav.querySelector('a.parent-node');
  const links = [...nav.querySelectorAll('ul.links > li > a[href]')];
  nav.closest('.localpagenavigation').remove();
  if (!parent && !links.length) return null;
  const rows = [];
  if (parent) {
    const a = doc.createElement('a');
    a.href = parent.getAttribute('href');
    a.textContent = text(parent);
    rows.push([a]);
  }
  const ul = doc.createElement('ul');
  links.forEach((source) => {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.href = source.getAttribute('href');
    a.textContent = text(source);
    li.append(a);
    ul.append(li);
  });
  rows.push([ul]);
  return WebImporter.Blocks.createBlock(doc, { name: 'Local Nav', cells: rows });
}

/** A source Marketo form (form[data-marketo-form-id]) → `Marketo Form` block, or null. */
function marketoBlock(container, doc) {
  const form = container.querySelector('form[data-marketo-form-id]');
  if (!form) return null;
  const cells = [
    ['Base URL', form.getAttribute('data-marketo-base-url') || ''],
    ['Munchkin ID', form.getAttribute('data-marketo-munchkin-id') || ''],
    ['Form ID', form.getAttribute('data-marketo-form-id') || ''],
  ];
  return WebImporter.Blocks.createBlock(doc, { name: 'Marketo Form', cells });
}

const CELL_COMPONENTS = [
  '.c-rich-text-editor', '.c-standalone-image', '.c-standalone-video', '.c-largeheadline',
  '.c-curatedcta', '.buttonset', 'table',
].join(', ');

/** The link around a standalone image (a[href] > img), or null. */
function linkedImage(component) {
  const img = component.querySelector('img');
  const link = img && img.closest('a[href]');
  return link && component.contains(link) ? link : null;
}

/**
 * A row of four columns that stryker.com sets one per row on phones (col-xs-12, e.g. the nse
 * grids, surgical videos): `Columns (stack)` (corp 4-cell rows are two per row on phones).
 */
function stackRow(columns) {
  return columns.length === 4 && columns.every((col) => !/\bcol-xs-([1-9]|1[01])\b/.test(col.className));
}

// a source box colour (.has-background.bg-…, a .dimensional-box without a colour: `boxed`)
// → its Columns variant colour
const BOX_COLOURS = {
  'light-gray': 'gray', blue: 'blue', gold: 'gold', purple: 'purple', 'dark-gray': 'dark',
};
// the Columns box variants (columns-corp): a cell's text in a coloured box
const BOX_VARIANTS = new Set(['gray-last', 'gray-2', 'gray-all', 'boxed-all', 'blue-all', 'gold-lead',
  'dark-lead', 'purple-last', 'gold-first', 'boxed-last', 'gray-lead']);

/**
 * How a column's text sits in a coloured box (its own row's boxes, not a nested row's):
 * { colour, kind } with kind `whole` (all its text is in the box; an image above it stays
 * out) or `lead` (its first text is the box, more text follows), else null.
 */
function cellBox(col) {
  const row = col.closest('.colctrl');
  const boxes = [...col.querySelectorAll('.has-background:not(.bg-white), .dimensional-box')]
    .filter((b) => b.closest('.colctrl') === row && text(b))
    .filter((b) => !b.parentElement.closest('.has-background:not(.bg-white), .dimensional-box'));
  if (!boxes.length) return null;
  const colourOf = (b) => {
    const bg = (b.className.match(/\bbg-([a-z-]+)/) || [])[1];
    if (b.classList.contains('dimensional-box') && (!bg || bg === 'white')) return 'boxed';
    return BOX_COLOURS[bg] || '';
  };
  const colours = [...new Set(boxes.map(colourOf))];
  if (colours.length !== 1 || !colours[0]) return { colour: '', kind: '' };
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  const boxed = squash(boxes.map((b) => b.textContent).join(''));
  if (boxed === squash(col.textContent)) return { colour: colours[0], kind: 'whole' };
  const first = [...col.querySelectorAll(CELL_COMPONENTS)]
    .filter((c) => !c.parentElement.closest(CELL_COMPONENTS) && text(c))[0];
  if (boxes.length === 1 && first && first.contains(boxes[0])) return { colour: colours[0], kind: 'lead' };
  return { colour: '', kind: '' };
}

/**
 * The Columns box variant of a row: one colour, all its text cells boxed (`gray-all`), one cell
 * boxed (`gray-last`, `gray-2`, `gold-first`) or every text cell opening with a box
 * (`dark-lead`); only the variants columns-corp has, else ''.
 */
function boxVariant(columns) {
  const boxes = columns.map(cellBox);
  const used = boxes.filter(Boolean);
  if (!used.length) return '';
  const colours = [...new Set(used.map((b) => b.colour))];
  const kinds = [...new Set(used.map((b) => b.kind))];
  if (colours.length !== 1 || !colours[0] || kinds.length !== 1) return '';
  const textCols = columns.filter((col) => text(col));
  let name = '';
  if (kinds[0] === 'lead' && used.length === textCols.length) name = `${colours[0]}-lead`;
  if (kinds[0] === 'whole') {
    if (used.length > 1 && used.length === textCols.length) name = `${colours[0]}-all`;
    else if (used.length === 1) {
      const i = boxes.findIndex(Boolean);
      if (i === columns.length - 1) name = `${colours[0]}-last`;
      else if (i === 0) name = `${colours[0]}-first`;
      else name = `${colours[0]}-${i + 1}`;
    }
  }
  return BOX_VARIANTS.has(name) ? name : '';
}

/**
 * The content of one column of a source column row, cleaned as in the article builder.
 * The Large Headline marked `data-page-title` (the page's first, on a page without a
 * title) is the page H1.
 */
function cellNodes(col, doc) {
  const out = [];
  [...col.querySelectorAll(CELL_COMPONENTS)]
    .filter((c) => !c.parentElement.closest(CELL_COMPONENTS))
    .forEach((c) => {
      if (c.matches('.c-rich-text-editor')) out.push(...richTextNodes(c, doc).nodes);
      else if (c.matches('.c-standalone-image')) {
        const nodes = imageNodes(c, doc);
        // a linked image (the endoscopy resources specialty tiles): the link alone on the
        // line after it makes the image clickable (`Columns (media-pair)`, columns.js), its
        // text the image's alt text; before the image's caption heading (OR staff tiles)
        const link = linkedImage(c);
        if (link && nodes.length) {
          const a = doc.createElement('a');
          a.setAttribute('href', newTabHref(link, absoluteAsset(link.getAttribute('href'))));
          a.textContent = link.querySelector('img').getAttribute('alt') || text(link) || a.getAttribute('href');
          const p = doc.createElement('p');
          p.append(a);
          nodes.splice(1, 0, p);
        }
        out.push(...nodes);
      } else if (c.matches('.c-standalone-video')) {
        const a = videoLink(c, doc);
        if (a) {
          const p = doc.createElement('p');
          p.append(a);
          out.push(p);
        }
      } else if (c.matches('.c-largeheadline')) {
        const lines = headlineNodes(c, doc);
        if (c.hasAttribute('data-page-title') && lines.length) {
          out.push(titleHeading(lines, doc));
        } else out.push(...lines);
      } else if (c.matches('.c-curatedcta, .buttonset')) out.push(...buttonNodes(c, doc));
      else out.push(c);
    });
  return out;
}

/**
 * A source column whose content is all centred (images in a .text-center box, paragraphs
 * with text-align: center; e.g. the rep-portal icon + link cells): the row gets `center`.
 */
function centredColumn(col) {
  const centred = (el) => !!el.closest('.text-center, [style*="text-align: center"], [style*="text-align:center"]');
  const images = [...col.querySelectorAll('.c-standalone-image img')];
  // the text too: rich text, Large Headline lines and an image's title (OR staff tiles,
  // instruments contact information: centred images over left-aligned text, not centred)
  const paragraphs = [...col.querySelectorAll('.c-rich-text-editor :is(p, h1, h2, h3, h4, h5, h6, li), .c-standalone-image .title-content :is(h2, h3, h4, h5), .c-largeheadline .line')]
    .filter((el) => text(el));
  const items = [...images, ...paragraphs];
  return items.length > 0 && items.every(centred);
}

/** The size tag of a copy style: 'p-1-25' → 'text-1-25', '' when it sets no size. */
function sizeTag(copyStyle) {
  const size = (copyStyle || '').split(',').map((s) => s.trim()).find((s) => /^p-\d/.test(s));
  return size ? `text-${size.slice(2)}` : '';
}

/**
 * Wraps the text of a paragraph or list in a bracket tag (`[[tag]…]`): each paragraph, or
 * each list item, nested ones too; a list item's paragraphs, or its text before a nested
 * list, so a tag never holds a block (Mako refreshers: "case reviews" over a nested list).
 */
function tagCopy(n, tag, doc) {
  const wrap = (first, last) => {
    if (first.nodeType === 3 && first.textContent.trimStart().startsWith(`[[${tag}]`)) return;
    first.before(doc.createTextNode(`[[${tag}]`));
    last.after(doc.createTextNode(']'));
  };
  if (!n.matches('ul, ol')) {
    if (n.firstChild) wrap(n.firstChild, n.lastChild);
    return;
  }
  n.querySelectorAll('li').forEach((li) => {
    const paragraphs = li.querySelectorAll(':scope > p');
    if (paragraphs.length) {
      paragraphs.forEach((p) => { if (p.firstChild) wrap(p.firstChild, p.lastChild); });
      return;
    }
    const inline = [];
    for (let c = li.firstChild; c && !(c.nodeType === 1 && c.matches('ul, ol')); c = c.nextSibling) inline.push(c);
    if (inline.some((c) => c.textContent.trim())) wrap(inline[0], inline[inline.length - 1]);
  });
}

/**
 * The copy style of a column row: the style of most of its text (by length) becomes the
 * section style (e.g. `p-1-25` for 17.5px lists); text in another size gets its size tag
 * (e.g. `[[text-2]Program objectives]`, 28px), as the cells share the section. When some
 * of the text is in the default size (14px), the section sets no size and each sized text
 * gets its tag instead (nse grids: 21px item names over 14px sizes; neurosurgical events:
 * a 21px card title over a 14px date), as there is no tag for the default size.
 */
function rowCopyStyle(cells, doc) {
  const copy = cells.flat().filter((n) => n.nodeType === 1 && n.copyStyle !== undefined
    && n.copyStyle !== null && !/^H\d$/.test(n.tagName));
  const weight = {};
  copy.forEach((n) => { weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text(n).length; });
  let dominant = Object.keys(weight).sort((a, b) => weight[b] - weight[a])[0] || '';
  if (sizeTag(dominant) && copy.some((n) => !sizeTag(n.copyStyle))) {
    dominant = dominant.split(',').map((s) => s.trim()).filter((s) => !/^p-\d/.test(s)).join(', ');
  }
  copy.filter((n) => sizeTag(n.copyStyle) && sizeTag(n.copyStyle) !== sizeTag(dominant))
    .forEach((n) => tagCopy(n, sizeTag(n.copyStyle), doc));
  // serif copy at the source's 14px: `serif, p-1` (in Columns `serif` alone is 21px;
  // footed attachments, jr45 faculty)
  const parts = dominant.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.includes('serif') && !parts.some((s) => sizeTag(s))) return ['p-1', ...parts].join(', ');
  return dominant;
}

// source column widths (col-sm-*) → the Columns variant
const COLUMN_VARIANTS = { '8,4': 'columns-67-33', '4,8': 'columns-33-67', '6,6': 'columns-50-50' };

function columnWidth(col) {
  const m = col.className.match(/\bcol-sm-(\d+)/) || col.className.match(/\bcol-md-(\d+)/);
  return m ? Number(m[1]) : 12;
}

/**
 * A source row whose content stays as it is (one column with content in a row of one or two
 * columns: not a Columns block) adds its 20px (30px from 840px) below its content, also
 * when nested in another row (webinars, the general-surgery downloads): its last content (a
 * component, or an inner row) is marked `data-row-end` (one per row level); the article
 * builder adds a `spacer` section after it (template CSS sets the row spacing). A row that
 * becomes Columns has its spacing already (template CSS).
 */
function markRowEnds(main) {
  const COMPONENT = '[class^="c-"], [class*=" c-"]';
  const hasContent = (el) => text(el) || el.querySelector('img, iframe, [data-asset-path]');
  main.querySelectorAll('.colctrl').forEach((colctrl) => {
    const row = colctrl.querySelector(':scope > .row');
    const all = row ? [...row.children] : [];
    const cols = all.filter(hasContent);
    if (cols.length !== 1 || all.length > 2) return;
    // the last unit with content: an inner row (its .cols wrapper) or a top-level component;
    // an empty coloured panel counts (OR staff: the gold bar under the title ends the row)
    const units = [...cols[0].querySelectorAll(`.colctrl, ${COMPONENT}`)].filter((el) => {
      const outer = el.parentElement.closest(`.colctrl, ${COMPONENT}`);
      return (!outer || outer === colctrl) && (text(el) || el.querySelector('img, iframe, [data-asset-path]')
        || el.matches('.c-full-bleed-panel[class*="bg-"]'));
    });
    const last = units[units.length - 1];
    if (!last) return;
    const unit = last.matches('.colctrl') && last.parentElement && /\bcols/.test(last.parentElement.className)
      ? last.parentElement : last;
    unit.setAttribute('data-row-end', String(Number(unit.getAttribute('data-row-end') || 0) + 1));
  });
  // an empty row (no content, no rule: e.g. between the nse product rows) still adds its
  // row spacing on the source: a row end after the content before it
  const mark = (el) => el.setAttribute('data-row-end', String(Number(el.getAttribute('data-row-end') || 0) + 1));
  main.querySelectorAll('.colctrl').forEach((colctrl) => {
    if (hasContent(colctrl) || colctrl.querySelector('.c-section-separator, .sectionseparator, hr')) return;
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className) ? colctrl.parentElement : colctrl;
    let prev = wrapper.previousElementSibling;
    while (prev && !hasContent(prev)) prev = prev.previousElementSibling;
    if (!prev) return;
    if (/\bcols/.test(prev.className) && prev.querySelector(':scope > .colctrl')) {
      mark(prev);
      return;
    }
    const parts = [...prev.querySelectorAll(COMPONENT)]
      .filter((el) => !el.parentElement.closest(COMPONENT) && hasContent(el));
    const last = parts[parts.length - 1] || (prev.matches(COMPONENT) ? prev : null);
    if (last) mark(last);
  });
}

/**
 * Source column rows (.colctrl) with two or more columns that have content, innermost
 * first:
 *   - a row with a Marketo form: the `Marketo Form` block in a section of its own, a
 *     Fragment block in another column (the contact aside) in the same section
 *   - any other row: a `Columns` block (variant from the column widths), its own section
 */
function columnRows(main, doc) {
  [...main.querySelectorAll('.colctrl')].reverse().forEach((colctrl) => {
    const all = rowColumns(colctrl);
    const filled = all
      .filter((col) => text(col) || col.querySelector('img, [data-asset-path], iframe, form, table'));
    // a row of three or more columns whose content leaves some empty (e.g. the 4th endoscopy
    // video under a row of three, the webinars text in a one-third column): the whole row,
    // the empty columns as empty cells, so the content keeps its source column width (a
    // two-column row with one empty column stays the content alone, e.g. a thank-you page)
    const columns = filled.length && filled.length < all.length && all.length >= 3 ? all : filled;
    if (columns.length < 2) return;
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className)
      ? colctrl.parentElement : colctrl;
    const form = marketoBlock(colctrl, doc);
    if (form) {
      form.setAttribute('data-keep', 'section');
      const asides = [...colctrl.querySelectorAll('table')].filter((t) => t.getAttribute('data-keep'));
      asides.forEach((t) => t.setAttribute('data-keep', 'join'));
      // the content of the other columns (e.g. the spine contact page's "Check out our social
      // media" and its buttons) joins the form's section too, so none of it is lost
      const others = columns
        .filter((col) => !col.querySelector('.c-marketo-form') && !col.querySelector('table[data-keep]'))
        .map((col) => cellNodes(col, doc))
        .filter((nodes) => nodes.length)
        .map((nodes) => {
          const box = doc.createElement('div');
          box.setAttribute('data-keep', 'join');
          box.append(...nodes);
          return box;
        });
      wrapper.replaceWith(form, ...asides, ...others);
      return;
    }
    const key = columns.map(columnWidth).join(',');
    // linked images (the endoscopy resources specialty tiles): `media-pair`
    const linked = filled.some((col) => [...col.querySelectorAll('.c-standalone-image')].some(linkedImage));
    const boxes = boxVariant(columns);
    // white text in a coloured box the row has no variant for (a colour per cell, a gradient)
    // stays in the text colour, so it stays readable
    if (!boxes) {
      colctrl.querySelectorAll('[data-white-tag]').forEach((el) => {
        // only the boxes of this row (not a band around it, not a nested row's)
        const inBox = el.closest('.has-background:not(.bg-white), .dimensional-box, .c-full-bleed-panel');
        if (!inBox || inBox.matches('.c-full-bleed-panel') || inBox.closest('.colctrl') !== colctrl) return;
        if (el.firstChild && el.firstChild.nodeValue === '[[color-white]') el.firstChild.remove();
        if (el.lastChild && el.lastChild.nodeValue === ']') el.lastChild.remove();
        el.removeAttribute('data-white-tag');
      });
    }
    // a rule at the end of the first of two columns (the nse intros: a section separator under
    // the text, not under the image beside it): `left-border-bottom`
    const parts = columns.length === 2 ? [...columns[0].querySelectorAll(`${CELL_COMPONENTS}, .sectionseparator`)]
      .filter((c) => c.closest('.colctrl') === colctrl && (text(c) || c.matches('.sectionseparator'))) : [];
    const firstRule = parts.length > 1 && parts[parts.length - 1].matches('.sectionseparator');
    const variant = [COLUMN_VARIANTS[key], linked ? 'media-pair' : '', stackRow(columns) ? 'stack' : '', boxes,
      firstRule ? 'left-border-bottom' : ''].filter(Boolean).join(', ');
    const centred = filled.every(centredColumn);
    const cells = columns.map((col) => cellNodes(col, doc));
    const style = [rowCopyStyle(cells, doc), centred ? 'center' : ''].filter(Boolean).join(', ');
    const block = WebImporter.Blocks.createBlock(doc, {
      name: variant ? `Columns (${variant})` : 'Columns',
      cells: [cells],
    });
    block.setAttribute('data-keep', 'section');
    if (style) block.setAttribute('data-section-style', style);
    if (wrapper.hasAttribute('data-row-end')) block.setAttribute('data-row-end', wrapper.getAttribute('data-row-end'));
    wrapper.replaceWith(block);
  });
  // a Marketo form outside a column row: a section of its own
  [...main.querySelectorAll('.c-marketo-form')].forEach((component) => {
    const form = marketoBlock(component, doc);
    if (!form) return;
    form.setAttribute('data-keep', 'section');
    (component.closest('.marketoform') || component).replaceWith(form);
  });
}

/** The rows of a block table (its name row first). */
function tableRows(table) {
  return [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')];
}

const MEDIA = 'img, picture, video, iframe, [data-asset-path], a[href*="/is/content/"], a[href*="/is/image/"]';
const isMediaCell = (td) => !td.textContent.trim() || (td.querySelector(MEDIA)
  && [...td.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')].every((el) => el.querySelector(MEDIA) || !text(el)));

/**
 * Consecutive rows of one source grid become the rows of one Columns block, so authors edit a
 * grid in one place (the nse grids: 10 blocks for 4 rows before): a Columns block followed by
 * another with the same name and number of cells, with nothing between them but empty source
 * components (an empty row: its spacing is not kept inside the grid). A row of images followed by
 * a row of their names (the nse grids) first becomes one row of tiles, each image with its name
 * (on phones each image then its own name). The rows also share the section style.
 */
function gridRows(main) {
  const isColumns = (el) => el && el.matches('table[data-keep="section"]')
    && /^Columns\b/.test(text(tableRows(el)[0] || el));
  const empty = (el) => !text(el) && !el.querySelector(`${MEDIA}, table, form, hr, .sectionseparator`)
    && !el.matches('[data-keep], .sectionseparator, hr');
  const next = (el) => {
    let n = el.nextElementSibling;
    while (n && empty(n)) n = n.nextElementSibling;
    return n;
  };
  const cellsOf = (table) => tableRows(table).slice(1).map((tr) => [...tr.children]);
  const textOnly = (td) => !td.querySelector(MEDIA);
  const sameBlock = (x, y) => isColumns(y) && text(tableRows(y)[0]) === text(tableRows(x)[0]);
  // the merged block ends where the last one ended (its source row spacing after it)
  const takeEnd = (into, from) => {
    if (from.hasAttribute('data-row-end')) into.setAttribute('data-row-end', from.getAttribute('data-row-end'));
    else into.removeAttribute('data-row-end');
  };
  const blocks = () => [...main.querySelectorAll('table[data-keep="section"]')].filter(isColumns);
  // 1. an image row and the row of names under it: one row of tiles
  blocks().forEach((first) => {
    const b = next(first);
    if (!first.isConnected || !sameBlock(first, b)) return;
    const [rowA] = cellsOf(first);
    const rowsB = cellsOf(b);
    const pair = cellsOf(first).length === 1 && rowsB.length === 1
      && rowsB[0].length === rowA.length;
    const images = rowA.every(isMediaCell) && rowA.some((td) => td.querySelector(MEDIA));
    if (!pair || !images || !rowsB[0].every(textOnly)) return;
    rowA.forEach((td, i) => td.append(...rowsB[0][i].childNodes));
    const style = b.getAttribute('data-section-style');
    if (style) first.setAttribute('data-section-style', style);
    else first.removeAttribute('data-section-style');
    takeEnd(first, b);
    b.remove();
  });
  // 2. consecutive rows of one grid: one block
  blocks().forEach((first) => {
    if (!first.isConnected) return;
    const width = cellsOf(first)[0].length;
    let b = next(first);
    while (sameBlock(first, b) && cellsOf(b).every((r) => r.length === width)
      && (first.getAttribute('data-section-style') || '') === (b.getAttribute('data-section-style') || '')) {
      const body = tableRows(first)[0].parentElement;
      tableRows(b).slice(1).forEach((tr) => body.append(tr));
      takeEnd(first, b);
      const after = next(b);
      b.remove();
      b = after;
    }
  });
}

/**
 * A full-width image (stryker.com .imgBoxId.full-width-img, 22 boxes on 17 pages: the
 * container width, edge to edge on phones): its image in a section with the
 * `full-width-image` style, `shadow` for .bg-shadow (template CSS). The desktop image
 * (picture source ≥840px) comes first; a different phone image (img src, incl. the white
 * placeholder some forms show on phones) follows and replaces it below 600px. URLs and alt
 * text as on the source.
 */
function fullWidthImages(main, doc) {
  main.querySelectorAll('.imgBoxId.full-width-img').forEach((box) => {
    const img = box.querySelector('img');
    if (!img) return;
    const desktop = (box.querySelector('source[srcset]') || {}).getAttribute?.('srcset') || img.getAttribute('src');
    const phone = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    const holder = doc.createElement('div');
    holder.setAttribute('data-keep', 'nodes');
    holder.setAttribute('data-section-style', box.classList.contains('bg-shadow') ? 'full-width-image, shadow' : 'full-width-image');
    [...new Set([desktop, phone])].filter(Boolean).forEach((src) => {
      const p = doc.createElement('p');
      const image = doc.createElement('img');
      image.setAttribute('src', src);
      image.setAttribute('alt', alt);
      p.append(image);
      holder.append(p);
    });
    box.replaceWith(holder);
  });
}

/** Replaces an element by a `tag` element with the same content. */
function renameTo(el, tag, doc) {
  if (el.tagName.toLowerCase() === tag) return el;
  const out = doc.createElement(tag);
  out.append(...el.childNodes);
  el.replaceWith(out);
  return out;
}

/** Wraps the content of an element in a bracket tag (`[[tag]…]`). */
function sizeTagged(el, tag, doc) {
  el.prepend(doc.createTextNode(`[[${tag}]`));
  el.append(doc.createTextNode(']'));
  return el;
}

// heading size spans with a size tag (template CSS)
const TITLE_SIZES = ['1-25', '1-5', '1-75', '2', '2-5'];

/**
 * A rich-text heading that is the page title, as an H1 looking like the source heading:
 * an h4-h6 is Futura bold (span.futura-bold → bold), and a size span around all of it
 * (span.fontsize-2-5em) becomes its size tag (e.g. the Mako thank-you page's H4).
 */
function titleFromHeading(heading, doc) {
  const level = heading.tagName;
  const h1 = renameTo(heading, 'h1', doc);
  const spans = [...h1.querySelectorAll('[class*="fontsize-"]')]
    .filter((span) => text(span) === text(h1));
  const size = spans.map((span) => (/\bfontsize-([\d-]+)em\b/.exec(span.className) || [])[1])
    .find((n) => TITLE_SIZES.includes(n));
  // a Heading 4 enlarged 2.5x keeps its size relative to the heading (43.75 / 35px): the
  // `h4-2-5` section style (the builder's heading sizes), not a copy size tag
  const h4Enlarged = level === 'H4' && size === '2-5';
  if (size) spans.forEach((span) => span.classList.remove(...[...span.classList].filter((c) => c.startsWith('fontsize-'))));
  if (h4Enlarged) spans[0].classList.add('fontsize-h4-2-5');
  if (/^H[4-6]$/.test(level) && !h1.querySelector('.futura-bold, b, strong')) {
    const bold = doc.createElement('span');
    bold.className = 'futura-bold';
    bold.append(...h1.childNodes);
    h1.append(bold);
  }
  if (size && !h4Enlarged) sizeTagged(h1, `text-${size}`, doc);
  return h1;
}

/** Drops the video components whose asset is a plain DAM file (not Dynamic Media). */
function dropDamVideos(main) {
  main.querySelectorAll('.c-standalone-video').forEach((video) => {
    const asset = video.querySelector('[data-asset-path]');
    if (asset && asset.getAttribute('data-asset-path').startsWith('/content/dam/')) {
      (video.closest('.standalonevideo') || video).remove();
    }
  });
}

const SHOW_TEXT = 4; // NodeFilter.SHOW_TEXT

/** "at:https://…" → "at: https://…", so EDS doesn't read `:https:` as an icon. */
function spaceUrlColons(main, doc) {
  const walker = doc.createTreeWalker(main, SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (/\S:https?:\/\//.test(node.textContent)) {
      node.textContent = node.textContent.replace(/(\S):(https?:\/\/)/g, '$1: $2');
    }
  }
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (!payload || !payload.template || !TEMPLATES.includes(payload.template.name)) return;
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;

  const path = sourcePath(payload);
  // the second, white-on-white H1 below a full-width image hero is not visible content
  main.querySelectorAll('.hero-space').forEach((el) => el.remove());
  main.querySelectorAll('.fullWidthImageHero').forEach((el) => el.setAttribute('data-keep', 'section'));
  dropDamVideos(main);
  fullWidthImages(main, doc);
  spaceUrlColons(main, doc);
  const nav = localNav(main, doc);
  experienceFragments(main, doc, PAGE_XFS[path] || [], PAGE_XF_SLOTS[path]);
  sectionTitles(main, doc);
  downloadTitles(main, doc);
  videoCaptions(main, doc);
  const hasTitle = !!(main.querySelector('.h1-title h1') && text(main.querySelector('.h1-title h1')))
    || !!main.querySelector('.fullWidthImageHero h1, .c-autocarousel h1');
  // no title: the first non-empty Large Headline or rich-text heading (in source order) is
  // the page H1 (e.g. the Mako thank-you page's "Thank you for registering." H4); any other
  // rich-text H1 is an H2 (the OR staff form has two), so the page has one H1
  let firstTitle = !hasTitle && [...main.querySelectorAll('.c-largeheadline, .c-rich-text-editor :is(h1, h2, h3, h4, h5, h6)')]
    .find((el) => text(el) && !el.closest('.h1-title'));
  const firstHeadline = firstTitle && firstTitle.matches('.c-largeheadline') ? firstTitle : null;
  if (firstTitle && !firstHeadline) firstTitle = titleFromHeading(firstTitle, doc);
  main.querySelectorAll('.c-rich-text-editor h1').forEach((h) => {
    if (h === firstTitle) return;
    // a second H1 keeps the source's 28px (the H1 size) as an H2, and its Egyptienne light
    // unless it is all Futura bold (the OR staff form titles); one all in a 1.75em span
    // (49px, Mako refreshers "Together with our customers…") is a statement paragraph, as
    // the other pages' "Together with our customers" lines
    const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
    const bold = [...h.querySelectorAll('.futura-bold, b, strong')]
      .filter((b) => !b.parentElement.closest('.futura-bold, b, strong'));
    const serif = squash(bold.map((b) => b.textContent).join('')) !== squash(h.textContent);
    const big = [...h.querySelectorAll('.fontsize-1-75em')].filter((s) => !s.parentElement.closest('.fontsize-1-75em'));
    const statement = squash(big.map((s) => s.textContent).join('')) === squash(h.textContent);
    const tag = [statement ? 'text-3-5' : 'text-2', serif ? 'serif' : ''].filter(Boolean).join(',');
    if (statement) big.forEach((span) => span.classList.remove('fontsize-1-75em'));
    sizeTagged(renameTo(h, statement ? 'p' : 'h2', doc), tag, doc);
  });
  if (firstHeadline) {
    firstHeadline.setAttribute('data-page-title', '');
    // plain bold (<b>) in the title keeps the heading's serif on the source; imported as
    // bold it would be Futura (corp <strong>), so it is plain text (e.g. jr45 "Complex
    // revision total hip"); Futura bold (span.futura-bold) stays bold
    firstHeadline.querySelectorAll('b').forEach((b) => {
      if (!b.closest('.futura-bold') && !b.querySelector('.futura-bold')) b.replaceWith(...b.childNodes);
    });
  }
  const helpers = {
    cellNodes, richText, text, tagCopy,
  };
  convertBeforeRows(main, doc, helpers);
  markRowEnds(main);
  columnRows(main, doc);
  gridRows(main);
  convertAfterRows(main, doc, helpers);
  // a marked inner row that stays as its content (not Columns): its last component ends it
  main.querySelectorAll('[data-row-end]:not([data-keep], [class^="c-"], [class*=" c-"])').forEach((wrapper) => {
    const parts = [...wrapper.querySelectorAll('[data-keep], [class^="c-"], [class*=" c-"]')]
      .filter((el) => !el.parentElement.closest('[data-keep], [class^="c-"], [class*=" c-"]')
        && (text(el) || el.querySelector('img, iframe, [data-asset-path]')));
    const last = parts[parts.length - 1];
    if (last) {
      const count = Number(wrapper.getAttribute('data-row-end')) + Number(last.getAttribute('data-row-end') || 0);
      last.setAttribute('data-row-end', String(count));
    }
    wrapper.removeAttribute('data-row-end');
  });
  buildArticle(element, {
    keep: '.c-resourcesanddownload, [data-keep]',
    spacer: false,
    componentStyle: columnStyle,
  });
  // the local navigation: a section of its own above the page
  if (nav) element.prepend(nav, doc.createElement('hr'));
}
