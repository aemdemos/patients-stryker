/* global WebImporter */
// www.stryker.com People pages (#515): the shared "◁ Back" link XFs of the leader and
// director bios, imported from their XF master URL into fragment documents that the bio
// pages include with a Fragment block (import-people.js).

import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import xfFragmentPath from './xf-fragment-path.js';

const FRAGMENTS = [
  '/content/experience-fragments/stryker/corporate/en/about/our_management/back-button/master',
  '/content/experience-fragments/stryker/corporate/en/about/our_board_of_directo/back-button/master',
];

const PAGE_TEMPLATE = {
  name: 'people-fragments',
  description: 'Back link Experience Fragments of the People bio pages, imported as fragment documents.',
  urls: FRAGMENTS.map((p) => `https://www.stryker.com${p}.html`),
  blocks: [],
};

const text = (el) => (el ? el.textContent.replace(/[\s\u00a0]+/g, ' ').trim() : '');

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const key = new URL(params.originalURL || url).pathname.replace(/\.html$/, '');
    const path = FRAGMENTS.includes(key) ? xfFragmentPath(key) : null;
    if (!path) throw new Error(`Not a mapped People fragment: ${key}`);

    const main = document.createElement('div');
    document.body.querySelectorAll('.c-rich-text-editor a[href]').forEach((src) => {
      // the teal Futura bold "◁ Back" link: a bold link
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.href = src.getAttribute('href');
      a.textContent = text(src);
      strong.append(a);
      p.append(strong);
      main.append(p);
    });
    document.body.replaceChildren(main);

    cleanupTransformer('afterTransform', main, { ...payload, template: PAGE_TEMPLATE });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path,
      report: { title: path, template: PAGE_TEMPLATE.name, source: key },
    }];
  },
};
