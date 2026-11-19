/* global WebImporter */
// www.stryker.com `base` pages: the shared Back link XFs, imported into fragment documents that
// the pages include with a Fragment block (import-base.js).
// People: the "◁ Back" link of the leader and director bios, read from the XF master URL.
// Interventional Spine footnotes: the "❮ BACK" link of the detail pages (the XF has no public
// URL, so it is read from a detail page that shows it), a bold + underlined link in a
// `no-arrow, back-link` section (no trailing chevron; source spacing below the header).

import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import xfFragmentPath from './xf-fragment-path.js';
import { BACK_XF } from './base/footnotes.js';

const FRAGMENTS = [
  '/content/experience-fragments/stryker/corporate/en/about/our_management/back-button/master',
  '/content/experience-fragments/stryker/corporate/en/about/our_board_of_directo/back-button/master',
];

const PAGE_TEMPLATE = {
  name: 'base-fragments',
  description: 'Back link Experience Fragments of the base template pages (People bios, Interventional Spine footnotes), imported as fragment documents.',
  urls: [
    ...FRAGMENTS.map((p) => `https://www.stryker.com${p}.html`),
    'https://www.stryker.com/us/en/interventional-spine/footnotes/1000-001-358.html',
  ],
  blocks: [],
};

const text = (el) => (el ? el.textContent.replace(/[\s\u00a0]+/g, ' ').trim() : '');

function peopleBack(document, main) {
  document.body.querySelectorAll('.c-rich-text-editor a[href]').forEach((src) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = src.getAttribute('href');
    a.textContent = text(src);
    strong.append(a);
    p.append(strong);
    main.append(p);
  });
}

function footnotesBack(document, main) {
  document.body.querySelectorAll('.experiencefragment .c-rich-text-editor a[href]').forEach((src) => {
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
  if (main.children.length) {
    main.append(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata', cells: { style: 'no-arrow, back-link' },
    }));
  }
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = params.originalURL || url;
    const key = new URL(source).pathname.replace(/\.html$/, '');
    const footnotes = key.startsWith('/us/en/interventional-spine/footnotes');
    const xf = footnotes ? BACK_XF : key;
    if (!footnotes && !FRAGMENTS.includes(key)) throw new Error(`Not a mapped base fragment: ${key}`);
    const path = xfFragmentPath(xf);

    const main = document.createElement('div');
    (footnotes ? footnotesBack : peopleBack)(document, main);
    if (!main.children.length) throw new Error(`No Back link XF on ${source}`);
    document.body.replaceChildren(main);

    cleanupTransformer('afterTransform', main, { ...payload, template: PAGE_TEMPLATE });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path,
      report: { title: path, template: PAGE_TEMPLATE.name, source: xf },
    }];
  },
};
