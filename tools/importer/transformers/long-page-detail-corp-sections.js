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
import { convertBeforeRows, convertAfterRows, panelOptions } from './long-page-detail-corp-components.js';
import PAGE_XF_SLOTS from '../long-page-detail-corp-xf-slots.js';
import { xfToFragmentPath } from '../xf-fragment-path.js';
import PAGE_XFS from '../long-page-detail-corp-xf.js';
import PRODUCT_XFS from '../product-detail-xf.js';
import REVIEW_XFS from '../review-pages-xf.js';
import SLIDE_XFS from '../product-detail-slide-xf.js';
import {
  STD_DRAFT_IMPORT, STD_REVIEW_IMPORT, stdProductPage, stdReviewPage,
} from './corp-text-markers.js';

const TEMPLATES = ['long-page-detail-corp', 'long-page-detail-corp-fragments'];

// a source data table as a Table block (staging build only, dataTables)
const STD_TABLE = 'table[data-std-table]';

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

// in review: the product pages' fragment documents, imported with the same standardised rules
// into the review folder (the real /us/en/fragments/… documents stay as they are)
export const STD_REVIEW_FRAGMENTS = '/drafts/astha/pages/fragments/';

// review fragments imported again after a change (2026-11-26: icons beside their text, 3 per
// row; the four link lists as Columns): new documents in a "-v2" folder, so the documents
// already in review stay as they are (the pages imported now link to the new ones)
const REVIEW_FRAGMENTS_V2 = [
  '/mako_smartrobotics_o/global-statistics/master',
  '/lifepak_35/product_page/intuitive-clinically-advanced-proven/master',
  '/emergency-care/en/business_unit/footer/master',
  // 2026-11-27: the slides' media-only fragments (their image or video, as on stryker.com) next
  // to the review documents that held a whole slide
  '/isolibrium_770039638/hero/master',
  '/lifepak_35/hero/master',
  '/lifepak_35/product_page/quotes/master',
  '/lifepak_35/product_page/quotes/hospital-workflow',
  '/lifepak_35/product_page/quotes/navigation',
  '/tpx_hd/total-joint-and-trauma-hero/master',
  '/tpx_hd/foot-and-ankle-hero/master',
  '/tpx_hd/oral-and-maxillofacial/master',
  '/pangea/ambient-video-banner/master',
  '/mako_smartrobotics_o/mako-means-more-hero/master',
  '/isuite_experience/connected-or/master',
  '/or_integration/rise/hero---desktop/master',
];

