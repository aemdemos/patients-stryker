/* global WebImporter */

/**
 * Transformer: news article typography (discussion #436, headline conventions in DA at
 * /drafts/authoring-conventions-headlines).
 *
 * Maps the www.stryker.com rich-text formatting of news articles to the corp authoring
 * conventions (measured on 448 live news pages at 375 / 1440):
 *
 *   live markup                                  → EDS authoring           → renders
 *   <b> / <strong> (Humanist 712 Bold)           → <strong>                → Humanist 712 Bold
 *   span.futura-bold in p / li (Futura Bold)     → <strong><em>            → Futura Bold, upright
 *   span.futura-bold inside a heading            → unwrapped               → Futura Bold
 *   heading without span.futura-bold             → section style h-serif   → Egyptienne Light
 *   coloured text (inline color / <font color>)  → [[color-<name>]text]    → gold, blue, purple,
 *                                                   teal, navy, grey, white (exact hex only)
 *   Futura title + gold "____" divider line      → <h1|h2><u>[[rule-gold]title]</u>
 *                                                   (h1 for the page title, h2 for subheads)
 *   text fully in .fontsize-1-25em               → section style lead      → Humanist 17.5px
 *   text fully in .fontsize-1-75em               → section style p-1-75    → 24.5px
 *   span.standalone-link around a link           → <strong><u><a>          → Futura uppercase CTA
 *   no <h1>: first Futura paragraph ≥ 2em        → <h1> (the article title)
 *   other .fontsize-* / .urw-egyptienne spans, other colours, <font>, inline fonts → dropped
 *
 * Section styles follow the live text components (.c-rich-text-editor). A component whose
 * blocks share one style becomes one section; a component that mixes styles is split into
 * runs of consecutive blocks, and every run after the first gets the `join` style, which
 * removes the section gap (templates/news-detail) so the split adds no vertical space.
 *
 * Usage: include in a news import script's transformer list (beforeTransform normalises the
 * source DOM before the parsers run; afterTransform writes the section breaks + metadata).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const MARK = 'data-news-section';
const RUN = 'news-run';
const BLOCKS = 'h1, h2, h3, h4, h5, h6, p, ul, ol';
const TEXT_BLOCKS = 'p, li';
const HEADINGS = 'h2, h3, h4, h5, h6';
// live .fontsize-<s>em classes that map to an existing section style
const SIZE_STYLES = { '1-25': 'lead', '1-75': 'p-1-75' };
const SIZES = ['1-25', '1-5', '1-75', '2', '2-5', '8'];
// bracket colour classes (styles/styles.css span.color-*) by their exact hex
const COLOURS = {
  ffb500: 'color-gold',
  '1c5687': 'color-blue',
  '85458a': 'color-purple',
  '4c7d7a': 'color-teal',
  '27455c': 'color-navy',
  545857: 'color-grey',
  ffffff: 'color-white',
};

// text containers of the live rich text: paragraphs, and the leaf <div>s some pages use instead
const PARAS = [
  '.c-rich-text-editor p',
  '.c-rich-text-editor div:not(:has(p, div, ul, ol, h1, h2, h3, h4, h5, h6, table))',
  '.c-largeheadline p',
].join(', ');

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
// features pages draw a divider as a line of underscores under styled titles; it is
// decoration, not text, so it does not count when deciding whether a style covers a block
const DIVIDER = /_{3,}/;
const textOf = (el) => norm((el.textContent || '').replace(/_{3,}/g, ''));

/** Replaces an element with its children. */
function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

/** Renames an element (keeps its children). */
function rename(el, tag) {
  const next = el.ownerDocument.createElement(tag);
  next.append(...el.childNodes);
  el.replaceWith(next);
  return next;
}

/** A CSS colour value as 6-digit lowercase hex (no #), or '' when it cannot be read. */
function toHex(value) {
  const v = (value || '').trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3})$/);
  if (m) return m[1].split('').map((c) => c + c).join('');
  m = v.match(/^#([0-9a-f]{6})$/);
  if (m) return m[1];
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
  return '';
}

