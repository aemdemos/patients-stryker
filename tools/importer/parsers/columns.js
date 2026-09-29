/* eslint-disable */
/* global WebImporter */

/**
 * Parser: source .cols2 / .cols3 grid → EDS `columns` block.
 *
 * Source shape (AEM Bootstrap grid):
 *   <div class="cols2|cols3"><div class="colctrl ...">
 *     <div class="row">
 *       <div class="col-xs-12 col-sm-6 ...">  … cell 1 content …  </div>
 *       <div class="col-xs-12 col-sm-6 ...">  … cell 2 content …  </div>
 *     </div>
 *   </div></div>
 *
 * Produces a columns block whose first row is the block name and whose second
 * row has one cell per source column, each keeping its inner content (headings,
 * paragraphs, lists, pictures). The columns block's decorate() derives the
 * column count from that second row's cell count.
 */
export default function parse(element, { document }) {
  // the immediate grid row holding the columns
  const row = element.querySelector('.colctrl .row, .row');
  if (!row) return;

  // direct column children (col-xs-*/col-sm-*/col-md-*)
  const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
  // Only treat this as a columns block when there are at least 2 columns with
  // real content. A cols2 wrapper that holds a single heading row (e.g. the
  // "FAQ" heading above the accordion) has one populated column — leave it as
  // default content so it stays part of its section rather than a stray block.
  const filled = cols.filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
  if (filled.length < 2) return;

  // build each cell from the meaningful content inside the column (unwrap the
  // Bootstrap .row / rich-text-editor / standalone-image wrappers so the cell
  // holds the real elements: headings, paragraphs, lists, pictures)
  const cells = cols.map((col) => {
    const frag = document.createElement('div');
    const pick = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) {
          const el = child;
          if (el.matches('picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol')) {
            frag.append(el);
          } else {
            // descend through layout / rich-text wrappers
            pick(el);
          }
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          frag.append(child);
        }
      });
    };
    pick(col);
    return [...frag.childNodes];
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    cells: [cells],
  });
  element.replaceWith(block);
}
