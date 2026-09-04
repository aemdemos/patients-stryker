/* eslint-disable */
/* global WebImporter */

/**
 * Parser: source .c-accordion / .panel-group (Bootstrap collapse) → EDS
 * `accordion` block. 2-column rows: [title cell, content cell]; first row is
 * the block name. The accordion block's decorate() reads row.children as
 * [label, content].
 */
export default function parse(element, { document }) {
  const group = element.matches('.panel-group') ? element : element.querySelector('.panel-group');
  if (!group) return;

  const rows = [];
  group.querySelectorAll(':scope > .panel, :scope > .panel-default').forEach((panel) => {
    const titleEl = panel.querySelector('.panel-title a, .panel-title');
    const body = panel.querySelector('.panel-body');
    if (!titleEl || !body) return;

    // title as plain text (drop the collapse toggle anchor, keep its text)
    const title = document.createElement('p');
    title.textContent = titleEl.textContent.trim();

    // body: unwrap rich-text/layout wrappers, keep paragraphs / lists / links
    const content = document.createElement('div');
    const pick = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) {
          const el = child;
          if (el.matches('p, ul, ol, h1, h2, h3, h4, h5, h6, picture, img, a')) {
            content.append(el);
          } else {
            pick(el);
          }
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          content.append(child);
        }
      });
    };
    pick(body);

    rows.push([title, [...content.childNodes]]);
  });

  if (!rows.length) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Accordion',
    cells: rows,
  });
  element.replaceWith(block);
}
