/* eslint-disable */
/* global WebImporter */
// Persisted content edits (excat-persist-content-edit). Page corrections run on the page body for
// their URL; fragment corrections run on a fragment the import splits out, whichever page writes it.
// Keep `export default` the only export: the transformer save hook loads this file as a classic script.

// ---- helpers for the text-only news pages (import-text-only.js) -------------------------
// The DOM here is the importer's: section breaks are <hr>, Section Metadata is a <table>.
// Every helper finds its target by text and does nothing when it is missing or already done.

const txt = (el) => (el ? el.textContent : '').replace(/[\s ]+/g, ' ').trim();

/** The next / previous sibling node, skipping whitespace-only text. */
const isBlank = (n) => n && n.nodeType === 3 && !n.textContent.trim();
function nextOf(n) {
  let x = n && n.nextSibling;
  while (isBlank(x)) x = x.nextSibling;
  return x;
}
function prevOf(n) {
  let x = n && n.previousSibling;
  while (isBlank(x)) x = x.previousSibling;
  return x;
}

/** The first `sel` element whose text starts with `start`. */
const find = (main, sel, start) => [...main.querySelectorAll(sel)].find((el) => txt(el).startsWith(start));

/** The top-level child of `main` holding `el`. */
function topOf(main, el) {
  let node = el;
  while (node && node.parentElement !== main) node = node.parentElement;
  return node;
}

/** The top-level elements of the section holding `el` (between <hr> markers). */
function sectionOf(main, el) {
  const kids = [...main.children];
  const i = kids.indexOf(topOf(main, el));
  if (i < 0) return [];
  let s = i;
  while (s > 0 && kids[s - 1].tagName !== 'HR') s -= 1;
  let e = i;
  while (e < kids.length - 1 && kids[e + 1].tagName !== 'HR') e += 1;
  return kids.slice(s, e + 1);
}

const isSectionMetadata = (el) => el && el.tagName === 'TABLE'
  && txt(el.querySelector('th, td')).toLowerCase() === 'section metadata';

/** Sets (or, with `value` null, removes) the style of the section holding `el`. */
function style(main, doc, el, value) {
  if (!el) return;
  const section = sectionOf(main, el);
  const table = section.find(isSectionMetadata);
  if (!value) {
    if (table) table.remove();
    return;
  }
  if (table) {
    const row = [...table.querySelectorAll('tr')].find((tr) => txt(tr.cells[0]).toLowerCase() === 'style');
    if (row) { row.cells[1].textContent = value; return; }
    table.remove();
  }
  section[section.length - 1].after(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: value } }));
}

/** Starts a new section at `el`, with style `value` (or none); the part before keeps its style. */
function breakBefore(main, doc, el, value) {
  if (!el) return;
  const top = topOf(main, el);
  if (top.previousElementSibling?.tagName === 'HR') { style(main, doc, el, value); return; }
  const table = sectionOf(main, el).find(isSectionMetadata);
  const hr = doc.createElement('hr');
  top.before(hr);
  if (table) hr.before(table);
  if (value) style(main, doc, el, value);
}

/** Ends the section after `el`; the section style stays below, or with `el` (`keepStyle`). */
function breakAfter(main, doc, el, { keepStyle = false } = {}) {
  if (!el) return;
  const top = topOf(main, el);
  if (top.nextElementSibling?.tagName === 'HR') return;
  const table = sectionOf(main, el).find(isSectionMetadata);
  const hr = doc.createElement('hr');
  top.after(hr);
  if (keepStyle && table) hr.before(table);
}

/** Joins the section holding `el` to the one before it (its own style goes). */
function mergeWithPrevious(main, el) {
  if (!el) return;
  const section = sectionOf(main, el);
  const hr = section[0].previousElementSibling;
  if (!hr || hr.tagName !== 'HR') return;
  section.filter(isSectionMetadata).forEach((t) => t.remove());
  const before = hr.previousElementSibling;
  hr.remove();
  const rest = sectionOf(main, section.find((n) => n.isConnected) || before);
  if (isSectionMetadata(before)) rest[rest.length - 1].after(before);
}

/** Replaces `el` with a `tag` element holding its content. */
function retag(main, doc, el, tag) {
  if (!el || el.tagName.toLowerCase() === tag) return el;
  const out = doc.createElement(tag);
  out.append(...el.childNodes);
  el.replaceWith(out);
  return out;
}

/** The subtitle under the title: an italic Heading 3 in a section of its own. */
function subtitle(main, doc, el, { em = false, split = true } = {}) {
  const h3 = retag(main, doc, el, 'h3');
  if (!h3) return;
  if (em && !h3.querySelector('em')) {
    const i = doc.createElement('em');
    i.append(...h3.childNodes);
    h3.append(i);
  }
  if (split) breakAfter(main, doc, h3);
}

/** `<p><strong>Label</strong></p><p>text</p>` → `<p><strong>Label</strong><br>text</p>`. */
function joinLabel(main, doc, label) {
  [...main.querySelectorAll('p')].filter((p) => txt(p) === label && txt(p.querySelector('strong')) === label).forEach((p) => {
    const next = p.nextElementSibling;
    if (!next || next.tagName !== 'P') return;
    p.append(doc.createElement('br'), ...next.childNodes);
    next.remove();
  });
}

/** Joins paragraph `p` onto the paragraph before it, after `breaks` line breaks. */
function joinParagraph(doc, p, breaks = 2) {
  const prev = p && p.previousElementSibling;
  if (!prev || prev.tagName !== 'P') return;
  for (let i = 0; i < breaks; i += 1) prev.append(doc.createElement('br'));
  prev.append(...p.childNodes);
  p.remove();
}

/** Makes the whole of `el` bold. */
function boldAll(main, doc, el) {
  if (!el || (el.children.length === 1 && el.firstElementChild.tagName === 'STRONG' && txt(el) === txt(el.firstElementChild))) return;
  const b = doc.createElement('strong');
  b.append(...el.childNodes);
  el.append(b);
}

/** A bold run with line breaks inside → one bold run per line, the breaks between them. */
function boldPerLine(strong, doc) {
  if (!strong || !strong.querySelector('br')) return;
  const parts = [[]];
  [...strong.childNodes].forEach((n) => (n.nodeName === 'BR' ? parts.push([]) : parts[parts.length - 1].push(n)));
  const out = [];
  parts.forEach((nodes, i) => {
    if (i) out.push(doc.createElement('br'));
    const b = doc.createElement('strong');
    b.append(...nodes);
    out.push(b);
  });
  strong.replaceWith(...out);
}

/** A line break opening a bold label moves in front of it (`<strong><br>X` → `<br><strong>X`). */
function brBeforeLabel(p) {
  const b = p && p.querySelector('strong');
  if (b && b.firstChild?.nodeName === 'BR') b.before(b.firstChild);
}

/** Opens the links to these addresses in a new tab (`#_blank`, scripts.js). */
function newTab(main, hrefs) {
  hrefs.forEach((h) => main.querySelectorAll(`a[href="${h}"]`).forEach((a) => a.setAttribute('href', `${h}#_blank`)));
}

