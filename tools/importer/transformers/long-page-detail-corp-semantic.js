/**
 * long-page-detail-corp: semantic output (rework without bracket tags, 2026-11-16).
 *
 * The structure transformers (long-page-detail-corp-article / -sections / -components) mark
 * the source's sizes, fonts and colours as intermediate `[[class]text]` tags. This last step
 * turns every one of them into the approved semantic markup (plan
 * .migration/plans/long-page-detail-rework-without-brackets.md §4), so the imported page has
 * no bracket syntax (AGENTS.md):
 * - gold → Bold + Italic; white / light grey / other accents → the container's colour;
 * - a whole line in a size tag → a heading level (1.75em H2, 1.5em H3 + Bold, 1.25em Bold
 *   H4), an Egyptienne line in a heading → Italic (heading + italic = Egyptienne light);
 * - a Large Headline section (`headline-box`) → one `Columns (large-headline)` block: H1
 *   4vw title (`title` option when fully Bold), H5 5vw Futura line, H2 Italic 4vw / H3 Italic
 *   3.5vw Egyptienne lines, H2 Bold 2vw, 1.5vw text;
 * - an enlarged rich-text title (`h4-2-5`) and subtitle stay page text, with the page theme
 *   `thank-you-large` (body `data-semantic-theme`, read by the import script);
 * - the typography section styles (`p-*`, `serif`, `h-serif`, `h2-1-5`, `h3-1-25`,
 *   `h4-2-5`, `bold-body`) are dropped.
 * Anything not mapped is unwrapped (its text kept) and logged.
 */

const TYPO_STYLES = new Set(['p-1', 'p-1-25', 'p-1-5', 'p-1-75', 'p-2', 'p-2-5', 'p-3-5', 'serif',
  'h-serif', 'h2-1-5', 'h3-1-25', 'h4-2-5', 'bold-body']);
