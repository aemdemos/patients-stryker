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
  ['sms-terms-and-conditions', ['width-50']],
  ['legal/icrc', ['headline-3-5vw']],
  ['governance/bylaws', [null, null, 'heading-space-l']],
  ['governance/charters', [...Array(11).fill(null), 'heading-space-l', ...Array(9).fill(null), 'heading-space-l']],
];

// Pages whose copy sits in 8/12 of the row (stryker.com `col-md-8`) from 900px, except the
// sections that hold the page title; bylaws and charters use 9/12.
const COPY_WIDTH = [
  ['governance/corporate-governance-guidelines', 'width-67'],
  ['governance/equity-based-compensation-awards', 'width-67'],
  ['legal/terms-of-use', 'width-67'],
  ['legal/surgeon-disclaimer', 'width-67'],
  ['legal/website-accessibility', 'width-67'],
  ['legal/privacy/privacy-notice-for-california-residents', 'width-67'],
  ['responsible-supply-chains/po-terms', 'width-67'],
  ['governance/bylaws', 'width-75'],
  ['governance/charters', 'width-75'],
];

// Section styles the shared builder adds that the source does not show: the intro of the
// accessibility and Sage pages is 14px (not 1.25em), the po-terms part number 14px
// (not small print)
const DROP_STYLES = [
  ['legal/website-accessibility', ['p-1-25']],
  ['sage/disclosure-and-safety-information', ['p-1-25']],
  ['responsible-supply-chains/po-terms', ['disclaimer']],
  ['legal/icrc', ['serif', 'p-1-5']],
];

// Bracket tags (`[[tag]text]`, the span-tags.js runtime #542 removes) the builder emits become
// semantic content or a section style: gold → Bold + Italic, `body-font` → `bold-body`, the
// Large Headline sizes → their `headline-*vw` section style, the other size tags are dropped.
const TAG_SECTION_STYLES = {
  'body-font': 'bold-body',
  'headline-2': 'headline-2vw',
  'headline-2-5': 'headline-2-5vw',
  serif: 'serif',
};
const BRACKET = /\[\[([a-z0-9,-]+)\]|\]/g;

function sectionIndex(main, node) {
  let top = node;
  while (top.parentElement && top.parentElement !== main) top = top.parentElement;
  let count = 0;
  for (let n = top.previousElementSibling; n; n = n.previousElementSibling) {
    if (n.tagName === 'HR') count += 1;
  }
  return count;
}

// splits the text nodes of one element into text, open and close tokens next to its elements
function bracketTokens(parent) {
  const tokens = [];
  [...parent.childNodes].forEach((node) => {
    if (node.nodeType !== 3) {
      tokens.push({ node });
      return;
    }
    const value = node.nodeValue;
    let last = 0;
    [...value.matchAll(BRACKET)].forEach((m) => {
      if (m.index > last) tokens.push({ text: value.slice(last, m.index) });
      tokens.push(m[1] ? { open: m[1].split(',') } : { close: true });
      last = m.index + m[0].length;
    });
    if (last < value.length) tokens.push({ text: value.slice(last) });
  });
  return tokens;
}

// Rebuilds the children of `parent` from its tokens: a matched pair is unwrapped, gold text
// is wrapped in <em><strong>; an unmatched `]` stays text. Returns the tags removed.
function stripBracketTokens(parent, document) {
  const tokens = bracketTokens(parent);
  const removed = [];
  const build = (from, closes) => {
    const nodes = [];
    let i = from;
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.open) {
        const inner = build(i + 1, true);
        removed.push(...t.open);
        i = inner.next;
        let content = inner.nodes;
        if (t.open.includes('color-gold')) {
          const tail = [];
          const isBlank = (n) => n.nodeName === 'BR'
            || (n.nodeType === 3 && !n.nodeValue.trim());
          while (content.length && isBlank(content[content.length - 1])) {
            tail.unshift(content.pop());
          }
          if (content.some((n) => n.nodeType === 3 && n.nodeValue.trim())) {
            const strong = document.createElement('strong');
            strong.append(...content);
            content = [strong];
          }
          const em = document.createElement('em');
          em.append(...content);
          content = [em, ...tail];
        }
        nodes.push(...content);
      } else if (t.close) {
        if (closes) return { nodes, next: i + 1 };
        nodes.push(document.createTextNode(']'));
        i += 1;
      } else {
        nodes.push(t.node || document.createTextNode(t.text));
        i += 1;
      }
    }
    return { nodes, next: i };
  };
  const { nodes } = build(0, false);
  parent.replaceChildren(...nodes);
  return removed;
}

