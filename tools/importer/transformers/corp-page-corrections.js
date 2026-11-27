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

/**
 * Opens every external link in a new tab (`#_blank`, scripts.js): absolute http(s) links
 * to another site, other Stryker sites included (investors.stryker.com, ent.stryker.com);
 * not www.stryker.com itself, this site's own paths, email links or anchors.
 */
function newTabExternal(main) {
  main.querySelectorAll('a[href^="http"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.endsWith('#_blank')) return;
    let host = '';
    try { host = new URL(href).hostname.toLowerCase(); } catch (e) { return; }
    if (['www.stryker.com', 'stryker.com'].includes(host) || /\.aem\.(page|live)$/.test(host)) return;
    a.setAttribute('href', `${href}#_blank`);
  });
}

/** No `theme` row: the page has no theme in DA (import-text-only.js drops an empty `data-meta-*`). */
function noTheme(main) {
  main.setAttribute('data-meta-theme', '');
}

/** Removes a `[[name]…]` text tag around a paragraph's content, keeping the content. */
function dropTextTag(main, doc, name) {
  const open = `[[${name}]`;
  main.querySelectorAll('p').forEach((p) => {
    if (!txt(p).startsWith(open) || !txt(p).endsWith(']')) return;
    const walker = doc.createTreeWalker(p, 4 /* NodeFilter.SHOW_TEXT */);
    const texts = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
    const first = texts.find((t) => t.textContent.includes(open));
    if (first) first.textContent = first.textContent.replace(open, '');
    const last = [...texts].reverse().find((t) => t.textContent.trim());
    if (last && last.textContent.trim().endsWith(']')) last.textContent = last.textContent.replace(/\]\s*$/, '');
  });
}

/** Underlines the text of the links in `el` (the bold + underline link convention). */
function underlineLinks(el, doc) {
  if (!el) return;
  el.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('u')) return;
    const u = doc.createElement('u');
    u.append(...a.childNodes);
    a.append(u);
  });
}

/** Unwraps the source's font-size `<sub><sup>` wrappers around copy (the SPS blog posts). */
function unwrapSubSup(main) {
  main.querySelectorAll('sub').forEach((sub) => {
    const sup = sub.children.length === 1 && sub.firstElementChild.tagName === 'SUP' ? sub.firstElementChild : null;
    if (!sup || /^[\s\d,*†‡-]*$/.test(sup.textContent)) return;
    sub.replaceWith(...sup.childNodes);
  });
}

/** `label` bold, with the `count` paragraphs after it as its lines (`<br>` between). */
function joinLines(main, doc, label, count) {
  const p = [...main.querySelectorAll('p')].find((el) => txt(el) === label);
  if (!p || p.querySelector('br')) return;
  if (!p.querySelector('strong')) boldAll(main, doc, p);
  for (let i = 0; i < count; i += 1) {
    const next = p.nextElementSibling;
    if (!next || next.tagName !== 'P') break;
    p.append(doc.createElement('br'), ...next.childNodes);
    next.remove();
  }
}

/** Sets every ™ / ® of the page text that is not in a <sup> as a superscript, `<sup>®</sup>`. */
function superscript(main, doc) {
  const walker = doc.createTreeWalker(main, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (/[™®]/.test(n.textContent) && !n.parentElement.closest('sup, script, style')) nodes.push(n);
  }
  nodes.forEach((n) => {
    const out = n.textContent.split(/([™®])/).filter(Boolean).map((part) => {
      if (!/^[™®]$/.test(part)) return doc.createTextNode(part);
      const sup = doc.createElement('sup');
      sup.textContent = part;
      return sup;
    });
    n.replaceWith(...out);
  });
}

/** Removes a `spacer` section that opens the page (the reviewed page starts with its title). */
function dropLeadingSpacer(main) {
  const first = main.firstElementChild;
  if (!isSectionMetadata(first) || txt(first).toLowerCase().indexOf('spacer') < 0) return;
  const hr = first.nextElementSibling;
  first.remove();
  if (hr && hr.tagName === 'HR') hr.remove();
}

/** Splits paragraph `p` after its first line (at the first `<br>`): two paragraphs. */
function splitAtFirstBreak(doc, p) {
  const br = p && p.querySelector(':scope > br');
  if (!br) return;
  const rest = doc.createElement('p');
  while (br.nextSibling) rest.append(br.nextSibling);
  br.remove();
  p.after(rest);
}

/** Inserts a section holding only Section Metadata `value` before the section holding `el`. */
function spacerBefore(main, doc, el, value) {
  if (!el) return;
  const first = sectionOf(main, el)[0];
  const prevHr = first.previousElementSibling;
  if (prevHr && prevHr.tagName === 'HR' && isSectionMetadata(prevHr.previousElementSibling)
    && prevHr.previousElementSibling.previousElementSibling?.tagName === 'HR'
    && txt(prevHr.previousElementSibling).toLowerCase().includes(value.split(',')[0])) return;
  const table = WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: value } });
  if (prevHr && prevHr.tagName === 'HR') prevHr.after(table, doc.createElement('hr'));
  else first.before(table, doc.createElement('hr'));
}

/** Removes the spacer-only section right after the section holding `el`. */
function dropSpacerAfter(main, el) {
  if (!el) return;
  const section = sectionOf(main, el);
  const hr = section[section.length - 1].nextElementSibling;
  const table = hr && hr.nextElementSibling;
  if (!hr || hr.tagName !== 'HR' || !isSectionMetadata(table) || !txt(table).toLowerCase().includes('spacer')) return;
  const after = table.nextElementSibling;
  if (after && after.tagName !== 'HR') return;
  hr.remove();
  table.remove();
}

/** The block table named `name` (first cell, case-insensitive), or undefined. */
const blockTable = (main, name) => [...main.querySelectorAll('table')]
  .find((t) => txt(t.querySelector('th, td')).toLowerCase().startsWith(name.toLowerCase()));

/** Adds a section with a block after the section holding `el`. */
function blockSectionAfter(main, doc, el, name, cells) {
  if (!el) return;
  const section = sectionOf(main, el);
  const last = section[section.length - 1];
  const table = WebImporter.Blocks.createBlock(doc, { name, cells });
  last.after(doc.createElement('hr'), table);
}

/** The social share block (`social-share-corp`): Facebook, LinkedIn, email, copy link. */
function socialShareAfter(main, doc, el) {
  if (blockTable(main, 'social share corp')) return;
  blockSectionAfter(main, doc, el, 'Social Share Corp', [[':facebook:'], [':linkedin:'], [':email:'], [':copy-link:']]);
}

/** Underlines the text of each bold run whose text starts with one of `labels`. */
function underlineBold(main, doc, labels) {
  main.querySelectorAll('strong').forEach((b) => {
    if (b.querySelector('u') || !labels.some((l) => txt(b).startsWith(l))) return;
    const u = doc.createElement('u');
    u.append(...b.childNodes);
    b.append(u);
  });
}

/** Drops the empty last cell of each row of the block tables named `name`. */
function dropEmptyLastCells(main, name) {
  [...main.querySelectorAll('table')].filter((t) => txt(t.querySelector('th, td')).toLowerCase().startsWith(name)).forEach((t) => {
    [...t.querySelectorAll('tr')].slice(1).forEach((tr) => {
      const last = tr.cells[tr.cells.length - 1];
      if (tr.cells.length > 2 && last && !txt(last) && !last.querySelector('img, picture, a')) last.remove();
    });
  });
}

/**
 * One item per reference in the ordered lists under `el`'s section: an item holding further
 * "<br>N. …" references is split there, and each item loses its leading "N. ".
 */
function stripListNumbers(main, el) {
  if (!el) return;
  const doc = main.ownerDocument;
  sectionOf(main, el).forEach((node) => node.querySelectorAll?.('ol > li').forEach((li) => {
    [...li.querySelectorAll(':scope > br')].reverse().forEach((br) => {
      const next = br.nextSibling;
      if (!next || next.nodeType !== 3 || !/^\s*\d+\.\s/.test(next.textContent)) return;
      const item = doc.createElement('li');
      while (br.nextSibling) item.append(br.nextSibling);
      br.remove();
      li.after(item);
    });
  }));
  sectionOf(main, el).forEach((node) => node.querySelectorAll?.('ol > li').forEach((li) => {
    const t = li.firstChild;
    if (t && t.nodeType === 3) t.textContent = t.textContent.replace(/^\s*\d+\.\s*/, '');
  }));
}

/** Size and join section styles the `body-l` theme replaces (it sets the copy and headings). */
const BODY_L_REPLACES = ['p-1', 'p-1-25', 'p-1-5', 'p-1-75', 'p-2', 'p-2-5', 'h2-0-8', 'h2-1-25', 'h2-1-5', 'h3-0-8', 'h3-1-25', 'h3-1-5', 'h4-1-25', 'join'];

/**
 * The `body-l` layout of the representative "School safety: The importance of effective staff
 * communication": theme `body-l`, the source's H2 subheads as bold H3 (Futura bold), no size
 * styles, and a section break before each H3 for space above the subheads.
 */
