/* eslint-disable */
/* global WebImporter */

import { PDF_TO_FRAGMENT, DM_TO_FRAGMENT } from '../procedure-detail/resources-fragment-index.js';

/**
 * Parser for the `tabs` block (Resources brochure tabs).
 * Base block: tabs. Source: us/en/ivs/index.html (.tabs .c-tabs) — the
 * "Resources" widget: a `component-subheading` <h2> plus a stryker-tabs
 * container whose nav lists the tab labels (`ul.tab .tab-link`, href
 * `#<id>__<n>`) and whose `.tab-content#<id>__<n>` panels each hold a `.cols4`
 * grid of curated-CTA brochure cards (cover image + LEARN MORE → PDF).
 *
 * Target (matches us/en/ivs/conditions/back-pain):
 *   <h2><strong>Resources</strong></h2> as default content, followed by a
 *   "Tabs" block — one row per tab: cell 1 = label, cell 2 = links to the card
 *   fragment(s) under /fragments/resources/ holding that tab's brochures
 *   (multiple fragments separated by <br>). tabs.js loads the fragments and
 *   merges their card grids into one row.
 *
 * Fragment resolution is automatic: each brochure's PDF href (or, as a
 * fallback, its DM cover-image URL) is looked up in the generated
 * resources-fragment-index. That index still records the pre-move
 * `/fragments/card-*` paths, so they are normalised to `/fragments/resources/`.
 */

const normPdf = (href) => {
  try {
    const path = new URL(href, 'https://patients.stryker.com').pathname;
    return decodeURI(path).trim();
  } catch (e) {
    return (href || '').trim();
  }
};
const normDm = (src) => (src || '').split('?')[0].trim();
const toResourcesPath = (path) => path.replace(/^\/fragments\/(?!resources\/)/, '/fragments/resources/');

function panelFragments(panel) {
  const paths = [];
  panel.querySelectorAll('.curatedcta .cta-img').forEach((card) => {
    const link = card.querySelector('a[href]');
    const img = card.querySelector('img');
    const path = (link && PDF_TO_FRAGMENT[normPdf(link.getAttribute('href'))])
      || (img && DM_TO_FRAGMENT[normDm(img.getAttribute('src'))]);
    if (!path) {
      console.warn('tabs: no fragment found for brochure', link && link.getAttribute('href'));
      return;
    }
    const resourcesPath = toResourcesPath(path);
    if (!paths.includes(resourcesPath)) paths.push(resourcesPath);
  });
  return paths;
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('ul.tab .tab-link').forEach((tabLink) => {
    const label = tabLink.textContent.trim();
    const panelId = (tabLink.getAttribute('href') || '').replace(/^#/, '');
    const panel = panelId ? element.querySelector(`[id="${panelId}"]`) : null;
    if (!label || !panel) return;

    const paths = panelFragments(panel);
    if (!paths.length) return; // nothing to reference — skip the empty tab

    const labelP = document.createElement('p');
    labelP.textContent = label;

    const contentP = document.createElement('p');
    paths.forEach((path, i) => {
      if (i > 0) contentP.append(document.createElement('br'));
      const a = document.createElement('a');
      a.href = path;
      // readable link text from the fragment name: card-disc-decompression → Disc decompression
      const name = path.split('/').pop().replace(/^card-/, '').replace(/-/g, ' ');
      a.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      contentP.append(a);
    });

    cells.push([labelP, contentP]);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const sourceHeading = element.querySelector('h2');
  const heading = document.createElement('h2');
  const strong = document.createElement('strong');
  strong.textContent = sourceHeading ? sourceHeading.textContent.trim() : 'Resources';
  heading.append(strong);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Tabs', cells });
  element.replaceWith(heading, block);
}
