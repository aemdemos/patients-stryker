/*
 * www.stryker.com page (or experience fragment) → its EDS body, for every corp template.
 *
 * buildCorpBody rebuilds <body> as the page's authorable content: the corp section builder
 * (corp-section-builder.js) walks the source components in authored order and hands each to
 * its handler (corp-component-handlers.js, the approved decision table
 * decisions/component-map.json). XFs on the page become Fragment blocks (matchXfWrappers),
 * hero slide XFs fragment links (markXfSlides). On a page (not an XF), the page disclaimer
 * and document code close the page as a small-print `disclaimer` section. What the builder
 * could not map is reported (data-corp-report on <body>, read by the import script).
 *
 * The import scripts run it through transformers/corp-sections.js, which gets these
 * functions in its payload (payload.corp = CORP_PAGE): transformers import nothing.
 */
import { createBuilder } from './corp-section-builder.js';
import { CORP_HANDLERS } from './corp-component-handlers.js';
import { matchXfWrappers, markXfSlides, corpLinkHref } from './corp-components.js';
import { pageXfRefs } from './xf-fragment-path.js';
import {
  BLOCK_TAGS, text, cleanRichText, contentCopy, footnoteList,
} from './corp-richtext.js';

/** The page disclaimer and document code (outside the content area) → small-print nodes. */
function disclaimerNodes(main, root, doc) {
  const boxes = [...main.querySelectorAll('.c-disclaimer')].filter((el) => !root.contains(el)
    && !el.querySelector('#publishedDate') && !el.parentElement.closest('.c-disclaimer') && text(el));
  const nodes = footnoteList(boxes.flatMap((box) => {
    const copy = contentCopy(box, doc);
    cleanRichText(copy, { wholeParagraphs: true });
    return [...copy.children].filter((el) => BLOCK_TAGS.has(el.tagName));
  }), doc);
  return nodes;
}

/**
 * beforeTransform of a corp page or XF: rebuilds `element` (<body>) as its sections.
 * @param {Element} element the import root
 * @param {object} payload the transformer payload (params, facts: the page facts, xf: the XF
 *   path when importing an XF, sectionStyles: styles every section gets)
 */
export function buildCorpBody(element, payload) {
  const doc = element.ownerDocument;
  const main = doc.querySelector('#aem-specific-data') || element;
  const root = main.querySelector('.main.content') || main;
  const source = payload.xf || (payload.params && payload.params.originalURL) || '';
  const ctx = createBuilder({
    doc, handlers: CORP_HANDLERS, source, facts: payload.facts || null,
  });
  const { matches, unmatched } = matchXfWrappers(main, source);
  ctx.xfMatches = matches;
  if (unmatched.length) ctx.report.notes.push(`XF not matched to the index, kept inline: ${unmatched.join(' | ')}`);
  const slides = markXfSlides(main, source);
  // a visible h1 on the source page: no Large Headline line is promoted to h1
  ctx.h1 = [...root.querySelectorAll('h1')].some((h) => !h.closest('[data-corp-hidden="true"]'));
  ctx.slideRefs = payload.xf ? [] : pageXfRefs(source).filter((r) => r.kind === 'slide');
  if (slides.length) ctx.report.notes.push(`slide XF not matched to the index, images kept: ${slides.join(' | ')}`);

  // payload.sectionStyles: styles of every section (an aside XF: contact-aside)
  const items = ctx.collect(root);
  const styles = payload.sectionStyles || [];
  ctx.place(styles.length ? [{ type: 'group', styles, items }] : items);
  if (!payload.xf) {
    const small = disclaimerNodes(main, root, doc);
    if (small.length) ctx.addSection('disclaimer', [small.converted ? 'disclaimer, references-spaced' : 'disclaimer'], small);
  }
  const nodes = ctx.render();
  element.replaceChildren(...nodes);
  const { report } = ctx;
  element.setAttribute('data-corp-report', JSON.stringify({
    unhandled: report.unhandled, notes: report.notes, hidden: report.hidden,
  }));
  if (report.unhandled.length || report.notes.length) {
    console.warn(`[corp-page] ${source}: ${[...report.unhandled, ...report.notes].join(' | ')}`);
  }
}

/** afterTransform: www.stryker.com links → their EDS form (corpLinkHref). */
export function rewriteCorpLinks(element) {
  element.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    // widget links (/widgets/…) are this site's code, not www.stryker.com pages
    if (href.startsWith('/widgets/')) return;
    a.setAttribute('href', corpLinkHref(href));
  });
}

/** What a corp import script passes to transformers/corp-sections.js (payload.corp). */
export const CORP_PAGE = { buildBody: buildCorpBody, rewriteLinks: rewriteCorpLinks };
