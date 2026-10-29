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
 *   5. the source back link (.c-back-button) is not content: the page is marked for the
 *      `page-back: show` metadata (import-long-page-detail-corp.js). The stryker.com
 *      script removes the link from the rendered page, so the pages that have it are
 *      listed in long-page-detail-corp-page-back.js (from the server HTML).
 *   6. components the source sets in the centred AEM grid column (offset 1, 10 or 11 of 12
 *      columns: the Virtual Learning Center video item) get the `column-10-12` section
 *      style (the template CSS sets the 10/12 column and the 11/12 downloads row).
 * The H1 title, rich text, separators and the small print (`disclaimer`) are built as in
 * the news articles. No `spacer` section follows the title.
 */

import buildArticle from './long-page-detail-corp-article.js';
import { xfToFragmentPath } from '../xf-fragment-path.js';
import PAGE_XFS from '../long-page-detail-corp-xf.js';
import PAGE_BACK from '../long-page-detail-corp-page-back.js';

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

function experienceFragments(main, doc, xfs) {
  const slots = [...main.querySelectorAll('.experiencefragment')]
    .filter((slot) => !slot.parentElement.closest('.experiencefragment'));
  const filled = slots.filter((slot) => {
    if (text(slot) || slot.querySelector('img, [data-asset-path], iframe')) return true;
    slot.remove();
    return false;
  });
  if (!filled.length) return;
  // the export gives a page's XFs, not their order on the page: a slot is resolved only
  // when the page has one XF (every slot shows it); otherwise the slots are imported
  // inline and the page is marked for the import report
  if (xfs.length !== 1) {
    main.ownerDocument.body.setAttribute('data-xf-unresolved', String(xfs.length));
    return;
  }
  const path = sharedFragmentPath(xfs[0]);
  filled.forEach((slot, i) => {
    if (i > 0) {
      slot.remove();
      return;
    }
    if (!path) return;
    const a = doc.createElement('a');
    a.href = path;
    a.textContent = path;
    const block = WebImporter.Blocks.createBlock(doc, { name: 'Fragment', cells: [[a]] });
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

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (!payload || !payload.template || !TEMPLATES.includes(payload.template.name)) return;
  const doc = element.ownerDocument;
  const main = doc.querySelector('[role="main"]') || element;

  const path = sourcePath(payload);
  if (PAGE_BACK.has(path) || main.querySelector('.c-back-button')) {
    element.setAttribute('data-page-back', 'show');
  }
  experienceFragments(main, doc, PAGE_XFS[path] || []);
  sectionTitles(main, doc);
  videoCaptions(main, doc);
  buildArticle(element, {
    keep: '.c-resourcesanddownload, [data-keep]',
    spacer: false,
    componentStyle: columnStyle,
  });
}