/** The inline colour of an element (style color or <font color>), as hex, or ''. */
function inlineColour(el) {
  if (el.tagName === 'FONT' && el.getAttribute('color')) return toHex(el.getAttribute('color'));
  const m = (el.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  return m ? toHex(m[1]) : '';
}

/** Removes the inline colour declaration / attribute from an element. */
function clearColour(el) {
  el.removeAttribute('color');
  const style = (el.getAttribute('style') || '').split(';')
    .map((d) => d.trim())
    .filter((d) => d && !/^color\s*:/i.test(d));
  if (style.length) el.setAttribute('style', style.join('; '));
  else el.removeAttribute('style');
}

/** True when the outermost `selector` descendants of `block` cover all of its text. */
function covers(block, selector) {
  const text = textOf(block);
  if (!text) return false;
  const styled = [...block.querySelectorAll(selector)]
    .filter((el) => !block.contains(el.parentElement.closest(selector)))
    .map(textOf)
    .join(' ');
  return norm(styled).length >= text.length - 1;
}

/** The live size class covering all text of `block` (outermost wins), or ''. */
function sizeOf(block) {
  const found = SIZES.filter((s) => covers(block, `.fontsize-${s}em`));
  if (found.length < 2) return found[0] || '';
  return found.find((s) => {
    const span = block.querySelector(`.fontsize-${s}em`);
    return !found.some((o) => o !== s && span.parentElement.closest(`.fontsize-${o}em`));
  }) || found[0];
}

/** True for a block whose only text is a "____" divider line. */
const isDividerBlock = (el) => !!el && DIVIDER.test(el.textContent) && !textOf(el);

/** The "____" divider text nodes of a block. */
function dividerNodes(block) {
  const walker = block.ownerDocument.createTreeWalker(block, 4); // NodeFilter.SHOW_TEXT
  const lines = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (DIVIDER.test(n.textContent) && /^[\s_]*$/.test(n.textContent)) lines.push(n);
  }
  return lines;
}

/**
 * The colour of the "____" divider drawn under a block (inside it, or as the next block):
 * hex, 'none' when uncoloured, '' when there is none.
 */
function dividerOf(block) {
  const holder = dividerNodes(block).length ? block : block.nextElementSibling;
  const [line] = holder && (holder === block || isDividerBlock(holder)) ? dividerNodes(holder) : [];
  if (!line) return '';
  for (let e = line.parentElement; e && e !== holder.parentElement; e = e.parentElement) {
    const c = inlineColour(e);
    if (c) return c;
  }
  return 'none';
}

/** Removes a block's "____" divider (inside it, or the divider block right after it). */
function stripDivider(block) {
  const lines = dividerNodes(block);
  if (lines.length) lines.forEach((n) => n.remove());
  else if (isDividerBlock(block.nextElementSibling)) block.nextElementSibling.remove();
}

/** Trims leading / trailing whitespace (incl. &nbsp;) inside an element. */
function trimInside(el) {
  const first = el.firstChild;
  const last = el.lastChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
}

/**
 * Turns a styled title paragraph into an underlined heading; a gold divider makes the rule
 * gold ([[rule-gold]…]), another divider keeps the grey rule.
 */
function toRuledHeading(p, tag, divider) {
  stripDivider(p);
  const h = rename(p, tag);
  h.querySelectorAll('br').forEach((br) => br.replaceWith(h.ownerDocument.createTextNode(' ')));
  h.querySelectorAll('span, strong, b, em, i, font').forEach(unwrap);
  h.normalize();
  trimInside(h);
  const doc = h.ownerDocument;
  const u = doc.createElement('u');
  const gold = COLOURS[divider] === 'color-gold';
  if (gold) u.append(doc.createTextNode('[[rule-gold]'));
  u.append(...h.childNodes);
  if (gold) u.append(doc.createTextNode(']'));
  h.append(u);
  return h;
}

