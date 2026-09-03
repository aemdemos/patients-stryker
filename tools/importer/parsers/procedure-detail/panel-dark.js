/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, dark + wide variant.
 * Base block: panel. Source: balloon-kyphoplasty.html
 *   (.fullbleedpanel .c-full-bleed-panel) — a full-bleed dark-teal clinical-
 *   evidence band.
 *
 * Target authored table (single content column), header "Panel (dark, wide)":
 *   one content cell holding:
 *     - h3 "Treating spine fractures can save lives"
 *     - supporting statistic paragraph (superscript reference preserved)
 */

export default function parse(element, { document }) {
  const contentCell = [];

  const heading = element.querySelector('.c-rich-text-editor h3, h3');
  if (heading) contentCell.push(heading);

  // Supporting statistic paragraph(s) inside the rich-text editor.
  const paras = element.querySelectorAll('.c-rich-text-editor p, p');
  paras.forEach((p) => {
    if (p.textContent.trim()) contentCell.push(p);
  });

  if (!heading && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Panel (dark, wide)', cells });
  element.replaceWith(block);
}
