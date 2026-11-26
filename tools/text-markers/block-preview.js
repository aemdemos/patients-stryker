/*
 * Preview page for the Text style panel (tools/text-markers/preview.html, shown in the panel's
 * preview frame). It renders the selected words with the chosen style using the site's own
 * code, so they look as on the page:
 *   - in their block: the block the words sit in is rebuilt from the document's markup, the
 *     words get the new markers, and the block is decorated by its own script and styles
 *     (markers, Dynamic Media images, block CSS / JS) — e.g. a hero's gold box or its image;
 *   - outside a block: the words in their line (paragraph or heading level), on white and on
 *     a dark background; with nothing selected, a sample sentence.
 * The panel posts { action: 'tm-preview-render', block?, sectionStyles?, tag?, html?, words,
 * marker } and gets { action: 'tm-preview-rendered', height, found } back.
 */
import decorateSpanMarkers from '../../scripts/span-markers.js';
import decorateDMAssets from '../../scripts/dm-support.js';

const MARKER_TEXT = /:(start-[a-z0-9-]+|end):/;
const loadedStyles = new Set();
let renderId = 0;

function loadCSS(href) {
  if (loadedStyles.has(href)) return Promise.resolve();
  loadedStyles.add(href);
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.append(link);
  });
}

/** marker text (`:start-x:` / `:end:`) → the empty icon spans the EDS pipeline makes of it */
function markersToSpans(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (MARKER_TEXT.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => {
    const parts = node.nodeValue.split(/(:(?:start-[a-z0-9-]+|end):)/).filter(Boolean);
    node.replaceWith(...parts.map((part) => {
      const m = part.match(/^:(start-[a-z0-9-]+|end):$/);
      if (!m) return part;
      const span = document.createElement('span');
      span.className = `icon icon-${m[1]}`;
      return span;
    }));
  });
}

/**
 * Puts the chosen style on the selected words: the text node holding them gets the new
 * markers, which replace markers already right around them.
 * @returns {boolean} Whether the words were found
 */
function restyleWords(root, words, marker, tag) {
  if (!words) return false;
  const escaped = words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?::start-[a-z0-9-]+:)*(${escaped})(?::end:)*`);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) {
    if (re.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
  }
  // the same words can appear elsewhere in the block (e.g. an image's link text): prefer the
  // line of the selection's kind (paragraph / heading level), not inside a link
  const lineOf = (node) => node.parentElement.closest('p, h1, h2, h3, h4, h5, h6, li');
  const node = hits.find((n) => lineOf(n)?.tagName === tag && !n.parentElement.closest('a'))
    || hits.find((n) => !n.parentElement.closest('a')) || hits[0];
  if (!node) return false;
  node.nodeValue = node.nodeValue.replace(re, marker ? `${marker}$1:end:` : '$1');
  return true;
}

function parse(html) {
  return [...new DOMParser().parseFromString(html, 'text/html').body.childNodes]
    .map((n) => document.importNode(n, true));
}

/** the selected words in their block, decorated by the block's own code */
async function renderBlock(main, {
  block: blockHtml, sectionStyles = [], words, marker, tag,
}) {
  const [block] = parse(blockHtml).filter((n) => n.nodeType === Node.ELEMENT_NODE);
  if (!block) return false;
  const name = block.classList[0];
  // as the EDS pipeline does: a cell holding a single paragraph loses the <p> (blocks rely
  // on it, e.g. to tell an image cell from a text cell)
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const only = cell.children.length === 1 && cell.firstElementChild;
    const loose = [...cell.childNodes]
      .some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (only?.tagName === 'P' && !loose) only.replaceWith(...only.childNodes);
  });
  const found = restyleWords(block, words, marker, tag);
  markersToSpans(block);
  const section = document.createElement('div');
  section.className = ['section', ...sectionStyles].join(' ');
  const wrapper = document.createElement('div');
  wrapper.className = `${name}-wrapper`;
  block.classList.add('block');
  wrapper.append(block);
  section.append(wrapper);
  main.replaceChildren(section);
  decorateDMAssets(main);
  decorateSpanMarkers(main);
  // a shared block's corp styles are its <name>-corp.css; a corp block (hero-corp …) has none
  await Promise.all([
    loadCSS(`/blocks/${name}/${name}.css`),
    ...(name.endsWith('-corp') ? [] : [loadCSS(`/blocks/${name}/${name}-corp.css`)]),
  ]);
  try {
    const mod = await import(`/blocks/${name}/${name}.js`);
    if (mod.default) await mod.default(block);
  } catch {
    // a block without a script, or one that fails here: its styles alone still apply
  }
  block.dataset.blockStatus = 'loaded';
  return found;
}

/** the words (or a sample) in their line, on white and on a dark background */
function renderLine(main, { tag = 'P', html, marker }) {
  const sample = !html;
  const sections = ['tm-line', 'tm-line tm-dark'].map((cls) => {
    const section = document.createElement('div');
    section.className = `section ${cls}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'default-content-wrapper';
    const line = document.createElement(tag.toLowerCase());
    const inner = sample ? 'Your styled text' : html;
    line.append(...(sample ? ['Preview: '] : []), ...parse(`${marker || ''}${inner}${marker ? ':end:' : ''}`), ...(sample ? [' next to plain text.'] : []));
    wrapper.append(line);
    section.append(wrapper);
    return section;
  });
  main.replaceChildren(...sections);
  markersToSpans(main);
  decorateSpanMarkers(main);
  return true;
}

let lastFound;
let lastHeight = 0;

/** tells the panel the full height of the render (the panel sizes and scrolls its frame) */
function reportHeight() {
  const { height } = document.querySelector('main').getBoundingClientRect();
  if (Math.abs(height - lastHeight) < 1) return;
  lastHeight = height;
  window.parent.postMessage({ action: 'tm-preview-rendered', height: Math.ceil(height), found: lastFound }, window.location.origin);
}
const heightObserver = new ResizeObserver(() => reportHeight());

async function render(data) {
  renderId += 1;
  const id = renderId;
  // decorated in the page (block scripts may measure or query media), replacing the last one
  const main = document.createElement('main');
  document.querySelector('main').replaceWith(main);
  const found = data.block ? await renderBlock(main, data) : renderLine(main, data);
  if (id !== renderId) return; // a newer choice arrived while this one was decorating
  await Promise.all([...main.querySelectorAll('img')].map((img) => (img.complete ? null
    : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }))));
  if (id !== renderId) return;
  lastFound = found;
  lastHeight = -1; // every render reports once
  reportHeight();
  // fonts, block scripts and images can still change the height: report it again when they do
  heightObserver.disconnect();
  heightObserver.observe(main);
}

window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin || e.data?.action !== 'tm-preview-render') return;
  render(e.data);
});
window.parent.postMessage({ action: 'tm-preview-ready' }, window.location.origin);
