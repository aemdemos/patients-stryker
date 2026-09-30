/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `columns` block, default variant (bvn-ablation singleton).
 * Source: .cols3 — "What you can expect": Before / During / After the procedure.
 * Text-only columns, each an h4 followed by one or more paragraphs and lists.
 *
 * Target authored table (one row, 3 cells), header "Columns". Every rich-text
 * child of a column is kept (not just the first <p>) so lists and the second
 * "During" paragraph survive.
 */

export default function parse(element, { document }) {
  const row = [];

  element.querySelectorAll('.row > [class*="col-md-4"]').forEach((col) => {
    const content = [];
    col.querySelectorAll('.c-rich-text-editor > div').forEach((rte) => {
      [...rte.children].forEach((child) => {
        if (child.textContent.replace(/ /g, ' ').trim()) content.push(child);
      });
    });
    if (content.length) row.push(content);
  });

  if (row.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [row] });
  element.replaceWith(block);
}
