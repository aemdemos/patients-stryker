/* global WebImporter */
// www.stryker.com Interventional Spine footnotes (#516): the shared "❮ BACK" link XF of the
// footnote detail pages, imported into the fragment document that the detail pages include
// with a Fragment block (import-ivs-footnotes.js). The XF has no public URL, so it is read
// from a detail page that shows it.

import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import xfFragmentPath from './xf-fragment-path.js';
import { BACK_XF } from './import-ivs-footnotes.js';

const PAGE_TEMPLATE = {
  name: 'ivs-footnotes-fragments',
  description: 'Back link Experience Fragment of the Interventional Spine footnote pages, imported as a fragment document from a detail page: a bold + underlined link in a `no-arrow, back-link` section.',
  urls: ['https://www.stryker.com/us/en/interventional-spine/footnotes/1000-001-358.html'],
  blocks: [],
};

const text = (el) => (el ? el.textContent.replace(/[\s\u00a0]+/g, ' ').trim() : '');

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const path = xfFragmentPath(BACK_XF);
    const main = document.createElement('div');
    document.body.querySelectorAll('.experiencefragment .c-rich-text-editor a[href]').forEach((src) => {
      // the teal Futura bold "❮ BACK" text link: a bold + underlined link (a flat Futura
      // bold teal link, a.link-strong) in a `no-arrow, back-link` section (no trailing
      // chevron; source spacing below the header)
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      const u = document.createElement('u');
      a.href = src.getAttribute('href');
      u.textContent = text(src);
      a.append(u);
      strong.append(a);
      p.append(strong);
      main.append(p);
    });
    if (!main.children.length) throw new Error(`No Back link XF on ${params.originalURL || url}`);
    main.append(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata', cells: { style: 'no-arrow, back-link' },
    }));
    document.body.replaceChildren(main);

    cleanupTransformer('afterTransform', main, { ...payload, template: PAGE_TEMPLATE });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path,
      report: { title: path, template: PAGE_TEMPLATE.name, source: BACK_XF },
    }];
  },
};
