/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `panel` block, gray variant (bvn-ablation singleton).
 * Source: .c-rich-text-editor .bg-light-gray — the "Contact your doctor if
 * you're exhibiting any of these lower back symptoms" box (h4 + list).
 *
 * NOT to be confused with the Potential-risks box further down, which is
 * `.bg-lighter-gray` and stays default content in a light-gray section.
 *
 * Target authored table (single content cell), header "Panel (gray)".
 */

export default function parse(element, { document }) {
  const contentCell = [...element.children].filter((el) => el.textContent.trim());

  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Panel (gray)', cells: [[contentCell]] });
  element.replaceWith(block);
}
