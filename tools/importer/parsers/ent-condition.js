/* eslint-disable */
/* global WebImporter */

/**
 * Parser: ENT-homepage condition row (source div.cols2) → ONE EDS `columns`
 * block, variant `columns-50-50`.
 *
 * Source shape (one condition, e.g. Sinusitis):
 *   div.cols2 > .colctrl > .row
 *     .col-sm-6                         ← image cell (div.standaloneimage > picture)
 *     .col-sm-6                         ← text cell, everything inside one .row:
 *       .text  (h3 title + body paragraphs + "Talk with your doctor…")
 *       .largeheadline > .bg-blue       ← stat box
 *       .text  ("Learn more" link)
 *
 * The stat box's internal shape is a single .line1 span holding BOTH lines,
 * separated by a <br>:
 *   .bg-blue > .line1 > .fontsize span >
 *       .futura-bold > span «31 million»      ← number (before the <br>)
 *       <br>
 *       span span span «adults suffer from sinusitis»  ← label (after the <br>)
 *
 * Everything stays IN the text cell (one columns block; no panel, no sibling
 * link). The stat is re-expressed with the project's inline-code convention so
 * the block CSS renders the navy box:
 *     <p><strong><code>31 million</code></strong></p>            ← gold number
 *     <p><code>adults suffer from sinusitis<sup>4</sup></code></p>  ← white label
 * The "Learn more" link stays as its own paragraph in the cell.
 *
 * Column order preserves source DOM order (image-first vs text-first). Each
 * condition is emitted with a Section Metadata table (Style=compact).
 */
export default function parse(element, { document }) {
  const row = element.querySelector('.colctrl .row, .row');
  if (!row) return;

  const cols = [...row.children].filter((c) => /\bcol-(xs|sm|md)-/.test(c.className));
  if (cols.length < 2) return;

  const textCol = cols.find((c) => c.querySelector('h1, h2, h3, h4')) || cols[1];
  const imageCol = cols.find((c) => c !== textCol) || cols[0];
  const imageFirst = cols.indexOf(imageCol) < cols.indexOf(textCol);

  const blueBox = textCol.querySelector('.bg-blue');

  // --- rebuild the stat box as two inline-code paragraphs -------------------
  // The box's content is one run split by a <br>: text before = number line,
  // text after = label line (which may carry a footnote <sup>). Walk the box's
  // descendants in order, switching from "number" to "label" at the first <br>.
  const statNodes = [];
  if (blueBox) {
    const numberFrag = document.createDocumentFragment();
    const labelFrag = document.createDocumentFragment();
    let afterBreak = false;
    const collect = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const t = child.textContent.replace(/ /g, ' ');
          if (t.trim()) (afterBreak ? labelFrag : numberFrag).append(document.createTextNode(t));
        } else if (child.nodeType === 1) {
          if (child.tagName === 'BR') { afterBreak = true; return; }
          if (child.tagName === 'SUP') {
            (afterBreak ? labelFrag : numberFrag).append(child.cloneNode(true));
          } else {
            collect(child); // descend through the source's nested styling spans
          }
        }
      });
    };
    collect(blueBox);

    const trimFrag = (frag) => {
      // collapse whitespace-only leading/trailing text nodes
      const p = document.createElement('p');
      p.append(frag);
      p.innerHTML = p.innerHTML.replace(/\s+/g, ' ').trim();
      return p;
    };

    const numberText = numberFrag.textContent.trim();
    if (numberText) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const code = document.createElement('code');
      const holder = trimFrag(numberFrag);
      while (holder.firstChild) code.append(holder.firstChild);
      strong.append(code);
      p.append(strong);
      statNodes.push(p);
    }
    const labelText = labelFrag.textContent.trim();
    if (labelText) {
      const p = document.createElement('p');
      const code = document.createElement('code');
      const holder = trimFrag(labelFrag);
      while (holder.firstChild) code.append(holder.firstChild);
      p.append(code);
      statNodes.push(p);
    }
  }

  // --- collect the text cell, dropping ONLY the blue box (not its container) ---
  // The whole text column lives inside a single .row that also holds the h3,
  // body paragraphs and the learn-more link. Short-circuit only on the blue box
  // itself (or nodes inside it); always descend into containers so the copy and
  // link survive. The rebuilt stat paragraphs are inserted where the box sat.
  const collectTextCell = () => {
    const frag = document.createElement('div');
    let statInserted = false;
    const pick = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) {
          const el = child;
          if (blueBox && el === blueBox) {
            statNodes.forEach((n) => frag.append(n));
            statInserted = true;
            return;
          }
          if (blueBox && blueBox.contains(el)) return; // inside the box — skip leaf
          if (el.matches('picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol')) {
            frag.append(el);
          } else {
            pick(el); // descend containers (.row, .text, .c-rich-text-editor, …)
          }
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          frag.append(child);
        }
      });
    };
    pick(textCol);
    if (!statInserted) statNodes.forEach((n) => frag.append(n));
    return [...frag.childNodes];
  };

  const collectImageCell = () => {
    const frag = document.createElement('div');
    const pick = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) {
          const el = child;
          if (el.matches('picture, img, h1, h2, h3, h4, h5, h6, p, ul, ol')) frag.append(el);
          else pick(el);
        } else if (child.nodeType === 3 && child.textContent.trim()) {
          frag.append(child);
        }
      });
    };
    pick(imageCol);
    return [...frag.childNodes];
  };

  const textCell = collectTextCell();
  const imageCell = collectImageCell();
  const cells = imageFirst ? [imageCell, textCell] : [textCell, imageCell];

  const columnsBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Columns',
    variants: ['columns-50-50'],
    cells: [cells],
  });

  const fragment = document.createDocumentFragment();
  fragment.append(columnsBlock);

  const meta = WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [['Style', 'compact']],
  });
  fragment.append(meta);

  element.replaceWith(fragment);
}