function bodyLRepresentative(main, doc) {
  main.setAttribute('data-meta-theme', 'body-l');
  main.querySelectorAll('h2').forEach((h2) => {
    const h3 = doc.createElement('h3');
    const b = doc.createElement('strong');
    b.append(...h2.childNodes);
    b.querySelectorAll('em, strong').forEach((el) => el.replaceWith(...el.childNodes));
    h3.append(b);
    h2.replaceWith(h3);
  });
  [...main.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => {
    const row = [...t.querySelectorAll('tr')].find((tr) => txt(tr.cells[0]).toLowerCase() === 'style');
    if (!row) return;
    const rest = txt(row.cells[1]).split(',').map((v) => v.trim()).filter((v) => v && !BODY_L_REPLACES.includes(v));
    if (rest.length) row.cells[1].textContent = rest.join(', ');
    else if (t.querySelectorAll('tr').length <= 2) t.remove();
    else row.remove();
  });
  main.querySelectorAll('h3').forEach((h3) => breakBefore(main, doc, h3, null));
}

/** Gold bold + italic label paragraphs (whole paragraph) become subheads (H2, then bold H3). */
function labelsToSubheads(main, doc, labels) {
  main.querySelectorAll('p').forEach((p) => {
    if (!labels.includes(txt(p)) || !p.querySelector('em strong, strong em')) return;
    const h2 = doc.createElement('h2');
    h2.append(...p.childNodes);
    p.replaceWith(h2);
  });
}

/**
 * A reference paragraph that numbers its entries inline ("<strong>References: 1.</strong> …
 * <strong>2.</strong> …") → its label on a line of its own ("<strong>References: </strong>")
 * and the entries as an ordered list, as the Sage news pages are authored in DA.
 */
function inlineReferencesToList(main, doc) {
  main.querySelectorAll('p').forEach((p) => {
    const head = p.firstElementChild;
    if (!head || head.tagName !== 'STRONG' || !txt(p).startsWith(txt(head))) return;
    const label = txt(head).match(/^(.+:)\s*1\.$/);
    if (!label) return;
    const lead = doc.createElement('p');
    const b = doc.createElement('strong');
    b.textContent = `${label[1]} `;
    lead.append(b);
    const ol = doc.createElement('ol');
    let li = null;
    [...p.childNodes].forEach((n) => {
      if (n === head || (n.nodeName === 'STRONG' && /^\d+\.$/.test(txt(n)))) {
        li = doc.createElement('li');
        ol.append(li);
      } else if (li) li.append(n);
    });
    ol.querySelectorAll('li').forEach((item) => {
      const t = item.firstChild;
      if (t && t.nodeType === 3) t.textContent = t.textContent.replace(/^\s+/, '');
    });
    p.replaceWith(lead, ol);
  });
}

/**
 * Two photos with their captions (image link, caption, image link, caption from the
 * paragraph holding `el` on) → a two-column `columns` block in a section of its own; the
 * section style of the text above stays with the text, so its rule sits above the photos.
 */
function photoPairColumns(main, doc, el) {
  const first = el && el.closest('p');
  if (!first) return;
  const paras = [first];
  while (paras.length < 4 && paras[paras.length - 1].nextElementSibling?.tagName === 'P') {
    paras.push(paras[paras.length - 1].nextElementSibling);
  }
  if (paras.length < 4) return;
  const table = sectionOf(main, first).find(isSectionMetadata);
  const hr = doc.createElement('hr');
  first.before(hr);
  if (table) hr.before(table);
  const after = paras[3].nextElementSibling;
  const block = WebImporter.Blocks.createBlock(doc, { name: 'Columns', cells: [[[paras[0], paras[1]], [paras[2], paras[3]]]] });
  hr.after(block);
  if (after && after.tagName !== 'HR') block.after(doc.createElement('hr'));
}

/**
 * The text of each section styled `p-1-5` is a Heading 3 and the style goes: bold text is a
 * plain heading (Futura bold), serif text (`serif`) is italic (the Egyptienne heading convention).
 */
function sizedTextToH3(main, doc) {
  [...main.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => {
    const row = [...t.querySelectorAll('tr')].find((tr) => txt(tr.cells[0]).toLowerCase() === 'style');
    const values = row ? txt(row.cells[1]).split(',').map((v) => v.trim()) : [];
    if (!values.includes('p-1-5')) return;
    const serif = values.includes('serif');
    sectionOf(main, t).filter((n) => n.tagName === 'P').forEach((para) => {
      const h3 = retag(main, doc, para, 'h3');
      // a heading is Futura bold already: no Bold around the whole text
      const only = h3.children.length === 1 && h3.firstElementChild.matches('strong, b') && txt(h3.firstElementChild) === txt(h3);
      if (only) h3.firstElementChild.replaceWith(...h3.firstElementChild.childNodes);
      if (serif && !h3.querySelector('em')) {
        const em = doc.createElement('em');
        em.append(...h3.childNodes);
        h3.append(em);
      }
    });
    const rest = values.filter((v) => v !== 'p-1-5' && !(serif && v === 'serif'));
    if (rest.length) row.cells[1].textContent = rest.join(', ');
    else t.remove();
  });
}

/**
 * The gold banner above a form (section `h2-1-5` with `background: bg-gold`): its opening
 * words are the Egyptienne Light of stryker.com, authored in Italic (the Egyptienne heading
 * convention); the Bold call to action after them stays Futura bold, e.g. "*Want to learn
 * more?* **Download the full eGuide.**". Bold + Italic together would be gold, so only the
 * text outside the Bold goes in Italic.
 */
function serifBanner(main, doc) {
  [...main.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => {
    const v = txt(t).toLowerCase();
    if (!v.includes('h2-1-5') || !v.includes('bg-gold')) return;
    sectionOf(main, t).filter((n) => n.tagName === 'H2').forEach((h2) => {
      if (h2.querySelector('em')) return;
      const lead = [];
      for (const n of [...h2.childNodes]) {
        if (n.nodeType === 1 && n.matches('strong, b')) break;
        lead.push(n);
      }
      if (!lead.some((n) => n.textContent.trim())) return;
      const trailing = lead[lead.length - 1];
      const space = trailing.nodeType === 3 && /\s$/.test(trailing.textContent);
      if (space) trailing.textContent = trailing.textContent.replace(/\s+$/, '');
      const em = doc.createElement('em');
      lead[0].before(em);
      em.append(...lead);
      if (space) em.after(doc.createTextNode(' '));
    });
  });
}

/**
 * A news form page on the `body-l` layout (as "What you're not seeing on a 12-lead ECG" and
 * "Why a powered fleet is key for EMS and fire departments"): theme `full-width, body-l`
 * (body-l sets the copy size, so the p-1-x styles go), a spacer under the title, the gold
 * banner above the form ("Want to learn more? …") a Heading 2 in a section of its own
 * (`h2-1-5`, background `bg-gold`) with its Egyptienne question in Italic, the form section
 * `form-with-aside` (keeping its other styles), no `join`; with `references`, the references
 * a numbered list without the typed numbers in a `disclaimer` section (the small print is
 * left as imported otherwise).
 */
