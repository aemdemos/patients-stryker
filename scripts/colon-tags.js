/*
 * Colon markers (readable settings): inline text styles written the way EDS writes icons, so
 * the HTML the server delivers never shows them as text (search engines read that HTML before
 * any script runs). The server turns every `:name:` an author types into an empty
 * `<span class="icon icon-name"></span>`; this turns the markers whose names are text styles
 * into the bracket tags the rest of the decoration reads (span-tags.js, corp-settings.js), so
 * a page renders exactly like its bracket-authored copy:
 *   :Gold:Whole heading                       to the end of the heading or paragraph (of the
 *                                             bold text or link it is typed in)
 *   before :Gold:styled:end: after            to the `:end:` marker
 *   :Gold::Large:two styles:end:              markers in a row are one style
 *   :x1p75:  :vw5p5:                          a size as a value: 1.75× the surrounding size,
 *                                             5.5vw (`p` for the decimal point)
 *   :blank-line:                              alone in a paragraph: an empty line of text
 * Names are letters and hyphens with digits only at the end (the server's icon rule). Markers
 * of other names stay icons. Runs before the icons are decorated.
 */
import { TEXT_STYLES } from './corp-settings.js';

// (class names that are no text style but are written the same way: kept as they are)
const OTHER_NAMES = ['visually-hidden', 'rule-gold'];
const SIZE = /^(x|vw)(\d+)(?:p(\d+))?$/;

/** a marker's name: `icon icon-Gold` → gold */
const nameOf = (span) => [...span.classList].find((c) => c.startsWith('icon-'))?.slice(5).toLowerCase() || '';

/** the bracket token of a style marker's name, '' for an icon */
function tokenOf(name) {
  if (TEXT_STYLES[name] || OTHER_NAMES.includes(name)) return name;
  const m = name.match(SIZE);
  if (!m) return '';
  const value = m[3] ? `${m[2]}.${m[3]}` : m[2];
  return m[1] === 'vw' ? `${value}vw` : `${value}×`;
}

const isMarker = (node) => node?.nodeType === 1 && node.matches('span.icon') && !node.childNodes.length;
const isEnd = (node) => isMarker(node) && nameOf(node) === 'end';
const isStyle = (node) => isMarker(node) && !!tokenOf(nameOf(node));

/** the block-level element holding a marker (heading, paragraph, list item, block cell) */
function containerOf(node) {
  let el = node.parentElement;
  while (el && /^(A|B|EM|I|S|SPAN|STRONG|SUB|SUP|U|DEL)$/.test(el.tagName)) el = el.parentElement;
  return el;
}

const slug = (text) => text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/**
 * Turns the style markers of one container into bracket tags: a run of markers opens one tag,
 * `:end:` closes the latest one, the end of the container closes the ones left open.
 * @param {Element} container The container
 */
function convert(container) {
  // `:blank-line:` alone in a paragraph
  const lone = container.tagName === 'P' && !container.textContent.trim()
    && container.children.length === 1 && isMarker(container.firstElementChild)
    && nameOf(container.firstElementChild) === 'blank-line';
  if (lone) {
    container.textContent = '[[Blank line]]';
    return;
  }
  const markers = [...container.querySelectorAll('span.icon')]
    .filter((m) => (isStyle(m) || isEnd(m)) && containerOf(m) === container);
  if (!markers.length) return;
  // the text the server derived a heading's id from: the marker names in place of the markers
  const authored = [...container.childNodes].map(function text(node) {
    if (isMarker(node)) return nameOf(node);
    return node.nodeType === 1 ? [...node.childNodes].map(text).join('') : node.textContent;
  }).join('');
  // (the open ones: where each was typed, so one left open closes at the end of that element,
  // e.g. inside the bold text it was typed in)
  const open = [];
  // (the later markers of a run go with its first; not `isConnected`: a fragment is decorated
  // before it is in the page)
  const merged = new Set();
  markers.forEach((m) => {
    if (merged.has(m)) return;
    // (the ones typed in an element this marker is past, e.g. a superscript: closed at its end)
    while (open.length && !open[open.length - 1].contains(m)) open.pop().append(']');
    if (isEnd(m)) {
      if (open.length) {
        m.replaceWith(']');
        open.pop();
      } else m.remove();
      return;
    }
    // (the first of a run of markers carries the run's tokens, the others go)
    const run = [m];
    while (isStyle(run[run.length - 1].nextSibling)) run.push(run[run.length - 1].nextSibling);
    const tokens = run.map((x) => tokenOf(nameOf(x)));
    run.slice(1).forEach((x) => {
      merged.add(x);
      x.remove();
    });
    open.push(m.parentElement);
    m.replaceWith(`[[${tokens.join(',')}]`);
  });
  open.reverse().forEach((parent) => parent.append(']'));
  container.normalize();
  // the id the server derived (marker names included) → the visible text's
  if (/^H[1-6]$/.test(container.tagName) && container.id
    && container.id.replace(/-/g, '') === slug(authored).replace(/-/g, '')) {
    const visible = container.textContent.replace(/\[\[[^\][]*\]/g, '').replace(/\]/g, '');
    // (a second heading of the same text gets -2, and so on)
    const base = slug(visible);
    let id = base;
    for (let k = 2; id && document.getElementById(id); k += 1) id = `${base}-${k}`;
    if (id) {
      container.id = id;
      // (a link to the heading: the browser looked for the id before it existed)
      if (window.location.hash === `#${id}`) {
        window.addEventListener('load', () => container.scrollIntoView(), { once: true });
      }
    }
  }
}

// the server's rule for `:name:` (not inside a URL)
const TYPED = /(?<!(?:https?|urn)[^\s]*):(#?[a-z_-]+[a-z\d]*):/gi;

/**
 * Markers still typed as text, where no server turned them into spans (the local preview,
 * editors that show the document as authored): the style ones become marker spans too.
 * @param {Element} main The container
 */
function markTypedMarkers(main) {
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue.includes(':') && !node.parentElement.closest('code, pre, script, style')) nodes.push(node);
  }
  const known = (name) => !!tokenOf(name) || ['end', 'blank-line'].includes(name);
  nodes.forEach((node) => {
    const text = node.nodeValue;
    const parts = [];
    let last = 0;
    [...text.matchAll(TYPED)].forEach((m) => {
      if (!known(m[1].toLowerCase())) return;
      const span = document.createElement('span');
      span.className = `icon icon-${m[1]}`;
      parts.push(text.slice(last, m.index), span);
      last = m.index + m[0].length;
    });
    if (!last) return;
    parts.push(text.slice(last));
    node.replaceWith(...parts.filter((p) => p !== ''));
  });
}

/**
 * Turns the colon markers of a container (main, or a fragment) into bracket tags.
 * @param {Element} main The container
 */
export default function decorateColonTags(main) {
  markTypedMarkers(main);
  const containers = new Set([...main.querySelectorAll('span.icon')]
    .filter((m) => isStyle(m) || isEnd(m) || nameOf(m) === 'blank-line')
    .map(containerOf)
    .filter(Boolean));
  containers.forEach(convert);
}