/** The review fragment document of an XF (its /us/en/fragments/… path in the review folder). */
export function reviewFragmentPath(xf) {
  const path = xfToFragmentPath(xf);
  const v2 = REVIEW_FRAGMENTS_V2.some((end) => (xf || '').endsWith(end));
  const review = path && path.replace(/^\/us\/en\/fragments\//, STD_REVIEW_FRAGMENTS);
  if (!review || !v2) return review;
  return /\/master$/.test(review) ? review.replace(/\/master$/, '-v2/master') : `${review}-v2`;
}

// a Hero (corp) row that holds only media: an image or a Dynamic Media video / image link
const MEDIA_LINK = /\/is\/(image|content)\/|\.(m3u8|mp4)(\?|$)/i;
function isMediaRow(row) {
  const cell = row.cells && row.cells.length === 1 ? row.cells[0] : null;
  if (!cell || cell.querySelector('h1, h2, h3, h4, h5, h6')) return false;
  const media = cell.querySelector('img, picture') || [...cell.querySelectorAll('a[href]')]
    .some((a) => MEDIA_LINK.test(a.getAttribute('href')));
  const words = cell.textContent.replace(/https?:\/\/\S+/g, ' ').trim().split(/\s+/).filter(Boolean);
  return !!media && words.length < 25;
}

/**
 * In review (product pages, staging build): a carousel slide's content is an Experience
 * Fragment on stryker.com — its image or video (the slide's mobile XF its phone image); the
 * headline belongs to the page. Each Hero (corp) block keeps its headline and options; its
 * media rows link to the slides' fragment documents (product-detail-slide-xf.js, page order),
 * which the fragment import writes (their XFs count as product XFs there).
 * @param {Element} main The page content (after the parsers and the DM transformer)
 * @param {Document} document The source document
 * @param {string} page The source page path (/us/en/….html)
 * @returns {string} '' when done or the page has no slide XFs; why not, otherwise (report)
 */
export function slideFragments(main, document, page) {
  const slides = SLIDE_XFS[page];
  if (!slides) return '';
  const heroes = [...main.querySelectorAll('table')]
    .filter((t) => /^hero corp\b/i.test((t.rows[0] && t.rows[0].textContent.trim()) || ''));
  if (heroes.length !== slides.length) {
    return `${heroes.length} Hero (corp) blocks for ${slides.length} slide XFs: slides left inline`;
  }
  const link = (xf) => {
    const a = document.createElement('a');
    a.setAttribute('href', reviewFragmentPath(xf));
    a.textContent = reviewFragmentPath(xf);
    return a;
  };
  heroes.forEach((table, i) => {
    const [desktop, mobile] = slides[i];
    const media = [...table.rows].slice(1).filter(isMediaRow);
    if (media[0]) media[0].cells[0].replaceChildren(link(desktop));
    if (mobile && media[1]) media[1].cells[0].replaceChildren(link(mobile));
  });
  return '';
}

/**
 * In review (product pages, staging build): no empty sections. Two section breaks with nothing
 * between them (a carousel's own breaks next to the page's, LIFEPAK 35) are one break; space
 * between sections is the section gap, or a `spacer` section where the source has more.
 * @param {Element} main The page content
 */
export function dropEmptySections(main) {
  const doc = main.ownerDocument;
  let prev = null;
  main.querySelectorAll('hr').forEach((hr) => {
    if (!prev) {
      prev = hr;
      return;
    }
    const range = doc.createRange();
    range.setStartAfter(prev);
    range.setEndBefore(hr);
    const between = range.cloneContents();
    const empty = !between.textContent.trim()
      && !between.querySelector('img, picture, video, iframe, table, a, [data-keep]');
    if (empty) hr.remove();
    else prev = hr;
  });
}

/**
 * In review (product pages, staging build): every XF the page places becomes a Fragment block
 * in its place (docs/standardisation/fragment.md), matched to the export's list by order (the
 * page shows its XF components in the export's order). A slot count that doesn't match the
 * export leaves the slots to the long-page-detail handling.
 * @returns {boolean} true when the slots were handled
 */
function productFragments(main, doc, xfs) {
  const slots = [...main.querySelectorAll('.experiencefragment')]
    .filter((slot) => !slot.parentElement.closest('.experiencefragment'));
  if (!xfs || slots.length !== xfs.length) return false;
  slots.forEach((slot, i) => {
    const path = xfs[i] && reviewFragmentPath(xfs[i]);
    const empty = !text(slot) && !slot.querySelector('img, [data-asset-path], iframe');
    if (!path || empty) {
      slot.remove();
      return;
    }
    const block = fragmentBlock(doc, path);
    block.setAttribute('data-keep', 'section');
    slot.replaceWith(block);
  });
  return true;
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
      // the underlined title keeps the standard grey line: stryker.com draws its
      // h2.border-bottom-gold titles' line grey too (rgb 178 180 174), not gold
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
      // review build: its title (data-title) is the jump bar target, the section's `anchor`
      // (blocks/sticky-nav reads .section[data-anchor]); the id the jump bar links to
      const label = STD_DRAFT_IMPORT && (title.getAttribute('data-title') || '').trim();
      if (label) spacer.setAttribute('data-anchor', label.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
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
  // review build: the grey rule above it (.margin-hr.rule-separator) or `no-top-line`
  const widget = nav.closest('[data-widget="local-page-nav"]') || nav.parentElement;
  const noTopLine = STD_DRAFT_IMPORT && !(widget && widget.querySelector('.margin-hr.rule-separator'));
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
  return WebImporter.Blocks.createBlock(doc, { name: noTopLine ? 'Local Nav (no-top-line)' : 'Local Nav', cells: rows });
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
// → its Columns box colour (the standard choices: docs/standardisation/columns.md)
const BOX_COLOURS = {
  'light-gray': 'gray',
  blue: 'blue',
  gold: 'gold',
  purple: 'purple',
  teal: 'teal',
  'dark-gray': 'dark',
  'dark-blue-gradient': 'dark-blue-gradient',
  'dark-purple-gradient': 'dark-purple-gradient',
};
// in review (staging build): every stryker.com box colour, exact — the nearest is never taken
// (bg-gray is mid grey #b2b4ae, bg-lighter-gray pale grey, bg-orange dark gold, and the grey,
// dark teal and dark orange gradients are their own colours)
const BOX_COLOURS_STD = {
  ...BOX_COLOURS,
  gray: 'mid-gray',
  'lighter-gray': 'pale-gray',
  orange: 'dark-gold',
  black: 'black',
  'golden-gradient': 'gold-gradient',
  'gray-gradient': 'gray-gradient',
  'dark-teal-gradient': 'teal-gradient',
  'dark-orange-gradient': 'orange-gradient',
};
const boxColours = () => (STD_DRAFT_IMPORT ? BOX_COLOURS_STD : BOX_COLOURS);
// a box in one cell that is neither the first nor the last (`gray-2`) and a box on the first
// line of the text (`-lead`) keep their own Columns variants (columns-corp)
const BOX_VARIANTS = new Set(['gray-2', 'gold-lead', 'dark-lead', 'gray-lead']);

// the box's inner spacing (the source's padding %, per side) → the nearest step; 5% is the
// default and 15% and more is the large step
const SPACE_STEPS = [[0, 'space-none'], [3, 'space-s'], [5, ''], [10, 'space-l']];
function spaceStep(boxes) {
  const values = boxes.flatMap((b) => ['top', 'right', 'bottom', 'left']
    .map((side) => (b.getAttribute('style') || '').match(new RegExp(`padding-${side}\\s*:\\s*([\\d.]+)%`)))
    .filter(Boolean).map((m) => Number(m[1])));
  if (!values.length) return '';
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return SPACE_STEPS.reduce((best, step) => (Math.abs(step[0] - median) < Math.abs(best[0] - median)
    ? step : best))[1];
}

// a source image border colour (img.bor-*) → the Columns image border (the agreed colours:
// blue goes to teal, white to none; other colours keep no border)
const IMAGE_BORDERS = {
  gray: 'image-border', teal: 'image-border-teal', black: 'image-border-black', blue: 'image-border-teal',
};
/**
 * Product pages (review build): whether every filled column's image shows narrower than its
 * column (under 85% of the column's text width, as laid out on the loaded source page), e.g.
 * stryker.com Connected OR "Safe / Efficient / Scalable": 300px images centred in 440px
 * columns. Such a row takes `image-centre` (images at their own size, centred). Images not
 * laid out (in a closed tab) leave it off.
 */
function smallImages(columns) {
  const images = columns.map((col) => col.querySelector('.c-standalone-image img')).filter(Boolean);
  if (!images.length || images.length !== columns.length) return false;
  return images.every((img, i) => {
    const { width } = img.getBoundingClientRect();
    const room = columns[i].getBoundingClientRect().width - 30;
    return width > 0 && room > 0 && width < room * 0.85;
  });
}

/**
 * Product pages (review build): whether a two-column image + text row shows its text in the
 * middle of the image's height on the loaded source page (stryker.com authors set a top
 * padding on the text for it, e.g. Mako SmartRobotics "Mako Total Knee": a 194px text block
 * 73px below the top of a 330px image). Such a row takes `valign-middle`; text that starts at
 * the top of the image (within 12% of its height) stays top-aligned. Columns not laid out (a
 * closed tab, phone width) leave it off.
 */
function valignMiddle(columns) {
  if (columns.length !== 2) return false;
  const imageOf = (col) => [...col.querySelectorAll('.c-standalone-image img, img')]
    .find((img) => img.getBoundingClientRect().height > 0);
  const images = columns.map(imageOf);
  const at = images.findIndex(Boolean);
  if (at < 0 || images.filter(Boolean).length !== 1) return false;
  const textCol = columns[1 - at];
  if (textCol.querySelector('img') || !text(textCol)) return false;
  // the laid-out boxes of its text (paragraphs, or lines joined by breaks)
  const lines = [];
  const walker = textCol.ownerDocument.createTreeWalker(textCol, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue.trim() && !/^:(start-[a-z0-9-]+|end):$|^\[\[|^\]$/.test(node.nodeValue.trim())) {
      const range = textCol.ownerDocument.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (rect.height > 0) lines.push({ getBoundingClientRect: () => rect });
    }
  }
  if (!lines.length) return false;
  const ib = images[at].getBoundingClientRect();
  const cb = columns[at].getBoundingClientRect();
  const tb = textCol.getBoundingClientRect();
  const sameRow = cb.top < tb.bottom && tb.top < cb.bottom && Math.abs(cb.left - tb.left) > 50;
  if (!sameRow || ib.height < 80) return false;
  const top = Math.min(...lines.map((el) => el.getBoundingClientRect().top));
  const bottom = Math.max(...lines.map((el) => el.getBoundingClientRect().bottom));
  const height = bottom - top;
  const offset = (top + bottom) / 2 - (ib.top + ib.bottom) / 2;
  return height < ib.height * 0.8 && top - ib.top > ib.height * 0.12
    && Math.abs(offset) < ib.height * 0.15;
}

/**
 * In review (staging build), product pages and their XFs: marks the two-column rows whose text
 * sits vertically centred to the image (data-std-valign; Columns option valign-middle). Run
 * from the import's preprocess, on the source layout before the importer's own cleanup drops
 * the blank paragraphs that some rows use to push their text down (Pangea "Variable angle
 * locking technology").
 */
export function markCentredRows(document) {
  if (!STD_DRAFT_IMPORT) return;
  document.querySelectorAll('.colctrl').forEach((colctrl) => {
    const filled = rowColumns(colctrl).filter((col) => text(col) || col.querySelector('img'));
    if (valignMiddle(filled)) colctrl.setAttribute('data-std-valign', 'middle');
  });
}

function imageBorder(columns) {
  const colours = columns.flatMap((col) => [...col.querySelectorAll('.c-standalone-image img[class*="bor-"]')]
    .map((img) => (img.className.match(/\bbor-([a-z]+)/) || [])[1]));
  const counts = {};
  colours.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  const main = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return IMAGE_BORDERS[main] || '';
}

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
    return boxColours()[bg] || '';
  };
  const colours = [...new Set(boxes.map(colourOf))];
  if (colours.length !== 1 || !colours[0]) return { colour: '', kind: '' };
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  const boxed = squash(boxes.map((b) => b.textContent).join(''));
  if (boxed === squash(col.textContent)) return { colour: colours[0], kind: 'whole', boxes };
  const first = [...col.querySelectorAll(CELL_COMPONENTS)]
    .filter((c) => !c.parentElement.closest(CELL_COMPONENTS) && text(c))[0];
  if (boxes.length === 1 && first && first.contains(boxes[0])) return { colour: colours[0], kind: 'lead', boxes };
  return { colour: '', kind: '' };
}

/**
 * The Columns box options of a row: one colour, all its text cells boxed (`box-all`), the first
 * or the last cell boxed (`box-first`, last by default), the white dimensional box with its
 * shadow, and the box spacing step; a box on every text cell's first line keeps its `-lead`
 * variant, a single middle cell `gray-2`; else '' (options separated by ", ").
 */
function boxVariant(columns) {
  const boxes = columns.map(cellBox);
  const used = boxes.filter(Boolean);
  if (!used.length) return '';
  const colours = [...new Set(used.map((b) => b.colour))];
  const kinds = [...new Set(used.map((b) => b.kind))];
  if (colours.length !== 1 || !colours[0] || kinds.length !== 1) return '';
  const textCols = columns.filter((col) => text(col));
  const colour = colours[0] === 'boxed' ? ['box-white', 'shadow'] : [`box-${colours[0]}`];
  const space = spaceStep(used.flatMap((b) => b.boxes || []));
  const standard = (cell) => [...colour, cell, space].filter(Boolean).join(', ');
  if (kinds[0] === 'lead' && used.length === textCols.length) {
    const lead = `${colours[0]}-lead`;
    return BOX_VARIANTS.has(lead) ? lead : '';
  }
  // the last column alone opening with a box that a video or image follows (jr45 season 1
  // faculty rows: "Watch …" in grey above the episode video): the last cell (columns.js ends
  // the box at the media)
  const last = columns[columns.length - 1];
  if (kinds[0] === 'lead' && used.length === 1 && boxes[columns.length - 1]
    && last.querySelector('.c-standalone-video, .c-standalone-image, [data-asset-path]')) {
    return standard('');
  }
  if (kinds[0] === 'whole') {
    if (used.length > 1 && used.length === textCols.length) return standard('box-all');
    if (used.length === 1) {
      const i = boxes.findIndex(Boolean);
      if (i === columns.length - 1) return standard('');
      if (i === 0) return standard('box-first');
      const middle = `${colours[0]}-${i + 1}`;
      return BOX_VARIANTS.has(middle) ? middle : '';
    }
  }
  return '';
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
  const serif = (style) => (style || '').split(',').map((x) => x.trim()).includes('serif');
  // staging build (draft pages): each paragraph carries its own size and font as Text style
  // markers, so the row looks the same on any page (no section style, no template rule);
  // other copy styles stay the section's
  if (STD_DRAFT_IMPORT) {
    copy.filter((n) => sizeTag(n.copyStyle) || serif(n.copyStyle))
      .forEach((n) => tagCopy(n, [sizeTag(n.copyStyle), serif(n.copyStyle) ? 'serif' : '']
        .filter(Boolean).join(','), doc));
    // a heading in its source size span keeps that size (headingSpanSizes)
    cells.flat().filter((n) => n.nodeType === 1 && /^H[1-3]$/.test(n.tagName) && n.stdHeadingSize)
      .forEach((n) => tagCopy(n, n.stdHeadingSize, doc));
    // product pages: a small-print line in a row (0.8em, LIFEPAK 35's document code below its
    // form) is that line's small size (Text style), not a disclaimer section around the row
    const product = stdProductPage(doc);
    if (product) {
      copy.filter((n) => (n.copyStyle || '').split(',').map((x) => x.trim()).includes('disclaimer'))
        .forEach((n) => tagCopy(n, 'text-0-8', doc));
    }
    const rest = new Set(copy.flatMap((n) => (n.copyStyle || '').split(',').map((x) => x.trim()))
      .filter((x) => x && x !== 'serif' && !/^p-\d/.test(x) && !(product && x === 'disclaimer')));
    return [...rest].join(', ');
  }
  const weight = {};
  copy.forEach((n) => { weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text(n).length; });
  let dominant = Object.keys(weight).sort((a, b) => weight[b] - weight[a])[0] || '';
  if (sizeTag(dominant) && copy.some((n) => !sizeTag(n.copyStyle))) {
    dominant = dominant.split(',').map((s) => s.trim()).filter((s) => !/^p-\d/.test(s)).join(', ');
  }
  // a serif cell in a row that is not serif keeps the font in its tag (jr45 season 3 March:
  // the Egyptienne 24.5px intro in the grey box beside the faculty)
  copy.filter((n) => sizeTag(n.copyStyle) && sizeTag(n.copyStyle) !== sizeTag(dominant))
    .forEach((n) => tagCopy(n, [sizeTag(n.copyStyle), serif(n.copyStyle) && !serif(dominant) ? 'serif' : '']
      .filter(Boolean).join(','), doc));
  // serif copy at the source's 14px: `serif, p-1` (in Columns `serif` alone is 21px;
  // footed attachments, jr45 faculty)
  const parts = dominant.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.includes('serif') && !parts.some((s) => sizeTag(s))) return ['p-1', ...parts].join(', ');
  return dominant;
}