const INLINE = /^(A|B|BR|DEL|EM|I|S|SPAN|STRONG|SUB|SUP|U)$/;
const TAG_RE = /\[\[([^\][]+)\]([^\][]*)\]/g;
const BRACKET_RE = /\[\[([^\][]+)\]|\[|\]/g;

/* ---- 1. the intermediate tags → spans with data-tag (as the former scripts/span-tags.js) ---- */

function parseTags(raw) {
  const names = raw.split(',').map((n) => n.trim());
  return names.every((n) => /^[\w-]+$/.test(n)) ? names : [];
}

function containerOf(node) {
  let el = node.parentElement;
  while (el && INLINE.test(el.tagName) && el.parentElement) el = el.parentElement;
  return el;
}

function textNodes(doc, container) {
  const out = [];
  const w = doc.createTreeWalker(container, 4);
  while (w.nextNode()) if (containerOf(w.currentNode) === container) out.push(w.currentNode);
  return out;
}

function tagSpan(doc, tags, ...content) {
  const span = doc.createElement('span');
  span.dataset.tag = tags.join(' ');
  span.append(...content);
  return span;
}

function replaceInText(doc, node) {
  const text = node.nodeValue;
  const parts = [];
  let last = 0;
  [...text.matchAll(TAG_RE)].forEach((m) => {
    const tags = parseTags(m[1]);
    if (!tags.length) return;
    parts.push(text.slice(last, m.index), tagSpan(doc, tags, m[2]));
    last = m.index + m[0].length;
  });
  if (!last) return;
  parts.push(text.slice(last));
  node.replaceWith(...parts.filter((p) => p !== ''));
}

function removeIfEmpty(node, container) {
  let cur = node;
  while (cur && cur !== container && !cur.textContent && !(cur.querySelector && cur.querySelector('br, img'))) {
    const parent = cur.parentNode;
    cur.remove();
    cur = parent;
  }
}

function wrapMultiNode(doc, container) {
  const open = [];
  let found;
  textNodes(doc, container).some((node) => [...node.nodeValue.matchAll(BRACKET_RE)].some((m) => {
    if (m[0] !== ']') {
      open.push({ node, m });
      return false;
    }
    const opener = open.pop();
    if (!opener || !opener.m[1] || opener.node === node) return false;
    const tags = parseTags(opener.m[1]);
    if (!tags.length) return false;
    found = {
      openNode: opener.node, open: opener.m, closeNode: node, closeIndex: m.index, tags,
    };
    return true;
  }));
  if (!found) return false;
  const {
    openNode, closeNode, closeIndex, tags,
  } = found;
  const text = openNode.nodeValue;
  const range = doc.createRange();
  range.setStart(openNode, found.open.index + found.open[0].length);
  range.setEnd(closeNode, closeIndex);
  const span = tagSpan(doc, tags, range.extractContents());
  range.insertNode(span);
  openNode.nodeValue = text.slice(0, found.open.index);
  closeNode.nodeValue = closeNode.nodeValue.slice(1);
  removeIfEmpty(openNode, container);
  removeIfEmpty(closeNode, container);
  return true;
}

function tagsToSpans(doc, main) {
  const containers = new Set();
  const w = doc.createTreeWalker(main, 4);
  while (w.nextNode()) if (w.currentNode.nodeValue.includes('[[')) containers.add(containerOf(w.currentNode));
  containers.forEach((c) => {
    textNodes(doc, c).filter((n) => n.nodeValue.includes('[[')).forEach((n) => replaceInText(doc, n));
    while (wrapMultiNode(doc, c));
  });
}

/* ---- helpers ---- */

const tagsOf = (el) => (el.dataset.tag || '').split(' ').filter(Boolean);
const norm = (t) => t.replace(/\s+/g, ' ').trim();
const spansIn = (el) => [...el.querySelectorAll('span[data-tag]')];

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

function rename(doc, el, tag) {
  const out = doc.createElement(tag);
  out.append(...el.childNodes);
  el.replaceWith(out);
  return out;
}

/** the vw size of a headline tag (`headline-3-5` → 3.5) */
function headlineSize(tags) {
  const t = tags.find((n) => /^headline-\d/.test(n));
  return t ? Number(t.slice(9).replace('-', '.')) : 0;
}

/** the largest headline size, and whether every text of the element is Futura (not serif) */
function lineInfo(el) {
  const spans = spansIn(el);
  const size = Math.max(0, ...spans.map((s) => headlineSize(tagsOf(s))));
  const serif = spans.some((s) => tagsOf(s).includes('serif'));
  const bold = !!el.querySelector('strong, b') && norm([...el.querySelectorAll('strong, b')]
    .map((b) => b.textContent).join('')) === norm(el.textContent);
  return { size, serif, bold };
}

/** wraps the children of a node in an element */
function wrapChildren(doc, node, tag) {
  const w = doc.createElement(tag);
  w.append(...node.childNodes);
  node.append(w);
  return w;
}

/** gold: Bold + Italic around the span's text (inside an existing bold, or adding one) */
function gold(doc, span) {
  const inBold = span.closest('strong, b');
  const hasBold = span.querySelector('strong, b');
  if (!inBold && !hasBold) wrapChildren(doc, span, 'strong');
  if (!span.closest('em, i')) {
    const em = doc.createElement('em');
    span.before(em);
    em.append(span);
  }
}

/**
 * Egyptienne text in a heading → Italic, around each run of its words that is not gold (a gold
 * run is Bold + Italic and stays Futura)
 */
function serifInHeading(doc, span) {
  // Bold words are Futura bold whatever the font tag (Bold + Italic would make them gold): an
  // Egyptienne tag inside a Bold (Mako "That's Mako SmartRobotics™") or around one stays plain
  if (span.closest('strong, b, em, i')) return;
  const runs = [];
  let run = [];
  [...span.childNodes].forEach((n) => {
    const isGold = n.nodeType === 1 && (n.matches('em, i, strong, b') || !!n.querySelector('strong, b, em, i')
      || (n.matches('span[data-tag]') && tagsOf(n).some((t) => t === 'color-gold')));
    if (isGold) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push(n);
  });
  if (run.length) runs.push(run);
  runs.forEach((r) => {
    if (!norm(r.map((n) => n.textContent).join(''))) return;
    const em = doc.createElement('em');
    r[0].before(em);
    em.append(...r);
  });
}

/* ---- 2. sections ---- */

function sectionsOf(main) {
  const out = [];
  let cur = { nodes: [], meta: null };
  [...main.children].forEach((el) => {
    if (el.tagName === 'HR') {
      out.push(cur);
      cur = { nodes: [], meta: null, hr: el };
      return;
    }
    const head = el.tagName === 'TABLE' && norm(el.querySelector('tr')?.textContent || '');
    if (head && /^section metadata$/i.test(head)) cur.meta = el;
    else cur.nodes.push(el);
  });
  out.push(cur);
  return out;
}

function metaRow(meta, key) {
  if (!meta) return null;
  return [...meta.querySelectorAll('tr')].find((tr) => norm(tr.children[0]?.textContent || '').toLowerCase() === key);
}

function styleOf(section) {
  const row = metaRow(section.meta, 'style');
  return row ? row.children[1].textContent.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function setStyle(section, styles) {
  const row = metaRow(section.meta, 'style');
  if (!row) return;
  if (styles.length) {
    row.children[1].textContent = styles.join(', ');
    return;
  }
  row.remove();
  // a metadata table left with only its header row: removed
  if (section.meta.querySelectorAll('tr').length <= 1) {
    section.meta.remove();
    section.meta = null;
  }
}

/* ---- 3. Large Headline sections → Columns (large-headline) ---- */

/** one Large Headline line (a paragraph or heading with headline tags) → its semantic element */
function headlineLine(doc, el, ctx) {
  const { size, serif, bold } = lineInfo(el);
  let tag = 'p';
  if (el.tagName === 'H1') {
    tag = 'h1';
    if (bold && !serif) ctx.title = true;
  } else if (size >= 4.75) tag = 'h5';
  else if (size >= 3.75 && serif) tag = 'h2';
  else if (size >= 2.75 && serif) tag = 'h3';
  else if (size >= 2.25 && serif) tag = 'h4';
  else if (size >= 1.75 && !serif) tag = 'h2';
  else if (size >= 2.75) ctx.warn.push(`large headline line ${size}vw Futura: "${norm(el.textContent).slice(0, 40)}"`);
  const line = tag === el.tagName.toLowerCase() ? el : rename(doc, el, tag);
  // the italic lines (H2 / H3 Egyptienne) are all Italic
  if ((tag === 'h2' || tag === 'h3') && serif) {
    spansIn(line).forEach((s) => unwrap(s));
    if (!line.querySelector(':scope > em:only-child')) wrapChildren(doc, line, 'em');
  }
  return line;
}

/** adds a page theme (body `data-semantic-theme`, comma-separated; read by the import script) */
function addTheme(main, theme) {
  const themes = (main.getAttribute('data-semantic-theme') || '').split(',').map((t) => t.trim()).filter(Boolean);
  if (!themes.includes(theme)) themes.push(theme);
  main.setAttribute('data-semantic-theme', themes.join(', '));
}

function largeHeadlines(doc, main, warn) {
  sectionsOf(main).forEach((section) => {
    const styles = styleOf(section);
    const isBox = styles.includes('headline-box');
    // an enlarged rich-text title (`h4-2-5`: stryker.com h4 at 2.5em, the Mako Live thank-you
    // page) stays plain page text; the page theme `thank-you-large` sets its size
    if (styles.includes('h4-2-5') && !isBox) {
      addTheme(main, 'thank-you-large');
      return;
    }
    // a Large Headline (`headline-box`) stays plain text in its section: each line becomes the
    // heading level of its size, and the page theme `large-headlines` sizes them
    const lines = section.nodes.filter((n) => /^(P|H[1-6])$/.test(n.tagName)
      && n.querySelector('span[data-tag^="headline-"], span[data-tag*=" headline-"]'));
    // a Large Headline title as the page's Heading 1 outside a box (TEACH talks "Tips and
    // tricks for glenoid exposure"): the same theme, its title 4vw (3.5vw normalised, §4.3)
    if (!isBox && lines.some((n) => n.tagName === 'H1')) {
      addTheme(main, 'large-headlines');
      return;
    }
    if (!lines.length || !isBox) return;
    const ctx = { title: false, warn };
    lines.forEach((n) => headlineLine(doc, n, ctx));
    addTheme(main, 'large-headlines');
  });
}

/* ---- 3a. page groups with a page theme (default content only; plan §4.2, 2026-11-16) ---- */

const PAGE_THEMES = [
  [/\/care-settings\/asc\//i, 'asc'],
  [/\/clinical\/clout(\.html)?$/i, 'clout'],
];

/** the size whose tags cover most of an element's text (a quote mark at 3vw in a 2.5vw line) */
function dominantSize(el) {
  const by = new Map();
  const w = el.ownerDocument.createTreeWalker(el, 4);
  while (w.nextNode()) {
    const n = w.currentNode;
    const len = norm(n.textContent).length;
    if (len) {
      let size = 0;
      for (let p = n.parentElement; p && p !== el.parentElement && !size; p = p.parentElement) {
        if (p.dataset?.tag) size = Math.max(0, ...tagsOf(p).map((t) => (/^headline-\d/.test(t) ? headlineSize([t]) : 0)));
      }
      by.set(size, (by.get(size) || 0) + len);
    }
  }
  return [...by.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
}

/** splits a line at a line break where its parts are in different Large Headline sizes */
function splitBySize(doc, p) {
  const brs = [...p.querySelectorAll('br')].filter((b) => {
    for (let el = b.parentElement; el !== p; el = el.parentElement) {
      if (!/^(SPAN|STRONG|B|EM|I)$/.test(el.tagName)) return false;
    }
    return true;
  });
  const br = brs.find((b) => {
    const r = doc.createRange();
    r.setStart(p, 0);
    r.setEndBefore(b);
    const head = doc.createElement('p');
    head.append(r.cloneContents());
    const tail = doc.createElement('p');
    r.setStartAfter(b);
    r.setEnd(p, p.childNodes.length);
    tail.append(r.cloneContents());
    return norm(head.textContent) && norm(tail.textContent)
      && dominantSize(head) !== dominantSize(tail);
  });
  if (!br) return [p];
  const r = doc.createRange();
  r.setStart(p, 0);
  r.setEndBefore(br);
  const first = doc.createElement('p');
  first.append(r.extractContents());
  br.remove();
  p.before(first);
  return [first, ...splitBySize(doc, p)];
}

/**
 * ASC page text (theme `asc`): a Large Headline in a full-bleed band (build-your-ASC "Let's
 * get started." band, the customer quote) gets the Large Headline levels by its main size:
 * 5vw+ H5, 3.5–4.5vw H3 (Italic when Egyptienne), 2.5vw H4, 2vw H2, smaller a paragraph
 */
function ascHeadlines(doc, main) {
  sectionsOf(main).forEach((section) => {
    const styles = styleOf(section);
    if (styles.includes('headline-box') || !styles.includes('full-bleed')) return;
    const lines = section.nodes.filter((n) => n.tagName === 'P'
      && n.querySelector('span[data-tag^="headline-"], span[data-tag*=" headline-"]'));
    lines.flatMap((p) => splitBySize(doc, p)).forEach((p) => {
      const size = dominantSize(p);
      const serif = spansIn(p).some((s) => tagsOf(s).includes('serif'));
      let tag = 'p';
      if (size >= 4.75) tag = 'h5';
      else if (size >= 2.75) tag = 'h3';
      else if (size >= 2.25) tag = 'h4';
      else if (size >= 1.75) tag = 'h2';
      if (tag === 'p') return;
      const h = rename(doc, p, tag);
      // trailing / leading line breaks of the source lines
      while (h.firstChild?.nodeName === 'BR') h.firstChild.remove();
      if (tag === 'h3' && serif) wrapChildren(doc, h, 'em');
    });
  });
}

/** an element whose whole text is in one size tag: the tag's name (`text-1-5`), else '' */
function wholeSize(el) {
  const spans = spansIn(el).filter((s) => tagsOf(s).some((t) => /^text-\d/.test(t)));
  const s = spans.find((sp) => norm(sp.textContent) === norm(el.textContent));
  return s ? tagsOf(s).find((t) => /^text-\d/.test(t)) : '';
}

/** adds a variant to a block table's name ("Columns (stack)" → "Columns (stack, large-copy)") */
function addVariant(table, variant) {
  const cell = table.querySelector('tr > th, tr > td');
  const name = norm(cell.textContent);
  const m = name.match(/^([^(]+?)\s*(?:\((.*)\))?$/);
  const opts = (m[2] || '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!opts.includes(variant)) opts.push(variant);
  cell.textContent = `${m[1]} (${opts.join(', ')})`;
}

/* ---- 3b. step 1c blocks: heroes, Columns cells, copy sizes (plan §4.2) ---- */

const blockName = (table) => norm(table.querySelector('tr')?.textContent || '').toLowerCase();
const blocksNamed = (main, re) => [...main.querySelectorAll('table')].filter((t) => re.test(blockName(t)));
/** the size of a line in vw-like units: `headline-N` (vw) or `text-N` (em, the hero's em sizes) */
const tagSize = (t) => {
  const m = t.match(/^(headline|text)-(\d+)(?:-(\d+))?$/);
  return m ? Number(`${m[2]}.${m[3] || 0}`) : 0;
};
const lineSize = (el) => Math.max(0, ...spansIn(el).flatMap((s) => tagsOf(s).map(tagSize)));
const hasTag = (el, re) => spansIn(el).some((s) => tagsOf(s).some((t) => re.test(t)));
const fullyBold = (el) => !!norm(el.textContent)
  && norm([...el.querySelectorAll('strong, b')].map((b) => b.textContent).join('')) === norm(el.textContent);
/** a line that is a link alone: a button or action link (authoring conventions), never a heading
 * (ASC implants-and-disposables "LEARN MORE", Bold + Italic: the gold button) */
const linkLine = (el) => {
  const links = el.querySelectorAll('a');
  return links.length === 1 && !!norm(el.textContent)
    && norm(links[0].textContent) === norm(el.textContent);
};

/** the section (its Section Metadata table, created when missing) of a block table */
function metaTableOf(doc, main, table) {
  const section = sectionsOf(main).find((s) => s.nodes.includes(table));
  if (!section) return null;
  if (section.meta) return section.meta;
  const meta = doc.createElement('table');
  const head = doc.createElement('tr');
  const th = doc.createElement('th');
  th.setAttribute('colspan', '2');
  th.textContent = 'Section Metadata';
  head.append(th);
  meta.append(head);
  const last = section.nodes[section.nodes.length - 1];
  last.after(meta);
  section.meta = meta;
  return meta;
}

function setMetaRow(doc, meta, key, value) {
  const row = metaRow(meta, key.toLowerCase());
  if (row) {
    row.children[1].textContent = value;
    return;
  }
  const tr = doc.createElement('tr');
  [key, value].forEach((v) => {
    const td = doc.createElement('td');
    td.textContent = v;
    tr.append(td);
  });
  meta.append(tr);
}

/**
 * Hero Corp text: the line(s) at the largest Large Headline size are the title, one Heading 1
 * (plain words Egyptienne light, Bold words Futura bold); the size is the hero option: below
 * 3vw the template's 2.5vw (SKILL's 35px included), 3–4.5vw `large` (4vw), from 5vw `xlarge`
 * (5.5vw; upper extremities' 9vw included). White or light grey text → `Text colour`.
 */
function heroes(doc, main) {
  blocksNamed(main, /^hero corp\b/).forEach((table) => {
    const rows = [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')];
    if (rows.length < 2) return;
    // the text rows (not the image rows: a link alone to a Dynamic Media image); a text row
    // of bare text is one line (BACS banners: the title row with its subtitle)
    const isImage = (c) => {
      const a = c.querySelector('a');
      return !!a && norm(c.textContent) === norm(a.textContent) && /\/is\/image\//.test(a.getAttribute('href') || '');
    };
    const cells = rows.slice(1).map((r) => r.lastElementChild)
      .filter((c) => c && norm(c.textContent) && !isImage(c));
    if (!cells.length) return;
    cells.forEach((c) => {
      if ([...c.children].some((n) => /^(P|H[1-6])$/.test(n.tagName))) return;
      const p = doc.createElement('p');
      p.append(...c.childNodes);
      c.append(p);
    });
    const lines = cells.flatMap((c) => [...c.children])
      .filter((n) => /^(P|H[1-6])$/.test(n.tagName) && norm(n.textContent));
    const sized = lines.filter((l) => hasTag(l, /^(headline|text)-\d/));
    const max = sized.length ? Math.max(...sized.map(lineSize)) : 0;
    // a smaller line at the end of a title line is its own line (BACS "To facilitate smooth
    // and efficient pre-approvals" after the 2.5em "BACS Accelerate")
    const ownSize = (s) => Math.max(0, ...tagsOf(s).map(tagSize));
    sized.filter((l) => lineSize(l) >= max - 0.5).forEach((l) => {
      const spans = spansIn(l);
      const big = spans.findIndex((s) => ownSize(s) >= max - 0.5);
      // spans are in document order: a small one after the first big one, not around it
      // (a line of words, not a mark such as SKILL NeuroElite's "TM")
      const small = spans.find((s, i) => i > big && !spans[big].contains(s) && ownSize(s)
        && ownSize(s) < max - 0.5 && !spansIn(s).some((x) => ownSize(x) >= max - 0.5)
        && norm(s.textContent).split(' ').length >= 2);
      if (big < 0 || !small) return;
      const range = doc.createRange();
      range.setStartBefore(small);
      range.setEnd(l, l.childNodes.length);
      const rest = doc.createElement('p');
      rest.append(range.extractContents());
      if (norm(rest.textContent)) {
        l.after(rest);
        lines.splice(lines.indexOf(l) + 1, 0, rest);
      }
    });
    // copy sizes (1.25em / 1.5em: the foot & ankle toolkit banners' text) are no title; the
    // page's first hero title is its Heading 1, a later hero's a Heading 2
    if (max >= 2) {
      // the title: the largest lines, next to each other
      const first = sized.findIndex((l) => lineSize(l) >= max - 0.5);
      const title = [];
      const big = (l) => lineSize(l) >= max - 0.5;
      for (let i = lines.indexOf(sized[first]); i < lines.length && big(lines[i]); i += 1) {
        title.push(lines[i]);
      }
      if (!title.length) title.push(sized[first]);
      const otherH1 = [...main.querySelectorAll('h1')].some((h) => !title.includes(h));
      const h1 = doc.createElement(otherH1 ? 'h2' : 'h1');
      title.forEach((l, i) => {
        if (i) h1.append(doc.createElement('br'));
        h1.append(...l.childNodes);
      });
      title[0].replaceWith(h1);
      title.slice(1).forEach((l) => l.remove());
      // leading and trailing line breaks of the source lines
      while (h1.firstChild && (h1.firstChild.nodeName === 'BR' || (h1.firstChild.nodeType === 3 && !h1.firstChild.textContent.trim()))) h1.firstChild.remove();
      while (h1.lastChild && (h1.lastChild.nodeName === 'BR' || (h1.lastChild.nodeType === 3 && !h1.lastChild.textContent.trim()))) h1.lastChild.remove();
      // em sizes (CLOUT, employee benefits 3.5em) top out at `large`
      const em = /^text-/.test(spansIn(h1).flatMap(tagsOf).find((t) => tagSize(t) === max) || '');
      if (max >= 5 && !em) addVariant(table, 'xlarge');
      else if (max >= 3) addVariant(table, 'large');
    }
    // the copy (lines that are no title): 1.25em → `large-copy`, Egyptienne → `serif` (the
    // foot & ankle toolkit banners)
    const copy = cells.flatMap((c) => [...c.querySelectorAll(':scope > p')])
      .filter((p) => norm(p.textContent) && !(p.querySelector('a') && norm(p.textContent) === norm(p.querySelector('a').textContent)));
    const most = (test) => copy.length && copy.filter(test).length * 2 > copy.length;
    if (most((p) => wholeSize(p) === 'text-1-25')) addVariant(table, 'large-copy');
    // 1.5em copy (CLOUT "The largest prospective mechanical thrombectomy study…")
    else if (most((p) => wholeSize(p) === 'text-1-5')) addVariant(table, 'xlarge-copy');
    if (most((p) => spansIn(p).some((s) => tagsOf(s).includes('serif') && norm(s.textContent) === norm(p.textContent)))) addVariant(table, 'serif');
    // text colour: white / light grey words (not in a dark text box, which is white anyway)
    // (the section's Section Metadata table is only created when a row is written)
    const existing = sectionsOf(main).find((s) => s.nodes.includes(table))?.meta;
    const box = norm(metaRow(existing, 'text box')?.children[1]?.textContent || '').toLowerCase();
    const count = (tag) => cells.flatMap(spansIn).filter((s) => tagsOf(s).includes(tag) && !s.parentElement.closest(`span[data-tag~="${tag}"]`))
      .reduce((n, s) => n + norm(s.textContent).length, 0);
    const white = count('color-white');
    const gray = count('color-light-gray');
    // light grey copy beside a dark text box (the 3 BACS heroes: the box text stays white)
    let colour = '';
    if (gray) colour = 'light-gray';
    else if (white && !/purple|teal|blue/.test(box)) colour = 'white';
    const meta = colour ? metaTableOf(doc, main, table) : null;
    if (meta) setMetaRow(doc, meta, 'Text colour', colour);
  });
}

/**
 * Columns: the cell lines and labels of step 1c.
 * - a box-tagged first line: `phase-boxes` (gradients: H3, Bold phase + Italic name) or
 *   `title-bars` (solid colours: H2, Italic plain words + Bold words);
 * - a fully Bold 2em line: H2 + `large-titles` (28px); a fully Bold 2.5em line: a fully Bold
 *   H2 (the 35px display line);
 * - Bold in the running font (`body-font`): `plain-bold`;
 * - whole paragraphs in 1.25em / 1.5em copy: `large-copy` / `xlarge-copy` (Accordion and
 *   Panel: `large-copy`).
 */
function columnsCells(doc, main) {
  blocksNamed(main, /^(columns|accordion|panel)\b/).forEach((table) => {
    const isColumns = /^columns\b/.test(blockName(table));
    const cells = [...table.querySelectorAll('td')].filter((td) => td.closest('table') === table);
    // Panel: a 2.5em box line is its title, an H2 + `large-titles` (TEACH talks "TEACH Talks:
    // Course overview", bare text in the box)
    if (/^panel\b/.test(blockName(table))) {
      cells.forEach((td) => {
        if (!norm(td.textContent) || [...td.children].some((n) => /^(P|H[1-6]|UL|OL)$/.test(n.tagName))) return;
        const p = doc.createElement('p');
        p.append(...td.childNodes);
        td.append(p);
      });
      cells.flatMap((td) => [...td.querySelectorAll(':scope > p')]).forEach((p) => {
        if (wholeSize(p) !== 'text-2-5') return;
        rename(doc, p, 'h2');
        addVariant(table, 'large-titles');
      });
    }
    cells.forEach((td) => {
      const firstLine = td.querySelector(':scope > p');
      if (isColumns && firstLine && firstLine === td.firstElementChild && hasTag(firstLine, /^box-/)) {
        const gradient = hasTag(firstLine, /^box-.*-gradient$/);
        const h = rename(doc, firstLine, gradient ? 'h3' : 'h2');
        spansIn(h).forEach(unwrap);
        // plain words → Italic (Egyptienne), Bold words stay
        [...h.childNodes].forEach((n) => {
          if (n.nodeType === 3 && n.textContent.trim()) {
            const em = doc.createElement('em');
            n.before(em);
            em.append(n);
          }
        });
        while (h.lastChild && (h.lastChild.nodeName === 'BR' || (h.lastChild.nodeType === 3 && !h.lastChild.textContent.trim()))) h.lastChild.remove();
        addVariant(table, gradient ? 'phase-boxes' : 'title-bars');
      }
    });
    const ps = cells.flatMap((td) => [...td.querySelectorAll('p')]);
    ps.forEach((p) => {
      if (!isColumns || !fullyBold(p) || linkLine(p)) return;
      const size = wholeSize(p);
      if (size === 'text-2') {
        const h = rename(doc, p, 'h2');
        h.querySelectorAll('strong, b').forEach(unwrap);
        addVariant(table, 'large-titles');
      } else if (size === 'text-2-5') {
        rename(doc, p, 'h2');
      } else if (!size && dominantSize(p) >= 4.75) {
        // a 5vw+ Bold line in a cell: a stat number, a fully Bold Heading 2 (the page keeps one
        // Heading 1; the CLOUT theme sizes it: ">90%")
        rename(doc, p, 'h2');
      }
    });
    if (isColumns) {
      // a 1.25em plain line right under a 1.5em Bold title line: `large-subtitles` (jr45
      // faculty "New York, NY" under "**Darwin Chen, M.D.**")
      const subtitle = cells.some((td) => [...td.querySelectorAll(':scope > p')].some((p) => {
        const prev = p.previousElementSibling;
        return wholeSize(p) === 'text-1-25' && !fullyBold(p) && prev?.tagName === 'P'
          && fullyBold(prev) && wholeSize(prev) === 'text-1-5';
      }));
      if (subtitle) addVariant(table, 'large-subtitles');
      // a text-only cell in the Large Headline 1.5vw copy: `headline-copy` (jr45 "Watch
      // Darwin Chen, M.D., … as they discuss …", bare text in its cell)
      cells.forEach((td) => {
        if (td.querySelector('a, img, picture') || !norm(td.textContent)) return;
        const whole = spansIn(td).find((s) => tagsOf(s).includes('headline-1-5') && norm(s.textContent) === norm(td.textContent));
        if (!whole) return;
        if (![...td.children].some((n) => /^(P|H[1-6]|UL|OL)$/.test(n.tagName))) {
          const p = doc.createElement('p');
          p.append(...td.childNodes);
          td.append(p);
        }
        addVariant(table, 'headline-copy');
      });
      // a line's first Bold in Futura before a Bold in the running font: `label-bold` (TEACH
      // "**Chapter 1:** **Kinematics of our shoulder…**", the title body-font Bold)
      const labelled = cells.some((td) => [...td.querySelectorAll('p')].some((p) => {
        const first = p.firstElementChild;
        return first?.matches('strong, b') && !first.querySelector('span[data-tag~="body-font"]')
          && [...p.querySelectorAll('span[data-tag~="body-font"]')]
            .some((s) => !first.contains(s) && (s.querySelector('strong, b') || s.closest('strong, b')));
      }));
      if (labelled) addVariant(table, 'label-bold');
    }
    // a fully Bold line under an image at the body size on stryker.com (no size tag, not
    // gold) is a product name, not a caption: `product-names` (nse attachments)
    const imageLink = (p) => {
      const a = p?.tagName === 'P' && p.querySelector('a');
      return !!a && norm(p.textContent) === norm(a.textContent) && /\/is\/image\//.test(a.getAttribute('href') || '');
    };
    if (isColumns && cells.some((td) => [...td.querySelectorAll(':scope > p')].some((p) => imageLink(p.previousElementSibling)
      && fullyBold(p) && !hasTag(p, /^(text-|headline-|color-gold$)/)))) {
      addVariant(table, 'product-names');
    }
    if (isColumns && spansIn(table).some((s) => tagsOf(s).includes('body-font') && (s.closest('strong, b') || s.querySelector('strong, b')))) {
      addVariant(table, 'plain-bold');
    }
    const copy = [...table.querySelectorAll('td p, td li')].filter((p) => norm(p.textContent) && !fullyBold(p));
    const sizeShare = (tag) => copy.filter((p) => wholeSize(p) === tag).length;
    if (copy.length && sizeShare('text-1-25') * 2 > copy.length) addVariant(table, 'large-copy');
    else if (isColumns && copy.length && sizeShare('text-1-5') * 2 > copy.length) addVariant(table, 'xlarge-copy');
  });
}

/** a heading-size Bold first line with more under it after a line break: its own line, so it
 * can become the heading (jr45 faculty "**Darwin Chen, M.D.**" over "New York, NY"; in a
 * cell also a 2em / 2.5em line: giving-back "$11.3M" over "contributed*") */
function splitTitleLines(doc, main) {
  // a Columns cell of bare text is one paragraph (CLOUT stat cells, jr45 "Watch …")
  blocksNamed(main, /^columns\b/).forEach((t) => t.querySelectorAll('td').forEach((td) => {
    if (td.closest('table') !== t || !norm(td.textContent) || td.querySelector('a, img, picture')
      || [...td.children].some((n) => /^(P|H[1-6]|UL|OL|DIV|TABLE)$/.test(n.tagName))) return;
    const p = doc.createElement('p');
    p.append(...td.childNodes);
    td.append(p);
  }));
  main.querySelectorAll('td p, :scope > p').forEach((p) => {
    // the first line break, also inside the tags around the whole paragraph (corporate
    // responsibility "[[text-1-5]**Physical**<br>…]" under its icon)
    const br = [...p.querySelectorAll('br')].find((b) => {
      for (let el = b.parentElement; el !== p; el = el.parentElement) {
        if (!/^(SPAN|STRONG|B|EM|I)$/.test(el.tagName)) return false;
      }
      return true;
    });
    if (!br) return;
    const range = doc.createRange();
    range.setStart(p, 0);
    range.setEndBefore(br);
    const holder = doc.createElement('p');
    holder.append(range.cloneContents());
    if (!norm(holder.textContent)) return;
    // (in a cell also a 5vw+ stat number over its label: CLOUT ">90%" over "Complete or
    // near-complete thrombus removal*")
    const sizes = p.closest('td')
      ? /^(text-(1-25|1-5|1-75|2|2-5)|headline-([5-9]|5-5))$/ : /^text-1-(5|75)$/;
    const size = spansIn(holder).filter((s) => tagsOf(s).some((t) => sizes.test(t)))
      .find((s) => norm(s.textContent) === norm(holder.textContent));
    if (!size || !fullyBold(holder)) return;
    const first = doc.createElement('p');
    first.append(range.extractContents());
    br.remove();
    p.before(first);
  });
}

/** 1.25em copy in the page's own text (default content: SKILL, ASC): the theme `large-copy` */
function pageCopy(main) {
  const own = [...main.children].flatMap((el) => (/^(P|UL|OL)$/.test(el.tagName) ? [el] : []))
    .flatMap((el) => (el.tagName === 'P' ? [el] : [...el.querySelectorAll('li')]))
    .filter((p) => norm(p.textContent) && !fullyBold(p));
  if (own.length && own.filter((p) => wholeSize(p) === 'text-1-25').length * 2 > own.length) addTheme(main, 'large-copy');
}

/* ---- 4. sizes and fonts outside Large Headlines ---- */

function sizeLines(doc, main) {
  main.querySelectorAll('p').forEach((p) => {
    // hero text keeps its lines (heroes(), above)
    const block = p.closest('table');
    if (block && /^hero corp\b/.test(blockName(block))) return;
    const size = wholeSize(p);
    if (!size) return;
    const bold = norm([...p.querySelectorAll('strong, b')].map((b) => b.textContent).join('')) === norm(p.textContent);
    if (!bold || linkLine(p)) return;
    if (size === 'text-1-5') rename(doc, p, 'h3');
    else if (size === 'text-1-25') rename(doc, p, 'h4');
    else if (size === 'text-1-75') {
      // a Heading 2 without Bold: the 24.5px Futura bold H2 (a fully Bold H2 in Columns is the
      // 35px display line). With a gold part it stays Bold: a Bold heading with a gold
      // marker (columns.js .columns-bold-gold; ASC operating room "A. Mako")
      const goldPart = !!p.querySelector('span[data-tag~="color-gold"]');
      const h2 = rename(doc, p, 'h2');
      if (!goldPart) h2.querySelectorAll('strong, b').forEach(unwrap);
    }
  });
}

/** a Columns paragraph of a `p-2-5` section with gold words: the 35px two-tone display H2 */
function displayLines(doc, main) {
  sectionsOf(main).forEach((section) => {
    if (!styleOf(section).includes('p-2-5')) return;
    section.nodes.filter((n) => n.tagName === 'TABLE').forEach((t) => {
      t.querySelectorAll('td p').forEach((p) => {
        if (p.querySelector('span[data-tag~="color-gold"]')) rename(doc, p, 'h2');
      });
    });
  });
}

/* ---- 5. the remaining tags: colours, serif in headings, then unwrap ---- */

function finishSpans(doc, main, warn) {
  // innermost first
  spansIn(main).reverse().forEach((span) => {
    const tags = tagsOf(span);
    if (tags.includes('color-gold')) gold(doc, span);
    if (tags.includes('serif') && span.closest('h1, h2, h3, h4, h5, h6')) serifInHeading(doc, span);
    const known = tags.every((t) => /^(color-|text-|headline-|serif$|body-font$|box-)/.test(t));
    if (!known) warn.push(`unmapped tag ${tags.join(',')}: "${norm(span.textContent).slice(0, 40)}"`);
  });
  spansIn(main).forEach(unwrap);
}

/* ---- 5b. emphasis edges ---- */

/**
 * Spaces and line breaks at the start or end of a Bold / Italic / Underline go outside it (a
 * tag's text often ends in a space, e.g. TEACH `[[color-gold]<strong>Shoulder</strong> ]Talks:`):
 * the page converter drops a space inside the edge ("ShoulderTalks:") and leaves `**` as text
 * for a Bold that starts or ends with one (reverse shoulder "View more information**").
 * Emphasis left with no text is unwrapped.
 */
function tidyEmphasis(doc, main) {
  const moveEdge = (el, first) => {
    for (;;) {
      const n = first ? el.firstChild : el.lastChild;
      if (!n) return;
      const put = (node) => (first ? el.before(node) : el.after(node));
      if (n.nodeType === 1 && n.tagName === 'BR') {
        put(n);
      } else if (n.nodeType === 3 && !n.textContent) {
        // an empty text left by the tag parser
        n.remove();
      } else if (n.nodeType === 3) {
        const t = n.textContent;
        const ws = (first ? t.match(/^\s+/) : t.match(/\s+$/))?.[0];
        if (!ws) return;
        if (ws.length === t.length) {
          n.textContent = ' ';
          put(n);
        } else {
          n.textContent = first ? t.slice(ws.length) : t.slice(0, -ws.length);
          put(doc.createTextNode(' '));
          return;
        }
      } else {
        return;
      }
    }
  };
  // a line break inside: one element per line, the break between them (the converter loses a
  // break inside a Bold / Italic: giving-back "36,000volunteer hours", Mako "That's Mako")
  const splitAtBreaks = (el) => {
    if (![...el.childNodes].some((n) => n.nodeName === 'BR')) return;
    const parts = [[]];
    [...el.childNodes].forEach((n) => (n.nodeName === 'BR' ? parts.push(n, []) : parts[parts.length - 1].push(n)));
    const out = parts.flatMap((p) => {
      if (!Array.isArray(p)) return [p];
      if (!p.some((n) => n.textContent.trim() || (n.nodeType === 1 && n.querySelector('img, picture')))) return p;
      const piece = el.cloneNode(false);
      piece.append(...p);
      return [piece];
    });
    el.replaceWith(...out);
    out.filter((n) => n.nodeType === 1 && n.nodeName === el.nodeName).forEach((n) => {
      moveEdge(n, true);
      moveEdge(n, false);
    });
  };
  // innermost first, so an inner edge reaches the outer element's edge
  [...main.querySelectorAll('strong, b, em, i, u')].reverse().forEach((el) => {
    moveEdge(el, true);
    moveEdge(el, false);
    if (!el.textContent.trim() && !el.querySelector('img, picture')) {
      unwrap(el);
      return;
    }
    splitAtBreaks(el);
  });
  // a non-breaking space right beside a Bold / Italic / Underline (stryker.com's "I.&nbsp;"
  // before "S-Series"): a normal space, which the converter keeps
  main.querySelectorAll('strong, b, em, i, u').forEach((el) => {
    const next = el.nextSibling;
    const prev = el.previousSibling;
    if (next?.nodeType === 3) next.textContent = next.textContent.replace(/^\u00a0+/, ' ');
    if (prev?.nodeType === 3) prev.textContent = prev.textContent.replace(/\u00a0+$/, ' ');
  });
}

/* ---- 6. typography section styles ---- */

// the copy size / font section styles that become a variant of the section's blocks
const BLOCK_VARIANT = { 'p-1-25': 'large-copy', 'p-1-5': 'xlarge-copy', serif: 'serif' };
const VARIANT_BLOCKS = /^(columns|accordion|panel)\b/i;
// the copy size section styles whose fully Bold lines are headings (the §4 size mapping)
const SECTION_SIZE_HEADING = {
  'p-2-5': 'h2', 'p-1-75': 'h2', 'p-1-5': 'h3', 'p-1-25': 'h4',
};

/** `h-serif`: the section's headings in Egyptienne → heading + Italic (gold words stay) */
function serifHeadings(doc, section) {
  section.nodes.filter((n) => /^H[1-6]$/.test(n.tagName)).forEach((h) => {
    if (h.querySelector(':scope > em:only-child') || norm(h.textContent) === norm([...h.querySelectorAll('strong')].map((s) => s.textContent).join(''))) return;
    const span = doc.createElement('span');
    span.append(...h.childNodes);
    h.append(span);
    serifInHeading(doc, span);
    unwrap(span);
  });
}

/** a heading's plain words (not Bold, not already Italic) in Italic: its Egyptienne light words */
function italicPlainWords(doc, h) {
  [...h.childNodes].forEach((n) => {
    if (n.nodeType !== 3 || !n.textContent.trim()) return;
    const em = doc.createElement('em');
    n.before(em);
    em.append(n);
  });
}

function dropTypographyStyles(doc, main, warn, group = '') {
  let prevEmptied = false;
  sectionsOf(main).forEach((section) => {
    const styles = styleOf(section);
    const typo = styles.filter((s) => TYPO_STYLES.has(s));
    if (!typo.length) {
      prevEmptied = false;
      return;
    }
    // two neighbouring sections split only by their typography styles are one section now
    // (the Mako Live thank-you title and its subtitle)
    const emptied = typo.length === styles.length;
    if (emptied && prevEmptied && section.hr) section.hr.remove();
    prevEmptied = emptied;
    if (typo.includes('h-serif') || typo.includes('h2-1-5')) serifHeadings(doc, section);
    // a fully Bold line of the section's own text at a heading size → that heading, as the
    // size-tagged lines (webinars "Check back for in-person programs later this year!",
    // Futura bold 1.5em → H3 + Bold)
    const level = SECTION_SIZE_HEADING[typo.find((s) => SECTION_SIZE_HEADING[s])];
    if (level) {
      section.nodes.forEach((n, i) => {
        if (n.tagName !== 'P' || !norm(n.textContent)) return;
        const bold = norm([...n.querySelectorAll('strong, b')].map((b) => b.textContent).join(''));
        if (bold !== norm(n.textContent) || linkLine(n)) return;
        const h = rename(doc, n, level);
        // 1.75em: the 24.5px H2 without Bold; 2.5em (`p-2-5`): a fully Bold H2, the 35px
        // display line (ASC product groups "Joint replacement", theme `asc`)
        if (level === 'h2' && !typo.includes('p-2-5')) h.querySelectorAll('strong, b').forEach(unwrap);
        section.nodes[i] = h;
      });
    }
    // 1.75em Bold lines in the section's Columns cells: H2 (with a gold marker it stays Bold,
    // the 24.5px Futura bold heading: ASC post-operative "A. Prime TC transport chair")
    if (typo.includes('p-1-75')) {
      section.nodes.filter((n) => n.tagName === 'TABLE' && /^columns\b/i.test(norm(n.querySelector('tr')?.textContent || '')))
        .forEach((t) => t.querySelectorAll('td > p').forEach((p) => {
          const bold = norm([...p.querySelectorAll('strong, b')].map((b) => b.textContent).join(''));
          if (!norm(p.textContent) || bold !== norm(p.textContent) || linkLine(p)) return;
          const h = rename(doc, p, 'h2');
          if (!h.querySelector('em, i')) h.querySelectorAll('strong, b').forEach(unwrap);
        }));
    }
    // ASC statements in the page's own text (theme `asc`): 3.5em Egyptienne → H2, 2.5em
    // Egyptienne → H3, plain words Italic (build-your-ASC "You only get one chance to launch
    // your ASC.", "Stryker ASC program offerings")
    if (group === 'asc' && typo.includes('serif') && (typo.includes('p-3-5') || typo.includes('p-2-5'))) {
      section.nodes.forEach((n, i) => {
        if (n.tagName !== 'P' || !norm(n.textContent)) return;
        const bold = norm([...n.querySelectorAll('strong, b')].map((b) => b.textContent).join(''));
        if (bold === norm(n.textContent)) return;
        const h = rename(doc, n, typo.includes('p-3-5') ? 'h2' : 'h3');
        italicPlainWords(doc, h);
        section.nodes[i] = h;
      });
    }
    const blocks = section.nodes.filter((n) => n.tagName === 'TABLE'
      && VARIANT_BLOCKS.test(norm(n.querySelector('tr')?.textContent || '')));
    typo.forEach((s) => {
      const variant = BLOCK_VARIANT[s];
      if (!variant) return;
      // a large-headline block has its own type scale
      blocks.filter((b) => !/large-headline/.test(b.querySelector('tr').textContent))
        .forEach((b) => addVariant(b, variant));
      const copy = section.nodes.filter((n) => /^(P|UL|OL)$/.test(n.tagName) && norm(n.textContent));
      // 1.25em copy in the page's own text: the theme `large-copy` (SKILL, ASC)
      if (copy.length && s === 'p-1-25') addTheme(main, 'large-copy');
      // …1.5em copy: the theme `xlarge-copy` (Mako surgeon campaign)
      else if (copy.length && s === 'p-1-5') addTheme(main, 'xlarge-copy');
      else if (copy.length) warn.push(`${s} on default content: "${norm(copy[0].textContent).slice(0, 40)}"`);
    });
    setStyle(section, styles.filter((s) => !TYPO_STYLES.has(s)));
  });
}

/**
 * Turns the intermediate tags of the page into semantic markup (see the file comment).
 * @param {Element} main The page body
 * @param {Document} doc The document
 * @param {string} url The source page URL (the page themes of a page group)
 * @returns {string[]} warnings (tags or lines not mapped)
 */
function semanticMarkup(main, doc, url = '') {
  const warn = [];
  // page themes by page group (§4.2, decided 2026-11-16): `asc` for the ASC care setting
  // pages' own text, `clout` for the CLOUT registry page (one-off)
  const group = PAGE_THEMES.find(([re]) => re.test(url))?.[1] || '';
  if (group) addTheme(main, group);
  tagsToSpans(doc, main);
  if (group === 'asc') ascHeadlines(doc, main, warn);
  largeHeadlines(doc, main, warn);
  heroes(doc, main);
  splitTitleLines(doc, main);
  columnsCells(doc, main);
  pageCopy(main);
  sizeLines(doc, main);
  displayLines(doc, main);
  finishSpans(doc, main, warn);
  dropTypographyStyles(doc, main, warn, group);
  tidyEmphasis(doc, main);
  const left = main.textContent.match(/\[\[[^\]]*\]/g);
  if (left) warn.push(`bracket text left: ${left.slice(0, 5).join(' ')}`);
  return warn;
}

/**
 * Transformer hook: runs last, after the structure transformers, on `afterTransform`; the
 * warnings go on the body (`data-semantic-warn`) for the import report.
 * @param {string} hookName The hook
 * @param {Element} element The page body
 * @param {Object} payload The import payload
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const url = payload.params?.originalURL || payload.url || '';
  const warn = semanticMarkup(element, payload.document, url);
  if (warn.length) element.setAttribute('data-semantic-warn', warn.join(' | '));
}