/** The DA `tags` metadata (not on the source page): import-text-only.js writes `data-meta-*`. */
function tags(main, value) {
  main.setAttribute('data-meta-tags', value);
}

/**
 * Numbered reference paragraphs ("1. …<br><br>2. …", "3. …") from `first` on → an
 * ordered list in a `disclaimer` section, after a `spacer` section.
 */
function footnotesToList(main, doc, first) {
  if (!first) return;
  const paras = [];
  for (let p = first; p && p.tagName === 'P' && /^\d+\./.test(txt(p)); p = p.nextElementSibling) paras.push(p);
  const ol = doc.createElement('ol');
  paras.forEach((p) => {
    let item = [];
    const flush = () => {
      if (!item.length) return;
      const li = doc.createElement('li');
      li.append(...item);
      if (li.firstChild?.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s*\d+\.\s*/, '');
      ol.append(li);
      item = [];
    };
    [...p.childNodes].forEach((n) => {
      if (n.nodeName === 'BR' && nextOf(n)?.nodeName === 'BR') { flush(); return; }
      if (n.nodeName === 'BR' && prevOf(n)?.nodeName === 'BR') return;
      if (isBlank(n) && (nextOf(n)?.nodeName === 'BR' || prevOf(n)?.nodeName === 'BR') && !item.length) return;
      item.push(n);
    });
    flush();
  });
  const last = paras[paras.length - 1];
  const hr1 = doc.createElement('hr');
  const hr2 = doc.createElement('hr');
  last.after(hr1, WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: 'spacer' } }), hr2, ol);
  paras.forEach((p) => p.remove());
  ol.after(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: 'disclaimer' } }));
}

// ---- long-page-detail-corp (step 1b / 1c pages, import-long-page-detail-corp.js) ----------------
//
// long-page-detail-corp (#469, steps 1b / 1c): the corrections reproduce each page as reviewed
// in DA (2026-11-24). They run last, on the importer's DOM: blocks are tables whose first row
// holds the block name ("Columns (faculty)"), sections are separated by <hr>, and the page
// theme is the body's `data-semantic-theme` (read by the import script).

const SRC = 'https://www.stryker.com/us/en/';

/* ---- helpers (the importer DOM) ---- */

const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
const headOf = (table) => table.querySelector('tr');
const nameOf = (table) => norm(headOf(table)?.textContent).toLowerCase();

/** the block tables whose name (with its variants) matches `re` */
const blocks = (main, re) => [...main.querySelectorAll('table')].filter((t) => re.test(nameOf(t)));