// source column widths (col-sm-*) → the Columns variant
const COLUMN_VARIANTS = {
  '8,4': 'columns-67-33',
  '4,8': 'columns-33-67',
  '6,6': 'columns-50-50',
  '4,4,4': 'columns-3-cols',
  '3,3,3,3': 'columns-4-cols',
};

function columnWidth(col) {
  const m = col.className.match(/\bcol-sm-(\d+)/) || col.className.match(/\bcol-md-(\d+)/);
  return m ? Number(m[1]) : 12;
}

// the desktop widths (col-md-*): three and four equal columns are col-sm-6 on tablets
function desktopWidth(col) {
  const m = col.className.match(/\bcol-md-(\d+)/) || col.className.match(/\bcol-sm-(\d+)/);
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

/*
 * In review (staging build only, STD_DRAFT_IMPORT; docs/standardisation/cards-corp.md): a row of
 * tiles is Cards (corp), one card per cell (its image or video, then its text), as the business
 * decided: 3 or more cells holding the same unit (an image and text, text only, or an image only),
 * or 2 cells with the same unit in a box. The row's choices carry over: cards per row, the box
 * colour (with its shadow and spacing), image borders, centred text; a title before the image is
 * `title-above`, images without text `no-text`. The media-pair link under an image is the card's
 * link (the image links to it), so it is dropped when the text links to the same page.
 */
const TILE_MEDIA = 'img, picture, video, iframe, a[href*="/is/content/"], a[href*="/is/image/"], '
  + 'a[href*="youtube.com/"], a[href*="youtu.be/"]';
const TILE_VIDEO = 'a[href*="/is/content/"], a[href*="youtube.com/"], a[href*="youtu.be/"]';
const nodeText = (n) => (n.textContent || '').trim();
const holdsMedia = (n) => n.nodeType === 1
  && (n.matches(TILE_MEDIA) || !!n.querySelector(TILE_MEDIA));
const isTileMedia = (n) => holdsMedia(n)
  && [...n.querySelectorAll('a')].every((a) => a.matches(TILE_MEDIA))
  && !n.querySelector('h1, h2, h3, h4, h5, h6, ul, ol')
  && (n.matches(TILE_MEDIA) || n.children.length === 1);
const tileParts = (nodes) => nodes.filter((n) => nodeText(n) || holdsMedia(n));
const unitOf = (nodes) => {
  const kinds = tileParts(nodes).map((n) => (isTileMedia(n) ? 'm' : 't'));
  return kinds.filter((k, i) => k !== kinds[i - 1]).join('');
};
const hrefOf = (n) => {
  const a = n.nodeType === 1 && (n.matches('a[href]') ? n : n.querySelector('a[href]'));
  return a ? a.getAttribute('href').split('#')[0] : '';
};
const TILE_KEEP = new RegExp('^(box-(?!all$|first$|last$)[a-z-]+|shadow|space-[a-z]+'
  + '|image-border(-[a-z]+)?|text-center|image-centre)$');
const TILE_NOT = /-lead$|^box-first$|^left-border-bottom$/;

// a card colour as authors read it in its colour cell (cards-corp.js reads it back)
const CARD_COLOUR_LABELS = {
  gray: 'Light grey',
  dark: 'Dark grey',
  'dark-blue-gradient': 'Blue gradient',
  'dark-purple-gradient': 'Purple gradient',
  'mid-gray': 'Mid grey',
  'pale-gray': 'Pale grey',
  'gray-gradient': 'Grey gradient',
  'teal-gradient': 'Dark teal gradient',
  'orange-gradient': 'Dark orange gradient',
};
const cardColourLabel = (c) => CARD_COLOUR_LABELS[c] || c.replace(/-/g, ' ').replace(/^./, (x) => x.toUpperCase());

/** drops the line-box tags a card's own colour replaces (`[[box-<colour>]` … `]` per line) */
function dropLineBoxes(nodes, colour) {
  nodes.filter((n) => n.nodeType === 1).forEach((n) => {
    [...(n.matches('p, h1, h2, h3, h4, h5, h6, li') ? [n] : []), ...n.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')]
      .forEach((line) => {
        if (line.firstChild?.nodeType === 3 && line.firstChild.nodeValue === `[[box-${colour}]`
          && line.lastChild?.nodeType === 3 && line.lastChild.nodeValue === ']') {
          line.firstChild.remove();
          line.lastChild.remove();
        }
      });
  });
}

function tileCards(cells, variant, doc, colours = []) {
  // a cell holding a table (data or block) is not a tile: tables stay tables
  if (cells.some((c) => c.some((n) => n.nodeType === 1 && (n.matches('table') || n.querySelector('table'))))) return null;
  const filled = cells.filter((c) => tileParts(c).length);
  const units = filled.map(unitOf);
  const names = variant.split(', ').filter(Boolean);
  const boxed = names.some((v) => v.startsWith('box-') && v !== 'box-first');
  const same = units.length > 0 && units.every((u) => u === units[0]);
  if (!same || (filled.length < 3 && !(filled.length === 2 && boxed))) return null;
  if (!/^t?m?t?$/.test(units[0]) || names.some((v) => TILE_NOT.test(v))) return null;
  // product pages: four text columns (stryker.com LIFEPAK 35 "Explore / Learn / Support /
  // More" link lists, col-sm-3: 4 per row, 2 on phones) stay Columns, whose four cells give
  // that layout (Cards text has no four per row)
  if (stdProductPage(doc) && units[0] === 't' && cells.length === 4) return null;
  // a colour per card (a different box colour in each cell): each card row opens with its
  // colour cell (cards-corp.js), when every card has one
  const filledColours = cells.map((c, i) => (tileParts(c).length ? colours[i] || '' : null))
    .filter((c) => c !== null);
  const perCard = filledColours.length === filled.length && filledColours.every(Boolean)
    && new Set(filledColours).size > 1;
  const rows = filled.map((nodes, i) => {
    if (perCard) dropLineBoxes(nodes, filledColours[i]);
    const parts = tileParts(nodes);
    const at = parts.findIndex(isTileMedia);
    if (at < 0) return [parts];
    const media = parts[at];
    const next = parts[at + 1];
    let rest = parts.filter((n) => n !== media);
    const others = rest.filter((n) => n !== next).map(hrefOf).filter(Boolean);
    if (next && next.nodeType === 1 && hrefOf(next) && !next.querySelector('strong, u')
      && others.includes(hrefOf(next))) {
      rest = rest.filter((n) => n !== next);
    }
    return [[media], rest];
  });
  const textCards = rows.every((r) => r.length === 1);
  const video = units[0].includes('m') && filled.every((c) => c.some((n) => n.nodeType === 1
    && (n.matches(TILE_VIDEO) || !!n.querySelector(TILE_VIDEO))));
  const perRow = { 2: 'two-up', 3: 'three-up' }[cells.length] || '';
  // linked images whose only text is their link (media-pair): images only
  const imageOnly = units[0] === 'm' || (names.includes('media-pair') && rows.every((r) => r.length === 2
    && r[1].length === 1 && hrefOf(r[1][0]) && nodeText(r[1][0]) === nodeText(r[1][0].querySelector('a') || r[1][0])));
  const options = [textCards ? 'text' : '', video ? 'video' : '', perRow,
    ...names.filter((v) => TILE_KEEP.test(v)),
    units[0].startsWith('tm') ? 'title-above' : '', imageOnly ? 'no-text' : ''].filter(Boolean);
  const cardRows = perCard
    ? rows.map((r, i) => [cardColourLabel(filledColours[i]), ...r]) : rows;
  // the Card box names of the gradients (Columns calls them dark-…)
  const named = options.map((o) => o.replace(/^box-dark-(blue|purple)-gradient$/, 'box-$1-gradient'));
  return WebImporter.Blocks.createBlock(doc, {
    name: named.length ? `Cards Corp (${named.join(', ')})` : 'Cards Corp',
    cells: cardRows,
  });
}

/**
 * Source column rows (.colctrl) with two or more columns that have content, innermost
 * first:
 *   - a row with a Marketo form: the `Marketo Form` block in a section of its own, a
 *     Fragment block in another column (the contact aside) in the same section
 *   - any other row: a `Columns` block (variant from the column widths), its own section
 */
/**
 * In review (staging build only, docs/standardisation/page-comparison.md): the rows of an XF's
 * AEM responsive grid (e.g. the Isolibrium feature rows: a 4-column image beside an 8-column
 * text) become a column row (.colctrl > .row > .col-md-N), so columnRows makes them one Columns
 * block in their source widths. Grid items fill a row up to the grid's 12 columns (offset +
 * span); a row with two or more filled items is converted; a full-width item stays as it is.
 * Outer grids first: an item's own grid (e.g. LIFEPAK 35's icon beside its text, in a row of
 * three) stays inside its cell (no blocks inside blocks).
 * @param {Element} main The page content
 * @param {Document} doc The document
 */
function xfGridRows(main, doc, selector = '.experiencefragment .aem-Grid') {
  const num = (el, re) => Number(((el.className || '').match(re) || [])[1]) || 0;
  const filled = (el) => !!text(el) || !!el.querySelector('img, [data-asset-path], iframe');
  [...main.querySelectorAll(selector)].forEach((grid) => {
    if (grid.closest('header, footer, .modal, .colctrl')) return;
    const n = num(grid, /\baem-Grid--(\d+)\b/) || 12;
    const rows = [];
    let row = null;
    [...grid.children].filter((el) => el.classList.contains('aem-GridColumn')).forEach((item) => {
      const span = num(item, /\baem-GridColumn--default--(\d+)\b/) || n;
      const offset = num(item, /\baem-GridColumn--offset--default--(\d+)\b/);
      if (row && row.used + offset + span <= n) {
        row.items.push([span, item]);
        row.used += offset + span;
      } else {
        row = { used: offset + span, items: [[span, item]] };
        rows.push(row);
      }
    });
    rows.forEach((r) => {
      const cells = r.items.filter(([, item]) => filled(item));
      if (cells.length < 2 || cells.some(([, item]) => item.querySelector('.colctrl'))) return;
      // a row of linked images without text (the contact aside's social icons) is a row of
      // icons, not columns: it stays default content (product pages: an icon row)
      if (stdProductPage(doc) && cells.every(([, item]) => !text(item) && item.querySelector('a[href] img'))) return;
      const colctrl = doc.createElement('div');
      colctrl.className = 'colctrl';
      const inner = doc.createElement('div');
      inner.className = 'row';
      colctrl.append(inner);
      cells[0][1].before(colctrl);
      cells.forEach(([span, item]) => {
        const col = doc.createElement('div');
        col.className = `col-sm-${span} col-md-${span}`;
        // product pages: the item's phone width too (stryker.com LIFEPAK 35 footer link lists:
        // aem-GridColumn--phone--6, two per row on phones), as a source column row has it
        const phone = num(item, /\baem-GridColumn--phone--(\d+)\b/);
        if (stdProductPage(doc) && phone) col.className += ` col-xs-${phone}`;
        col.append(item);
        inner.append(col);
      });
    });
  });
}

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
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className)
      ? colctrl.parentElement : colctrl;
    // product pages: a coloured Large Headline box in one half of a row whose other half is
    // empty (SafeAir "SafeAir compact smoke evacuator": a gold band over the left half) is
    // Columns two equal with that cell's box, the other cell empty (as the source row). A white
    // box (bg-white, no shadow) on the white page is no box, as everywhere else: its text is
    // plain text at the content edge, in line with the text under it (Mako "Mako 4")
    if (stdProductPage(doc) && all.length === 2 && filled.length === 1
      && all.every((col) => columnWidth(col) === 6)) {
      const box = filled[0].querySelector('.c-largeheadline .has-background[class*="bg-"]');
      const colour = box && { 'bg-gold': 'box-gold', 'bg-light-gray': 'box-gray' }[
        [...box.classList].find((c) => /^bg-/.test(c))];
      if (colour) {
        const nodes = cellNodes(filled[0], doc);
        rowCopyStyle([nodes], doc);
        const cells = all.map((col) => (col === filled[0] ? nodes : ''));
        const first = all[0] === filled[0];
        const block = WebImporter.Blocks.createBlock(doc, {
          name: `Columns (columns-50-50, ${colour}${first ? ', box-first' : ''})`,
          cells: [cells],
        });
        block.setAttribute('data-keep', 'section');
        wrapper.replaceWith(block);
        return;
      }
    }
    if (columns.length < 2) return;
    const form = marketoBlock(colctrl, doc);
    if (form) {
      form.setAttribute('data-keep', 'section');
      const asides = [...colctrl.querySelectorAll('table')].filter((t) => t.getAttribute('data-keep'));
      asides.forEach((t) => t.setAttribute('data-keep', 'join'));
      // the content of the other columns (e.g. the spine contact page's "Check out our social
      // media" and its buttons) joins the form's section too, so none of it is lost
      const box = (nodes) => {
        const div = doc.createElement('div');
        div.setAttribute('data-keep', 'join');
        div.append(...nodes);
        return div;
      };
      // in review (staging build only, docs/standardisation/section-layout.md): the form and
      // the content beside it stay side by side in their source order, a `flex` section in the
      // first column's width (2/3 → `flex-67-33`, 1/3 → `flex-33-67`, halves → `flex`)
      const at = columns.findIndex((col) => col.querySelector('.c-marketo-form'));
      if (STD_DRAFT_IMPORT && at >= 0) {
        const ratio = { 8: 'flex-67-33', 4: 'flex-33-67' }[columnWidth(columns[0])];
        const side = [];
        // product pages: the form's column keeps its other content (stryker.com LIFEPAK 35: the
        // "Have feedback…" line above the form, the document code below it), in order; the
        // section layout stacks it with the form in the wide column
        const formColumn = (col) => {
          let top = col.querySelector('.c-marketo-form');
          while (top.parentElement && top.parentElement !== col && !top.parentElement.matches('.row')) {
            top = top.parentElement;
          }
          const items = top.parentElement ? [...top.parentElement.children] : [top];
          return items.flatMap((item) => {
            if (item === top) return [form];
            const holder = doc.createElement('div');
            holder.append(item.cloneNode(true));
            const nodes = cellNodes(holder, doc);
            if (!nodes.length) return [];
            side.push(nodes);
            return [box(nodes)];
          });
        };
        const parts = columns.map((col, i) => {
          if (i === at) return stdProductPage(doc) ? formColumn(col) : [form];
          if (col.querySelector('table[data-keep]')) return asides.filter((t) => col.contains(t));
          const nodes = cellNodes(col, doc);
          if (nodes.length) side.push(nodes);
          return nodes.length ? [box(nodes)] : [];
        }).flat();
        // the text beside the form keeps its size and font (Text style markers), as a row's
        const copy = rowCopyStyle(side, doc);
        form.setAttribute('data-keep', 'join');
        parts[0].setAttribute('data-keep', 'section');
        parts[0].setAttribute('data-section-style', ['flex', ratio, copy].filter(Boolean).join(', '));
        wrapper.replaceWith(...parts);
        return;
      }
      const others = columns
        .filter((col) => !col.querySelector('.c-marketo-form') && !col.querySelector('table[data-keep]'))
        .map((col) => cellNodes(col, doc))
        .filter((nodes) => nodes.length)
        .map(box);
      wrapper.replaceWith(form, ...asides, ...others);
      return;
    }
    // in review (staging build only, docs/standardisation/table.md): a row with a Table in a
    // column is a side-by-side section (no block inside Columns): each column's content in
    // source order, the Table blocks as parts of their own, in the first column's width
    if (STD_DRAFT_IMPORT && colctrl.querySelector(STD_TABLE)) {
      const box = (nodes) => {
        const div = doc.createElement('div');
        div.setAttribute('data-keep', 'join');
        div.append(...nodes);
        return div;
      };
      const perColumn = columns.map((col) => {
        const out = [];
        let run = [];
        cellNodes(col, doc).forEach((n) => {
          if (n.nodeType === 1 && n.matches(STD_TABLE)) {
            if (run.length) out.push(box(run));
            run = [];
            n.setAttribute('data-keep', 'join');
            out.push(n);
          } else run.push(n);
        });
        if (run.length) out.push(box(run));
        return out;
      }).filter((p) => p.length);
      const parts = perColumn.flat();
      if (parts.length) {
        const ratio = { 8: 'flex-67-33', 4: 'flex-33-67' }[columnWidth(columns[0])];
        // side by side when each column is one part, or (wide + narrow) the narrow one is: the
        // section layout stacks the other parts in the wide column; otherwise (a heading, a
        // table and a note in each of three columns, Transend) the parts follow one another
        const narrow = ratio === 'flex-67-33' ? perColumn[perColumn.length - 1] : perColumn[0];
        const side = perColumn.every((p) => p.length === 1)
          || (ratio && perColumn.length === 2 && narrow.length === 1);
        parts[0].setAttribute('data-keep', 'section');
        if (side) parts[0].setAttribute('data-section-style', ['flex', ratio].filter(Boolean).join(', '));
        if (wrapper.hasAttribute('data-row-end')) parts[0].setAttribute('data-row-end', wrapper.getAttribute('data-row-end'));
        wrapper.replaceWith(...parts);
        return;
      }
    }
    // in review (staging build only, docs/standardisation/panel.md): a column made only of
    // coloured or shadow boxes beside a column without any (Isolibrium "Integrated and
    // intuitive touch screen": a gold heading box over a white shadow box, the photo beside)
    // is the package's "box beside other content": a side-by-side section of Panel blocks (one
    // per box, stacked in their column, scripts/corp.js) and the other column's content — only
    // where the Columns cell box can't carry it (a single box in a cell stays the cell box)
    if (stdProductPage(doc) && columns.length === 2 && !boxVariant(columns)) {
      const boxOf = (c) => c.querySelector(':scope > .dimensional-box, :scope > .has-background, :scope > div > .dimensional-box');
      const squash = (v) => (v || '').replace(/[\s\u00a0]+/g, '');
      const texts = columns.map((col) => [...col.querySelectorAll('.c-rich-text-editor')]
        .filter((c) => c.closest('.colctrl') === colctrl && !c.parentElement.closest('.c-rich-text-editor') && text(c))
        .map((c) => ({ c, box: boxOf(c) }))
        .map((t) => ({ ...t, variant: t.box ? panelOptions(t.box, t.c) : '' })));
      const onlyBoxes = (i) => texts[i].length > 0 && texts[i].every((t) => t.variant)
        && squash(texts[i].map((t) => t.c.textContent).join('')) === squash(columns[i].textContent);
      const at = [0, 1].find((i) => onlyBoxes(i) && !texts[1 - i].some((t) => t.variant));
      if (at !== undefined) {
        const panels = texts[at].map(({ c, variant }) => {
          const holder = doc.createElement('div');
          holder.append(c.cloneNode(true));
          const nodes = cellNodes(holder, doc);
          rowCopyStyle([nodes], doc);
          // a heading of Futura bold words and Egyptienne ones (span.futura-bold beside plain
          // text): the plain words keep the serif (Text style), the bold words stay Futura
          nodes.filter((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName) && n.querySelector('strong'))
            .forEach((h) => {
              const walker = doc.createTreeWalker(h, 4);
              const runs = [];
              for (let t = walker.nextNode(); t; t = walker.nextNode()) {
                if (!t.parentElement.closest('strong') && t.nodeValue.replace(/\[\[[^\]]*\]|\]/g, '').trim()) runs.push(t);
              }
              runs.forEach((t) => {
                const m = t.nodeValue.match(/^(\s*(?:\[\[[^\]]*\])*)([\s\S]*?)(\]*\s*)$/);
                if (!m || !m[2].trim()) return;
                t.nodeValue = `${m[1]}[[serif]${m[2]}]${m[3]}`;
              });
            });
          const block = WebImporter.Blocks.createBlock(doc, { name: `Panel (${variant})`, cells: [[nodes]] });
          block.setAttribute('data-keep', 'join');
          return block;
        });
        const otherNodes = cellNodes(columns[1 - at], doc);
        rowCopyStyle([otherNodes], doc);
        const other = doc.createElement('div');
        other.setAttribute('data-keep', 'join');
        other.append(...otherNodes);
        const parts = at === 0 ? [...panels, other] : [other, ...panels];
        const ratio = { 8: 'flex-67-33', 4: 'flex-33-67' }[columnWidth(columns[0])];
        parts[0].setAttribute('data-keep', 'section');
        parts[0].setAttribute('data-section-style', ['flex', ratio].filter(Boolean).join(', '));
        if (wrapper.hasAttribute('data-row-end')) parts[0].setAttribute('data-row-end', wrapper.getAttribute('data-row-end'));
        wrapper.replaceWith(...parts);
        return;
      }
    }
    const key = columns.map(columnWidth).join(',');
    // linked images (the endoscopy resources specialty tiles): `media-pair`
    const linked = filled.some((col) => [...col.querySelectorAll('.c-standalone-image')].some(linkedImage));
    const boxes = boxVariant(columns);
    // a coloured box the row's box options can't carry (around part of a cell, a colour per
    // cell): each of its lines in a Text style line box of its colour (`[[box-<colour>]…]`, the
    // Text style markers, corp-text-markers.js), its white text kept
    const lineBoxed = new Set();
    if (!boxes && STD_DRAFT_IMPORT) {
      columns.flatMap((col) => [...col.querySelectorAll('.has-background:not(.bg-white)')])
        .filter((b) => b.closest('.colctrl') === colctrl && text(b)
          && !b.parentElement.closest('.has-background:not(.bg-white), .dimensional-box'))
        .forEach((b) => {
          const colour = boxColours()[(b.className.match(/\bbg-([a-z-]+)/) || [])[1]];
          if (!colour) return;
          // a Large Headline's lines are its span.line elements ("Build your ASC" phase cards)
          const lines = b.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').length
            ? b.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li') : b.querySelectorAll('.line');
          lines.forEach((line) => {
            if (!text(line) || line.parentElement.closest('p, h1, h2, h3, h4, h5, h6, li')) return;
            // inside a headline line's own block (its <div>), so no line break comes first
            const into = line.matches('.line') && line.querySelector(':scope > div') ? line.querySelector(':scope > div') : line;
            into.prepend(doc.createTextNode(`[[box-${colour}]`));
            into.append(doc.createTextNode(']'));
          });
          lineBoxed.add(b);
        });
    }
    // white text in any other coloured box the row has no option for stays in the text colour,
    // so it stays readable
    if (!boxes) {
      colctrl.querySelectorAll('[data-white-tag]').forEach((el) => {
        // only the boxes of this row (not a band around it, not a nested row's)
        const inBox = el.closest('.has-background:not(.bg-white), .dimensional-box, .c-full-bleed-panel');
        if (!inBox || inBox.matches('.c-full-bleed-panel') || inBox.closest('.colctrl') !== colctrl) return;
        if (lineBoxed.has(inBox)) return;
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
    const centred = filled.every(centredColumn);
    const layout = COLUMN_VARIANTS[key] || COLUMN_VARIANTS[columns.map(desktopWidth).join(',')];
    const variant = [layout, linked ? 'media-pair' : '', stackRow(columns) ? 'stack' : '', boxes,
      imageBorder(columns), centred ? 'text-center' : '', firstRule ? 'left-border-bottom' : '',
      stdProductPage(doc) && smallImages(filled) ? 'image-centre' : '',
      stdProductPage(doc) && colctrl.getAttribute('data-std-valign') === 'middle' ? 'valign-middle' : '']
      .filter(Boolean).join(', ');
    const cells = columns.map((col) => cellNodes(col, doc));
    const style = rowCopyStyle(cells, doc);
    // each column's own box colour (a colour per card), in review
    const colours = STD_DRAFT_IMPORT && !boxes ? columns.map((col) => {
      const box = cellBox(col);
      return box && box.kind === 'whole' && box.colour !== 'boxed' ? box.colour : '';
    }) : [];
    // (product pages: the plate rows, plateColumns, stay Columns as on stryker.com)
    const block = (STD_DRAFT_IMPORT && !colctrl.hasAttribute('data-columns')
      && tileCards(cells, variant, doc, colours))
      || WebImporter.Blocks.createBlock(doc, {
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

/*
 * In review (staging build only, STD_DRAFT_IMPORT; docs/standardisation/table.md): a source
 * data table (content/table `.c-table`, the patent lists `.c-patenttables`) is the `Table`
 * block; the committed build drops the full-width ones. The first row is the header when it
 * uses <th> or every filled cell of it is all bold (its bold is dropped: a header cell is bold);
 * otherwise `no-header`. `mobile-enabled` (stryker.com's mobile design) is `mobile-stacked`;
 * the patent lists are `sheet` (a long list, kept in a sheet on stryker.com) and always
 * stacked. Widths (55%, 75% on 3 tables) are not kept: full width. A table in a column row is
 * a part of a side-by-side section (columnRows), not a block inside Columns. The component's
 * subheading stays as an H3 before it.
 */
function tableCellNodes(td, doc) {
  const cell = td.cloneNode(true);
  cell.querySelectorAll('.cell-mobile-title').forEach((el) => el.remove());
  cell.querySelectorAll('.cell-content').forEach((el) => el.replaceWith(...el.childNodes));
  if (!text(cell)) return [];
  // downloads stay on www.stryker.com, PDFs and new-tab links get the #_blank marker
  cell.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('href', newTabHref(a, absoluteAsset(a.getAttribute('href'))));
  });
  const div = doc.createElement('div');
  div.append(...cell.childNodes);
  return [div];
}

function headerRow(tr) {
  const cells = [...tr.children].filter((c) => /^T[HD]$/.test(c.tagName));
  if (cells.some((c) => c.tagName === 'TH' && text(c))) return true;
  const filled = cells.filter((c) => text(c));
  const squash = (value) => value.replace(/[\s\u00a0]+/g, '');
  return filled.length > 0 && filled.every((c) => squash([...c.querySelectorAll('b, strong')]
    .filter((b) => !b.parentElement.closest('b, strong'))
    .map((b) => b.textContent).join('')) === squash(c.textContent));
}

function dataTables(main, doc) {
  main.querySelectorAll('.c-patenttables, .c-table').forEach((component) => {
    if (!component.isConnected || component.parentElement.closest('.c-patenttables, .c-table')) return;
    const table = component.querySelector('table');
    const trs = table ? [...table.querySelectorAll('tr')].filter((tr) => text(tr)) : [];
    if (!trs.length) return;
    const header = headerRow(trs[0]);
    if (header) {
      trs[0].querySelectorAll('b, strong').forEach((b) => b.replaceWith(...b.childNodes));
    }
    const sheet = component.matches('.c-patenttables');
    const options = [header ? '' : 'no-header',
      sheet || component.matches('.mobile-enabled') ? 'mobile-stacked' : '',
      sheet ? 'sheet' : ''].filter(Boolean);
    let rows = trs.map((tr) => [...tr.children].filter((c) => /^T[HD]$/.test(c.tagName))
      .map((td) => tableCellNodes(td, doc)));
    // a column empty in every row (an authoring leftover, e.g. Vocera easter eggs) is dropped
    const width = Math.max(...rows.map((r) => r.length));
    const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i] && r[i].length));
    rows = rows.map((r) => used.map((i) => r[i] || []));
    const block = WebImporter.Blocks.createBlock(doc, {
      name: options.length ? `Table (${options.join(', ')})` : 'Table',
      cells: rows,
    });
    block.setAttribute('data-std-table', '');
    block.setAttribute('data-keep', 'body');
    const subheading = component.querySelector('.component-subheading');
    const parts = [block];
    if (subheading && text(subheading)) {
      const h3 = doc.createElement('h3');
      h3.textContent = text(subheading);
      h3.setAttribute('data-keep', 'body');
      parts.unshift(h3);
    }
    (component.closest('.table.parbase, .patenttables') || component).replaceWith(...parts);
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
    // review build, product pages: a desktop and a phone image are a `desktop-only` and a
    // `mobile-only` section (standard section styles; RISE "Hydro irrigation system"); the
    // image shadow has no standard style (the soft shadow is a box's)
    const sources = [...new Set([desktop, phone])].filter(Boolean);
    if (stdReviewPage(doc)) {
      box.replaceWith(...sources.map((src, i) => {
        const one = doc.createElement('div');
        one.setAttribute('data-keep', 'nodes');
        const device = ['desktop-only', 'mobile-only'][i];
        one.setAttribute('data-section-style', sources.length > 1 ? `full-width-image, ${device}` : 'full-width-image');
        const p = doc.createElement('p');
        const image = doc.createElement('img');
        image.setAttribute('src', src);
        image.setAttribute('alt', alt);
        p.append(image);
        one.append(p);
        return one;
      }));
      return;
    }
    const holder = doc.createElement('div');
    holder.setAttribute('data-keep', 'nodes');
    holder.setAttribute('data-section-style', box.classList.contains('bg-shadow') ? 'full-width-image, shadow' : 'full-width-image');
    sources.forEach((src) => {
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
  let size = spans.map((span) => (/\bfontsize-([\d-]+)em\b/.exec(span.className) || [])[1])
    .find((n) => TITLE_SIZES.includes(n));
  // review build, product pages: nested size spans multiply, as on stryker.com; the nearest
  // size step (RISE "RISE": 2.5em in 2em, 140px → 2.5x)
  if (size && stdReviewPage(doc)) {
    const factor = spans.map((span) => (/\bfontsize-(\d+)(?:-(\d+))?em\b/.exec(span.className) || []))
      .filter((m) => m[1]).reduce((f, m) => f * Number(`${m[1]}.${m[2] || 0}`), 1);
    const off = (n) => Math.abs(Math.log(Number(n.replace('-', '.')) / factor));
    size = TITLE_SIZES.reduce((x, y) => (off(y) < off(x) ? y : x));
  }
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

/** The asset name of an image address (…/is/image/stryker/<name>?…), '' for none. */
const assetName = (src) => ((src || '').match(/\/is\/(?:image|content)\/([^?#]+)/) || [])[1] || '';

/**
 * Product pages (review build): the images of standalone-image columns a quarter or less of
 * their grid wide with text beside them (icons), by asset name.
 * @param {Element} main The page content
 * @returns {Set<string>} The asset names
 */
function iconSources(main) {
  const names = new Set();
  main.querySelectorAll('.standaloneimage[class*="aem-GridColumn--default--"]').forEach((col) => {
    const grid = col.parentElement && col.parentElement.className.match(/\baem-Grid--default--(\d+)\b/);
    const width = col.className.match(/\baem-GridColumn--default--(\d+)\b/);
    const beside = col.nextElementSibling && col.nextElementSibling.matches('.text') && text(col.nextElementSibling);
    if (!grid || !width || !beside || Number(width[1]) * 4 > Number(grid[1])) return;
    col.querySelectorAll('img').forEach((img) => names.add(assetName(img.getAttribute('src'))));
  });
  names.delete('');
  return names;
}

/**
 * Product pages (review build): a Cards or Columns block whose images are all icons
 * (iconSources) is a Columns (icon-text) block, the standard look for a small icon beside its
 * text, the icons in their source rows (Mako global statistics: 3 then 2 per row, 87px icons
 * beside each figure on stryker.com).
 */
function iconBlocks(root, icons, doc) {
  root.querySelectorAll('table').forEach((table) => {
    const trs = [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')];
    const head = trs[0] && trs[0].firstElementChild;
    const m = head && head.textContent.trim().match(/^(Cards Corp|Columns)(?: \((.*)\))?$/);
    if (!m) return;
    const names = [...table.querySelectorAll('img')].map((img) => assetName(img.getAttribute('src')))
      .concat([...table.querySelectorAll('a[href]')].map((a) => assetName(a.getAttribute('href')))
        .filter((n) => n && !/\.(?:m3u8|mp4)$/.test(n)));
    if (!names.length || !names.every((n) => icons.has(n))) return;
    const media = (n) => n.nodeType === 1 && (n.matches('img, picture') || !!n.querySelector('img, picture')
      || (n.matches('a[href], p') && icons.has(assetName((n.matches('a') ? n : n.querySelector('a[href]'))?.getAttribute('href')))));
    // the icon units in source order, each [icon, its text…], grouped as the source rows: a
    // Columns row's cells, or a Cards block's cards per row (three-up / two-up)
    const units = [];
    trs.slice(1).forEach((tr) => {
      const cells = [...tr.children];
      if (m[1] === 'Cards Corp' && cells.length === 2) {
        units.push({ row: units.length, nodes: [...cells[0].childNodes, ...cells[1].childNodes] });
        return;
      }
      const row = units.length ? units[units.length - 1].row + 1 : 0;
      cells.forEach((cell) => {
        const nodes = [...cell.childNodes];
        const at = nodes.findIndex(media);
        if (at < 0) return;
        units.push({ row, nodes: [nodes[at], ...nodes.filter((n, k) => k !== at)] });
      });
    });
    if (!units.length) return;
    const perRow = m[1] === 'Cards Corp'
      ? ({ 'two-up': 2, 'three-up': 3 }[(m[2] || '').split(', ').find((v) => /-up$/.test(v))] || 3) : 0;
    const grouped = [];
    units.forEach((unit, i) => {
      const at = perRow ? Math.floor(i / perRow) : unit.row;
      (grouped[at] = grouped[at] || []).push(unit.nodes);
    });
    const rows = grouped.filter(Boolean);
    // one icon per row (an icon beside a whole-width text): the icon and its text are the
    // row's two cells; icons side by side (stryker.com Mako global statistics, LIFEPAK 35
    // "Intuitive / Clinically advanced / Proven": 3 per row): each cell holds its icon and
    // its text, side by side within the cell (columns-corp.css)
    const cells = rows.every((r) => r.length === 1)
      ? rows.map(([nodes]) => [[nodes[0]], nodes.slice(1)])
      : rows.map((r) => r.map((nodes) => {
        const [icon, ...rest] = nodes;
        const paragraph = (inline) => {
          const p = doc.createElement('p');
          p.append(...inline);
          return p;
        };
        const block = (n) => n.nodeType === 1 && /^(P|H[1-6]|UL|OL|DIV|TABLE)$/.test(n.tagName);
        const filled = (list) => list.some((n) => n.nodeType === 1 || n.textContent.trim());
        // the icon and the text in paragraphs of their own (loose text, e.g. a figure and its
        // line, is one paragraph), so the cell's text sits beside the icon as a whole
        const out = [block(icon) ? icon : paragraph([icon])];
        let run = [];
        rest.forEach((n) => {
          if (block(n)) {
            if (filled(run)) out.push(paragraph(run));
            run = [];
            out.push(n);
          } else run.push(n);
        });
        if (filled(run)) out.push(paragraph(run));
        return out;
      }));
    table.replaceWith(WebImporter.Blocks.createBlock(doc, { name: 'Columns (icon-text)', cells }));
  });
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
  // in review (staging build only): a slide's headline box can be a rich text box
  // (.has-background.bg-…, e.g. LIFEPAK 35's dark purple gradient slides), which the steps
  // below unwrap: its colour is kept on the slide's overlay for the slide parser (slideOptions)
  if (STD_DRAFT_IMPORT) {
    element.querySelectorAll('.overlayparsys').forEach((overlay) => {
      const box = overlay.querySelector('.has-background[class*="bg-"]');
      const bg = box && [...box.classList].find((c) => /^bg-/.test(c));
      if (bg) overlay.setAttribute('data-std-box', bg);
    });
  }
  if (!payload || !payload.template || !TEMPLATES.includes(payload.template.name)) return;
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;

  const path = sourcePath(payload);
  // in review: an XF of a product page imported as its own fragment document (the fragments
  // import marks it product-detail): its own grid rows are the XF's rows, and it has no page
  // title (the page that places it has the H1)
  const productXf = stdProductPage(doc) && payload.template.name === 'long-page-detail-corp-fragments';
  // the second, white-on-white H1 below a full-width image hero is not visible content
  main.querySelectorAll('.hero-space').forEach((el) => el.remove());
  // review build, product pages: a size typed in pixels (RISE "Connectivity" in a 21px span)
  // reads as the size step it is (1.5em of the 14px copy), as the size spans
  if (stdReviewPage(doc)) {
    const STEPS = ['8', '1-25', '1-5', '1-75', '2', '2-5'];
    main.querySelectorAll('span[style*="font-size"]').forEach((span) => {
      const m = (span.getAttribute('style') || '').match(/font-size:\s*(\d+(?:\.\d+)?)px/i);
      if (!m) return;
      const factor = Number(m[1]) / 14;
      const off = (n) => Math.abs(Math.log((n === '8' ? 0.8 : Number(n.replace('-', '.'))) / factor));
      const step = STEPS.reduce((x, y) => (off(y) < off(x) ? y : x));
      if (Math.abs(factor - 1) > 0.1) span.classList.add(`fontsize-${step}em`);
    });
  }
  main.querySelectorAll('.fullWidthImageHero').forEach((el) => el.setAttribute('data-keep', 'section'));
  dropDamVideos(main);
  fullWidthImages(main, doc);
  spaceUrlColons(main, doc);
  const nav = localNav(main, doc);
  // a review run of pages of other templates: their XFs from review-pages-xf.js
  const pageXfs = PRODUCT_XFS[path] || (STD_REVIEW_IMPORT ? REVIEW_XFS[path] : undefined);
  if (!(stdProductPage(doc) && productFragments(main, doc, pageXfs))) {
    experienceFragments(main, doc, PAGE_XFS[path] || [], PAGE_XF_SLOTS[path]);
  }
  sectionTitles(main, doc);
  downloadTitles(main, doc);
  videoCaptions(main, doc);
  if (STD_DRAFT_IMPORT) dataTables(main, doc);
  const hasTitle = productXf
    || !!(main.querySelector('.h1-title h1') && text(main.querySelector('.h1-title h1')))
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
  // product pages (and the review run): images in a narrow grid column beside their text (a
  // quarter or less, e.g. the Mako global statistics and LIFEPAK 35 icons, 1 of 4 columns):
  // their cards / columns are icon-text rows
  const icons = stdProductPage(doc) ? iconSources(main) : null;
  const helpers = {
    cellNodes, richText, text, tagCopy,
  };
  convertBeforeRows(main, doc, helpers);
  markRowEnds(main);
  if (STD_DRAFT_IMPORT) xfGridRows(main, doc, productXf ? '.aem-Grid' : undefined);
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
    // review build of the shared fragments: Text style sizes, icon rows side by side
    stdText: STD_DRAFT_IMPORT && payload.template.name === 'long-page-detail-corp-fragments',
  });
  if (icons && icons.size) iconBlocks(element, icons, doc);
  // the local navigation: a section of its own above the page
  if (nav) element.prepend(nav, doc.createElement('hr'));
}
