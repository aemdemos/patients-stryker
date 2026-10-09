/* eslint-disable */
/* global WebImporter */

// Generated href → fragment index (build-fragment-index.js); shared DATA, not
// template logic, so it is read from its single generated location.
import { PDF_TO_FRAGMENT, DM_TO_FRAGMENT } from '../procedure-detail/resources-fragment-index.js';

/**
 * Parser for the `tabs` block (bvn-ablation singleton).
 * Source: .tabs .tab-container — the Resources `c-tabs` widget: a tab bar
 * (.tabs-nav a.tab-link → #panel-id) and one .tab-content panel per tab, each a
 * grid of brochure cards.
 *
 * Target structure = block library "Tabs – Resources by treatment"
 * (/.da/library/blocks/tabs, item 1): one row per tab, two cells
 *   | tab label (plain text) | fragment link(s), one per paragraph |
 * The "Resources" h2 stays default content above the block. Each brochure is
 * resolved to its existing card fragment (content/fragments/card-*) by its PDF
 * href, falling back to the DM cover-image URL; the tabs block loads the
 * fragments into the panel. Brochures with no fragment are kept as an inline
 * `Cards (resources)` block after the tabs (nothing is ever lost).
 */

function pdfKey(href) {
  try { return decodeURI(href).trim(); } catch { return (href || '').trim(); }
}
function dmKey(url) {
  return (url || '').split('?')[0].trim();
}

// Resolve one brochure column to a fragment path, or null when not indexed.
function resolveFragment(col) {
  const learnMore = col.querySelector('a.btn[href], a.btn-teal[href], a[href$=".pdf"], a[href*=".pdf"]');
  const pdfHref = learnMore && learnMore.getAttribute('href');
  if (pdfHref && PDF_TO_FRAGMENT[pdfKey(pdfHref)]) return PDF_TO_FRAGMENT[pdfKey(pdfHref)];
  const img = col.querySelector('.cta-img img, img');
  const imgSrc = img && (img.getAttribute('src') || img.getAttribute('title'));
  if (imgSrc && DM_TO_FRAGMENT[dmKey(imgSrc)]) return DM_TO_FRAGMENT[dmKey(imgSrc)];
  return null;
}

// Inline fallback card cells for an unmatched brochure (DM image + LEARN MORE).
function inlineCardCells(col, document) {
  const img = col.querySelector('.cta-img img, img');
  const learnMore = col.querySelector('a.btn[href], a.btn-teal[href]');
  const bodyCell = [];
  if (learnMore) {
    const label = learnMore.textContent.trim();
    learnMore.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = label;
    learnMore.append(strong);
    const p = document.createElement('p');
    p.append(learnMore);
    bodyCell.push(p);
  }
  return [img || '', bodyCell];
}

export default function parse(element, { document }) {
  const rows = [];
  const inlineCells = [];

  // Tab labels in tab-bar order, each pointing at its panel by id.
  const links = [...element.querySelectorAll('.tabs-nav a.tab-link[href^="#"]')];
  const tabs = links.length
    ? links.map((a) => ({
      label: a.textContent.trim(),
      panel: element.querySelector(`[id="${a.getAttribute('href').slice(1)}"]`),
    }))
    : [...element.querySelectorAll('.tab-content')].map((panel) => ({ label: '', panel }));

  tabs.forEach(({ label, panel }) => {
    if (!panel) return;
    const paths = [];
    panel.querySelectorAll('.cols4 .row > [class*="col-"]').forEach((col) => {
      const img = col.querySelector('.cta-img img, img');
      const learnMore = col.querySelector('a.btn[href], a.btn-teal[href]');
      if (!img && !learnMore) return; // empty placeholder slot
      const path = resolveFragment(col);
      if (path) {
        if (!paths.includes(path)) paths.push(path);
      } else {
        inlineCells.push(inlineCardCells(col, document));
      }
    });
    if (!paths.length) return;

    const contentCell = paths.map((path) => {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', path);
      a.textContent = label || path;
      p.append(a);
      return p;
    });
    rows.push([label, contentCell]);
  });

  const out = [];
  if (rows.length) out.push(WebImporter.Blocks.createBlock(document, { name: 'Tabs', cells: rows }));
  if (inlineCells.length) {
    console.warn(`tabs-resources: ${inlineCells.length} brochure(s) without a card fragment kept inline`);
    out.push(WebImporter.Blocks.createBlock(document, { name: 'Cards (resources)', cells: inlineCells }));
  }
  if (!out.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  element.replaceWith(...out);
}