function formPageBodyL(main, doc, { references = false } = {}) {
  main.setAttribute('data-meta-theme', 'full-width, body-l');
  const sizes = /^p-1(-\d+)?$/;
  [...main.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => {
    const v = txt(td).split(',').map((x) => x.trim());
    if (!v.some((x) => sizes.test(x))) return;
    const rest = v.filter((x) => !sizes.test(x));
    if (rest.length) td.textContent = rest.join(', ');
    else t.remove();
  }));
  const title = sectionOf(main, main.querySelector('h1'));
  const afterTitle = title.length && title[title.length - 1].nextElementSibling;
  spacerBefore(main, doc, afterTitle && afterTitle.nextElementSibling, 'spacer');
  let banner = [...main.querySelectorAll('p, h2')].find((el) => /^(want to|interested in) learn(ing)? more\?/i.test(txt(el)));
  if (banner) {
    breakBefore(main, doc, banner, null);
    banner = retag(main, doc, banner, 'h2');
    breakAfter(main, doc, banner);
    sectionOf(main, banner).filter(isSectionMetadata).forEach((t) => t.remove());
    const sec = sectionOf(main, banner);
    sec[sec.length - 1].after(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style: 'h2-1-5', background: 'bg-gold' } }));
  }
  serifBanner(main, doc);
  const form = blockTable(main, 'marketo form');
  const formMeta = form && sectionOf(main, form).find(isSectionMetadata);
  const formRow = formMeta && [...formMeta.querySelectorAll('tr')].find((tr) => txt(tr.cells[0]).toLowerCase() === 'style');
  const formStyle = formRow ? txt(formRow.cells[1]).split(',').map((x) => x.trim()).filter(Boolean) : [];
  if (form && !formStyle.includes('form-with-aside')) style(main, doc, form, ['form-with-aside', ...formStyle].join(', '));
  // `join` goes: body-l sets the gaps (as in DA)
  [...main.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => {
    const v = txt(td).split(',').map((x) => x.trim());
    if (!v.includes('join')) return;
    const rest = v.filter((x) => x !== 'join');
    if (rest.length) td.textContent = rest.join(', ');
    else t.remove();
  }));
  const first = references && [...main.querySelectorAll('ol > li')].find((li) => /^1\.\s/.test(txt(li))
    && sectionOf(main, li).some((n) => isSectionMetadata(n) && txt(n).includes('disclaimer')));
  if (first) {
    stripListNumbers(main, first);
    // a typed number in Bold ("<strong>1.</strong> Pereira B…") goes too
    first.parentElement.querySelectorAll(':scope > li').forEach((li) => {
      const lead = li.firstElementChild;
      if (lead && lead === li.firstChild && lead.matches('strong, b') && /^\d+[.:]$/.test(txt(lead))) {
        lead.remove();
        if (li.firstChild && li.firstChild.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s+/, '');
      }
    });
    style(main, doc, first, 'disclaimer');
  }
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
      noTheme(m);
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
      noTheme(m);
    },
  ],
  // stryker-joins-leading-executives-and-employers-in-forming-oneten
  'https://www.stryker.com/us/en/about/news/2020/stryker-joins-leading-executives-and-employers-in-forming-oneten.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/diversity-equity-inclusion");
      noTheme(m);
      const sub = find(m, 'p', 'OneTen will create one million jobs');
      style(m, d, sub, null);
      subtitle(m, d, sub);
    },
  ],
  // urgent-11-vulnerabilities---wind-river-vxworks-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/urgent-11-vulnerabilities---wind-river-vxworks-.html': [
    (m, d) => {
      noTheme(m);
      m.querySelectorAll('a[href="https://www.us-cert.gov/ics/advisories/icsa-19-211-01"]').forEach((a) => {
        const u = a.querySelector('u') || a;
        if (txt(u) === 'https://www.us-cert.gov/ics/advisories/icsa-19-211-01') u.textContent = u.textContent.toUpperCase();
      });
    },
  ],
  // microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-windows-rdp-vulnerability--cve-2019-0708--bulletin.html': [
    (m, d) => {
      noTheme(m);
      newTab(m, ['https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2019-0708', 'https://support.microsoft.com/en-us/help/4500705/customer-guidance-for-cve-2019-0708']);
    },
  ],
  // ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/ripple20-treck-tcp-ip-stack-vulnerabilities-icsa-20-168-01.html': [
    (m, d) => {
      noTheme(m);
      newTab(m, ['https://us-cert.cisa.gov/ics/advisories/icsa-20-168-01']);
    },
  ],
  // -sweyntooth--ble-vulnerabilities--icsa--20-063-01-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/-sweyntooth--ble-vulnerabilities--icsa--20-063-01-.html': [
    (m, d) => {
      noTheme(m);
      newTab(m, ['https://us-cert.cisa.gov/ics/alerts/ics-alert-20-063-01']);
    },
  ],
  // vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/vocera-report-server-vulnerabilities--cve-2022-46898--cve-2022-4.html': [
    (m, d) => {
      noTheme(m);
      boldPerLine([...m.querySelectorAll('p > strong')].find((s) => txt(s).startsWith('CVE-2022-46898 Arbitrary File Upload')), d);
      newTab(m, ['https://support.vocera.com/s/contactsupport', ...['46898', '46899', '46900', '46901', '46902'].map((n) => `https://cve.report/CVE-2022-${n}`)]);
    },
  ],

  // text-only pages, second set: the DA `tags` row and external links in a new tab
  // apache--log4j--open-source-logging-library
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/apache--log4j--open-source-logging-library.html': [
    (m, d) => {
      newTabExternal(m);
    },
  ],
  // microsoft-print-spooler-vulnerabilities--cve-2021-34527-and-cve-
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/microsoft-print-spooler-vulnerabilities--cve-2021-34527-and-cve-.html': [
    (m, d) => {
      newTabExternal(m);
    },
  ],
  // stryker-responds-to-krack-vulnerability-for-ibed-wireless-enable
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/stryker-responds-to-krack-vulnerability-for-ibed-wireless-enable.html': [
    (m, d) => {
      newTabExternal(m);
    },
  ],
  // wannacry-vulnerability
  'https://www.stryker.com/us/en/about/governance/cyber-security/product-security/wannacry-vulnerability.html': [
    (m, d) => {
      newTabExternal(m);
    },
  ],
  // kevin-lobo-shares-leadership-strategies-with-medical-design---ou
  'https://www.stryker.com/us/en/about/news/2021/kevin-lobo-shares-leadership-strategies-with-medical-design---ou.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      newTabExternal(m);
    },
  ],
  // stryker-announced-as-new-partner-for-the-ana-innovation-awards
  'https://www.stryker.com/us/en/about/news/2021/stryker-announced-as-new-partner-for-the-ana-innovation-awards.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      newTabExternal(m);
    },
  ],
  // stryker-sponsors-pga-2021-world-golf-championships-fedex-st--jud
  'https://www.stryker.com/us/en/about/news/2021/stryker-sponsors-pga-2021-world-golf-championships-fedex-st--jud.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/events");
      newTabExternal(m);
    },
  ],
  // stryker-to-showcase-new--combined-foot-and-ankle-portfolio-at--2
  'https://www.stryker.com/us/en/about/news/2021/stryker-to-showcase-new--combined-foot-and-ankle-portfolio-at--2.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/product-bulletins, stryker:content-type/news/events, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      newTabExternal(m);
    },
  ],
  // cms-grants-outpatient-facility-code-for-insertion-of-stryker-s-i
  'https://www.stryker.com/us/en/about/news/2022/cms-grants-outpatient-facility-code-for-insertion-of-stryker-s-i.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews, stryker:content-type/news/product-bulletins");
      retag(m, d, find(m, 'p', 'The new code enables greater access'), 'h3');
      ['About the decision', 'About Stryker', 'Media contact'].forEach((label) => joinLabel(m, d, label));
      ['About the decision', 'About Stryker', 'Media contact'].forEach((label) => style(m, d, find(m, 'p', label), 'separator'));
      newTabExternal(m);
    },
  ],
  // stryker-completes-acquisition-of-vocera-communications
  'https://www.stryker.com/us/en/about/news/2022/stryker-completes-acquisition-of-vocera-communications.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      newTabExternal(m);
    },
  ],
  // stryker-works-with-red-cross-to-direct-resources-to-humanitarian
  'https://www.stryker.com/us/en/about/news/2022/stryker-works-with-red-cross-to-direct-resources-to-humanitarian.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      newTabExternal(m);
    },
  ],
  // vocera--now-part-of-stryker--introduces-latest-evolution-in-hand
  'https://www.stryker.com/us/en/about/news/2022/vocera--now-part-of-stryker--introduces-latest-evolution-in-hand.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      retag(m, d, find(m, 'p', 'New Minibadge expands intuitive mobile'), 'h4');
      newTabExternal(m);
    },
  ],
  // Cigna-Coverage-Policy-Update-ClariFix
  'https://www.stryker.com/us/en/ent/news/Cigna-Coverage-Policy-Update-ClariFix.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news");
      joinLabel(m, d, 'About Stryker');
      style(m, d, find(m, 'p', 'About Stryker'), null);
      newTabExternal(m);
    },
  ],
  // stryker-announces-creation-new-nasal-valve-collapse-1CD-10-CM-codes
  'https://www.stryker.com/us/en/ent/news/stryker-announces-creation-new-nasal-valve-collapse-1CD-10-CM-codes.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news");
      style(m, d, find(m, 'p', 'Effective October 1, 2024'), null);
      newTabExternal(m);
    },
  ],
  // stryker-announces-creation-of-new-category-1-cpt-codes-for-repor
  'https://www.stryker.com/us/en/ent/news/stryker-announces-creation-of-new-category-1-cpt-codes-for-repor.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/ent/clinical-information");
      joinLabel(m, d, 'About Stryker');
      joinLines(m, d, 'Media contact', 3);
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
      newTabExternal(m);
    },
  ],
  // united-healthcare-medicare-advantage-policy-update-for-clarifix-
  'https://www.stryker.com/us/en/ent/news/united-healthcare-medicare-advantage-policy-update-for-clarifix-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news");
      newTabExternal(m);
    },
  ],
  // i-thought-op-knees-were-approved-by-medicare--why-arent-they-in-
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/i-thought-op-knees-were-approved-by-medicare--why-arent-they-in-.html': [
    (m, d) => {
      unwrapSubSup(m);
      mergeWithPrevious(m, find(m, 'p', 'While there is not (yet)'));
      dropTextTag(m, d, 'color-teal');
      const back = [...m.querySelectorAll('p')].find((p) => txt(p) === 'BACK');
      underlineLinks(back, d);
      style(m, d, back, null);
      newTabExternal(m);
    },
  ],
  // update-from-cms--what-to-expect-may--september-2018
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/update-from-cms--what-to-expect-may--september-2018.html': [
    (m, d) => {
      style(m, d, find(m, 'p', 'On April 24th, CMS provided'), null);
      const close = find(m, 'p', 'Every episode is an opportunity');
      if (close) {
        const h5 = d.createElement('h5');
        const first = d.createElement('strong');
        first.textContent = 'Every episode is an opportunity to do what is best for your patients.';
        const em = d.createElement('em');
        const second = d.createElement('strong');
        second.textContent = 'We have your back.';
        em.append(second);
        h5.append(first, em);
        close.replaceWith(h5);
      }
      dropTextTag(m, d, 'color-teal');
      const back = [...m.querySelectorAll('p')].find((p) => txt(p) === 'GO BACK');
      underlineLinks(back, d);
      style(m, d, back, null);
      newTabExternal(m);
    },
  ],
  // will-your-practice-qualify-for-mips-exemption-under-bpci-advance
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/will-your-practice-qualify-for-mips-exemption-under-bpci-advance.html': [
    (m, d) => {
      style(m, d, find(m, 'p', 'Many orthopedic physician groups'), null);
      dropTextTag(m, d, 'color-teal');
      const back = [...m.querySelectorAll('p')].find((p) => txt(p) === 'BACK');
      underlineLinks(back, d);
      style(m, d, back, null);
      newTabExternal(m);
    },
  ],

  // news-detail `basic` pages (text and lead image, import-news-detail.js): the DA `tags`
  // row and ™ / ® as superscript
  // stryker-expands-mako-robotics-portfolio
  'https://www.stryker.com/us/en/about/news/2026/stryker-expands-mako-robotics-portfolio.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      superscript(m, d);
    },
  ],
  // stryker-showcases-continued-innovation-across-orthopaedics-at-aaos-2026-annual-meeting
  'https://www.stryker.com/us/en/about/news/2026/stryker-showcases-continued-innovation-across-orthopaedics-at-aaos-2026-annual-meeting.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      superscript(m, d);
    },
  ],
  // stryker-launches-surpass-elite-flow-diverter
  'https://www.stryker.com/us/en/about/news/2025/stryker-launches-surpass-elite-flow-diverter.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      superscript(m, d);
    },
  ],
  // stryker-unveils-oculan-lighting-platform
  'https://www.stryker.com/us/en/about/news/2024/stryker-unveils-oculan-lighting-platform.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      superscript(m, d);
    },
  ],
  // stryker-launches-prostep--mis-lapidus--a-new-minimally-invasive-
  'https://www.stryker.com/us/en/about/news/2023/stryker-launches-prostep--mis-lapidus--a-new-minimally-invasive-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      dropLeadingSpacer(m);
      style(m, d, m.querySelector('h1'), null);
      subtitle(m, d, find(m, 'p', 'Stryker’s PROstep MIS portfolio will be'), { em: true });
      splitAtFirstBreak(d, [...m.querySelectorAll('p')].find((p) => txt(p).startsWith('References: 1.')));
      style(m, d, find(m, 'p', 'A surgeon must always rely'), 'separator,disclaimer');
      superscript(m, d);
    },
  ],
  // stryker-announces-definitive-agreement-to-acquire-vocera-communi
  'https://www.stryker.com/us/en/about/news/2022/stryker-announces-definitive-agreement-to-acquire-vocera-communi.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/ir, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      superscript(m, d);
    },
  ],

  // news-detail `basic` pages, second set (import-news-detail.js; SurgiCount: import-news-xf.js)
  // stryker-launches-the-connected-power-pro-2-powered-ambulance-cot
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-the-connected-power-pro-2-powered-ambulance-cot.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      superscript(m, d);
    },
  ],
  // stryker-strengthens-its-r-d-capabilities-with-advanced-global-te
  'https://www.stryker.com/us/en/about/news/2022/stryker-strengthens-its-r-d-capabilities-with-advanced-global-te.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      subtitle(m, d, find(m, 'p', 'New center to help accelerate'));
      joinLabel(m, d, 'About Stryker');
      style(m, d, find(m, 'p', 'About Stryker'), 'separator');
      ['Stryker:', 'SPAG:'].forEach((label) => joinLabel(m, d, label));
      mergeWithPrevious(m, find(m, 'p', 'SPAG:'));
      style(m, d, find(m, 'p', 'Media contact'), 'separator');
      superscript(m, d);
    },
  ],
  // stryker-launches-next-generation-of-surgicount--to-help-improve-
  'https://www.stryker.com/us/en/about/news/2024/stryker-launches-next-generation-of-surgicount--to-help-improve-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      // news-detail-xf page on the `basic` theme in DA (the XF script has no representative groups)
      m.setAttribute('data-meta-theme', 'basic');
      const h1 = m.querySelector('h1');
      dropSpacerAfter(m, h1);
      // the body's image row is the shared fragment in DA
      const cols = blockTable(m, 'columns');
      if (cols) {
        const a = d.createElement('a');
        a.href = '/us/en/fragments/stryker/corporate/en/about/news/2024/stryker-launches-next-generation-of-surgicount-to-help-improve';
        a.textContent = a.getAttribute('href');
        cols.replaceWith(WebImporter.Blocks.createBlock(d, { name: 'Fragment', cells: [[a]] }));
      }
      spacerBefore(m, d, m.querySelector('ol'), 'spacer, small');
      superscript(m, d);
    },
  ],
  // stryker-names-spencer-stiles-president-and-chief-operating-officer
  'https://www.stryker.com/us/en/about/news/2025/stryker-names-spencer-stiles-president-and-chief-operating-officer.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      const h1 = m.querySelector('h1');
      style(m, d, h1, null);
      breakAfter(m, d, h1);
      breakAfter(m, d, m.querySelector('h2'));
      const logo = [...m.querySelectorAll('p')].find((p) => txt(p) === 'stryker_logo2015_left');
      breakAfter(m, d, logo);
      spacerBefore(m, d, find(m, 'p', 'PORTAGE, Mich., USA – Dec. 4'), 'spacer, small');
      socialShareAfter(m, d, find(m, 'p', 'About Stryker'));
      superscript(m, d);
    },
  ],
  // stryker-cmr-surgical-announce-strategic-alliance-advance-robotic-assisted-surgery
  'https://www.stryker.com/us/en/about/news/2026/stryker-cmr-surgical-announce-strategic-alliance-advance-robotic-assisted-surgery.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      const lead = find(m, 'p', 'Strategic alliance combines CMR');
      style(m, d, lead, null);
      breakAfter(m, d, lead);
      underlineBold(m, d, ['Strategic alliance combines CMR', 'For investor inquiries for Stryker:', 'For media inquiries for Stryker:', 'For investor and media inquiries for CMR Surgical:']);
      superscript(m, d);
    },
  ],
  // stryker-partners-professional-golfer-shane-lowry-caregiver-journey
  'https://www.stryker.com/us/en/about/news/2026/stryker-partners-professional-golfer-shane-lowry-caregiver-journey.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      socialShareAfter(m, d, find(m, 'p', 'About Stryker'));
      superscript(m, d);
    },
  ],
  // stryker-launches-new-gamma4-hip-fracture-nailing-system
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-new-gamma4-hip-fracture-nailing-system.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      dropSpacerAfter(m, m.querySelector('h1'));
      const sub = find(m, 'p', 'New System to Strengthen the Gamma');
      breakAfter(m, d, sub);
      style(m, d, sub, 'p-1-25');
      const media = find(m, 'p', 'Media contact');
      breakBefore(m, d, media, null);
      spacerBefore(m, d, media, 'spacer');
      spacerBefore(m, d, find(m, 'p', 'References'), 'spacer, small');
      superscript(m, d);
    },
  ],
  // stryker-launches-q-guidance-system-with-spine-guidance-software
  'https://www.stryker.com/us/en/about/news/2022/stryker-launches-q-guidance-system-with-spine-guidance-software.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      const sub = find(m, 'p', 'First spine navigation software');
      breakAfter(m, d, sub);
      style(m, d, sub, 'p-1-25');
      const about = find(m, 'p', 'About Stryker');
      breakBefore(m, d, about, null);
      spacerBefore(m, d, about, 'spacer');
      const media = find(m, 'p', 'Media contact');
      breakBefore(m, d, media, null);
      spacerBefore(m, d, media, 'spacer, small');
      spacerBefore(m, d, find(m, 'p', 'References:'), 'spacer, small');
      superscript(m, d);
    },
  ],
  // stryker-launches-steri-shield-8-personal-protection-system
  'https://www.stryker.com/us/en/about/news/2025/stryker-launches-steri-shield-8-personal-protection-system.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      const note = find(m, 'p', '*Stryker internal data');
      spacerBefore(m, d, note, 'spacer, small');
      style(m, d, note, 'disclaimer, join');
      superscript(m, d);
    },
  ],
  // stryker-launches-industry-s-first-completely-wireless-hospital-b
  'https://www.stryker.com/us/en/about/news/2020/stryker-launches-industry-s-first-completely-wireless-hospital-b.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews");
      const img = [...m.querySelectorAll('p, a')].find((el) => txt(el) === 'IsoTour bed');
      spacerBefore(m, d, img, 'spacer');
      style(m, d, img, 'col-8');
      style(m, d, find(m, 'p', 'ProCuity Bed Series designed'), 'col-8');
      style(m, d, find(m, 'p', 'Specific key features of ProCuity'), 'separator, col-8');
      dropEmptyLastCells(m, 'columns');
      ['About Stryker', 'Media contact'].forEach((label) => joinLabel(m, d, label));
      style(m, d, find(m, 'p', 'About Stryker'), null);
      style(m, d, find(m, 'p', 'Media contact'), null);
      const refs = m.querySelector('ol');
      stripListNumbers(m, refs);
      style(m, d, refs, 'disclaimer');
      superscript(m, d);
    },
  ],
  // a-clearer-vision-of-surgery-stryker-releases-its-next-generation-of-advanced-surgical-cameras
  'https://www.stryker.com/us/en/about/news/2023/a-clearer-vision-of-surgery-stryker-releases-its-next-generation-of-advanced-surgical-cameras.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      spacerBefore(m, d, [...m.querySelectorAll('p, a')].find((el) => txt(el) === '1788 Camera hero'), 'spacer');
      breakAfter(m, d, m.querySelector('h2'));
      breakBefore(m, d, blockTable(m, 'video'), null);
      const media = find(m, 'p', 'Media contacts');
      breakBefore(m, d, media, null);
      spacerBefore(m, d, media, 'spacer, small');
      spacerBefore(m, d, m.querySelector('ol'), 'spacer');
      superscript(m, d);
    },
  ],
  // stryker-receives-fda-clearance-for-optablate-bvn-ablation-system
  'https://www.stryker.com/us/en/about/news/2025/stryker-receives-fda-clearance-for-optablate-bvn-ablation-system.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/in-the-news");
      const body = find(m, 'p', 'PORTAGE, Mich., USA');
      spacerBefore(m, d, body, 'spacer, small');
      // the image and the key features are a 50/50 Columns block in DA
      const img = [...m.querySelectorAll('p')].find((p) => txt(p) === 'OptaBlate-BVN-ablation-vertebral-body');
      const key = find(m, 'p', 'Key features of the system include');
      if (img && key && !blockTable(m, 'columns')) {
        const rest = sectionOf(m, key).filter((n) => !isSectionMetadata(n));
        sectionOf(m, key).filter(isSectionMetadata).forEach((t) => t.remove());
        const hr = rest[0].previousElementSibling;
        const table = WebImporter.Blocks.createBlock(d, { name: 'Columns (columns-50-50)', cells: [[[img], rest]] });
        hr.after(table);
      }
      style(m, d, body, 'join');
      const notes = find(m, 'p', '*Chronic low back pain');
      const refs = [...m.querySelectorAll('p')].find((p) => txt(p) === 'References');
      breakBefore(m, d, refs, 'disclaimer, bold-body');
      style(m, d, notes, null);
      breakBefore(m, d, notes, null);
      spacerBefore(m, d, notes, 'spacer, small');
      spacerBefore(m, d, refs, 'spacer, small');
      superscript(m, d);
    },
  ],
  // stryker-s-neuroform-atlas--stent-system-granted-an-expanded-indi
  'https://www.stryker.com/us/en/about/news/2020/stryker-s-neuroform-atlas--stent-system-granted-an-expanded-indi.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews");
      dropLeadingSpacer(m);
      const h1 = m.querySelector('h1');
      style(m, d, h1, null);
      const img = [...m.querySelectorAll('p')].find((p) => /atlas-1/.test(p.innerHTML) && p.querySelector('a'));
      breakAfter(m, d, img, { keepStyle: true });
      spacerBefore(m, d, m.querySelector('ol'), 'spacer, small');
      superscript(m, d);
    },
  ],

  // single news-detail pages
  // reduce-cauti-icu-primafit
  'https://www.stryker.com/us/en/sage/news/2024/reduce-cauti-icu-primafit.html': [
    (m, d) => {
      // the body-l form page layout
      formPageBodyL(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2, stryker:business-unit/SAGE");
      // the reference as in DA: the label on its own line, the entry a numbered list
      inlineReferencesToList(m, d);
    },
  ],
  // surgical-site-infections-safety-savings
  'https://www.stryker.com/us/en/sage/news/2024/surgical-site-infections-safety-savings.html': [
    (m, d) => {
      // the body-l form page layout
      formPageBodyL(m, d, { references: true });
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage, stryker:content-type/news/sage/2, stryker:business-unit/SAGE");
      // the form section as in DA: `form-with-aside, bold-body`
      style(m, d, blockTable(m, 'marketo form'), 'form-with-aside, bold-body');
    },
  ],
  // successful-virtual-care-partnership-in-hospitals
  'https://www.stryker.com/us/en/smart-care/news/successful-virtual-care-partnership-in-hospitals.html': [
    (m, d) => {
      // the body-l form page layout
      formPageBodyL(m, d);
      // the banner as on stryker.com: the call to action on a line of its own, the box in 8 columns (`col-8`)
      const vBanner = [...m.querySelectorAll('h2')].find((h) => txt(h).startsWith('Interested in learning more?')); if (vBanner) { const em = vBanner.querySelector('em'); if (em && em.nextSibling?.nodeName !== 'BR') { if (em.nextSibling && em.nextSibling.nodeType === 3 && !em.nextSibling.textContent.trim()) em.nextSibling.remove(); em.after(d.createElement('br')); } style(m, d, vBanner, 'h2-1-5, col-8'); }
      tags(m, "stryker:content-type/news");
      // the footer links fragment as in DA (the body-copy one)
      m.querySelectorAll('a[href="/us/en/fragments/stryker/acute-care/en/business-unit/footer-links/master"]').forEach((a) => { a.href = '/us/en/fragments/stryker/acute-care/en/business-unit/footer-links/body-copy/master'; if (a.textContent.includes('/fragments/')) a.textContent = a.getAttribute('href'); });
    },
  ],
  // hospital-fall-prevention-with-smart-stretchers
  'https://www.stryker.com/us/en/acute-care/news/hospital-fall-prevention-with-smart-stretchers.html': [
    (m, d) => {
      // the body-l form page layout
      formPageBodyL(m, d, { references: true });
      tags(m, "stryker:content-type/news");
    },
  ],
  // hospital-acquired-infection-prevention-strategies
  'https://www.stryker.com/us/en/sage/news/2025/hospital-acquired-infection-prevention-strategies.html': [
    (m, d) => {
      // the body-l form page layout
      formPageBodyL(m, d, { references: true });
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage, stryker:content-type/news/sage/2, stryker:business-unit/SAGE");
    },
  ],
  // patient-skin-integrity-a-critical-factor-in-infection-prevention
  'https://www.stryker.com/us/en/sage/news/2025/patient-skin-integrity-a-critical-factor-in-infection-prevention.html': [
    (m, d) => {
      // the body-l form page layout
      formPageBodyL(m, d, { references: true });
      // the product teaser as in DA: a `cards-corp` (teaser, three-up) block, the image beside its text and Learn more link
      const cImg = m.querySelector('a[href*="Sage-CHG-Cloths-Thumbnail"]')?.closest('p'); const cText = find(m, 'p', 'Help address bacteria'); const cMore = [...m.querySelectorAll('p')].find((x) => txt(x) === 'Learn more'); if (cImg && cText && cMore) { [cImg, cText, cMore].forEach((el) => sectionOf(m, el).filter(isSectionMetadata).forEach((t) => t.remove())); const dup = cImg.nextElementSibling; if (dup && dup.tagName === 'P' && !dup.querySelector('strong') && dup.querySelector('a[href="/us/en/sage/products/sage-chg-cloths"]')) dup.remove(); mergeWithPrevious(m, cText); mergeWithPrevious(m, cMore); const block = WebImporter.Blocks.createBlock(d, { name: 'Cards Corp (teaser, three-up)', cells: [[cImg.querySelector('a'), [cText, cMore]]] }); cImg.replaceWith(block); }
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage, stryker:content-type/news/sage/2");
    },
  ],
  // why-powered-fleet-is-key-ems-fire-departments
  'https://www.stryker.com/us/en/emergency-care/news/2025/why-powered-fleet-is-key-ems-fire-departments.html': [
    (m, d) => {
      tags(m, "stryker:business-unit/ems/news/articles, stryker:content-type/news, stryker:business-unit/ems/news");
      // body-l (17.5px copy) on the full-width layout; body-l sets the copy size, so the p-1-x styles go
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (!v.some((x) => /^p-1(-\d+)?$/.test(x))) return; const rest = v.filter((x) => !/^p-1(-\d+)?$/.test(x)); if (rest.length) td.textContent = rest.join(', '); else t.remove(); }));
      // a spacer section under the title (as in DA)
      const titleSection = sectionOf(m, m.querySelector('h1')); const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
      spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, 'spacer');
      // the gold banner above the form: a Heading 2 in a section of its own, `h2-1-5` with the `bg-gold` background (as the 12-lead ECG form page)
      let banner = find(m, 'p', 'Want to learn more? Download the full eGuide'); if (banner) { breakBefore(m, d, banner, null); banner = retag(m, d, banner, 'h2'); const sec = sectionOf(m, banner); sec.filter(isSectionMetadata).forEach((t) => t.remove()); const rest = sectionOf(m, banner); rest[rest.length - 1].after(WebImporter.Blocks.createBlock(d, { name: 'Section Metadata', cells: { style: 'h2-1-5', background: 'bg-gold' } })); }
      // the form section: `form-with-aside` (as in DA)
      style(m, d, blockTable(m, 'marketo form'), 'form-with-aside');
      // the banner's opening words in Italic (Egyptienne on stryker.com), the call to action Bold
      serifBanner(m, d);
    },
  ],
  // lifepak35-15-lead-ecg-integration
  'https://www.stryker.com/us/en/emergency-care/news/2026/lifepak35-15-lead-ecg-integration.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:business-unit/ems/news, stryker:business-unit/ems, stryker:business-unit/ems/news/case-studies");
      // body-l (17.5px copy) on the full-width layout; body-l sets the copy size, so the p-1-x styles go
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (!v.some((x) => /^p-1(-\d+)?$/.test(x))) return; const rest = v.filter((x) => !/^p-1(-\d+)?$/.test(x)); if (rest.length) td.textContent = rest.join(', '); else t.remove(); }));
      // a spacer section under the title (as in DA)
      const titleSection = sectionOf(m, m.querySelector('h1')); const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
      spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, 'spacer');
      // the gold box above the form: `h2-1-5` with the `bg-gold` background (as in DA)
      const box = [...m.querySelectorAll('h2')].find((h) => /learn(ing)? more\?/i.test(txt(h))); if (box) { const t = sectionOf(m, box).find(isSectionMetadata); if (t) t.remove(); const sec = sectionOf(m, box); sec[sec.length - 1].after(WebImporter.Blocks.createBlock(d, { name: 'Section Metadata', cells: { style: 'h2-1-5', background: 'bg-gold' } })); }
      // the form section: `form-with-aside` (as in DA)
      style(m, d, blockTable(m, 'marketo form'), 'form-with-aside');
      // the references label in the copy font (Humanist bold on stryker.com: Underline), the references a numbered list without typed numbers, small print `disclaimer`
      const refsLabel = [...m.querySelectorAll('p')].find((x) => txt(x) === 'References:'); if (refsLabel) { const b = refsLabel.querySelector('strong'); const u = d.createElement('u'); u.textContent = 'References:'; (b || refsLabel).replaceWith(u); if (!b) refsLabel.append(u); }
      stripListNumbers(m, find(m, 'li', '1. Thygesen'));
      style(m, d, find(m, 'li', 'Thygesen'), 'disclaimer');
      // the banner's opening words in Italic (Egyptienne on stryker.com), the call to action Bold
      serifBanner(m, d);
    },
  ],
  // close-the-gap-in-fecal-management
  'https://www.stryker.com/us/en/sage/news/2026/close-the-gap-in-fecal-management.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:business-unit/SAGE");
      // body-l (17.5px copy) on the full-width layout; body-l sets the copy size, so the p-1-x styles go
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (!v.some((x) => /^p-1(-\d+)?$/.test(x))) return; const rest = v.filter((x) => !/^p-1(-\d+)?$/.test(x)); if (rest.length) td.textContent = rest.join(', '); else t.remove(); }));
      // a spacer section under the title (as in DA)
      const titleSection = sectionOf(m, m.querySelector('h1')); const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
      spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, 'spacer');
      // the gold box above the form: `h2-1-5` with the `bg-gold` background (as in DA)
      const box = [...m.querySelectorAll('h2')].find((h) => /learn(ing)? more\?/i.test(txt(h))); if (box) { const t = sectionOf(m, box).find(isSectionMetadata); if (t) t.remove(); const sec = sectionOf(m, box); sec[sec.length - 1].after(WebImporter.Blocks.createBlock(d, { name: 'Section Metadata', cells: { style: 'h2-1-5', background: 'bg-gold' } })); }
      // the form section: `form-with-aside` (as in DA)
      style(m, d, blockTable(m, 'marketo form'), 'form-with-aside');
      // the banner's opening words in Italic (Egyptienne on stryker.com), the call to action Bold
      serifBanner(m, d);
    },
  ],
  // life-saving-journey-inspires-community
  'https://www.stryker.com/us/en/emergency-care/news/2024/life-saving-journey-inspires-community.html': [
    (m, d) => {
      tags(m, "stryker:business-unit/ems/news/articles, stryker:content-type/news, stryker:business-unit/ems/news");
      // a spacer section under the title (as in DA)
      const titleSection = sectionOf(m, m.querySelector('h1')); const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
      spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, 'spacer');
      // body-l (17.5px copy, 21px / 24.5px subheads) on the full-width layout; body-l sets the sizes, so the size styles go
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (!v.some((x) => BODY_L_REPLACES.includes(x))) return; const rest = v.filter((x) => !BODY_L_REPLACES.includes(x)); if (rest.length) td.textContent = rest.join(', '); else t.remove(); }));
      // a section break above each subhead, for space above it
      m.querySelectorAll('h2').forEach((h2) => breakBefore(m, d, h2, null));
      // the references: a numbered list without the typed numbers, small print `disclaimer`
      stripListNumbers(m, find(m, 'li', '1. Beseems'));
      style(m, d, find(m, 'li', 'Beseems'), 'disclaimer');
      // a spacer section above the small print
      spacerBefore(m, d, find(m, 'li', 'Beseems'), 'spacer');
      // the lead photo's caption at 14px, as on stryker.com: `p-1` on the photo section (body-l keeps it)
      style(m, d, find(m, 'p', 'Chasie Greathouse and Cherish Works'), 'p-1');
      // the caption in italic and a spacer above the Resources fragment (as in DA)
      const caption = find(m, 'p', 'Chasie Greathouse and Cherish Works'); if (caption && !caption.querySelector('em')) { const em = d.createElement('em'); em.append(...caption.childNodes); caption.append(em); }
      spacerBefore(m, d, blockTable(m, 'fragment'), 'spacer');
    },
  ],
  // acute-care-training-and-education-resources
  'https://www.stryker.com/us/en/acute-care/news/acute-care-training-and-education-resources.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:business-unit/acute-care/news, stryker:business-unit/acute-care/news/articles");
      // a spacer section under the title (as in DA)
      const titleSection = sectionOf(m, m.querySelector('h1')); const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
      spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, 'spacer');
      // body-l (17.5px copy, 21px / 24.5px subheads) on the full-width layout; body-l sets the sizes, so the size styles go
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (!v.some((x) => BODY_L_REPLACES.includes(x))) return; const rest = v.filter((x) => !BODY_L_REPLACES.includes(x)); if (rest.length) td.textContent = rest.join(', '); else t.remove(); }));
      // a section break above each subhead, for space above it
      m.querySelectorAll('h2').forEach((h2) => breakBefore(m, d, h2, null));
      // a spacer section above the small print
      spacerBefore(m, d, [...m.querySelectorAll('table')].filter(isSectionMetadata).find((t) => txt(t).includes('disclaimer')), 'spacer');
    },
  ],
  // nurse-led-innovation-and-the-power-of-partnership
  'https://www.stryker.com/us/en/acute-care/news/nurse-led-innovation-and-the-power-of-partnership.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:custom/acute-care/acute-care-bu-news");
      // a spacer section under the title (as in DA)
      const titleSection = sectionOf(m, m.querySelector('h1')); const afterTitle = titleSection[titleSection.length - 1].nextElementSibling;
      spacerBefore(m, d, afterTitle && afterTitle.nextElementSibling, 'spacer');
      // body-l (17.5px copy, 21px / 24.5px subheads) on the full-width layout; body-l sets the sizes, so the size styles go
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (!v.some((x) => BODY_L_REPLACES.includes(x))) return; const rest = v.filter((x) => !BODY_L_REPLACES.includes(x)); if (rest.length) td.textContent = rest.join(', '); else t.remove(); }));
      // a section break above each subhead, for space above it
      m.querySelectorAll('h2').forEach((h2) => breakBefore(m, d, h2, null));
      // a spacer section above the small print
      spacerBefore(m, d, [...m.querySelectorAll('table')].filter(isSectionMetadata).find((t) => txt(t).includes('disclaimer')), 'spacer');
      // the references: a numbered list without the typed numbers (as in DA)
      const refs = [...m.querySelectorAll('p')].filter((p) => /^\d+\s/.test(txt(p)) && sectionOf(m, p).some((n) => isSectionMetadata(n) && txt(n).includes('disclaimer'))); if (refs.length) { const ol = d.createElement('ol'); refs[0].before(ol); refs.forEach((p) => { const li = d.createElement('li'); li.append(...p.childNodes); li.normalize(); if (li.firstChild && li.firstChild.nodeType === 3) li.firstChild.textContent = li.firstChild.textContent.replace(/^\s*\d+\s+/, ''); ol.append(li); p.remove(); }); }
    },
  ],
  // stryker-highlights-commitment-to-advanced-digital-healthcare
  'https://www.stryker.com/us/en/about/news/2021/stryker-highlights-commitment-to-advanced-digital-healthcare.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/Features");
    },
  ],
  // fda-authorizes-production-of-non-sterile-hoods-and-togas
  'https://www.stryker.com/us/en/about/news/2020/fda-authorizes-production-of-non-sterile-hoods-and-togas.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/corporatenews, stryker:content-type/news/covid-19");
    },
  ],
  // stryker-is-a-gallup-exceptional-workplace-for-the-13th-year
  'https://www.stryker.com/us/en/about/news/2020/stryker-is-a-gallup-exceptional-workplace-for-the-13th-year.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
    },
  ],
  // people-magazine-names-stryker-as-one-of-its-companies-that-care
  'https://www.stryker.com/us/en/about/news/2021/people-magazine-names-stryker-as-one-of-its-companies-that-care-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/awards, stryker:content-type/news, stryker:content-type/news/Features, stryker:content-type/corporatenews, stryker:content-type/news/cr");
      superscript(m, d);
      // the link in capitals, as in DA
      m.querySelectorAll('a[href="/us/en/about/corporate-responsibility"] u').forEach((u) => { u.textContent = u.textContent.toUpperCase(); });
    },
  ],
  // people-magazine-names-stryker-as-one-of-its-companies-that-care-2022
  'https://www.stryker.com/us/en/about/news/2022/people-magazine-names-stryker-as-one-of-its-companies-that-care-2022.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      superscript(m, d);
    },
  ],
  // stryker-announces-definitive-agreement-to-acquire-inari-medical-inc
  'https://www.stryker.com/us/en/about/news/2025/stryker-announces-definitive-agreement-to-acquire-inari-medical-inc.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      // no spacer below the title (as in DA)
      dropSpacerAfter(m, m.querySelector('h1'));
    },
  ],
  // stryker-signs-definitive-agreement-acquire-amplitude-vascular-systems
  'https://www.stryker.com/us/en/about/news/2026/stryker-signs-definitive-agreement-acquire-amplitude-vascular-systems.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news, stryker:content-type/corporatenews");
      // the share buttons after the press release link (as in DA)
      socialShareAfter(m, d, find(m, 'p', 'Read full press release here'));
    },
  ],
  // rebuilding-what-s-been-broken
  'https://www.stryker.com/us/en/about/news/features/rebuilding-what-s-been-broken-.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/Features");
      // the references: no typed numbers, small print `disclaimer` (as in DA)
      m.querySelectorAll('ol > li').forEach((li) => { const t = li.firstChild; if (t && t.nodeType === 3) t.textContent = t.textContent.replace(/^\s*\d+:\s*/, ''); });
      style(m, d, m.querySelector('ol > li'), 'disclaimer');
    },
  ],
  // revealing-character-rebuilding-lives
  'https://www.stryker.com/us/en/about/news/features/revealing-character--rebuilding-lives-.html': [
    (m, d) => {
      tags(m, "stryker:Stryker-SEO-Tags/covid19, stryker:content-type/news, stryker:Stryker-SEO-Tags/coronavirus, stryker:Stryker-SEO-Tags/covid-19, stryker:content-type/news/Features, stryker:content-type/news/covid-19");
      // no `join` (as in DA)
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (v.includes('join')) { const rest = v.filter((x) => x !== 'join'); if (rest.length) td.textContent = rest.join(', '); else t.remove(); } }));
      // the `p-1-5` text is a Heading 3
      sizedTextToH3(m, d);
    },
  ],
  // trees-landfills-and-the-environment
  'https://www.stryker.com/us/en/about/news/features/trees--landfills-and-the-environment.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news/Features");
      // the title style without `date-above` (as in DA)
      style(m, d, m.querySelector('h1'), 'h1-42');
    },
  ],
  // bpci-a-team-last-but-not-least
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/_bpci_-a-team-_-last-but-not-least-.html': [
    (m, d) => {
      // the BACK link: a bold + underline link (teal Futura bold on stryker.com), no `[[color-teal]` text tag
      dropTextTag(m, d, 'color-teal');
      m.querySelectorAll('p > strong > a').forEach((a) => { if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d); });
    },
  ],
  // bpci-advanced-calendar-updated
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/bpci-advanced-calendar--updated-.html': [
    (m, d) => {
      // the BACK link: a bold + underline link (teal Futura bold on stryker.com), no `[[color-teal]` text tag
      dropTextTag(m, d, 'color-teal');
      m.querySelectorAll('p > strong > a').forEach((a) => { if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d); });
    },
  ],
  // meet-the-bpci-a-team-take-two
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/meet-the--bpci--a-team---take-two-.html': [
    (m, d) => {
      // the BACK link: a bold + underline link (teal Futura bold on stryker.com), no `[[color-teal]` text tag
      dropTextTag(m, d, 'color-teal');
      m.querySelectorAll('p > strong > a').forEach((a) => { if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d); });
    },
  ],
  // meet-the-bpci-a-team-take-four
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/meet-the-_bpci_-a-team--take-four-.html': [
    (m, d) => {
      // the BACK link: a bold + underline link (teal Futura bold on stryker.com), no `[[color-teal]` text tag
      dropTextTag(m, d, 'color-teal');
      m.querySelectorAll('p > strong > a').forEach((a) => { if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d); });
    },
  ],
  // meet-the-bpci-a-team-take-three
  'https://www.stryker.com/us/en/joint-replacement/sps-blog/2018/meet-the-_bpci_-a-team--take-three-.html': [
    (m, d) => {
      // the BACK link: a bold + underline link (teal Futura bold on stryker.com), no `[[color-teal]` text tag
      dropTextTag(m, d, 'color-teal');
      m.querySelectorAll('p > strong > a').forEach((a) => { if (/^(GO )?BACK$/.test(txt(a.parentElement.parentElement))) underlineLinks(a.parentElement, d); });
    },
  ],
  // target-tetra-gets-510k-clearance
  'https://www.stryker.com/us/en/neurovascular/news/target-tetra-gets-510k-clearance.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:custom/neurovascular/neurovascular-bu-news");
      // no `join` (as in DA)
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { const v = txt(td).split(',').map((x) => x.trim()); if (v.includes('join')) { const rest = v.filter((x) => x !== 'join'); if (rest.length) td.textContent = rest.join(', '); else t.remove(); } }));
    },
  ],
  // stryker-receives-multi-million-dollar-grant-to-open-r-d-lab-in-a
  'https://www.stryker.com/us/en/about/news/2021/stryker-receives-multi-million-dollar-grant-to-open-r-d-lab-in-a.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/in-the-news");
      // the photo columns: no empty third cell (as in DA)
      dropEmptyLastCells(m, 'columns');
    },
  ],
  // changing-the-course-of-healthcare-in-under-resourced-communities
  'https://www.stryker.com/us/en/about/news/features/changing-the-course-of-healthcare-in-under-resourced-communities.html': [
    (m, d) => {
      tags(m, "stryker:content-type/news, stryker:content-type/news/Features");
      // the photo pairs as two-column `columns` blocks, below the rule (as in DA)
      photoPairColumns(m, d, m.querySelector('a[href*="Rwanda%20surgical%20center%20img-2"]'));
      photoPairColumns(m, d, m.querySelector('a[href*="Jess%20F%20with%20baby%20Sandrine"]'));
      // the `p-1-5` text is a Heading 3
      sizedTextToH3(m, d);
    },
  ],
  // cns-impact-through-innovation-and-implementation-of-primafit-external-urine-management-system-for-females
  'https://www.stryker.com/us/en/sage/news/2021/cns-impact-through-innovation-and-implementation-of-primafit-external-urine-management-system-for-females.html': [
    (m, d) => {
      // the gold Futura bold labels on stryker.com are the subheads
      labelsToSubheads(m, d, ["Background", "Intervention", "Results", "Conclusion", "About the Clinicians"]);
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news/sage/4, stryker:content-type/news");
      // the small print: `disclaimer` as in DA
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { if (txt(td) === 'disclaimer, references-body-lines') td.textContent = 'disclaimer'; }));
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
      // the serif lead-in is an italic Heading 2 (the Egyptienne headline convention), as in DA
      const uti = find(m, 'p', 'Urinary tract infections (UTIs) are one of the most common');
      style(m, d, uti, null);
      if (uti) { const em = d.createElement('em'); em.append(...uti.childNodes); uti.append(em); retag(m, d, uti, 'h2'); }
    },
  ],
  // new-safety-advisory-from-the-joint-commission
  'https://www.stryker.com/us/en/sage/news/2021/new-safety-advisory-from-the-joint-commission.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
    },
  ],
  // primafit-device-updates
  'https://www.stryker.com/us/en/sage/news/2021/primafit-device-updates.html': [
    (m, d) => {
      // the gold Futura bold labels on stryker.com are the subheads
      labelsToSubheads(m, d, ["Developed in partnership with clinicians for better outcomes", "New enhancements for better care", "Addressing the #1 CAUTI risk factor", "No catheter. No CAUTI.™"]);
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
      // the small print: `disclaimer` as in DA
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => t.querySelectorAll('td').forEach((td) => { if (txt(td) === 'disclaimer, references-body-lines') td.textContent = 'disclaimer'; }));
      // the closing link: bold + italic (the link convention), in one section with the line before it
      dropTextTag(m, d, 'color-teal');
      const more = find(m, 'p', 'To learn more about how Sage can help');
      if (more && !more.querySelector('em')) { const em = d.createElement('em'); em.append(...more.childNodes); more.append(em); }
      style(m, d, more, null);
      mergeWithPrevious(m, more);
      style(m, d, more, null);
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // sage-supports-the-family-health-partnership-clinic-in-mchenry-co
  'https://www.stryker.com/us/en/sage/news/2021/sage-supports-the-family-health-partnership-clinic-in-mchenry-co.html': [
    (m, d) => {
      // the gold Futura bold labels on stryker.com are the subheads
      labelsToSubheads(m, d, ["Raising funds and awareness at the Care4Breast Cancer 5K", "Helping our neighbors", "Donate today – any amount makes a difference!"]);
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
    },
  ],
  // can-brushing-your-teeth-keep-you-healthy-in-the-hospital
  'https://www.stryker.com/us/en/sage/news/2022/can-brushing-your-teeth-keep-you-healthy-in-the-hospital.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
    },
  ],
  // ecri-reports-nvhap-as-a-top-threat-to-patient-safety-in-2022
  'https://www.stryker.com/us/en/sage/news/2022/ecri-reports-nvhap-as-a-top-threat-to-patient-safety-in-2022.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
    },
  ],
  // evergreen-medical-uses-a-kinder-gentler-presurgical-skin-prep
  'https://www.stryker.com/us/en/sage/news/2022/evergreen-medical-uses-a-kinder-gentler-presurgical-skin-prep.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/4");
    },
  ],
  // focusrn-website-is-now-available
  'https://www.stryker.com/us/en/sage/news/2022/focusrn-website-is-now-available.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
    },
  ],
  // health-affairs-urges-policy-makers-to-confront-pneumonia-threat
  'https://www.stryker.com/us/en/sage/news/2022/health-affairs-urges-policy-makers-to-confront-pneumonia-threat.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // infection-control-today-article-about-waterborne-pathogens
  'https://www.stryker.com/us/en/sage/news/2022/infection-control-today-article-about-waterborne-pathogens.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // joint-commission-barbara-quinn-interview-nv-hap-prevention
  'https://www.stryker.com/us/en/sage/news/2022/joint-commission-barbara-quinn-interview-nv-hap-prevention.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news");
      // the reference: no typed number in the list item; the small print is `disclaimer` (as in DA)
      stripListNumbers(m, find(m, 'li', '1. The Joint Commission'));
      style(m, d, find(m, 'li', 'The Joint Commission: Preventing'), 'disclaimer');
    },
  ],
  // poster-presented-at-wocn-shows-comfort-shield-reduces-iad
  'https://www.stryker.com/us/en/sage/news/2022/poster-presented-at-wocn-shows-comfort-shield-reduces-iad.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news/sage/4, stryker:content-type/news");
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // preoperative-strategy-to-reduce-the-risk-of-surgical-site-infect
  'https://www.stryker.com/us/en/sage/news/2022/preoperative-strategy-to-reduce-the-risk-of-surgical-site-infect.html': [
    (m, d) => {
      // the gold Futura bold labels on stryker.com are the subheads
      labelsToSubheads(m, d, ["Surgical Technology International article recommends using chlorhexidine-impregnated cloths instead of a chlorhexidine solution"]);
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
    },
  ],
  // sage-launches-journey-to-zero-to-help-reduce-nurse-injury
  'https://www.stryker.com/us/en/sage/news/2022/sage-launches-journey-to-zero-to-help-reduce-nurse-injury.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
    },
  ],
  // stryker-sea-and-mccd-help-clean-up-hickory-grove-highlands
  'https://www.stryker.com/us/en/sage/news/2022/stryker-sea-and-mccd-help-clean-up-hickory-grove-highlands.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
    },
  ],
  // stryker-womens-network-at-sage-supports-international-womens-day
  'https://www.stryker.com/us/en/sage/news/2022/stryker-womens-network-at-sage-supports-international-womens-day.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
    },
  ],
  // a-magical-celebration-in-cary
  'https://www.stryker.com/us/en/sage/news/2023/a-magical-celebration-in-cary.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
    },
  ],
  // iu-health-decreases-urinary-catheter-usage-and-cauti-rates
  'https://www.stryker.com/us/en/sage/news/2023/iu-health-decreases-urinary-catheter-usage-and-cauti-rates.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/4");
    },
  ],
  // journey-to-zero-program-helps-protect-healthcare-workers
  'https://www.stryker.com/us/en/sage/news/2023/journey-to-zero-program-helps-protect-healthcare-workers.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
    },
  ],
  // nyc-medical-center-implementation-of-external-female-catheter-av
  'https://www.stryker.com/us/en/sage/news/2023/nyc-medical-center-implementation-of-external-female-catheter-av.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news");
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // shea-oral-care-reduction-in-non-ventilator-associated-pneumonia
  'https://www.stryker.com/us/en/sage/news/2023/shea-oral-care-reduction-in-non-ventilator-associated-pneumonia.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news/sage/4, stryker:content-type/news");
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // study-shows-sepsis-occurred-in-20-percent-of-nv-hap-patients
  'https://www.stryker.com/us/en/sage/news/2023/study-shows-sepsis-occurred-in-20-percent-of-nv-hap-patients.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
      // the references: the label on its own line, the entries as a numbered list (as in DA)
      inlineReferencesToList(m, d);
    },
  ],
  // stryker-advances-urology-portfolio-launch-flexible-ureteroscope
  'https://www.stryker.com/us/en/endoscopy/news/stryker-advances-urology-portfolio-launch-flexible-ureteroscope.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:business-unit/endoscopy");
      // the col-8 layout as in DA
      style(m, d, [...m.querySelectorAll('p')].find((p) => txt(p) === 'F88 ureteroscope'), 'image-1-2, col-8');
      style(m, d, find(m, 'p', 'To learn more, visit Stryker'), 'col-8');
    },
  ],
  // sage-launches-new-multi-position-mats-to-help-or-nurses-safely-t
  'https://www.stryker.com/us/en/sage/news/2022/sage-launches-new-multi-position-mats-to-help-or-nurses-safely-t.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
    },
  ],
  // sea-promotes-social-responsibility-with-tree-planting-event-
  'https://www.stryker.com/us/en/sage/news/2022/sea-promotes-social-responsibility-with-tree-planting-event-.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/3");
    },
  ],
  // the-journey-to-zero-program-supports-nurse-safety
  'https://www.stryker.com/us/en/sage/news/2022/the-journey-to-zero-program-supports-nurse-safety.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/1");
    },
  ],
  // study-validates-the-value-of-mobilty-for-older-patients
  'https://www.stryker.com/us/en/sage/news/2023/study-validates-the-value-of-mobilty-for-older-patients.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2");
    },
  ],
  // 2-percent-chlorhexidine-gluconate-cloth-ssi-prevention
  'https://www.stryker.com/us/en/sage/news/2024/2-percent-chlorhexidine-gluconate-cloth-ssi-prevention.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:content-type/news, stryker:content-type/news/sage/2, stryker:business-unit/SAGE");
    },
  ],
  // aeds-role-in-athletics
  'https://www.stryker.com/us/en/emergency-care/news/2024/aeds-role-in-athletics.html': [
    (m, d) => {
      // like the representative school safety page: body-l, bold H3 subheads, no size styles
      bodyLRepresentative(m, d);
      tags(m, "stryker:business-unit/ems/news/articles, stryker:content-type/news");
      // as in DA: a spacer before the Learn More links, the reference as a paragraph
      spacerBefore(m, d, [...m.querySelectorAll('h3')].find((h) => txt(h) === 'Learn More'), 'spacer');
      mergeWithPrevious(m, find(m, 'p', 'Knowing when to use an AED'));
      const refs = [...m.querySelectorAll('ol')].find((ol) => txt(ol).includes('Rothmier'));
      if (refs) refs.replaceWith(...[...refs.children].map((li) => { const p = d.createElement('p'); p.append(...li.childNodes); return p; }));
    },
  ],
  // introducing-ip-bravoe-a-new-standard-in-or-integration
  'https://www.stryker.com/us/en/endoscopy/news/introducing-ip-bravoe-a-new-standard-in-or-integration.html': [
    (m, d) => {
      // body-l theme: it sets the copy (17.5px) and the italic H2 (the Egyptienne subheads, 21px,
      // 24.5px from 600px), so no p-1-25 / p-1-5 / h2-1-25 size styles
      m.setAttribute('data-meta-theme', 'body-l');
      tags(m, 'stryker:content-type/news, stryker:business-unit/endoscopy');
      style(m, d, find(m, 'p', 'As surgical environments evolve'), null);
      // the closing line: bold only (black Futura bold on stryker.com; bold + italic would be
      // the gold label), its link keeps the link colour
      const close = find(m, 'p', 'The future of');
      style(m, d, close, null);
      close?.querySelectorAll('em').forEach((em) => em.replaceWith(...em.childNodes));
    },
  ],
  // school-safety-staff-communication
  'https://www.stryker.com/us/en/smart-care/news/school-safety-staff-communication.html': [
    (m, d) => {
      // body-l theme (17.5px copy, italic H2 at 21px / 24.5px from 600px); no p-1-25 section
      // size styles: the theme sets the copy size
      m.setAttribute('data-meta-theme', 'body-l');
      tags(m, 'stryker:content-type/news, stryker:business-unit/acute-care/news');
      style(m, d, find(m, 'p', 'In today'), null);
      // a section break before each Heading 3, for space above the subheads
      m.querySelectorAll('h3').forEach((h3) => breakBefore(m, d, h3, null));
      [...m.querySelectorAll('table')].filter(isSectionMetadata).forEach((t) => {
        const row = [...t.querySelectorAll('tr')].find((tr) => txt(tr.cells[0]).toLowerCase() === 'style');
        if (!row) return;
        const rest = txt(row.cells[1]).split(',').map((v) => v.trim()).filter((v) => v && v !== 'p-1-25');
        if (rest.length) row.cells[1].textContent = rest.join(', ');
        else if (t.querySelectorAll('tr').length <= 2) t.remove();
        else row.remove();
      });
    },
  ],
  // how-augmented-reality-can-help-care-teams-plan--design-and-const
  'https://www.stryker.com/us/en/about/news/2024/features/how-augmented-reality-can-help-care-teams-plan--design-and-const.html': [
    (m, d) => {
      // full width with the body-l theme (17.5px copy, italic H2 at 21px / 24.5px from 600px)
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      tags(m, 'stryker:content-type/news/product-bulletins, stryker:content-type/news, stryker:content-type/news/Features, stryker:content-type/news/advanced-digital-healthcare');
      // the full-bleed image row on a light gray band, as in DA
      const cols = blockTable(m, 'columns');
      if (cols && !sectionOf(m, cols).some(isSectionMetadata)) {
        const section = sectionOf(m, cols);
        section[section.length - 1].after(WebImporter.Blocks.createBlock(d, { name: 'Section Metadata', cells: { style: 'full-bleed', background: 'light-gray' } }));
      }
    },
  ],
  // advancing-surgical-education-highlights-from-ispies-at-ircad
  'https://www.stryker.com/us/en/endoscopy/news/advancing-surgical-education-highlights-from-ispies-at-ircad.html': [
    (m, d) => {
      // full width with the body-l theme (17.5px copy); the copy and heading sizes come from the
      // theme and the template, not from size styles
      m.setAttribute('data-meta-theme', 'full-width, body-l');
      tags(m, 'stryker:business-unit/endoscopy, stryker:content-type/news');
      const body = find(m, 'p', 'In mid-October, Endoscopy');
      style(m, d, body, null);
      // the Egyptienne subheads: italic Heading 2
      m.querySelectorAll('h2').forEach((h2) => {
        if (h2.querySelector('em') || !txt(h2)) return;
        const em = d.createElement('em');
        em.append(...h2.childNodes);
        h2.append(em);
      });
      // as in DA: a small spacer, the social share block and a spacer under the title
      const spacer = sectionOf(m, m.querySelector('h1'))[0]?.nextElementSibling?.nextElementSibling;
      if (isSectionMetadata(spacer) && !blockTable(m, 'social share corp')) {
        style(m, d, spacer, 'spacer,small');
        socialShareAfter(m, d, spacer);
        spacerBefore(m, d, body, 'spacer');
      }
    },
  ],
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
