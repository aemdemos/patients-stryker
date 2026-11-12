/* global WebImporter */
// www.stryker.com legal, governance and policy pages, built by the long-page-detail-corp builder.
import longPageDetailSectionsTransformer, {
  keepHeadlineBlankLines, edsLinkPaths,
} from './transformers/long-page-detail-corp-sections.js';
import { cleanRichText } from './transformers/long-page-detail-corp-article.js';
import { contactUs } from './transformers/contact-division-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

const PAGE_TEMPLATE = {
  name: 'corp-legal',
  description: 'www.stryker.com legal, governance and policy pages (#517): built as the long-page-detail-corp pages (H1 or underlined H2 title, rich text, section titles as underlined H2 with their ids, Accordion, conventions buttons, Columns, small print as a `disclaimer` section); source tables as `Table (no-header, striped)` blocks; `published` with `last-updated: show` (false where the source hides the line).',
  urls: [
    'https://www.stryker.com/us/en/legal/terms-of-use.html',
    'https://www.stryker.com/us/en/about/governance/bylaws.html',
    'https://www.stryker.com/us/en/about/governance/lifecycle-support.html',
  ],
  blocks: [],
};

const transformers = [
  longPageDetailSectionsTransformer,
  cleanupTransformer,
  dmImagesTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

const text = (el) => (el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();

// Runs of .buildingblock siblings (lifecycle support): phase heads → Columns (color-heads),
// intro + product table per phase → Columns (striped).
function buildingBlocks(main, document) {
  const groups = [];
  main.querySelectorAll('.buildingblock').forEach((bb) => {
    const prev = bb.previousElementSibling;
    const last = groups[groups.length - 1];
    if (prev && last && last[last.length - 1] === prev) last.push(bb);
    else groups.push([bb]);
  });
  let count = 0;
  groups.filter((g) => g.length > 1).forEach((group) => {
    const heads = group.every((bb) => bb.querySelector('.c-largeheadline'));
    const cells = group.map((bb) => {
      const nodes = [];
      if (heads) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = text(bb.querySelector('.c-largeheadline'));
        p.append(strong);
        nodes.push(p);
      }
      bb.querySelectorAll('.c-rich-text-editor p').forEach((src) => {
        if (!text(src)) return;
        const p = document.createElement('p');
        p.append(...[...src.childNodes].map((n) => n.cloneNode(true)));
        cleanRichText(p);
        nodes.push(p);
      });
      const items = [...bb.querySelectorAll('.c-table td')].filter((td) => text(td));
      if (items.length) {
        const ul = document.createElement('ul');
        items.forEach((td) => {
          const li = document.createElement('li');
          li.append(...[...td.childNodes].map((n) => n.cloneNode(true)));
          cleanRichText(li);
          const trailing = (n) => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()));
          while (trailing(li.lastChild)) li.lastChild.remove();
          ul.append(li);
        });
        nodes.push(ul);
      }
      return nodes;
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: heads ? 'Columns (color-heads)' : 'Columns (striped)',
      cells: [cells],
    });
    block.setAttribute('data-keep', 'flow');
    group[0].before(block);
    group.forEach((bb) => bb.remove());
    count += 1;
  });
  return count;
}

// .c-table → Table (no-header, striped); columns empty in every row are dropped.
function tables(main, document) {
  let count = 0;
  main.querySelectorAll('.c-table').forEach((component) => {
    const source = component.querySelector('table');
    if (!source) return;
    const rows = [...source.querySelectorAll('tr')].map((tr) => [...tr.children]);
    const width = Math.max(0, ...rows.map((r) => r.length));
    const used = [...Array(width).keys()].filter((i) => rows.some((r) => r[i] && text(r[i])));
    const cells = rows.filter((r) => r.some((td) => text(td))).map((r) => used.map((i) => {
      const box = document.createElement('div');
      if (r[i]) box.append(...[...r[i].childNodes].map((n) => n.cloneNode(true)));
      cleanRichText(box);
      const trailing = (n) => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !n.textContent.trim()));
      while (trailing(box.lastChild)) box.lastChild.remove();
      return [...box.childNodes];
    }));
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'Table (no-header, striped)',
      cells,
    });
    block.setAttribute('data-keep', 'flow');
    (component.closest('.table.parbase') || component).replaceWith(block);
    count += 1;
  });
  return count;
}