/**
 * Article titles drawn as styled paragraphs. Without an <h1>, the first Futura paragraph at
 * ≥ 2em (or a vw size) becomes the h1; Futura paragraphs followed by a divider line become
 * underlined h2 subheads.
 */
export function promoteTitles(root) {
  const paras = [...root.querySelectorAll(PARAS)];
  if (!root.querySelector('h1')) {
    const title = paras.find((p) => p.querySelector('.futura-bold') && textOf(p)
      && (['2', '2-5'].includes(sizeOf(p)) || p.querySelector('[class*="vw"]')));
    if (title) {
      const divider = dividerOf(title);
      if (divider) toRuledHeading(title, 'h1', divider);
      else {
        const h1 = rename(title, 'h1');
        h1.querySelectorAll('br').forEach((br) => br.replaceWith(root.ownerDocument.createTextNode(' ')));
      }
    }
  }
  paras.filter((p) => p.isConnected && /^(P|DIV)$/.test(p.tagName)).forEach((p) => {
    const divider = dividerOf(p);
    if (divider && textOf(p) && covers(p, '.futura-bold')) toRuledHeading(p, 'h2', divider);
  });
}

/** Section style of a paragraph / list item, or null when it has no text. */
function textKey(el) {
  if (!norm(el.textContent)) return null;
  return SIZE_STYLES[sizeOf(el)] || '';
}

/** Section style key of a top-level text block (p / ul / ol / heading). */
function blockKey(block) {
  if (/^H[2-6]$/.test(block.tagName)) {
    const key = sizeOf(block) === '1-25' ? 'lead' : '';
    // live h2 / h3 are Egyptienne unless wrapped in span.futura-bold; h4–h6 are Futura anyway
    if (!/^H[23]$/.test(block.tagName)) return { key };
    const face = block.querySelector('.futura-bold') || block.querySelector('u') ? 'futura' : 'serif';
    return { key, face };
  }
  if (block.tagName === 'UL' || block.tagName === 'OL') {
    const keys = [...block.querySelectorAll('li')].map(textKey).filter((k) => k !== null);
    if (!keys.length) return { key: null };
    return { key: keys.every((k) => k === keys[0]) ? keys[0] : '' };
  }
  if (block.tagName === 'H1') return { key: '' };
  return { key: textKey(block) };
}

/** Top-level text blocks of a component, in document order. */
function topBlocks(component) {
  return [...component.querySelectorAll(BLOCKS)].filter((el) => {
    const outer = el.parentElement.closest(BLOCKS);
    return !outer || !component.contains(outer);
  });
}

/**
 * Groups a component's blocks into runs of one section style. Empty blocks join the current
 * run; a heading joins when its size key matches and the run's heading face agrees.
 */
function buildRuns(component) {
  const runs = [];
  topBlocks(component).forEach((block) => {
    const { key, face } = blockKey(block);
    const run = runs[runs.length - 1];
    const sameParent = run && run.blocks[0].parentElement === block.parentElement;
    const sameFace = !face || !(run && run.face) || face === run.face;
    if (run && sameParent && (key === null || (key === run.key && sameFace))) {
      run.blocks.push(block);
      if (face) run.face = face;
      return;
    }
    runs.push({ key: key === null ? '' : key, face, blocks: [block] });
  });
  return runs;
}

/** Style value of a run: its text style plus h-serif for Egyptienne headings. */
function runStyle(run) {
  return [run.key, run.face === 'serif' ? 'h-serif' : ''].filter(Boolean).join(', ');
}

