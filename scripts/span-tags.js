/*
 * Bracket span tags: authors style inline text by typing `[[class1,class2]text]` in a
 * heading, paragraph, list item or block cell; it becomes
 * `<span class="class1 class2">text</span>`. Used for coloured text (e.g. `[[color-blue]…]`,
 * classes in styles/styles.css). Same syntax as aemdemos/lundbeck-libs (bracket tags v3).
 *
 * The content may carry formatting (bold, italic, links, line breaks), and the bracket
 * characters themselves may sit inside or outside that formatting:
 *   [[color-blue]**Bold title**]   **[[color-blue]Bold title]**   [[color-blue]one<br>two]
 * Malformed expressions (empty or invalid class names, no closing `]`) are left as typed.
 */
import { toClassName } from './aem.js';

// formatting a bracket expression may run through (and may itself be wrapped in)
const INLINE_TAGS = new Set(['A', 'B', 'BR', 'DEL', 'EM', 'I', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U']);

// `[[classes]content]` within one text node; `[` is not allowed inside, so the
// innermost expression of `[[x]…[[y]…]` is the one matched
const SPAN_TAG_RE = /\[\[([^\][]+)\]([^\][]*)\]/g;
// a `[[classes]` opener whose closing `]` is in a later text node
const OPEN_TAG_RE = /\[\[([^\][]+)\]/g;

/**
 * Parses the comma-separated class list of a bracket expression.
 * @param {string} raw The text between `[[` and `]`
 * @returns {string[]} The class names, or [] when any of them is invalid
 */
function parseClasses(raw) {
  const names = raw.split(',').map((name) => name.trim());
  if (names.some((name) => !/^[\w-]+$/.test(name))) return [];
  return names.map((name) => toClassName(name));
}

function createSpan(classes, ...content) {
  const span = document.createElement('span');
  span.className = classes.join(' ');
  span.append(...content);
  return span;
}

/**
 * The element that holds a bracket expression: the nearest ancestor of the text node
 * that is not inline formatting (a heading, paragraph, list item or block cell).
 * @param {Text} node A text node
 * @returns {Element} The container
 */
function getContainer(node) {
  let el = node.parentElement;
  while (INLINE_TAGS.has(el.tagName) && el.parentElement) el = el.parentElement;
  return el;
}

/**
 * The text nodes of an element that are only wrapped in inline formatting below it.
 * Text in code, or in a nested paragraph/list, belongs to another container.
 * @param {Element} container The container
 * @returns {Text[]} The text nodes, in document order
 */
function getTextNodes(container) {
  const nodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (getContainer(walker.currentNode) === container) nodes.push(walker.currentNode);
  }
  return nodes;
}

/**
 * Replaces the bracket expressions that are complete within one text node.
 * @param {Text} node The text node
 */
function replaceInTextNode(node) {
  const text = node.nodeValue;
  const parts = [];
  let last = 0;
  [...text.matchAll(SPAN_TAG_RE)].forEach((match) => {
    const [full, raw, content] = match;
    const classes = parseClasses(raw);
    if (!classes.length) return;
    parts.push(text.slice(last, match.index), createSpan(classes, content));
    last = match.index + full.length;
  });
  if (!last) return;
  parts.push(text.slice(last));
  node.replaceWith(...parts.filter((part) => part !== ''));
}

/**
 * Removes a text node emptied of its bracket characters, and the formatting
 * elements (below the container) that are left empty with it.
 * @param {Text} node The text node
 * @param {Element} container The container
 */
function removeIfEmpty(node, container) {
  let current = node;
  while (current !== container && !current.textContent && !current.querySelector?.('br, img')) {
    const parent = current.parentNode;
    current.remove();
    current = parent;
  }
}

/**
 * Wraps the first bracket expression whose `[[classes]` and `]` are in different text
 * nodes of the container, i.e. whose content runs through formatting (bold, links, <br>).
 * @param {Element} container The container
 * @returns {boolean} Whether an expression was wrapped
 */
function wrapMultiNodeTag(container) {
  const nodes = getTextNodes(container);
  return nodes.some((openNode, i) => {
    const text = openNode.nodeValue;
    const open = [...text.matchAll(OPEN_TAG_RE)].pop();
    if (!open || text.slice(open.index + open[0].length).includes(']')) return false;
    const classes = parseClasses(open[1]);
    const closeNode = nodes.slice(i + 1).find((node) => node.nodeValue.includes(']'));
    if (!classes.length || !closeNode) return false;

    const range = document.createRange();
    range.setStart(openNode, open.index + open[0].length);
    range.setEnd(closeNode, closeNode.nodeValue.indexOf(']'));
    // the extracted copy keeps formatting that the brackets cut through (e.g. a
    // partially bracketed <strong>); the span lands where the content was
    const span = createSpan(classes, range.extractContents());
    range.insertNode(span);

    openNode.nodeValue = text.slice(0, open.index);
    closeNode.nodeValue = closeNode.nodeValue.slice(1);
    removeIfEmpty(openNode, container);
    removeIfEmpty(closeNode, container);
    return true;
  });
}

/**
 * Heading ids are generated from the authored text, brackets included; re-derive
 * them from the decorated text so in-page links and the TOC use the visible title.
 * @param {Element} heading The heading
 * @param {string} authoredText The heading text before decoration
 */
function updateHeadingId(heading, authoredText) {
  const slug = (text) => text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (heading.id !== slug(authoredText)) return; // an explicitly authored id: keep it
  const id = slug(heading.textContent);
  if (id && !document.getElementById(id)) heading.id = id;
}

/**
 * Turns `[[classes]text]` bracket expressions into class-carrying spans.
 * @param {Element} main The container element
 */
export default function decorateSpanTags(main) {
  const containers = new Set();
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue.includes('[[') && !node.parentElement.closest('code, pre, script, style')) {
      containers.add(getContainer(node));
    }
  }

  containers.forEach((container) => {
    const authoredText = container.textContent;
    getTextNodes(container)
      .filter((node) => node.nodeValue.includes('[['))
      .forEach(replaceInTextNode);
    let wrapped = true;
    while (wrapped) wrapped = wrapMultiNodeTag(container);
    if (/^H[1-6]$/.test(container.tagName) && container.id) {
      updateHeadingId(container, authoredText);
    }
  });
}