// .c-contactus → underlined H2 + Columns (columns-50-50), in a section of its own.
function contacts(main, document, report) {
  main.querySelectorAll('.c-contactus').forEach((component) => {
    const nodes = contactUs(component, document, report);
    const holder = document.createElement('div');
    holder.setAttribute('data-keep', 'nodes');
    holder.append(...nodes);
    (component.closest('.contactus') || component).replaceWith(holder);
  });
}

// section styles that are not in the corp Library (the headline box and its colours, the rule)
const DROPPED_STYLES = ['headline-box', 'blue', 'purple', 'separator'];

// the rule under a title-only section is the underlined Heading 1 (authoring convention)
// instead of a `separator` section; the MRI rule above the Accordion is drawn
// by the corp-legal template
function underlineTitles(main, document) {
  main.querySelectorAll('table').forEach((table) => {
    if (text(table.querySelector('th, tr')) !== 'Section Metadata') return;
    const styles = text(table.querySelector('tr:nth-child(2) td:nth-child(2)')).split(',').map((v) => v.trim());
    if (!styles.includes('separator')) return;
    let hr = table.previousElementSibling;
    while (hr && hr.tagName !== 'HR') hr = hr.previousElementSibling;
    let title = hr?.previousElementSibling;
    while (title?.tagName === 'TABLE') title = title.previousElementSibling;
    if (title?.tagName !== 'H1') return;
    const u = document.createElement('u');
    u.append(...title.childNodes);
    title.append(u);
  });
}

function dropUnlistedStyles(main) {
  main.querySelectorAll('table').forEach((table) => {
    if (text(table.querySelector('th, tr')) !== 'Section Metadata') return;
    [...table.querySelectorAll('tr')].slice(1).forEach((tr) => {
      const [key, value] = tr.children;
      if (!key || !value || text(key).toLowerCase() !== 'style') return;
      const styles = text(value).split(',').map((v) => v.trim())
        .filter((v) => v && !DROPPED_STYLES.includes(v));
      if (styles.length) value.textContent = styles.join(', ');
      else tr.remove();
    });
    if (table.querySelectorAll('tr').length < 2) table.remove();
  });
}

// empty trailing cells of a Columns row (mri: 2 buttons in a 4-column source row) are not authored
function trimEmptyCells(main) {
  main.querySelectorAll('table').forEach((table) => {
    if (!/^Columns/.test(text(table.querySelector('th, tr')))) return;
    table.querySelectorAll('tr').forEach((tr, i) => {
      if (!i) return;
      const cells = [...tr.children];
      while (cells.length > 1) {
        const last = cells[cells.length - 1];
        if (text(last) || last.querySelector('img, picture, video, iframe')) break;
        last.remove();
        cells.pop();
      }
    });
  });
}

// Section styles by page, one entry per section (null: none). California transparency: the source
// title and body sit in 6/12 and 8/12 columns; mri: the title and its line sit in 6/12; bylaws:
// two empty paragraphs above each Article heading; charters: above the 2nd and 3rd committee
// heading
const WIDTH_STYLES = [
  ['california-transparency', ['width-50', 'width-67']],
  ['hemorrhagic-stroke/mri', ['width-50']],
  ['governance/bylaws', [null, null, 'heading-space-l']],
  ['governance/charters', [...Array(11).fill(null), 'heading-space-l', ...Array(9).fill(null), 'heading-space-l']],
];