/** Marks each component (or each run of a mixed component) with its section style. */
function markSections(root) {
  root.querySelectorAll('.c-rich-text-editor').forEach((component) => {
    if (component.closest('.c-customizeable, .c-disclaimer')) return;
    const runs = buildRuns(component);
    if (runs.length === 1) {
      const style = runStyle(runs[0]);
      if (style) component.setAttribute(MARK, style);
      return;
    }
    runs.forEach((run, i) => {
      const style = [runStyle(run), i > 0 ? 'join' : ''].filter(Boolean).join(', ');
      if (!style) return;
      const wrap = root.ownerDocument.createElement('div');
      wrap.className = RUN;
      run.blocks[0].before(wrap);
      wrap.append(...run.blocks);
      wrap.setAttribute(MARK, style);
    });
  });
}

/**
 * Removes the remaining "____" divider lines (features pages): in EDS they would render as
 * plain underscores. A paragraph left with no text is removed.
 */
function dropDividers(root) {
  root.querySelectorAll(PARAS).forEach((p) => {
    if (!DIVIDER.test(p.textContent)) return;
    dividerNodes(p).forEach((n) => n.remove());
    if (!norm(p.textContent) && !p.querySelector('img, picture')) p.remove();
  });
}

/** Wraps the nodes [first..last] (siblings) in a bracket tag, whitespace kept outside. */
function wrapInTag(first, last, cls) {
  const doc = first.ownerDocument;
  if (first.nodeType === 3) {
    const lead = first.textContent.match(/^\s*/)[0];
    if (lead) {
      first.before(doc.createTextNode(lead));
      first.textContent = first.textContent.slice(lead.length);
    }
  }
  if (last.nodeType === 3) {
    const tail = last.textContent.match(/\s*$/)[0];
    if (tail) {
      last.after(doc.createTextNode(tail));
      last.textContent = last.textContent.slice(0, last.textContent.length - tail.length);
    }
  }
  first.before(doc.createTextNode(`[[${cls}]`));
  last.after(doc.createTextNode(']'));
}

/**
 * Coloured text → bracket tags. An element with an inline colour of one of the corp colours
 * gets its own text wrapped as [[color-<name>]…]; children with a colour of their own (black
 * included) are left out and handled on their own. Other colours (and black) are dropped.
 */
function mapColours(root) {
  const coloured = [...root.querySelectorAll('.c-rich-text-editor [style*="color"], .c-largeheadline [style*="color"], font[color]')];
  const own = new Map(coloured.map((el) => [el, inlineColour(el)]));
  coloured.forEach((el) => {
    const cls = COLOURS[own.get(el)];
    clearColour(el);
    if (!cls) return;
    // text of a node that no coloured descendant handles itself
    const freeText = (node) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1 || own.get(node)) return '';
      return [...node.childNodes].map(freeText).join('');
    };
    // runs of children that carry no colour of their own
    let run = [];
    const flush = () => {
      if (run.some((n) => norm(freeText(n)))) wrapInTag(run[0], run[run.length - 1], cls);
      run = [];
    };
    [...el.childNodes].forEach((child) => {
      if (child.nodeType === 1 && own.get(child)) flush();
      else run.push(child);
    });
    flush();
  });
}

/** Drops inline font declarations and <font> wrappers (pasted Word styles). */
function dropInlineFonts(root) {
  root.querySelectorAll('font').forEach(unwrap);
  root.querySelectorAll('[style]').forEach((el) => {
    const kept = el.getAttribute('style').split(';')
      .map((d) => d.trim())
      .filter((d) => d && !/^(font|font-family|font-size|font-weight|line-height)\s*:/i.test(d));
    if (kept.length) el.setAttribute('style', kept.join('; '));
    else el.removeAttribute('style');
  });
}

/** <h1>: keep only text, <sup>, the underline and bracket tags. */
function plainHeadline(root) {
  root.querySelectorAll('h1').forEach((h1) => {
    h1.querySelectorAll('span, strong, b, em, i').forEach(unwrap);
  });
}

