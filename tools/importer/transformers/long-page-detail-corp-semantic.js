/* global WebImporter */
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
 * - a Large Headline section (`headline-box`, or the `h4-2-5` title) → one
 *   `Columns (large-headline)` block: H1 4vw title (`title` option when fully Bold), H5 5vw
 *   Futura line, H2 Italic 4vw / H3 Italic 3.5vw Egyptienne lines, H2 Bold 2vw, 1.5vw text;
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
  const runs = [];
  let run = [];
  [...span.childNodes].forEach((n) => {
    const isGold = n.nodeType === 1 && (n.matches('em, i') || (n.matches('span[data-tag]') && tagsOf(n).some((t) => t === 'color-gold')));
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

function largeHeadlines(doc, main, warn) {
  sectionsOf(main).forEach((section) => {
    const styles = styleOf(section);
    const isBox = styles.includes('headline-box');
    const isTitle = styles.includes('h4-2-5');
    const lines = section.nodes.filter((n) => /^(P|H[1-6])$/.test(n.tagName)
      && (n.querySelector('span[data-tag^="headline-"], span[data-tag*=" headline-"]') || (isTitle && n.tagName === 'H1')));
    if (!lines.length || !(isBox || isTitle)) return;
    const ctx = { title: isTitle, warn };
    const first = section.nodes.find((n) => lines.includes(n));
    const out = section.nodes.filter((n) => lines.includes(n) || /^(P|H[1-6]|UL|OL)$/.test(n.tagName))
      .map((n) => (lines.includes(n) ? headlineLine(doc, n, ctx) : n));
    const name = `Columns (large-headline${ctx.title ? ', title' : ''})`;
    const marker = doc.createComment('lh');
    (first.isConnected ? first : out[0]).before(marker);
    const block = WebImporter.Blocks.createBlock(doc, { name, cells: [[out]] });
    marker.replaceWith(block);
  });
}

/* ---- 4. sizes and fonts outside Large Headlines ---- */

/** an element whose whole text is in one size tag: the tag's name (`text-1-5`), else '' */
function wholeSize(el) {
  const spans = spansIn(el).filter((s) => tagsOf(s).some((t) => /^text-\d/.test(t)));
  const s = spans.find((sp) => norm(sp.textContent) === norm(el.textContent));
  return s ? tagsOf(s).find((t) => /^text-\d/.test(t)) : '';
}

function sizeLines(doc, main) {
  main.querySelectorAll('p').forEach((p) => {
    const size = wholeSize(p);
    if (!size) return;
    const bold = norm([...p.querySelectorAll('strong, b')].map((b) => b.textContent).join('')) === norm(p.textContent);
    if (!bold) return;
    if (size === 'text-1-5') rename(doc, p, 'h3');
    else if (size === 'text-1-25') rename(doc, p, 'h4');
    else if (size === 'text-1-75') {
      // a Heading 2 without Bold: the 24.5px Futura bold H2 (a fully Bold H2 in Columns is the
      // 35px display line)
      const h2 = rename(doc, p, 'h2');
      h2.querySelectorAll('strong, b').forEach(unwrap);
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

/* ---- 6. typography section styles ---- */

// the copy size / font section styles that become a variant of the section's blocks
const BLOCK_VARIANT = { 'p-1-25': 'large-copy', 'p-1-5': 'xlarge-copy', serif: 'serif' };
const VARIANT_BLOCKS = /^(columns|accordion|panel)\b/i;

/** adds a variant to a block table's name ("Columns (stack)" → "Columns (stack, large-copy)") */
function addVariant(table, variant) {
  const cell = table.querySelector('tr > th, tr > td');
  const name = norm(cell.textContent);
  const m = name.match(/^([^(]+?)\s*(?:\((.*)\))?$/);
  const opts = (m[2] || '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!opts.includes(variant)) opts.push(variant);
  cell.textContent = `${m[1]} (${opts.join(', ')})`;
}

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

function dropTypographyStyles(doc, main, warn) {
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
    const blocks = section.nodes.filter((n) => n.tagName === 'TABLE'
      && VARIANT_BLOCKS.test(norm(n.querySelector('tr')?.textContent || '')));
    typo.forEach((s) => {
      const variant = BLOCK_VARIANT[s];
      if (!variant) return;
      // a large-headline block has its own type scale
      blocks.filter((b) => !/large-headline/.test(b.querySelector('tr').textContent))
        .forEach((b) => addVariant(b, variant));
      const copy = section.nodes.filter((n) => /^(P|UL|OL)$/.test(n.tagName) && norm(n.textContent));
      if (copy.length) warn.push(`${s} on default content (theme?): "${norm(copy[0].textContent).slice(0, 40)}"`);
    });
    setStyle(section, styles.filter((s) => !TYPO_STYLES.has(s)));
  });
}

/**
 * Turns the intermediate tags of the page into semantic markup (see the file comment).
 * @param {Element} main The page body
 * @param {Document} doc The document
 * @returns {string[]} warnings (tags or lines not mapped)
 */
function semanticMarkup(main, doc) {
  const warn = [];
  tagsToSpans(doc, main);
  largeHeadlines(doc, main, warn);
  sizeLines(doc, main);
  displayLines(doc, main);
  finishSpans(doc, main, warn);
  dropTypographyStyles(doc, main, warn);
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
  const warn = semanticMarkup(element, payload.document);
  if (warn.length) element.setAttribute('data-semantic-warn', warn.join(' | '));
}
