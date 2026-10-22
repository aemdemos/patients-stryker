/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
// The ENT search page: search results are implemented later in the project, so
// only the authorable text is kept — default content plus the Search block, which
// renders the search field (same form as the header search).
const PAGE_TEMPLATE = {
  name: 'search',
  description: 'ENT site search page — SINGLETON. Default content plus one block: h1 \'Search Results\', h2 \'Showing results for:\', a Search block (placeholder text only — the block builds the form), the no-results message and suggestions list. Hidden inputs and the Load more button are dropped. Styled via the `search` theme.',
  urls: [
    'https://patients.stryker.com/us/en/ent/search.html',
    'https://www.stryker.com/us/en/search.html',
  ],
  blocks: [
    { name: 'search', instances: ['.search-header .search-bar'] },
  ],
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Rebuilds the search widget as authorable content: h1, h2, a Search block (the
 * field's placeholder), the no-results message split into paragraphs, and the
 * suggestions list without the literal bullet characters. Hidden inputs and the
 * Load more button are dropped.
 * @param {Document} document
 * @param {Element} main
 */
function buildSearchContent(document, main) {
  const header = main.querySelector('.search-page .search-header, .search-header');
  if (!header) return;

  const out = document.createElement('div');

  const h1 = header.querySelector('h1');
  if (h1) {
    const heading = document.createElement('h1');
    heading.textContent = h1.textContent.trim();
    out.append(heading);
  }

  const h2 = header.querySelector('h2');
  if (h2) {
    // drop any query echoed into the heading — the static page has no query
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim().replace(/:.*$/, ':');
    out.append(heading);
  }

  // the search field becomes a `Search` block (one cell: the placeholder text);
  // the block builds the form itself, so only the authorable text is kept
  const input = header.querySelector('.search-bar input[name="q"]');
  if (input) {
    out.append(WebImporter.Blocks.createBlock(document, {
      name: 'Search',
      cells: [[input.getAttribute('placeholder') || 'Search this site']],
    }));
  }

  // the no-results message is a bare <div> holding text nodes separated by <br>,
  // followed by the suggestions <ul>
  const message = [...header.querySelectorAll(':scope > div')]
    .find((div) => !div.classList.contains('search-bar') && div.querySelector('ul'));
  if (message) {
    let text = '';
    const flush = () => {
      const value = text.replace(/\s+/g, ' ').trim();
      if (value) {
        const p = document.createElement('p');
        p.textContent = value;
        out.append(p);
      }
      text = '';
    };
    [...message.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        text += node.textContent;
      } else if (node.nodeName === 'BR') {
        flush();
      } else if (node.nodeName === 'UL') {
        flush();
        const ul = document.createElement('ul');
        node.querySelectorAll('li').forEach((li) => {
          const value = li.textContent.replace(/^[\s•·]+/, '').trim();
          if (!value) return;
          const item = document.createElement('li');
          item.textContent = value;
          ul.append(item);
        });
        if (ul.children.length) out.append(ul);
      } else {
        text += node.textContent;
      }
    });
    flush();
  }

  const container = header.closest('.search-page') || header;
  container.replaceWith(...out.childNodes);
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;
    // www.stryker.com (corp) renders "Last Updated <Month>/<Year>" client-side; keep it as
    // `published` (whether the line shows is up to the corp bulk metadata sheet)
    const isCorp = new URL(params.originalURL).hostname === 'www.stryker.com';
    const updated = isCorp
      && document.body.textContent.match(/Last Updated\s+([A-Za-z]+)\/(\d{4})/);

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Rebuild the search widget as default content + the Search block.
    buildSearchContent(document, main);

    // 3. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // The shared cleanup demotes every <h1> to <h2> (legal-page convention); the
    // search page keeps "Search Results" as its <h1> to match the source.
    const title = main.querySelector('h2');
    if (title && !main.querySelector('h1')) {
      const h1 = document.createElement('h1');
      [...title.attributes].forEach((attr) => h1.setAttribute(attr.name, attr.value));
      while (title.firstChild) h1.appendChild(title.firstChild);
      title.replaceWith(h1);
    }

    // Empty `spacer` section (30px) above the h1 — the source leaves 30px (mobile)
    // to 40px (desktop) between the header and the title; without it the h1 sits
    // flush under the nav.
    const spacerMeta = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: 'spacer' },
    });
    main.prepend(document.createElement('hr'));
    main.prepend(spacerMeta);

    // Same empty `spacer` section (30px) below the content, so the suggestions
    // list doesn't sit flush on the footer.
    main.append(document.createElement('hr'));
    main.append(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: 'spacer' },
    }));

    // 4. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // `theme = search` adds a `search` class to <body> so any page-specific
    // styling in styles/themes.css is scoped to body.search.
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.theme = 'search';
    if (updated) {
      const month = new Date(`${updated[1]} 1, 2000`).getMonth() + 1;
      meta.published = `${updated[2]}-${String(month).padStart(2, '0')}`;
    }
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: ['search'],
      },
    }];
  },
};