/** h2–h6: Futura is the EDS default, so the live Futura spans / bold wrappers go. */
function plainHeadings(root) {
  root.querySelectorAll(HEADINGS).forEach((h) => {
    h.querySelectorAll('span.futura-bold, strong, b').forEach(unwrap);
  });
}

/** span.standalone-link → <strong><u><a>…</a></u></strong> (flat Futura CTA). */
function standaloneLinks(root) {
  root.querySelectorAll('span.standalone-link').forEach((span) => {
    const a = span.closest('a') || span.querySelector('a');
    unwrap(span);
    if (!a || a.closest('strong u, u strong')) return;
    const doc = a.ownerDocument;
    const strong = doc.createElement('strong');
    const u = doc.createElement('u');
    a.replaceWith(strong);
    strong.append(u);
    u.append(a);
  });
}

/** span.futura-bold in running text → <strong><em>…</em></strong>. */
function futuraBold(root) {
  [...root.querySelectorAll('span.futura-bold')]
    .filter((span) => !span.closest(`${HEADINGS}, h1`))
    .forEach((span) => {
      // an outer Humanist bold around the Futura run would double the wrapper
      const outer = span.parentElement && span.parentElement.closest('strong, b');
      if (outer && norm(outer.textContent) === norm(span.textContent)) unwrap(outer);
      span.querySelectorAll('strong, b, span.futura-bold').forEach(unwrap);
      const doc = span.ownerDocument;
      const strong = doc.createElement('strong');
      const em = doc.createElement('em');
      em.append(...span.childNodes);
      strong.append(em);
      span.replaceWith(strong);
    });
}

/**
 * Remaining styling spans (sizes, Egyptienne) are carried by the section styles set in
 * markSections(), or have no text-level EDS equivalent and are dropped.
 */
function dropStyleSpans(root) {
  root.querySelectorAll('span[class*="fontsize-"], span.urw-egyptienne').forEach(unwrap);
}

/**
 * <b> → <strong>, <i> → <em> on text (DA only produces <strong> / <em>); icon <i> elements
 * (class icon-*, no text) are site chrome and stay as they are.
 */
function semanticInline(root) {
  root.querySelectorAll(`:is(${TEXT_BLOCKS}, ${HEADINGS}, h1) :is(b, i)`).forEach((el) => {
    if (!norm(el.textContent)) return;
    rename(el, el.tagName === 'B' ? 'strong' : 'em');
  });
}

/** True when any element follows `node` (in document order) inside `root`. */
function hasFollowing(node, root) {
  let n = node;
  while (n && n !== root) {
    if (n.nextElementSibling) return true;
    n = n.parentElement;
  }
  return false;
}

/** Inserts the section break + metadata around each marked component / run. */
function writeSections(root) {
  const doc = root.ownerDocument;
  root.querySelectorAll(`[${MARK}]`).forEach((el) => {
    const style = el.getAttribute(MARK);
    el.removeAttribute(MARK);
    if (el.closest('table')) return; // inside a block table: no section break possible
    if (el.previousElementSibling?.tagName !== 'HR') el.before(doc.createElement('hr'));
    const meta = WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: [['Style', style]] });
    el.after(meta);
    if (hasFollowing(meta, root) && meta.nextElementSibling?.tagName !== 'HR') meta.after(doc.createElement('hr'));
  });
}

export default function transform(hookName, element, payload) {
  // news templates only (news-detail and its variants); other templates keep their own rules
  const template = payload && payload.template && payload.template.name;
  if (template && !template.includes('news')) return;
  const root = element;
  if (hookName === TransformHook.beforeTransform) {
    promoteTitles(root);
    markSections(root);
    dropDividers(root);
    mapColours(root);
    dropInlineFonts(root);
    plainHeadline(root);
    plainHeadings(root);
    standaloneLinks(root);
    futuraBold(root);
    dropStyleSpans(root);
    semanticInline(root);
  }
  if (hookName === TransformHook.afterTransform) {
    writeSections(root);
  }
}