/** a block table's name and variants ("Columns (a, b)") */
function variantsOf(table) {
  const m = norm(headOf(table).textContent).match(/^([^(]+?)\s*(?:\((.*)\))?$/);
  return { name: m[1], list: (m[2] || '').split(',').map((v) => v.trim()).filter(Boolean) };
}

/** sets a block table's variants (in this order) */
function setVariants(table, list) {
  const { name } = variantsOf(table);
  headOf(table).firstElementChild.textContent = list.length ? `${name} (${list.join(', ')})` : name;
}

/** adds variants to a block table (after its own) */
function addVariants(table, ...more) {
  const { list } = variantsOf(table);
  setVariants(table, [...list, ...more.filter((v) => !list.includes(v))]);
}

/** the page theme (comma-separated, as the page metadata shows it) */
function setTheme(main, theme) {
  main.setAttribute('data-semantic-theme', theme);
}

/** renames an element, keeping its content */
function rename(el, tag) {
  const doc = el.ownerDocument;
  const out = doc.createElement(tag);
  while (el.firstChild) out.append(el.firstChild);
  el.replaceWith(out);
  return out;
}

/** wraps a node in a new element */
function wrap(node, tag) {
  const el = node.ownerDocument.createElement(tag);
  node.before(el);
  el.append(node);
  return el;
}

/** the `style` value cells of the page's Section Metadata tables */
const styleCells = (main) => blocks(main, /^section metadata$/)
  .flatMap((t) => [...t.querySelectorAll('tr')])
  .filter((tr) => norm(tr.firstElementChild?.textContent).toLowerCase() === 'style' && tr.children[1])
  .map((tr) => tr.children[1]);

/** replaces a section style (the whole value) where it is exactly `from` (the nth match, or all) */
function replaceStyle(main, from, to, nth = -1) {
  styleCells(main).filter((td) => norm(td.textContent) === from)
    .forEach((td, i) => { if (nth < 0 || i === nth) td.textContent = to; });
}

/** the Section Metadata tables whose style is exactly `style` */
const metaWithStyle = (main, style) => styleCells(main)
  .filter((td) => norm(td.textContent) === style).map((td) => td.closest('table'));

/** removes a section made of its Section Metadata table only (with the break after it) */
function removeEmptySection(meta) {
  const next = meta.nextElementSibling;
  if (next?.tagName === 'HR') next.remove();
  meta.remove();
}

/** hero tables, and Columns / other blocks by their exact name (lower case, with variants) */
const heroes = (main) => blocks(main, /^hero corp\b/);
const named = (main, name) => blocks(main, new RegExp(`^${name.replace(/[()]/g, '\\$&')}$`));

/** trims the leading space of an element's first text */
function trimLead(el) {
  const first = el.firstChild;
  if (first?.nodeType === 3) first.textContent = first.textContent.trimStart();
}

/** removes an element's whitespace-only texts (directly in it) */
function dropBlankText(el) {
  [...el.childNodes].filter((n) => n.nodeType === 3 && !norm(n.textContent))
    .forEach((n) => n.remove());
}

/** a video's poster at the size the source viewer requests (stryker.com, measured per video) */
function posterSize(main, asset, wid, hei) {
  main.querySelectorAll(`a[href*="/${asset}"]`).forEach((a) => {
    a.setAttribute('href', a.getAttribute('href').replace(/wid=\d+&hei=\d+/, `wid=${wid}&hei=${hei}`));
  });
}

/** moves a paragraph's last line (after its last <br>) into a paragraph of its own */
function splitLastLine(para) {
  const brs = para.querySelectorAll(':scope > br');
  const last = brs[brs.length - 1];
  if (!last) return;
  const out = para.ownerDocument.createElement('p');
  while (last.nextSibling) out.append(last.nextSibling);
  last.remove();
  out.normalize();
  trimLead(out);
  para.after(out);
}

/** a first line (up to its <br>) of an element as `tag`, the rest as a paragraph after it */
function splitFirstLine(el, tag, keep = (n) => n) {
  const br = el.querySelector(':scope > br');
  if (!br) return;
  const doc = el.ownerDocument;
  const head = doc.createElement(tag);
  const rest = doc.createElement('p');
  const kids = [...el.childNodes];
  const at = kids.indexOf(br);
  head.append(...kids.slice(0, at).map(keep));
  rest.append(...kids.slice(at + 1));
  rest.normalize();
  trimLead(rest);
  el.replaceWith(head, rest);
}

/** an Italic element's content without the Italic */
const unItalic = (n) => {
  if (n.nodeName !== 'EM') return n;
  const frag = n.ownerDocument.createDocumentFragment();
  frag.append(...n.childNodes);
  return frag;
};

/** a Section Metadata table with one `style` row */
function styleTable(doc, style) {
  const table = doc.createElement('table');
  const head = doc.createElement('tr');
  const th = doc.createElement('th');
  th.setAttribute('colspan', '2');
  th.textContent = 'Section Metadata';
  head.append(th);
  const row = doc.createElement('tr');
  ['style', style].forEach((v) => {
    const td = doc.createElement('td');
    td.textContent = v;
    row.append(td);
  });
  table.append(head, row);
  return table;
}

/** adds a Section Metadata `style` row to the section holding `node` (at the section's end) */
function addSectionStyle(node, style) {
  let last = node;
  while (last.nextElementSibling && last.nextElementSibling.tagName !== 'HR') last = last.nextElementSibling;
  last.after(styleTable(node.ownerDocument, style));
}

/** a section of its own (a spacer) right before the section that starts with `node` */
function sectionBefore(node, style) {
  node.before(styleTable(node.ownerDocument, style), node.ownerDocument.createElement('hr'));
}

/** the Section Metadata tables of the sections right before the section starting with `node`
 * (nearest first), as long as each of those sections is its Section Metadata table alone */
function spacerSectionsBefore(node) {
  const out = [];
  let hr = node.previousElementSibling;
  while (hr?.tagName === 'HR') {
    const meta = hr.previousElementSibling;
    if (meta?.tagName !== 'TABLE' || nameOf(meta) !== 'section metadata') break;
    const before = meta.previousElementSibling;
    if (before && before.tagName !== 'HR') break;
    out.push(meta);
    hr = before;
  }
  return out;
}

/** a block table: the name row, then one row of cells (each a list of nodes) */
function blockTable(doc, name, cells) {
  const table = doc.createElement('table');
  const head = doc.createElement('tr');
  const th = doc.createElement('th');
  th.setAttribute('colspan', String(cells.length));
  th.textContent = name;
  head.append(th);
  const row = doc.createElement('tr');
  cells.forEach((nodes) => {
    const td = doc.createElement('td');
    td.append(...nodes);
    row.append(td);
  });
  table.append(head, row);
  return table;
}

/** the elements (tag) whose text is exactly `text` */
const withText = (main, tag, text) => [...main.querySelectorAll(tag)]
  .filter((el) => norm(el.textContent) === text);

/** a heading's content Bold (one <strong> around its text) */
function boldHeading(h) {
  const strong = h.ownerDocument.createElement('strong');
  strong.textContent = norm(h.textContent);
  h.replaceChildren(strong);
  return h;
}

/**
 * jr45 titles: the line after the gold first line is Bold in the heading's light serif (the
 * source's <b> in the 4vw Large Headline title, Columns `plain-bold`), any line after it stays
 * Italic. Handles the gold line's Italic running over the next lines (`<em><strong>A</strong>
 * <br>B</em>`) and a separate Italic run (`<em><strong>A</strong></em><em>B</em>`).
 */
function boldSecondTitleLine(h1) {
  const gold = [...h1.children].find((el) => el.tagName === 'EM' && el.querySelector(':scope > strong'));
  if (!gold) return;
  const lead = gold.querySelector(':scope > strong');
  // the gold Italic holds the gold line only
  let after = gold;
  const kids = [...gold.childNodes];
  kids.slice(kids.indexOf(lead) + 1).forEach((n) => {
    after.after(n);
    after = n;
  });
  // the first text after the gold line is the second line (Bold); after its line break, Italic
  let started = false;
  let done = false;
  let node = gold.nextSibling;
  while (node) {
    const next = node.nextSibling;
    if (node.nodeName === 'BR') {
      if (started) done = true;
    } else if (norm(node.textContent)) {
      if (!done) {
        started = true;
        if (node.nodeName === 'EM') rename(node, 'strong');
        else if (node.nodeName !== 'STRONG') wrap(node, 'strong');
      } else if (node.nodeType === 3) {
        wrap(node, 'em');
      }
    }
    node = next;
  }
}

/* ---- the corrections ---- */

// jr45 season 1: the title's second line Bold (Columns `plain-bold`)
const JR45_TITLE = [
  (main) => blocks(main, /^columns \(columns 67 33, large-titles, large-copy\)$/).forEach((t) => {
    const h1 = t.querySelector('h1');
    if (!h1) return;
    addVariants(t, 'plain-bold');
    boldSecondTitleLine(h1);
  }),
];

// jr45 August, September, seasons 2 and 3: the 24.5px box text (Columns `large-box-copy`)
const JR45_BOX = [
  (main) => blocks(main, /^columns \((stack, )?faculty\)$/).forEach((t) => addVariants(t, 'large-box-copy')),
];

// foot & ankle patient marketing toolkit pages (bunion, total ankle replacement)
const TOOLKIT = (title) => [
  (main) => withText(main, 'h1', title).forEach(boldHeading),
  (main) => [...main.querySelectorAll(':scope > h2')].filter((h) => norm(h.textContent).startsWith('Welcome to the'))
    .forEach((h) => rename(h, 'h4')),
  (main) => named(main, 'columns (columns-33-67, large-serif-copy)').forEach((t) => addVariants(t, 'plain-bold')),
  (main) => named(main, 'hero corp (banner, half-text)').forEach((t) => addVariants(t, 'large-serif-copy')),
  (main) => withText(main, 'p', "Follow Stryker's Foot & Ankle team on Social Media!").forEach((el) => rename(el, 'h3')),
  (main) => setTheme(main, 'large-headlines, xxlarge-copy, serif-copy'),
];

const page = (path) => `${SRC}${path}.html`;
const jr45 = (path) => `${SRC}training-and-education/orthopaedics/joint-replacement/jr45/${path}.html`;

const CORRECTIONS = {
  // text-only news pages (import-text-only.js): the edits authors made in DA after the
  // import, so a re-import gives the reviewed page; `tags` is the DA metadata row
  // stryker-announces-definitive-agreement-to-acquire-artelon--inc--
  'https://www.stryker.com/us/en/about/news/2024/stryker-announces-definitive-agreement-to-acquire-artelon--inc--.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
    },
  ],
  // stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-vertos-medical-inc-expanding-interventional-pain-management-solutions.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-care-ai
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-care-ai.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad
  'https://www.stryker.com/us/en/about/news/2024/stryker-joins-atrium-health-affiliate-ircad-north-america--to-ad.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-nico-corporation--expanding-min
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-nico-corporation--expanding-min.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-molli-surgical
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-molli-surgical.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-artelon-inc
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-artelon-inc.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews");
    },
  ],
  // stryker-completes-acquisition-of-serf-sas
  'https://www.stryker.com/us/en/about/news/2024/stryker-completes-acquisition-of-serf-sas.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      style(m, d, find(m, 'p', 'Forward-looking statements'), null);
      ['About Menix', 'About SERF SAS', 'Media contact'].forEach((label) => joinLabel(m, d, label));
    },
  ],
  // stryker-expands-foot---ankle-portfolio-with-specialized-offering
  'https://www.stryker.com/us/en/about/news/2024/stryker-expands-foot---ankle-portfolio-with-specialized-offering.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      retag(m, d, find(m, 'h4', 'The company to feature new products'), 'h3');
    },
  ],
  // stryker-expands-prophecy-surgical-planning-system-to-include-the
  'https://www.stryker.com/us/en/about/news/2024/stryker-expands-prophecy-surgical-planning-system-to-include-the.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      boldAll(m, d, find(m, 'p', 'References:'));
    },
  ],
  // stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet
  'https://www.stryker.com/us/en/about/news/2023/stryker-unveils-mako-total-knee-2-0-at-the-aaos-2023-annual-meet.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'Next advancement of Mako SmartRobotics'), { em: true });
      const about = find(m, 'p', 'About Stryker');
      breakBefore(m, d, about, 'separator');
      if (about && about.lastChild?.nodeName !== 'BR') about.append(d.createElement('br'));
      brBeforeLabel(find(m, 'p', 'Media contact'));
    },
  ],
  // stryker-s-pangea-systems-receive-fda-clearance
  'https://www.stryker.com/us/en/about/news/2023/stryker-s-pangea-systems-receive-fda-clearance.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'h2', 'Pangea to offer'));
    },
  ],
  // stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a
  'https://www.stryker.com/us/en/about/news/2022/stryker-receives-fda-clearance-for-q-guidance-system-for-spine-a.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'Innovative planning and intraoperative'));
      ['About Stryker', 'Media contact'].forEach((label) => joinLabel(m, d, label));
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
      style(m, d, find(m, 'p', 'Media contact'), 'separator');
    },
  ],
  // 2022-ana-innovation-award-winners-address-gaps-in-health-equity-
  'https://www.stryker.com/us/en/about/news/2022/2022-ana-innovation-award-winners-address-gaps-in-health-equity-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
    },
  ],
  // stryker-announces-first-patient-case-using--new-tornier-perform-
  'https://www.stryker.com/us/en/about/news/2022/stryker-announces-first-patient-case-using--new-tornier-perform-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/events, stryker:content-type/news/in-the-news");
      breakAfter(m, d, find(m, 'p', 'Case to be Presented at 2022'));
    },
  ],
  // stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu
  'https://www.stryker.com/us/en/about/news/2022/stryker-donates-to-k9s-for-warriors-to-conclude-2022-minor-leagu.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      subtitle(m, d, find(m, 'h4', 'This season, the Official SmartRobotics'), { split: false });
      breakBefore(m, d, find(m, 'p', 'About Stryker'), 'separator');
    },
  ],
  // stryker-launches--free-your-feet--campaign-to-raise-awareness-ab
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches--free-your-feet--campaign-to-raise-awareness-ab.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      const more = find(m, 'p', 'More information about the campaign');
      mergeWithPrevious(m, more);
      joinParagraph(d, more, 2);
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
    },
  ],
  // stryker-launches-prostep--mica-solo-guide--to-simplify-minimally
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-prostep--mica-solo-guide--to-simplify-minimally.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
    },
  ],
  // stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-
  'https://www.stryker.com/us/en/about/news/2022/stryker-to-showcase-innovative-portfolio-of-spine-solutions--at-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'Newly Launched Q Guidance System'), { em: true });
      mergeWithPrevious(m, find(m, 'p', 'QGS-MM-2_3426'));
      style(m, d, find(m, 'p', 'References:'), 'separator, disclaimer');
    },
  ],
  // stryker-launches-insignia--femoral-hip-stem-at-the-american-acad
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-insignia--femoral-hip-stem-at-the-american-acad.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      subtitle(m, d, find(m, 'p', 'Engineered to optimize fit and function'));
      joinLabel(m, d, 'About Stryker');
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
    },
  ],
  // stryker-enters-national-partnership-with-minor-league-baseball-t
  'https://www.stryker.com/us/en/about/news/2021/stryker-enters-national-partnership-with-minor-league-baseball-t.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      const label = [...m.querySelectorAll('p > strong')].find((s) => txt(s) === 'The Nation Emerges from COVID-19');
      if (label && nextOf(label)?.nodeName === 'BR' && nextOf(nextOf(label))?.nodeName !== 'BR') label.after(d.createElement('br'));
    },
  ],
  // stryker-introduces-market-leading-tornier-shoulder-arthroplasty-
  'https://www.stryker.com/us/en/about/news/2021/stryker-introduces-market-leading-tornier-shoulder-arthroplasty-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      // the source's bold place and separately styled dash: the place bold, then ' — ' in the copy
      const date = [...m.querySelectorAll('p > strong, p > b')].find((s) => /^MAHWAH, N\.J\.—?$/.test(txt(s)));
      if (date) {
        const dash = nextOf(date);
        if (dash && dash.nodeType === 1 && txt(dash) === '—') dash.remove();
        if (txt(date).endsWith('—')) date.textContent = 'MAHWAH, N.J.';
        const rest = nextOf(date);
        if (rest && rest.nodeType === 3 && !rest.textContent.startsWith(' — ')) rest.textContent = ` — ${rest.textContent.replace(/^[\s—]+/, '')}`;
      }
      breakBefore(m, d, find(m, 'p', 'Media Contacts'), null);
    },
  ],
  // stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v
  'https://www.stryker.com/us/en/about/news/2021/stryker-expands-its-mako-smartrobotics-footprint-to-reach-more-v.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/in-the-news");
      breakAfter(m, d, find(m, 'p', 'Stryker continues to work with United'), { keepStyle: true });
      const label = [...m.querySelectorAll('p > strong')].find((s) => txt(s) === 'About Stryker');
      if (label && nextOf(label)?.nodeName === 'BR' && nextOf(nextOf(label))?.nodeName === 'BR') nextOf(label).remove();
    },
  ],
  // awareness-campaign-launched-to-support-world-restart-a-heart-day
  'https://www.stryker.com/us/en/about/news/2020/awareness-campaign-launched-to-support-world-restart-a-heart-day.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      footnotesToList(m, d, find(m, 'p', '1. Cardiovascular diseases (CVDs)'));
    },
  ],
  // stryker-releases-emergency-relief-bed
  'https://www.stryker.com/us/en/about/news/2020/stryker-releases-emergency-relief-bed.html': [
    (m, d) => {
      tags(m, "stryker:Stryker-SEO-Tags/covid19, stryker:content-type/news, stryker:Stryker-SEO-Tags/coronavirus, stryker:Stryker-SEO-Tags/covid-19, stryker:content-type/news/product-bulletins, stryker:content-type/corporatenews, stryker:content-type/news/covid-19");
      const place = find(m, 'h5', 'Kalamazoo, MI, USA');
      if (place) { const p = d.createElement('p'); const b = d.createElement('strong'); b.append(...place.childNodes); p.append(b); place.replaceWith(p); }
      const h1 = m.querySelector('h1');
      if (h1 && !h1.querySelector('strong')) boldAll(m, d, h1);
      style(m, d, h1, null);
      retag(m, d, find(m, 'h4', 'Company aims to manufacture'), 'h3');
      ['About Stryker', 'Media contact'].forEach((label) => joinLabel(m, d, label));
      breakBefore(m, d, find(m, 'p', 'About Stryker'), 'separator');
      breakBefore(m, d, find(m, 'p', 'Media contact'), null);
    },
  ],
  // stryker-completes-acquisition-of-wright-medical
  'https://www.stryker.com/us/en/about/news/2020/stryker-completes-acquisition-of-wright-medical.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews");
    },
  ],
  // stryker-joins-leading-executives-and-employers-in-forming-oneten
  'https://www.stryker.com/us/en/about/news/2020/stryker-joins-leading-executives-and-employers-in-forming-oneten.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/diversity-equity-inclusion");
      const sub = find(m, 'p', 'OneTen will create one million jobs');
      style(m, d, sub, null);
      subtitle(m, d, sub);
    },
  ],
  // urgent-11-vulnerabilities---wind-river-vxworks-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/urgent-11-vulnerabilities---wind-river-vxworks-.html': [
    (m, d) => {
      m.querySelectorAll('a[href="https://www.us-cert.gov/ics/advisories/icsa-19-211-01"]').forEach((a) => {
        const u = a.querySelector('u') || a;
        if (txt(u) === 'https://www.us-cert.gov/ics/advisories/icsa-19-211-01') u.textContent = u.textContent.toUpperCase();
      });
    },
  ],
  // microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin.html': [
    (m, d) => {
      newTab(m, ['https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2019-0708', 'https://support.microsoft.com/en-us/help/4500705/customer-guidance-for-cve-2019-0708']);
    },
  ],
  // ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01.html': [
    (m, d) => {
      newTab(m, ['https://us-cert.cisa.gov/ics/advisories/icsa-20-168-01']);
    },
  ],
  // -sweyntooth--ble-vulnerabilities--icsa--20-063-01-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/-sweyntooth--ble-vulnerabilities--icsa--20-063-01-.html': [
    (m, d) => {
      newTab(m, ['https://us-cert.cisa.gov/ics/alerts/ics-alert-20-063-01']);
    },
  ],
  // vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4.html': [
    (m, d) => {
      boldPerLine([...m.querySelectorAll('p > strong')].find((s) => txt(s).startsWith('CVE-2022-46898 Arbitrary File Upload')), d);
      newTab(m, ['https://support.vocera.com/s/contactsupport', ...['46898', '46899', '46900', '46901', '46902'].map((n) => `https://cve.report/CVE-2022-${n}`)]);
    },
  ],
  // ---- long-page-detail-corp ----
  ...Object.fromEntries(['april', 'may', 'december', 'january', 'february', 'march', 'june', 'july', 'november']
    .map((p) => [jr45(p), JR45_TITLE])),
  [jr45('october')]: [
    ...JR45_TITLE,
    (main) => blocks(main, /^columns \(gray-2, headline-serif-copy\)$/)
      .forEach((t) => setVariants(t, ['gray-2', 'headline-copy', 'serif'])),
  ],
  [page('about/corporate-responsibility/employee-benefits-and-resources')]: [
    (main) => setTheme(main, 'xlarge-copy, serif-copy'),
  ],
  [page('nse/products/heavy-duty-attachments/cutting-accessories')]: [
    (main) => setTheme(main, 'large-headlines, xlarge-copy, serif-copy'),
  ],
  [page('nse/products/mis-attachments/accessories')]: [
    (main) => replaceStyle(main, 'tabbed', 'tabbed, light-gray-titles'),
  ],
  [page('nse/products/mis-attachments/cutting-accessories')]: [
    (main) => blocks(main, /^columns \(columns 67 33, gray last, plain-bold\)$/)
      .forEach((t) => setVariants(t, ['columns 67 33', 'product-details'])),
    (main) => blocks(main, /^columns \(stack\)$/).forEach((t) => addVariants(t, 'product-names')),
  ],
  [page('training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/resources/colorectal-surgery')]: [
    (main) => blocks(main, /^columns \(product-names, xlarge-copy\)$/).forEach((t) => setVariants(t, ['xlarge-copy'])),
  ],
  [page('training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/resources/plastic-surgery')]: [
    // the video title on one heading ("The Ergonomics and Utility of SPY-PHI")
    (main) => withText(main, 'h3', 'The Ergonomics and Utility').forEach((h) => {
      const next = h.nextElementSibling;
      if (next?.tagName !== 'H3' || norm(next.textContent) !== 'of SPY-PHI') return;
      h.querySelector('strong').textContent = 'The Ergonomics and Utility of SPY-PHI';
      next.remove();
    }),
  ],
  [page('training-and-education/medical-and-surgical-equipment--/neurosurgical/medical-education/events')]: [
    (main) => blocks(main, /^columns$/).forEach((t) => addVariants(t, 'event-cards')),
  ],
  [page('training-and-education/orthopaedics/joint-replacement/OR_Staff')]: [
    (main) => withText(main, 'h5', 'Want more Mako educational information?')
      .forEach((h) => boldHeading(rename(h, 'h3'))),
    (main) => setTheme(main, 'large-headlines, xlarge-copy, or-staff'),
  ],
  ...Object.fromEntries(['accelerate', 'assist', 'assure'].map((p) => [
    page(`spine/products/bacs-balance-acs/index/${p}`), [
      (main) => heroes(main).forEach((t) => addVariants(t, 'fixed-title')),
      (main) => setTheme(main, 'bacs'),
    ]])),
  [page('training-and-education/orthopaedics/spine/spine-medical-education/on-demand-webinars')]: [
    (main) => named(main, 'local nav corp (border)').forEach((t) => setVariants(t, ['overlay'])),
    (main) => named(main, 'marketo form').forEach((t) => setVariants(t, ['two-thirds'])),
  ],
  [page('training-and-education/orthopaedics/trauma-extremities/teach/TEACH-Landing-Page/TEACH-Thank-You')]: [
    (main) => named(main, 'columns (columns 50 50)').forEach((t) => addVariants(t, 'page-title')),
    (main) => replaceStyle(main, 'separator, image-link, center', 'image-link, center'),
  ],
  [page('training-and-education/neurotechnology/neurovascular/skill/skill-connect')]: [
    (main) => heroes(main).forEach((t) => addVariants(t, 'fixed-title')),
    (main) => named(main, 'columns (columns 50 50, large-copy)').forEach((t) => addVariants(t, 'lowered-text')),
    (main) => setTheme(main, 'large-copy, skill'),
  ],
  [page('training-and-education/orthopaedics/trauma-extremities/te-virtual-learning-center/upper-extremities')]: [
    // the hero section without a style, and no spacer section after it
    (main) => metaWithStyle(main, 'white-text').forEach((t) => t.remove()),
    (main) => metaWithStyle(main, 'spacer').slice(0, 1).forEach(removeEmptySection),
    (main) => named(main, 'columns (stack)').forEach((t) => addVariants(t, 'course-boxes')),
    (main) => setTheme(main, 'large-headlines, te-vlc'),
  ],
  [page('about/corporate-responsibility/giving-back')]: [
    // the intro: a paragraph, the Bold Heading 3 "Stryker’s global support", a paragraph
    (main, doc) => [...main.querySelectorAll('p')].filter((el) => [...el.querySelectorAll(':scope > strong')]
      .some((b) => norm(b.textContent) === 'Stryker’s global support')).forEach((para) => {
      const bold = [...para.querySelectorAll(':scope > strong')].find((b) => norm(b.textContent) === 'Stryker’s global support');
      const before = doc.createElement('p');
      const after = doc.createElement('p');
      const kids = [...para.childNodes];
      const at = kids.indexOf(bold);
      before.append(...kids.slice(0, at));
      after.append(...kids.slice(at + 1));
      [before, after].forEach((el) => {
        el.querySelectorAll(':scope > br').forEach((br) => br.remove());
        el.normalize();
        el.childNodes.forEach((n) => {
          if (n.nodeType === 3) n.textContent = n.textContent.trim();
        });
      });
      const h3 = doc.createElement('h3');
      h3.append(bold);
      para.replaceWith(before, h3, after);
    }),
  ],
  [page('surgical-technologies/services/instruments/contact-information')]: [
    (main) => posterSize(main, 'AdobeStock_275515599-AVS', 1464, 824),
    (main) => named(main, 'columns (blue all)').forEach((t) => {
      setVariants(t, ['blue-all', 'contact-boxes']);
      t.querySelectorAll('td > p').forEach((para) => {
        if (/Opt\. 2 Then Opt\. [23]\s*\S+@stryker\.com$/.test(norm(para.textContent))) splitLastLine(para);
      });
    }),
  ],
  [page('surgical-technologies/services/instruments/new-accounts')]: [
    (main) => posterSize(main, 'AdobeStock_313522943-AVS', 1464, 824),
    // the headline box: the title, then its line as a paragraph (plain)
    (main) => [...main.querySelectorAll('h3')].filter((h) => norm(h.textContent).startsWith('New Accounts To Request'))
      .forEach((h) => {
        const kids = [...h.childNodes];
        const br = h.querySelector(':scope > br');
        const line = kids.slice(kids.indexOf(br) + 1).find((n) => norm(n.textContent));
        if (line?.nodeName === 'EM') line.replaceWith(...line.childNodes);
        splitFirstLine(h, 'h3');
      }),
    (main) => replaceStyle(main, 'headline-box, blue', 'headline-box, blue, gold-titles'),
  ],
  [page('surgical-technologies/services/instruments/tech-support')]: [
    (main) => posterSize(main, 'AdobeStock_280821945-AVS', 1464, 824),
    (main) => named(main, 'columns (columns 67 33, blue all, headline-copy)').forEach((t) => {
      setVariants(t, ['columns 67 33', 'blue-all', 'contact-boxes']);
      const cells = t.querySelectorAll('tr:nth-child(2) > td');
      // the first cell: the Heading 2 title (Bold "Tech", plain "Support"), then its text
      const lead = cells[0]?.querySelector(':scope > p');
      if (lead) splitFirstLine(lead, 'h2', unItalic);
      cells[1]?.querySelectorAll(':scope > p').forEach((para) => {
        if (/Opt\. 2 Then Opt\. 3\s*\S+@stryker\.com$/.test(norm(para.textContent))) splitLastLine(para);
      });
    }),
    (main) => withText(main, 'h2', 'Products').forEach((h) => {
      const em = h.querySelector(':scope > em');
      if (em) rename(em, 'u');
    }),
  ],
  [page('training-and-education/neurotechnology/neurovascular/skill/skill-assist-max')]: [
    (main) => heroes(main).forEach((t) => addVariants(t, 'fixed-title')),
    (main) => named(main, 'panel (gold)').forEach((t) => addVariants(t, 'spaced')),
    (main) => named(main, 'accordion (large-copy)').forEach((t) => addVariants(t, 'blue-titles')),
    (main) => setTheme(main, 'large-copy, skill'),
  ],
  [page('training-and-education/orthopaedics/spine/spine-medical-education/events')]: [
    (main) => named(main, 'local nav corp (border)').forEach((t) => setVariants(t, ['overlay'])),
    // the MedEd banner title without the source's blank lines and "\" lines
    (main) => [...main.querySelectorAll('h2')].filter((h) => norm(h.textContent) === '\\ MedEd Events')
      .forEach((h) => {
        h.querySelectorAll(':scope > br').forEach((br) => br.remove());
        [...h.querySelectorAll(':scope > strong')].filter((b) => norm(b.textContent) === '\\').forEach((b) => b.remove());
        h.normalize();
        [...h.childNodes].filter((n) => n.nodeType === 3 && !norm(n.textContent)).forEach((n) => {
          if (n === h.firstChild || n === h.lastChild) n.remove();
        });
        const next = h.nextElementSibling;
        if (next?.tagName === 'P' && norm(next.textContent) === '\\') next.remove();
      }),
    (main) => setTheme(main, 'spine-meded'),
  ],
  [page('training-and-education/orthopaedics/spine/spine-medical-education/contact')]: [
    (main) => named(main, 'local nav corp (border)').forEach((t) => setVariants(t, ['overlay'])),
    (main) => named(main, 'marketo form').forEach((t) => setVariants(t, ['with-aside'])),
    (main) => [...main.querySelectorAll(':scope > p')].filter((el) => norm(el.textContent).startsWith('Questions? Contact'))
      .forEach((el) => addSectionStyle(el, 'p-2')),
    (main) => setTheme(main, 'xlarge-copy, serif-copy, spine-meded'),
  ],
  [page('training-and-education/orthopaedics/joint-replacement/Medical_Education_Landing_Page/Mako_Refreshers_Page')]: [
    // the title, then its text as a paragraph (plain)
    (main) => [...main.querySelectorAll('h1')].filter((h) => norm(h.textContent).startsWith('Join us for one'))
      .forEach((h) => splitFirstLine(h, 'h1', (n) => n)),
    (main) => [...main.querySelectorAll('p')].filter((el) => norm(el.textContent).startsWith('Each virtual course'))
      .forEach((el) => [...el.querySelectorAll(':scope > em')].forEach((em) => em.replaceWith(...em.childNodes))),
    (main) => named(main, 'columns (dark lead, large-titles, large-subtitles, large-copy)')
      .forEach((t) => setVariants(t, ['dark-lead', 'course-cards'])),
    (main) => [...main.querySelectorAll('p')].filter((el) => norm(el.textContent) === 'Together with our customers, we are driven to make healthcare better.')
      .forEach((el) => {
        const h3 = rename(el, 'h3');
        const em = h3.ownerDocument.createElement('em');
        em.textContent = norm(h3.textContent);
        h3.replaceChildren(em);
      }),
    (main) => setTheme(main, 'large-headlines, mako-refreshers'),
  ],
  [page('nse/products/heavy-duty-attachments/accessories')]: [
    (main) => named(main, 'columns (columns 67 33, left border bottom)').forEach((t) => {
      addVariants(t, 'product-intro');
      const first = t.querySelector('tr:nth-child(2) > td > p');
      if (first && norm(first.textContent) === norm(first.querySelector(':scope > strong')?.textContent)) rename(first, 'h2');
    }),
  ],
  [page('training-and-education/neurotechnology/neurovascular/skill/training-centers')]: [
    (main) => heroes(main).forEach((t) => addVariants(t, 'fixed-title')),
    (main) => [...main.querySelectorAll(':scope > h2')].filter((h) => norm(h.textContent) === 'Advancing your procedural skills')
      .forEach((h) => sectionBefore(h, 'spacer, large')),
    (main) => named(main, 'columns (columns 50 50, large-copy)').forEach((t) => addVariants(t, 'lowered-text-m')),
    (main) => replaceStyle(main, 'center', 'center, p-1-5', 0),
    (main) => withText(main, 'h4', 'Salt Lake City, UT').filter((h) => h.parentElement === main)
      .forEach((h) => sectionBefore(h, 'spacer')),
    (main) => setTheme(main, 'large-headlines, large-copy, skill'),
  ],
  [page('training-and-education/neurotechnology/neurovascular/skill/centers-of-excellence')]: [
    (main) => heroes(main).forEach((t) => addVariants(t, 'fixed-title')),
    (main) => named(main, 'video').slice(0, 1).forEach((t) => sectionBefore(t, 'spacer, large')),
    (main) => posterSize(main, 'SKILL%20COE_V3-1-AVS', 1380, 776),
    (main) => named(main, 'columns (columns 50 50, large-copy)').forEach((t) => addVariants(t, 'lowered-text')),
    (main) => named(main, 'panel (gold)').filter((t) => norm(t.textContent).includes('These days, young neurointerventionalists'))
      .forEach((t) => addVariants(t, 'quote')),
    (main) => withText(main, 'p', 'Contact your local representative to find out more!').forEach((el) => rename(el, 'h2')),
    (main) => setTheme(main, 'large-copy, skill'),
  ],
  [page('training-and-education/neurotechnology/neurovascular/skill/neuroelite-fellows-program')]: [
    (main) => heroes(main).forEach((t) => addVariants(t, 'fixed-title')),
    (main) => replaceStyle(main, 'separator', 'separator, h2-1-25', 0),
    (main) => named(main, 'panel (gold)').forEach((t) => addVariants(t, 'spaced')),
    (main) => named(main, 'columns (columns 50 50, large-copy)').forEach((t) => addVariants(t, 'lowered-text')),
    // the gold-lead row a section of its own
    (main, doc) => named(main, 'columns (columns 50 50, gold lead, large-copy)').forEach((t) => {
      setVariants(t, ['columns 50 50', 'gold-lead-copy', 'lowered-text-m']);
      if (t.previousElementSibling?.tagName === 'TABLE') t.before(doc.createElement('hr'));
    }),
    // "SKILL MedEd curriculum" and its image in sections of their own
    (main, doc) => withText(main, 'h2', 'SKILL MedEd curriculum').filter((h) => h.parentElement === main)
      .forEach((h) => { if (h.nextElementSibling?.tagName === 'P') h.after(doc.createElement('hr')); }),
    (main) => setTheme(main, 'large-headlines, large-copy, skill'),
  ],
  [page('training-and-education/neurotechnology/neurovascular/skill/e-lab')]: [
    (main) => heroes(main).forEach((t) => {
      setVariants(t, ['banner', 'third-text', 'fixed-xlarge-title']);
      t.querySelectorAll('h2').forEach((h) => {
        if (norm(h.textContent) !== 'e-Lab') return;
        const title = rename(h, 'h1');
        title.querySelectorAll('br').forEach((br) => br.remove());
        dropBlankText(title);
      });
    }),
    (main) => [...main.querySelectorAll(':scope > h1')].filter((h) => norm(h.textContent) === 'A 24/7 online training platform')
      .forEach((h) => rename(h, 'h2')),
    (main) => named(main, 'columns (columns 50 50, large-copy)').forEach((t) => addVariants(t, 'lowered-text-s')),
    (main, doc) => named(main, 'columns (columns 50 50, gold lead, large-copy)').forEach((t) => {
      if (t.previousElementSibling?.tagName === 'TABLE') t.before(doc.createElement('hr'));
    }),
    (main) => withText(main, 'h3', 'The SKILL e-Lab offers what you need').forEach((h) => {
      const b = h.querySelector(':scope > strong');
      if (b && !b.querySelector('em')) {
        const em = h.ownerDocument.createElement('em');
        em.append(...b.childNodes);
        b.append(em);
      }
    }),
    (main) => setTheme(main, 'large-headlines, large-copy, skill'),
  ],
  [page('training-and-education/orthopaedics/foot-and-ankle/patient-marketing-toolkit/bunion')]: TOOLKIT('Bunion'),
  [page('training-and-education/orthopaedics/foot-and-ankle/patient-marketing-toolkit/total-ankle-replacement')]:
    TOOLKIT('Total Ankle Replacement'),
  [page('training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/ispies')]: [
    // the title row: the Heading 1, its date a plain Heading 2 (Columns `large-headline`, `title`)
    (main) => named(main, 'columns (columns 50 50)').forEach((t) => {
      setVariants(t, ['columns 50 50', 'large-headline', 'title']);
      t.querySelectorAll('h1').forEach((h) => {
        splitFirstLine(h, 'h1');
        const date = t.querySelector('h1 + p');
        if (!date) return;
        const h2 = rename(date, 'h2');
        h2.querySelectorAll('em').forEach((em) => em.replaceWith(...em.childNodes));
      });
    }),
    // the "Where: … | When: …" lines as Heading 2 headline boxes
    (main) => [...main.querySelectorAll(':scope > p')].filter((el) => norm(el.textContent).startsWith('Where: IRCAD'))
      .forEach((el) => addSectionStyle(rename(el, 'h2'), 'headline-box')),
    (main) => setTheme(main, 'large-headlines, xxlarge-copy, serif-copy'),
  ],
  [page('training-and-education/orthopaedics/spine/spine-medical-education/resources')]: [
    (main) => named(main, 'local nav corp (border)').forEach((t) => setVariants(t, [])),
    (main) => named(main, 'columns (columns-67-33, gold-first, large-serif-copy)').forEach((t, i) => {
      setVariants(t, ['columns-67-33', 'gold-headline-first', 'large-serif-copy']);
      if (i === 0) addSectionStyle(t, 'spaced-items');
    }),
    (main) => replaceStyle(main, 'spacer', 'spacer, large', 0),
    (main) => [...main.querySelectorAll('p')].filter((el) => norm(el.textContent).startsWith('The goal of this program'))
      .forEach((el) => {
        const b = el.querySelector(':scope > strong');
        if (!b || b.querySelector('em')) return;
        const em = el.ownerDocument.createElement('em');
        em.append(...b.childNodes);
        b.append(em);
      }),
    // the two S2S list titles: Heading 2 lines, the plain words Italic (Columns `large-titles`)
    (main) => named(main, 'columns (columns-50-50, large-serif-copy)').forEach((t) => {
      addVariants(t, 'large-titles');
      [...t.querySelectorAll('p')].filter((el) => /^(Highlights of each interactive|Routine) S2S/.test(norm(el.textContent)))
        .forEach((el) => {
          const h2 = rename(el, 'h2');
          [...h2.childNodes].filter((n) => n.nodeType === 3 && norm(n.textContent)).forEach((n) => {
            n.textContent = norm(n.textContent);
            wrap(n, 'em');
          });
        });
    }),
    (main) => setTheme(main, 'large-headlines, spine-meded'),
  ],
  [page('about/corporate-responsibility/environmental-programs')]: [
    (main) => named(main, 'columns (columns 50 50, boxed all, serif)')
      .forEach((t) => setVariants(t, ['columns 50 50', 'boxed-all', 'goal-cards'])),
    (main) => blocks(main, /^columns \(stack, image border(, large-copy)?\)$/)
      .forEach((t) => setVariants(t, ['image-border', 'large-copy'])),
    // the section titles teal (`teal-titles`)
    (main) => [...main.querySelectorAll(':scope > h3')].filter((h) => /^(Stryker’s locations using renewable energy|Design for sustainability)/.test(norm(h.textContent)))
      .forEach((h) => addSectionStyle(h, 'teal-titles')),
    // the five procurement items: one Columns row (`product-names`, `large-copy`)
    (main, doc) => {
      const first = [...main.querySelectorAll(':scope > p')].find((el) => el.querySelector('a[href*="/hydro-V2"]'));
      if (!first) return;
      const cells = [];
      let node = first;
      while (node && node.tagName === 'P' && cells.length < 5) {
        const image = node;
        const label = node.nextElementSibling;
        node = label?.nextElementSibling;
        cells.push([image, label]);
      }
      const table = blockTable(doc, 'Columns (product-names, large-copy)', [...cells, []]);
      (node || first).before(table);
    },
    // one `spacer, large` section before "Design for sustainability" and before "Employee
    // engagement on sustainability"
    (main) => [...main.querySelectorAll(':scope > h3')].filter((h) => /^(Design for sustainability|Employee engagement on sustainability)/.test(norm(h.textContent)))
      .forEach((h) => {
        const [nearest, next] = spacerSectionsBefore(h);
        if (!nearest || !next) return;
        if (norm(h.textContent).startsWith('Design')) {
          nearest.querySelector('tr:nth-child(2) > td:last-child').textContent = 'spacer, large';
          removeEmptySection(next);
        } else {
          next.querySelector('tr:nth-child(2) > td:last-child').textContent = 'spacer, large';
          removeEmptySection(nearest);
        }
      }),
    // "Doing more with less…": a Bold Heading 4 subtitle above the rule line
    (main) => [...main.querySelectorAll(':scope > p')].filter((el) => norm(el.textContent).startsWith('Doing more with less through additive manufacturing'))
      .forEach((el) => {
        const b = el.querySelector(':scope > strong');
        const br = el.querySelector(':scope > br');
        if (!b || !br) return;
        const h4 = el.ownerDocument.createElement('h4');
        h4.append(b);
        dropBlankText(el);
        br.remove();
        el.before(h4);
      }),
  ],
  [page('training-and-education/orthopaedics/joint-replacement/Mako_surgeon_campaign')]: [
    // the hero: the two title lines, then the text as a paragraph (plain)
    (main, doc) => [...main.querySelectorAll('h1')].filter((h) => norm(h.textContent).startsWith('Know more. Cut less.'))
      .forEach((h) => {
        const brs = [...h.querySelectorAll(':scope > br')];
        const second = brs.find((br) => br.nextSibling?.nodeName === 'BR');
        if (!second) return;
        const para = doc.createElement('p');
        const kids = [...h.childNodes];
        const rest = kids.slice(kids.indexOf(second) + 2);
        second.nextSibling.remove();
        second.remove();
        rest.forEach((n) => {
          if (n.nodeName === 'EM') para.append(...n.childNodes);
          else if (norm(n.textContent)) para.append(n);
          else n.remove();
        });
        para.normalize();
        para.childNodes.forEach((n) => { if (n.nodeType === 3) n.textContent = n.textContent.replace(/\s+/g, ' '); });
        trimLead(para);
        if (h.lastChild?.nodeType === 3 && !norm(h.lastChild.textContent)) h.lastChild.remove();
        h.after(para);
      }),
    (main) => posterSize(main, 'JR_2021_Dig_Media_campaign_video_banner-1', 1380, 776),
    (main) => ['MAKTKA_VA_39-1', 'MKOTHA_VA_20-1', 'MAKPKA_VA_32-1'].forEach((v) => posterSize(main, v, 440, 248)),
    // the section titles Heading 3 (Bold), the training academy line a Heading 2
    (main) => ['Know more', 'Cut less', 'See Mako in action', 'Turn data into insights and insights into action']
      .forEach((text) => withText(main, 'h4', text).forEach((h) => boldHeading(rename(h, 'h3')))),
    (main) => [...main.querySelectorAll('h4')].filter((h) => norm(h.textContent).startsWith('For more procedural videos'))
      .forEach((h) => rename(h, 'h2')),
    // the key clinical studies accordions (`large-titles`): a Total Knee / Total Hip panel's
    // title is one Heading 2 (the gold product, Bold "key clinical studies", the topic on its own
    // line; Partial Knee keeps its two paragraphs), the study labels Heading 4
    (main, doc) => named(main, 'accordion (large-copy)').forEach((t) => {
      addVariants(t, 'large-titles');
      [...t.querySelectorAll('p')].filter((el) => /^Mako Total (Knee|Hip) key clinical studies$/.test(norm(el.textContent))
        && el.nextElementSibling?.tagName === 'P' && el.nextElementSibling.querySelector(':scope > strong')
        && norm(el.nextElementSibling.textContent) === norm(el.nextElementSibling.querySelector(':scope > strong').textContent))
        .forEach((el) => {
          const topic = el.nextElementSibling;
          const h2 = doc.createElement('h2');
          h2.append(...el.childNodes, doc.createElement('br'), topic.querySelector(':scope > strong'));
          topic.remove();
          el.replaceWith(h2);
        });
      t.querySelectorAll('h5').forEach((h) => rename(h, 'h4'));
    }),
    (main) => setTheme(main, 'large-headlines, xlarge-copy, mako-campaign'),
  ],
  ...Object.fromEntries(['august', 'september', 'season-2/december', 'season-2/february',
    'season-2/november', 'season-2/october', 'season-2/september', 'season-3/april',
    'season-3/february', 'season-3/january', 'season-3/july', 'season-3/june', 'season-3/march']
    .map((p) => [jr45(p), JR45_BOX])),
};

const FRAGMENT_CORRECTIONS = {
  // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
};

const pageKey = (u) => {
  try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
  catch { return u; }
};

// The fragment's document path as the import saves it: no `.`, empty or trailing segments.
const fragmentKey = (p) => String(p).replace(/\\/g, '/').replace(/\.plain\.html$/, '').split('/')
  .reduce((parts, part) => {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
    return parts;
  }, [])
  .join('/');

function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
  const { document, params } = payload || {};
  if (!document || !params) return;
  if (element === document.body) {
    if (!params.originalURL) return;
    (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document));
    return;
  }
  const fragment = (params.fragments || []).find((f) => f.element === element);
  if (!fragment || typeof fragment.path !== 'string') return;
  (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document));
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
}
