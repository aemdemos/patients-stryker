/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section handling for the Eustachian-tube-dysfunction (ETD) page
 * and other NAO-style condition pages that use ETD's heading set. Runs in
 * afterTransform (after the parsers have built the block tables).
 *
 * Sections (top → bottom):
 *   1. Hero                 — page start, no break, NOT compact
 *   2. Causes               (H2 "CAUSES")          — compact
 *   3. Symptoms             (H2 "SYMPTOMS")         — compact
 *   4. Treatment            (H2 "TREATMENT")        — compact
 *   5. What to expect       (H2 "WHAT TO EXPECT")   — compact
 *   6. FAQ                  (H2 "FAQ", accordion)   — NOT compact
 *   7. References/disclaimer                        — compact
 *
 * Also:
 *   - the FIRST non-hero body section's columns block is marked `columns-50-50`
 *     (per the agreed layout: the first content section is a 50/50 columns row);
 *   - every non-hero, non-accordion section gets a Style=compact section
 *     metadata table so the compact typography variant applies.
 *
 * Section metadata attaches to the section it sits in, and sections are
 * delimited by <hr>. So for each anchored section we insert an <hr> break and,
 * where compact is wanted, a Section Metadata table immediately after the break.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// heading labels that start a section, in document order
const SECTION_HEADINGS = ['CAUSES', 'SYMPTOMS', 'TREATMENT', 'WHAT TO EXPECT', 'FAQ'];
// which of those sections should NOT be compact
const NON_COMPACT = new Set(['FAQ']);

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const doc = element.ownerDocument;
  const root = element;

  // hoist an anchor above any block table/wrapper so the <hr> delimits whole
  // sections (a break inside a block table is invalid and gets stripped).
  const outermostAnchor = (node) => {
    let anchor = node;
    let n = node;
    while (n && n !== root) {
      if (n.tagName === 'TABLE'
        || (n.classList && (n.classList.contains('columns') || n.classList.contains('accordion')))) {
        anchor = n;
      }
      n = n.parentElement;
    }
    return anchor;
  };

  const makeSectionMeta = () => WebImporter.Blocks.createBlock(doc, {
    name: 'Section Metadata',
    cells: [['Style', 'compact']],
  });

  // insert <hr> (and optional compact metadata) before an anchor node
  const breakBefore = (node, compact) => {
    const anchor = outermostAnchor(node);
    if (!anchor.parentElement) return;
    if (!(anchor.previousElementSibling && anchor.previousElementSibling.tagName === 'HR')) {
      anchor.parentElement.insertBefore(doc.createElement('hr'), anchor);
    }
    // the compact metadata belongs to the PREVIOUS section (the one that ends at
    // this break), so it is inserted just before the <hr> we placed. But we want
    // it to describe the section that FOLLOWS. In EDS the section-metadata block
    // applies to the section it lives in, so place it right AFTER the break,
    // before the heading — i.e. as the first node of the new section.
    if (compact) anchor.parentElement.insertBefore(makeSectionMeta(), anchor);
  };

  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')];

  // --- insert section breaks + compact metadata ---
  SECTION_HEADINGS.forEach((label) => {
    const h = headings.find((el) => el.textContent.trim().toUpperCase().startsWith(label));
    if (h) breakBefore(h, !NON_COMPACT.has(label));
  });

  // references / disclaimer section (compact)
  const discl = [...root.querySelectorAll('p')].find((p) => {
    const t = p.textContent.trim();
    return /^references$/i.test(t) || /^the information presented is for educational purposes/i.test(t);
  });
  if (discl) breakBefore(discl, true);

  // --- mark columns-50-50 in the SYMPTOMS and TREATMENT sections ---
  // Do this AFTER breaks are inserted: the source DOM nests the section headings
  // inside the grid wrappers (so a pre-break document-position test misattributes
  // them). Post-break, walk the top-level content stream, tracking the current
  // section from the most recent section-defining heading, and mark any columns
  // <table> whose section is SYMPTOMS/TREATMENT.
  const FIFTY_FIFTY_SECTIONS = ['SYMPTOMS', 'TREATMENT'];
  const isSectionHeading = (el) => /^H[1-6]$/.test(el.tagName)
    && SECTION_HEADINGS.some((s) => el.textContent.trim().toUpperCase().startsWith(s));
  // the section-defining heading is often INSIDE the columns block's first cell
  // (the source nests the h2 within the grid). So for each columns table,
  // determine its section from a section heading found INSIDE it first, then
  // fall back to the most recent heading seen before it.
  const sectionLabelOf = (el) => {
    const found = SECTION_HEADINGS.find((s) => el.textContent.trim().toUpperCase().startsWith(s));
    return found || null;
  };
  let currentSection = null;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== 1) return;
      if (/^H[1-6]$/.test(child.tagName) && isSectionHeading(child)) {
        currentSection = sectionLabelOf(child);
      }
      if (child.tagName === 'TABLE') {
        const hdr = child.querySelector('tr');
        if (hdr && /^columns$/i.test(hdr.textContent.trim())) {
          // prefer a section heading nested inside this columns block
          const innerHeading = [...child.querySelectorAll('h1, h2, h3, h4, h5, h6')]
            .find((h) => isSectionHeading(h));
          const section = innerHeading ? sectionLabelOf(innerHeading) : currentSection;
          if (FIFTY_FIFTY_SECTIONS.includes(section)) {
            const hdrCell = child.querySelector('tr td, tr th');
            if (hdrCell) hdrCell.textContent = 'Columns (columns-50-50)';
          }
        }
        return; // don't descend into the block table
      }
      walk(child);
    });
  };
  walk(root);
}
