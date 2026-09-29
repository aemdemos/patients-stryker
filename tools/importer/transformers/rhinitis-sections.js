/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section handling for the Chronic rhinitis page. Runs in
 * afterTransform (after parsers build block tables and the cleanup transformer
 * has converted the source's gold section labels into bold+italic markup).
 *
 * Unlike the ETD page (whose section labels are real <h2>s), rhinitis marks its
 * section labels as GOLD text that the cleanup transformer turns into
 * <p><em><strong>LABEL</strong></em></p> paragraphs (not headings). So sections
 * are anchored on those bold-italic label paragraphs, matched by text.
 *
 * Sections (top → bottom):
 *   1. Hero (columns-50-50)                    — compact (per request)
 *   2. CAUSES                                  — compact
 *   3. SYMPTOMS                                — compact + columns-50-50
 *   4. TREATMENT OPTIONS                       — compact + columns-50-50
 *   5. CLARIFIX FOR TREATMENT…                 — compact
 *   6. WHAT TO EXPECT WITH TREATMENT           — compact
 *   7. FAQ (accordion)                         — NOT compact
 *   8. References/disclaimer                   — compact
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// section label text (uppercased, matched by startsWith), in document order
const SECTION_LABELS = ['CAUSES', 'SYMPTOMS', 'TREATMENT OPTIONS', 'CLARIFIX', 'WHAT TO EXPECT'];
const NON_COMPACT = new Set(['FAQ']);
const FIFTY_FIFTY = ['SYMPTOMS', 'TREATMENT OPTIONS'];

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const doc = element.ownerDocument;
  const root = element;

  // hoist an anchor above any block table so the <hr> delimits whole sections
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

  const breakBefore = (node, compact) => {
    const anchor = outermostAnchor(node);
    if (!anchor.parentElement) return;
    if (!(anchor.previousElementSibling && anchor.previousElementSibling.tagName === 'HR')) {
      anchor.parentElement.insertBefore(doc.createElement('hr'), anchor);
    }
    if (compact) anchor.parentElement.insertBefore(makeSectionMeta(), anchor);
  };

  // A section label's text (normalised, uppercased) starts with a SECTION_LABELS
  // entry. Labels are bold-italic <p> paragraphs (from the cleanup transformer).
  const labelText = (el) => el.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
  const seen = new Set();

  // --- hero: it is a columns-50-50 block (from ent-hero parser). Give it compact
  // via a section metadata placed at the very top (before the first block). ---
  const firstBlock = root.querySelector('table');
  if (firstBlock && firstBlock.parentElement) {
    // only if the hero is the columns-50-50 table (header text check)
    const hdr = firstBlock.querySelector('tr');
    if (hdr && /columns/i.test(hdr.textContent)) {
      firstBlock.parentElement.insertBefore(makeSectionMeta(), firstBlock);
    }
  }

  // --- section breaks + compact metadata on each labelled section ---
  const allRuns = [...root.querySelectorAll('p em > strong, p strong > em, p > em, p > strong')]
    .map((el) => el.closest('p'))
    .filter(Boolean);
  SECTION_LABELS.forEach((label) => {
    const p = allRuns.find((para) => !seen.has(para) && labelText(para).startsWith(label));
    if (p) { seen.add(p); breakBefore(p, true); }
  });

  // FAQ (accordion) — break but NOT compact
  const faqP = [...root.querySelectorAll('p')].find((p) => labelText(p) === 'FAQ');
  if (faqP) breakBefore(faqP, false);

  // references / disclaimer (compact)
  const discl = [...root.querySelectorAll('p')].find((p) => {
    const t = p.textContent.trim();
    return /^references$/i.test(t) || /^the information presented is for educational purposes/i.test(t);
  });
  if (discl) breakBefore(discl, true);

  // --- mark columns-50-50 in SYMPTOMS and TREATMENT OPTIONS sections ---
  // walk the post-break content, tracking the current section from label
  // paragraphs; the label may sit INSIDE a columns block's first cell.
  const currentOf = (el) => SECTION_LABELS.find((s) => labelText(el).startsWith(s)) || null;
  let currentSection = null;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== 1) return;
      // a label paragraph updates the current section
      if (child.tagName === 'P') {
        const s = currentOf(child);
        if (s) currentSection = s;
      }
      if (child.tagName === 'TABLE') {
        const hdr = child.querySelector('tr');
        if (hdr && /^columns$/i.test(hdr.textContent.trim())) {
          // prefer a label found INSIDE this columns block
          const innerLabelP = [...child.querySelectorAll('p')].find((p) => currentOf(p));
          const section = innerLabelP ? currentOf(innerLabelP) : currentSection;
          if (FIFTY_FIFTY.includes(section)) {
            const hdrCell = child.querySelector('tr td, tr th');
            if (hdrCell) hdrCell.textContent = 'Columns (columns-50-50)';
          }
        }
        return;
      }
      walk(child);
    });
  };
  walk(root);
}
