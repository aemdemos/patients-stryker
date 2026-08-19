/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: insert EDS section breaks (<hr>) for the nasal-airway-obstruction
 * page. Runs in afterTransform (after parsers have built the blocks).
 *
 * Section grouping (agreed):
 *   1. Hero                 — page start, no break
 *   2. Causes               (H2 "CAUSES" …)
 *   3. Symptoms + LATERA + What to expect  (H2 "SYMPTOMS" …)
 *   4. Patient satisfaction (H2 "PATIENT SATISFACTION…")
 *   5. FAQ                  (H2 "FAQ")
 *   6. Disclaimer + references
 *
 * Each break is hoisted to the top level of the content root so it delimits
 * whole sections rather than landing inside a nested block.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const HEADING_ANCHORS = ['CAUSES', 'SYMPTOMS', 'PATIENT SATISFACTION', 'FAQ'];

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const doc = element.ownerDocument;

  // content root = the element the importer serializes (document.body / main)
  const root = element;

  // Insert a section break (<hr>) directly before the anchor node. The importer
  // flattens the nested source markup into a linear content stream, and an <hr>
  // anywhere in that stream becomes a section break — so it must sit inline
  // right before the heading, NOT hoisted to a top-level wrapper (all headings
  // share the same top-level `.wrapper` ancestor, which would collapse every
  // break to one position).
  const insertBreakBefore = (node) => {
    // If the anchor sits inside a block that a parser already produced (a
    // <table>, or a .columns/.panel/.accordion wrapper), the <hr> must go BEFORE
    // that whole block — a section break inside a block table is invalid and
    // gets stripped. Hoist to the outermost such wrapper.
    let anchor = node;
    let n = node;
    while (n && n !== root) {
      if (n.tagName === 'TABLE'
        || (n.classList && (n.classList.contains('columns') || n.classList.contains('panel') || n.classList.contains('accordion')))) {
        anchor = n;
      }
      n = n.parentElement;
    }
    if (anchor.previousElementSibling && anchor.previousElementSibling.tagName === 'HR') return;
    anchor.parentElement.insertBefore(doc.createElement('hr'), anchor);
  };

  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  HEADING_ANCHORS.forEach((label) => {
    const h = headings.find((el) => el.textContent.trim().toUpperCase().startsWith(label));
    if (h) insertBreakBefore(h);
  });

  // disclaimer/references section
  const discl = [...root.querySelectorAll('p')].find((p) => {
    const t = p.textContent.trim();
    return /^references$/i.test(t) || /^the information presented is for educational purposes/i.test(t);
  });
  if (discl) insertBreakBefore(discl);
}
