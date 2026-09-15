/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns. Base: columns. Variant: default (auto columns-N-cols).
 * Source: https://patients.stryker.com/us/en/ivs/treatments/mild.html
 * Selectors (three instances, one parser):
 *   - proven-results 2-up: ".cols2:has(.standaloneimage):not(.c-full-bleed-panel .cols2)"
 *     each column = DM stat chart image ON TOP + caption paragraph below.
 *   - before-after 2-up (dark): ".c-full-bleed-panel.bg-dark-teal-gradient .cols2:has(h4)"
 *     each column = DM diagram image + heading (h3) + caption (h4).
 *   - how-it-works 3-up (text-only): ".cols3"
 *     each column = h4 + paragraph + list (no image).
 * Generated: 2026-09-11
 *
 * The EDS columns block (blocks/columns/columns.js) takes ONE row whose cells are
 * the columns; it auto-tags `columns-{n}-cols` from the cell count and, for
 * text-only cells in a plain section, `columns-text`. A cell whose sole child is a
 * picture is tagged `.columns-img-col` (image column) — for the image-over-text
 * columns here the image and caption live in the SAME cell (image stacked above
 * text), which is the default columns behaviour, NOT the 50-50 image-beside-text
 * variant. So we emit a single row of N cells, each cell carrying that column's
 * content in source order (image first when present, then text).
 *
 * Each source column is a `.col-*` wrapper containing `.standaloneimage` (optional)
 * and `.text.parbase` rich-text blocks. We flatten each column to its meaningful
 * nodes: the image (raw <img>, so patients-stryker-dm-images.js rewrites the DM
 * src), then headings/paragraphs/lists in order. Empty spacer paragraphs (e.g. the
 * trailing "&nbsp;" block after the After caption) are dropped.
 */
function isEmptyNode(node) {
  if (node.querySelector && node.querySelector('img, picture')) return false;
  return !node.textContent.replace(/ /g, ' ').trim();
}

export default function parse(element, { document }) {
  // The columns are the Bootstrap `.col-*` children of the inner `.row`.
  const row = element.querySelector('.colctrl .row') || element.querySelector('.row');
  const columns = row
    ? Array.from(row.children).filter((c) => /\bcol-/.test(c.className))
    : [];

  const cells = [];
  columns.forEach((col) => {
    const cellNodes = [];

    // Image first (image-over-text stacking), as a raw <img>.
    const img = col.querySelector('.standaloneimage img, img');
    if (img) cellNodes.push(img);

    // Then the text blocks (headings, paragraphs, lists) in document order.
    col.querySelectorAll('.text.parbase, .c-rich-text-editor').forEach((rte) => {
      // Only take the innermost rich-text container to avoid duplicating nodes.
      if (rte.querySelector('.c-rich-text-editor')) return;
      Array.from(rte.children).forEach((wrapper) => {
        Array.from(wrapper.children).forEach((node) => {
          if (isEmptyNode(node)) return;
          cellNodes.push(node);
        });
      });
    });

    // Before/After caption: the source authors the column as <h3>Before mild</h3>
    // + <h4>caption</h4>, and the reference renders that caption AS an <h4> (bold,
    // 17.5px) — so we keep it as-is. The column CSS styles the h4 caption to match.

    // Only keep columns that resolved to real content (drop empty spacer columns).
    if (cellNodes.length) cells.push(cellNodes);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // One row, N cells — the columns block reads the first row's cell count.
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns',
    cells: [cells],
  });
  element.replaceWith(block);
}