// Every bracket tag of the page → semantic markup; returns { sectionIndex → styles }.
function stripBrackets(main, document) {
  const styles = new Map();
  const parents = [...main.querySelectorAll('*')].filter((el) => [...el.childNodes]
    .some((n) => n.nodeType === 3 && /\[\[[a-z0-9,-]+\]/.test(n.nodeValue)));
  parents.forEach((parent) => {
    if (!parent.isConnected) return;
    const index = sectionIndex(main, parent);
    stripBracketTokens(parent, document).forEach((tag) => {
      const style = TAG_SECTION_STYLES[tag];
      if (!style) return;
      if (!styles.has(index)) styles.set(index, new Set());
      styles.get(index).add(style);
    });
  });
  return styles;
}

// Adds the page's section styles (WIDTH_STYLES and the ones bracket tags became) to the
// Section Metadata of each section, creating it when the section has none.
function sectionStyles(main, document, url, extra) {
  const widths = WIDTH_STYLES.find(([key]) => url.includes(key))?.[1] || [];
  const hrs = [...main.children].filter((n) => n.tagName === 'HR');
  const ends = [...hrs, null];
  const drop = DROP_STYLES.find(([key]) => url.includes(key))?.[1] || [];
  const copyWidth = COPY_WIDTH.find(([key]) => url.includes(key))?.[1];
  const count = Math.max(widths.length, hrs.length + 1, ...[...extra.keys()].map((i) => i + 1));
  for (let i = 0; i < count; i += 1) {
    const add = [...(extra.get(i) || [])].filter((v) => !drop.includes(v));
    if (widths[i]) add.push(widths[i]);
    if (copyWidth && !widths[i] && !add.some((a) => a.startsWith('headline'))) {
      let titled = false;
      let n = i ? hrs[i - 1]?.nextElementSibling : main.firstElementChild;
      for (; n && n !== ends[i]; n = n.nextElementSibling) {
        if (n.matches('h1, h2') || n.querySelector('h1, h2')) titled = true;
      }
      if (!titled) add.push(copyWidth);
    }
    if (add.length || drop.length) {
      const end = ends[i];
      let table = null;
      let n = i ? hrs[i - 1].nextElementSibling : main.firstElementChild;
      for (; n && n !== end; n = n.nextElementSibling) {
        if (n.tagName === 'TABLE' && text(n.querySelector('th, tr')) === 'Section Metadata') table = n;
      }
      if (table) {
        const value = table.querySelector('tr:nth-child(2) td:nth-child(2)');
        const have = text(value).split(',').map((v) => v.trim()).filter((v) => !drop.includes(v));
        const added = add.filter((v) => !have.includes(v) && !drop.includes(v));
        value.textContent = [...have, ...added].join(', ');
        if (!value.textContent) table.remove();
      } else if (add.length) {
        const block = WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: add.join(', ') } });
        if (end) end.before(block);
        else main.append(block);
      }
    }
  }
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

// board-committees: each committee (bold name, member lines) was a pair of sections; the
// source shows the three side by side, so they become the cells of one Columns row.
// icrc: the page's full-width hero image (desktop and phone crops, as two images) becomes a
// Hero Corp block, which shows the crop that fits the viewport.
function heroImage(main, document, url) {
  if (!url.includes('legal/icrc')) return;
  const imgs = [...main.querySelectorAll('p > a[href*="media-assets.stryker.com"]')]
    .filter((a) => text(a) === a.getAttribute('href'));
  if (!imgs.length) return;
  const [first] = imgs;
  const holder = first.parentElement;
  imgs.slice(1).forEach((a) => a.parentElement.remove());
  const cells = imgs.slice(0, 2).map((a) => [a]);
  holder.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Hero Corp (image-slide)', cells }));
  main.querySelectorAll('table').forEach((table) => {
    if (text(table.querySelector('th, tr')) === 'Section Metadata'
      && text(table).includes('full-width-image')) table.remove();
  });
}

function committeeColumns(main, document, url) {
  if (!url.includes('governance/board-committees')) return;
  const hrs = [...main.children].filter((n) => n.tagName === 'HR');
  if (hrs.length < 7) return;
  const sections = hrs.slice(0, 6).map((hr, i) => {
    const nodes = [];
    let el = hr.nextElementSibling;
    for (; el && el !== hrs[i + 1]; el = el.nextElementSibling) nodes.push(el);
    return nodes.find((x) => x.tagName === 'P');
  });
  const cells = [0, 1, 2].map((k) => [sections[2 * k], sections[2 * k + 1]]);
  for (let n = hrs[0].nextElementSibling; n && n !== hrs[6];) {
    const next = n.nextElementSibling;
    n.remove();
    n = next;
  }
  hrs[0].after(WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [cells] }));
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
    const bracketStyles = stripBrackets(main, document);
    committeeColumns(main, document, url);
    heroImage(main, document, url);
    underlineTitles(main, document);
    dropUnlistedStyles(main);
    trimEmptyCells(main);
    sectionStyles(main, document, url, bracketStyles);
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