function widthStyles(main, document, url) {
  const styles = WIDTH_STYLES.find(([key]) => url.includes(key))?.[1];
  if (!styles) return;
  const hrs = [...main.children].filter((n) => n.tagName === 'HR');
  const ends = [...hrs, null];
  styles.forEach((style, i) => {
    if (!style) return;
    const end = ends[i];
    let table = null;
    let n = i ? hrs[i - 1].nextElementSibling : main.firstElementChild;
    for (; n && n !== end; n = n.nextElementSibling) {
      if (n.tagName === 'TABLE' && text(n.querySelector('th, tr')) === 'Section Metadata') table = n;
    }
    if (table) {
      const value = table.querySelector('tr:nth-child(2) td:nth-child(2)');
      value.textContent = `${text(value)}, ${style}`;
    } else {
      const block = WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } });
      if (end) end.before(block);
      else main.append(block);
    }
  });
}

// Runs of paragraphs indented with margin-left (bylaws clauses (a), (i)) → nested lists,
// one level per indent step; the clause marker stays in the item text.
function indentedLists(main, document) {
  const indent = (p) => parseInt((p.getAttribute('style') || '').match(/margin-left:\s*(\d+)px/)?.[1] || '0', 10);
  main.querySelectorAll('p').forEach((first) => {
    const prev = first.previousElementSibling;
    if (!first.isConnected || !indent(first) || (prev?.matches('p') && indent(prev))) return;
    const run = [];
    for (let n = first; n && n.matches('p') && indent(n); n = n.nextElementSibling) run.push(n);
    const steps = [...new Set(run.map(indent))].sort((a, b) => a - b);
    const root = document.createElement('ul');
    const stack = [{ ul: root, li: null }];
    run.forEach((p) => {
      const level = steps.indexOf(indent(p));
      stack.length = Math.min(stack.length, level + 1);
      while (stack.length <= level) {
        const parent = stack[stack.length - 1];
        const ul = document.createElement('ul');
        if (!parent.li) {
          parent.li = document.createElement('li');
          parent.ul.append(parent.li);
        }
        parent.li.append(ul);
        stack.push({ ul, li: null });
      }
      const li = document.createElement('li');
      li.append(...p.childNodes);
      stack[level].ul.append(li);
      stack[level].li = li;
    });
    first.before(root);
    run.forEach((p) => p.remove());
  });
}

// #hiddenPublishedDate (MM/DD/YYYY) → `published` (YYYY-MM-DD).
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : '';
}

export default {
  // before the importer's own cleanup, which drops empty paragraphs
  preprocess: ({ document }) => {
    keepHeadlineBlankLines(document);
    if (document.querySelector('#publishedDate.hidden')) document.body.setAttribute('data-date-hidden', '');
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const hcp = !!document.querySelector('.g-hcpbanner');
    const published = publishedDate(document);

    if (url.includes('/hemorrhagic-stroke/mri')) {
      main.querySelectorAll('.panel-group').forEach((group) => group.setAttribute('data-divided', ''));
    }
    indentedLists(main, document);
    const columnCount = buildingBlocks(main, document);
    const tableCount = tables(main, document);
    const contactReport = { phones: [] };
    contacts(main, document, contactReport);
    executeTransformers('beforeTransform', main, payload);
    executeTransformers('afterTransform', main, payload);
    underlineTitles(main, document);
    dropUnlistedStyles(main);
    trimEmptyCells(main);
    widthStyles(main, document, url);
    edsLinkPaths(main);

    // site + template are repeated on the page so it renders the same without bulk metadata
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    if (hcp) meta['hcp-banner'] = 'true';
    if (published) {
      meta.published = published;
      // the source hides the "Last Updated" line on some pages (#publishedDate.hidden)
      meta['last-updated'] = main.hasAttribute('data-date-hidden') ? 'false' : 'show';
    }
    main.removeAttribute('data-xf-unresolved');
    main.removeAttribute('data-date-hidden');
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [...Array(tableCount).fill('table'), ...Array(columnCount).fill('columns')],
        phones: contactReport.phones,
      },
    }];
  },
};
