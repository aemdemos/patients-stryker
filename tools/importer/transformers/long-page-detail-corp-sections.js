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
 *      cards-corp-resources parser.
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
  richTextNodes, imageNodes, buttonNodes, headlineNodes, titleHeading,
} from './long-page-detail-corp-article.js';
import { videoLink } from '../parsers/video.js';
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

// the centred AEM grid column of the Virtual Learning Center video item
const CENTRED_COLUMN = ':is(.aem-GridColumn--default--10, .aem-GridColumn--default--11).aem-GridColumn--offset--default--1';

function columnStyle(component) {
  return component.closest(CENTRED_COLUMN) ? 'column-10-12' : '';
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
  main.querySelectorAll('.c-section-title').forEach((title) => {
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
    title.replaceWith(richText(doc, nodes));
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
      else if (c.matches('.c-standalone-image')) out.push(...imageNodes(c, doc));
      else if (c.matches('.c-standalone-video')) {
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

/** The size tag of a copy style: 'p-1-25' → 'text-1-25', '' when it sets no size. */
function sizeTag(copyStyle) {
  const size = (copyStyle || '').split(',').map((s) => s.trim()).find((s) => /^p-\d/.test(s));
  return size ? `text-${size.slice(2)}` : '';
}

/**
 * The copy style of a column row: the style of most of its text (by length) becomes the
 * section style (e.g. `p-1-25` for 17.5px lists); text in another size gets its size tag
 * (e.g. `[[text-2]Program objectives]`, 28px), as the cells share the section.
 */
function rowCopyStyle(cells, doc) {
  const copy = cells.flat().filter((n) => n.nodeType === 1 && n.copyStyle !== undefined
    && n.copyStyle !== null && !/^H\d$/.test(n.tagName));
  const weight = {};
  copy.forEach((n) => { weight[n.copyStyle] = (weight[n.copyStyle] || 0) + text(n).length; });
  const dominant = Object.keys(weight).sort((a, b) => weight[b] - weight[a])[0] || '';
  copy.filter((n) => sizeTag(n.copyStyle) && sizeTag(n.copyStyle) !== sizeTag(dominant))
    .forEach((n) => {
      const tag = sizeTag(n.copyStyle);
      const targets = n.matches('ul, ol') ? [...n.querySelectorAll(':scope > li')] : [n];
      targets.forEach((el) => {
        el.prepend(doc.createTextNode(`[[${tag}]`));
        el.append(doc.createTextNode(']'));
      });
    });
  return dominant;
}

// source column widths (col-sm-*) → the Columns variant
const COLUMN_VARIANTS = { '8,4': 'columns-67-33', '4,8': 'columns-33-67', '6,6': 'columns-50-50' };

function columnWidth(col) {
  const m = col.className.match(/\bcol-sm-(\d+)/) || col.className.match(/\bcol-md-(\d+)/);
  return m ? Number(m[1]) : 12;
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
    const columns = rowColumns(colctrl)
      .filter((col) => text(col) || col.querySelector('img, [data-asset-path], iframe, form, table'));
    if (columns.length < 2) return;
    const wrapper = colctrl.parentElement && /\bcols/.test(colctrl.parentElement.className)
      ? colctrl.parentElement : colctrl;
    const form = marketoBlock(colctrl, doc);
    if (form) {
      form.setAttribute('data-keep', 'section');
      const asides = [...colctrl.querySelectorAll('table')].filter((t) => t.getAttribute('data-keep'));
      asides.forEach((t) => t.setAttribute('data-keep', 'join'));
      wrapper.replaceWith(form, ...asides);
      return;
    }
    const key = columns.map(columnWidth).join(',');
    const variant = COLUMN_VARIANTS[key];
    const cells = columns.map((col) => cellNodes(col, doc));
    const style = rowCopyStyle(cells, doc);
    const block = WebImporter.Blocks.createBlock(doc, {
      name: variant ? `Columns (${variant})` : 'Columns',
      cells: [cells],
    });
    block.setAttribute('data-keep', 'section');
    if (style) block.setAttribute('data-section-style', style);
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
  if (size) spans.forEach((span) => span.classList.remove(...[...span.classList].filter((c) => c.startsWith('fontsize-'))));
  if (/^H[4-6]$/.test(level) && !h1.querySelector('.futura-bold, b, strong')) {
    const bold = doc.createElement('span');
    bold.className = 'futura-bold';
    bold.append(...h1.childNodes);
    h1.append(bold);
  }
  if (size) sizeTagged(h1, `text-${size}`, doc);
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
  spaceUrlColons(main, doc);
  const nav = localNav(main, doc);
  experienceFragments(main, doc, PAGE_XFS[path] || [], PAGE_XF_SLOTS[path]);
  sectionTitles(main, doc);
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
    // a second H1 keeps the source's 28px (the H1 size) as an H2
    if (h !== firstTitle) sizeTagged(renameTo(h, 'h2', doc), 'text-2', doc);
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
  columnRows(main, doc);
  buildArticle(element, {
    keep: '.c-resourcesanddownload, [data-keep]',
    spacer: false,
    componentStyle: columnStyle,
  });
  // the local navigation: a section of its own above the page
  if (nav) element.prepend(nav, doc.createElement('hr'));
}
