/*
 * Text style — an Experience Workspace / DA sidebar extension for the text markers
 * (scripts/span-markers.js). Authors pick a colour, font, size and spacing from the panel
 * instead of remembering the marker words; the panel builds `:start-<words>:` and either
 * wraps the selected text with it (… `:end:`) or inserts it at the caret. A live preview
 * renders the choice with the site's own styles.
 *
 * The word lists come from scripts/span-markers.js, so the panel always offers exactly the
 * words the site understands.
 */
import {
  COLOURS, FONTS, SIZES, DECORATIONS, SPACING,
} from '../../scripts/span-markers.js';
import libraryOptions, { labelOf } from '../library-options.js';
import { REVIEW_NOTE, documentPath, outsideReview } from '../review-pages.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';

const LABELS = {
  blue: 'Blue',
  gold: 'Gold',
  purple: 'Purple',
  teal: 'Teal',
  grey: 'Grey',
  white: 'White',
  'light-gray': 'Light grey',
  serif: 'Serif (Egyptienne)',
  sans: 'Sans (Futura)',
  body: 'Body (Humanist)',
  s: 'Small (0.8×)',
  l: 'Large (1.25×)',
  xl: 'X-large (1.5×)',
  xxl: 'XX-large (1.75×)',
  'rule-gold': 'Gold rule under a heading',
  'box-gold': 'Box: gold',
  'box-blue': 'Box: blue',
  'box-purple': 'Box: purple',
  'box-teal': 'Box: teal',
  'box-dark': 'Box: dark grey (news: dark quote box)',
  'box-dark-purple-gradient': 'Box: dark purple gradient',
};
// words the site still reads (older content) but the panel doesn't offer: they style no text on
// stryker.com (content export, styled runs): navy and capitals have no use, and no single line
// sits in a white, light grey or dark blue gradient box (those are cell or card boxes)
const NOT_OFFERED = new Set(['navy', 'upper', 'box-white', 'box-gray', 'box-dark-blue-gradient']);
const offered = (words) => words.filter((w) => !NOT_OFFERED.has(w));

// the choices per group: built in, or set by the library sheet (tools/library-options.js)
const lists = {
  colour: offered(COLOURS),
  font: offered(FONTS),
  size: offered(SIZES),
  look: offered(DECORATIONS),
};
const BUILT_IN = {
  colour: COLOURS, font: FONTS, size: SIZES, look: DECORATIONS,
};

/**
 * Reads the library sheet's text-style rows (sheet panel-options). A new word must be one word
 * (letters and digits) that is not a spacing word: the site gives it the class ts-<word>,
 * styled in styles-corp.css.
 */
async function loadLists() {
  const groups = await libraryOptions('text-style');
  Object.keys(lists).forEach((key) => {
    if (!groups.has(key)) return;
    const words = groups.get(key).filter(([word]) => !NOT_OFFERED.has(word)
      && (BUILT_IN[key].includes(word) || (/^[a-z0-9]+$/.test(word) && !SPACING[word])));
    if (!words.length) return;
    lists[key] = words.map(([word]) => word);
    words.forEach(([word, label]) => { if (label) LABELS[word] = label; });
  });
}

// spacing (padding, margin) is not a Text style choice: on stryker.com it belongs to the box
// (Block options) or the block's standard gap; the site still reads older spacing words
const state = {
  colour: '', font: '', size: '', look: '',
};

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v !== undefined) node.setAttribute(k, v === true ? '' : v);
  });
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
};

/** the marker words for the current choice, in the order the site reads them */
function markerWords() {
  const words = [];
  if (state.colour) words.push(state.colour);
  if (state.font) words.push(state.font);
  const digits = /\d/.test(state.size || '');
  if (state.size && !digits) words.push(state.size);
  if (state.look) words.push(state.look);
  // a word with digits (the headline sizes hl15, hl2, hl3, hl45) goes last: EDS reads `:name:` as a
  // marker only when its digits end the name
  if (state.size && digits) words.push(state.size);
  return words;
}

const startMarker = () => (markerWords().length ? `:start-${markerWords().join('-')}:` : '');
const END_MARKER = ':end:';
// EDS skips a `:name:` right after a word holding "http" or "urn" (its guard for addresses,
// e.g. "journey.:end:" stays as text): a space before the marker keeps it a marker
const ADDRESS_GUARD = /((?:https?|urn)\S*?)(:(?:start-[a-z0-9-]+|end):)/gi;
const readable = (text) => text.replace(ADDRESS_GUARD, '$1 $2');

let sdk = null;
let statusEl;
let codeEl;
let previewFrame;
let applyButtons = [];
let endButton;
let previewNote;
let moreOptions;
let noticeEl;
let removeButton;
let columnsNote;

function setStatus(text, kind = 'info') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

/*
 * Preview: tools/text-markers/preview.html in a frame, rendering with the site's own code.
 * Words inside a block are shown in that block (its background, image, box …) at desktop or
 * phone width, scaled to the panel; other words in their line.
 */
const VIEWS = { desktop: 1200, phone: 375 };
let view = 'desktop';
let previewReady = false;
let previewHeight = 160;
let viewToggle;

// the selection being previewed: its line { tag, html, words, old } and, when it sits in a
// block, that block { block: HTML, sectionStyles, name }
let previewLine = null;
let previewBlock = null;
let lastSelection = '';

function sizePreview() {
  const box = previewFrame.parentElement;
  const width = previewBlock ? VIEWS[view] : box.clientWidth;
  const scale = Math.min(1, box.clientWidth / width);
  previewFrame.style.width = `${width}px`;
  previewFrame.style.height = `${previewHeight}px`;
  previewFrame.style.transform = `scale(${scale})`;
  box.style.height = `${Math.ceil(previewHeight * scale)}px`;
  viewToggle.hidden = !previewBlock;
}

function updatePreview() {
  const marker = startMarker();
  codeEl.textContent = marker ? `${marker}Your text${END_MARKER}` : 'Pick a style below';
  applyButtons.forEach((b) => { b.disabled = !marker || !sdk; });
  if (endButton) endButton.disabled = !sdk;
  const kind = previewLine && (previewLine.tag === 'P' ? 'paragraph' : `heading ${previewLine.tag.slice(1)}`);
  let note = 'Select words in the document to preview them here.';
  if (previewLine) note = `Previewing your selection (${kind}${previewBlock ? ` in ${previewBlock.name}` : ''}).`;
  if (previewLine?.old) note = `${note.slice(0, -1)}, now styled :start-${previewLine.old}:.`;
  previewNote.textContent = note;
  if (columnsNote) columnsNote.hidden = previewBlock?.name !== 'columns';
  if (!previewReady) return;
  const message = { action: 'tm-preview-render', marker, words: previewLine?.words || '' };
  if (previewLine && previewBlock) Object.assign(message, previewBlock, { tag: previewLine.tag });
  else if (previewLine) Object.assign(message, { tag: previewLine.tag, html: previewLine.html });
  sizePreview();
  previewFrame.contentWindow.postMessage(message, window.location.origin);
}

/** colour swatches take their colour from the site's own color-* classes */
function paintSwatches(container) {
  const doc = previewFrame.contentDocument;
  if (!doc?.body) return;
  container.querySelectorAll('[data-colour]').forEach((button) => {
    const probe = doc.createElement('span');
    const { colour } = button.dataset;
    // styled like a marked word on the page: the corp colours apply to span.text-marker only
    probe.className = `text-marker ${COLOURS.includes(colour) ? `color-${colour}` : `ts-${colour}`}`;
    probe.textContent = 'x';
    doc.querySelector('main').append(probe);
    button.style.setProperty('--swatch', doc.defaultView.getComputedStyle(probe).color);
    probe.remove();
  });
}

/** the preview page reports when it is ready and the height of each render */
function listenToPreview(choices) {
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin || e.source !== previewFrame.contentWindow) return;
    if (e.data?.action === 'tm-preview-ready') {
      previewReady = true;
      paintSwatches(choices);
      updatePreview();
    }
    if (e.data?.action === 'tm-preview-rendered') {
      previewHeight = Math.max(60, Math.min(e.data.height, 1600));
      sizePreview();
    }
  });
}

function choiceGroup(title, options, current, onPick, { swatch = false } = {}) {
  const group = el('fieldset', { class: 'tm-group' }, el('legend', {}, title));
  const row = el('div', { class: 'tm-choices', role: 'radiogroup', 'aria-label': title });
  const buttons = [];
  const select = (value) => {
    onPick(value);
    buttons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === value)));
    updatePreview();
  };
  [['', 'None'], ...options.map((o) => [o, LABELS[o] || labelOf(o)])].forEach(([value, label]) => {
    const button = el('button', {
      type: 'button',
      role: 'radio',
      class: `tm-choice${swatch && value ? ' tm-swatch' : ''}`,
      'data-value': value,
      'aria-checked': String(value === current),
      title: value ? `${label} — word “${value}”` : 'No change',
      // a choice that doesn't fit the selection (special looks) is greyed out with its reason
      onclick: () => { if (button.getAttribute('aria-disabled') !== 'true') select(value); },
    }, swatch && value ? el('span', { class: 'tm-dot', 'aria-hidden': 'true' }) : null, label);
    if (swatch && value) button.dataset.colour = value;
    buttons.push(button);
    row.append(button);
  });
  group.append(row);
  group.select = select;
  return group;
}

/*
 * Special looks fit only some text, as Block options fit only some blocks: the gold rule draws
 * a rule under a heading, and a box goes around a whole line (on part of a sentence it would
 * break the sentence apart). The panel greys out a look that doesn't fit the selection, with
 * the reason and what the look does on hover; a look the words already have stays available.
 */
const LOOK_HINTS = {
  'rule-gold': 'A gold rule under the heading (stryker.com feature titles)',
};
const boxHint = (word) => `The whole line in a ${(LABELS[word] || labelOf(word)).replace(/^Box: /, '').replace(/ \(.*\)$/, '').toLowerCase()} box`;

// what the panel knows about the selection: its line's tag, whether it is the whole line
// (null when the document can't be read), and the marker words it already has
let selectionFacts = null;
let lookGroup;

/**
 * Why a look doesn't fit the selection, or '' when it does.
 * @param {string} word The look's marker word
 * @returns {string} The reason
 */
function lookUnfit(word) {
  if (!selectionFacts) return 'select the words in the document first';
  if (`-${selectionFacts.old}-`.includes(`-${word}-`)) return '';
  if (word === 'rule-gold' && !/^H[1-6]$/.test(selectionFacts.tag)) return 'it goes under a heading (the selection is in a paragraph or list)';
  if (word.startsWith('box-') && selectionFacts.whole === false) return 'select the whole line: the box goes around the whole line';
  return '';
}

/** greys out the looks that don't fit the selection, and drops a picked look that no longer fits */
function updateLooks() {
  if (!lookGroup) return;
  let reasons = 0;
  const buttons = [...lookGroup.querySelectorAll('.tm-choice')].filter((b) => b.dataset.value);
  buttons.forEach((button) => {
    const word = button.dataset.value;
    const reason = lookUnfit(word);
    const label = button.textContent.trim();
    const hint = LOOK_HINTS[word] || (word.startsWith('box-') ? boxHint(word) : '');
    button.classList.toggle('tm-unfit', !!reason);
    if (reason) button.setAttribute('aria-disabled', 'true');
    else button.removeAttribute('aria-disabled');
    button.title = [reason ? `Not available here: ${reason}.` : '', hint ? `${hint}.` : '', `${label} — word “${word}”`]
      .filter(Boolean).join(' ');
    if (reason) reasons += 1;
    if (reason && state.look === word) lookGroup.select('');
  });
  const note = lookGroup.querySelector('.tm-reason');
  note.hidden = reasons !== buttons.length;
}

// containers the editor wraps a selection in (a selection inside a block comes back inside
// its table, row and cell) and the lines that hold text
const WRAPPERS = /^(TABLE|THEAD|TBODY|TR|TD|TH|DIV|UL|OL|BLOCKQUOTE)$/;
const LINES = /^(P|H[1-6]|LI)$/;

/**
 * The line a selection sits in: its tag (P, H1 … H6, LI) and the selected inline HTML,
 * found below the table / cell / list wrappers the editor returns around it. Null when the
 * selection spans several lines (markers style part of one line).
 * @param {string} html The selection as the editor returns it
 * @returns {{tag: string, html: string}|null} The line
 */
function readLine(html) {
  // parsed in an inert document: nothing is rendered or run
  const { body } = new DOMParser().parseFromString(html.trim(), 'text/html');
  let node = body;
  for (;;) {
    const elements = [...node.children];
    const loose = [...node.childNodes]
      .some((c) => c.nodeType === Node.TEXT_NODE && c.textContent.trim());
    if (elements.length === 1 && !loose && WRAPPERS.test(elements[0].tagName)) {
      [node] = elements;
    } else break;
  }
  const lines = [...node.children].filter((c) => LINES.test(c.tagName) || WRAPPERS.test(c.tagName));
  if (lines.length > 1) return null;
  if (lines.length === 1 && node.children.length === 1 && LINES.test(lines[0].tagName)) {
    return { tag: lines[0].tagName, html: lines[0].innerHTML };
  }
  if (lines.length === 1) return null;
  return { tag: 'P', html: node.innerHTML };
}

// inline formatting the editor keeps on text it inserts in place of a selection: only
// formatting that covers the whole selection survives (it is taken from where it starts)
const FORMATTING = 'strong, b, em, i, u, s, sub, sup';

/**
 * The selection as the editor returns it, or '' when nothing is selected. The DA editor
 * answers an empty selection with an error; a host without selection support may not answer
 * at all, so the wait is short.
 * @returns {Promise<string>} The selected HTML
 */
async function readSelection() {
  try {
    const html = await Promise.race([
      sdk.actions.getSelection(),
      new Promise((resolve) => { setTimeout(() => resolve(''), 1500); }),
    ]);
    return html || '';
  } catch {
    return '';
  }
}

// the markers as authors see them in the document text
const MARKER_TEXT = /:(?:start-[a-z0-9-]+|end):/g;

/**
 * Whether the selection can be rewritten as plain text without losing anything: no links or
 * line breaks, and any bold / italic covering all of it.
 * @param {string} inner The selection's inline HTML
 * @returns {{text: string, ok: boolean}} Its text, and whether rewriting it is safe
 */
function analyseSelection(inner) {
  const { body } = new DOMParser().parseFromString(`<p>${inner}</p>`, 'text/html');
  const line = body.firstElementChild;
  const text = line.textContent;
  if (line.querySelector('a, br, img')) return { text, ok: false };
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  const formats = new Set();
  let markersApart = false;
  while (walker.nextNode()) {
    const markersOnly = !walker.currentNode.textContent.replace(MARKER_TEXT, '').trim();
    if (markersOnly && walker.currentNode.textContent.trim()) markersApart = true;
    if (!markersOnly) {
      const marks = [];
      let node = walker.currentNode.parentElement;
      while (node && node !== line) {
        if (node.matches(FORMATTING)) marks.push(node.tagName.replace(/^B$/, 'STRONG').replace(/^I$/, 'EM'));
        node = node.parentElement;
      }
      formats.add(marks.sort().join(','));
    }
  }
  return { text, ok: formats.size <= 1, markersApart };
}

// the document, when the editor shares it (Experience Workspace's live document)
let liveHtml = '';
let liveText = '';
// the block holding the cursor in that document (null outside a block) and whether it's editable
let liveBlockIndex = null;
let liveEditable = true;
// the DA editor's saved source, read at most every few seconds
let sourceCache = { at: 0, html: '' };

/**
 * The style already around the selected words on the page, when they sit right inside a
 * marker pair (`:start-gold:words:end:`) and the editor shares the document.
 * @param {string} words The selected words
 * @returns {string} The existing marker words, or ''
 */
function styleAround(words, text = liveText) {
  if (!text || !words.trim()) return '';
  const escaped = words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = text.match(new RegExp(`:start-([a-z0-9-]+):${escaped}:end:`));
  return m ? m[1] : '';
}

/**
 * The document's HTML: Experience Workspace shares it live; the DA editor does not, so it is
 * read from the document's saved source (the editor saves as the author types).
 * @returns {Promise<string>} The HTML, or '' when it cannot be read
 */
async function documentHtml() {
  if (liveHtml) return liveHtml;
  if (Date.now() - sourceCache.at < 4000) return sourceCache.html;
  const ctx = sdk.context || sdk.project || {};
  if (!ctx.org || !ctx.repo || !ctx.path || typeof sdk.actions.daFetch !== 'function') return '';
  let html = '';
  try {
    const resp = await Promise.race([
      sdk.actions.daFetch(`https://admin.da.live/source/${ctx.org}/${ctx.repo}${ctx.path}.html`),
      new Promise((resolve) => { setTimeout(() => resolve(null), 3000); }),
    ]);
    if (resp?.ok) html = await resp.text();
  } catch {
    html = '';
  }
  sourceCache = { at: Date.now(), html };
  return html;
}

async function documentText() {
  if (liveText) return liveText;
  const html = await documentHtml();
  return html ? new DOMParser().parseFromString(html, 'text/html').body.textContent : '';
}

const plain = (text) => text.replace(MARKER_TEXT, '').replace(/\s+/g, ' ').trim();
const toClassName = (s) => s.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

/**
 * The block the selected words sit in, from the document's markup (sections hold blocks as
 * <div class="name options">), with its section's styles (Section Metadata "style").
 * @param {string} words The selected words
 * @returns {Promise<{block: string, sectionStyles: string[], name: string}|null>} The block
 */
async function findBlock(words) {
  const html = await documentHtml();
  const target = plain(words);
  if (!html || !target) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('main') || doc.body;
  const blocks = [...root.querySelectorAll(':scope > div > div[class]')]
    .filter((b) => !/^(section-metadata|metadata)$/.test(b.classList[0]));
  const block = blocks.find((b) => plain(b.textContent).includes(target));
  if (!block) return null;
  const meta = block.parentElement.querySelector(':scope > .section-metadata');
  const styleRow = meta && [...meta.children]
    .find((row) => row.children[0]?.textContent.trim().toLowerCase() === 'style');
  const sectionStyles = styleRow
    ? styleRow.children[1].textContent.split(',').map(toClassName).filter(Boolean) : [];
  return { block: block.outerHTML, sectionStyles, name: block.classList[0] };
}

/**
 * Whether the selected words are their whole line, from the document (null when unknown).
 * @param {string} words The selected words
 * @returns {Promise<boolean|null>} The answer
 */
async function isWholeLine(words) {
  const html = await documentHtml();
  const target = plain(words);
  if (!html || !target) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines = [...doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')]
    .filter((line) => plain(line.textContent).includes(target));
  if (!lines.length) return null;
  return lines.some((line) => plain(line.textContent) === target);
}

/*
 * Experience Workspace: the markers go in through a guarded replace of the block holding the
 * selection (outside blocks: its paragraph, heading or list), the way Block options changes a
 * block, so the canvas re-renders the styled text at once. Typed text (sendText) changes the
 * document but leaves the canvas as it was.
 */
const LIVE_LINES = ':scope > div > :is(p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote)';
const LIVE_SKIP = /^(section-metadata|metadata|da-metadata|library-metadata)$/;

/** the text nodes of an element that hold `text` */
function textNodesWith(root, text) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.includes(text)) hits.push(walker.currentNode);
  }
  return hits;
}

/**
 * Puts the markers around the one occurrence of `find` in the target: when the words fill
 * their bold / italic / underline, the markers go outside it (EDS then reads both markers).
 * @returns {boolean} false when the words are not exactly once in one text node
 */
function markInTarget(target, find, words, marker) {
  const count = target.textContent.split(find).length - 1;
  const hits = textNodesWith(target, find);
  if (count !== 1 || hits.length !== 1) return false;
  const [node] = hits;
  const doc = target.ownerDocument;
  if (node.textContent === find) {
    let outer = node;
    while (outer.parentElement !== target && outer.parentElement.matches(FORMATTING)
      && outer.parentElement.childNodes.length === 1) outer = outer.parentElement;
    node.textContent = words;
    outer.before(doc.createTextNode(marker));
    outer.after(doc.createTextNode(END_MARKER));
    return true;
  }
  const at = node.textContent.indexOf(find);
  const before = node.textContent.slice(0, at);
  const after = node.textContent.slice(at + find.length);
  node.textContent = readable(`${before}${marker}${words}${END_MARKER}${after}`);
  return true;
}

/**
 * Applies the markers through the live document.
 * @param {string} find The selected text as it is in the document (with any old markers)
 * @param {string} words The words to style
 * @param {string} marker The start marker
 * @returns {Promise<boolean>} true when the canvas took the change
 */
/**
 * The live document and the element a replace targets: the block holding the cursor, or
 * outside blocks the one paragraph / heading / list whose text holds `find`.
 * @returns {{html: string, blockIndex: number|null, target: Element}|null}
 */
function liveTarget(find) {
  if (!liveHtml || !liveEditable || sdk.capabilities?.sendHTMLReplace !== 1) return null;
  const html = liveHtml;
  const blockIndex = liveBlockIndex;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('main') || doc.body;
  let target;
  if (blockIndex !== null) {
    target = [...root.querySelectorAll(':scope > div > div[class]')]
      .filter((b) => !LIVE_SKIP.test(b.classList[0]))[blockIndex];
  } else {
    const lines = [...root.querySelectorAll(LIVE_LINES)]
      .filter((l) => l.textContent.includes(find));
    if (lines.length === 1) [target] = lines;
  }
  return target ? { html, blockIndex, target } : null;
}

/** the text node and offset at a character position of an element's text */
function textAt(root, pos) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let start = 0;
  while (walker.nextNode()) {
    const { length } = walker.currentNode.textContent;
    if (pos < start + length) return { node: walker.currentNode, offset: pos - start };
    start += length;
  }
  return null;
}

/** sends the changed target as a guarded replace; true when the canvas took it */
async function sendLive({ html, blockIndex, target }) {
  let result;
  try {
    const expected = { html, blockIndex };
    result = await sdk.actions.sendHTML(target.outerHTML, { replace: true, expected });
  } catch {
    return false;
  }
  if (!result?.ok) return false;
  if (typeof result.html === 'string') {
    liveHtml = result.html;
    liveText = new DOMParser().parseFromString(liveHtml, 'text/html').body.textContent;
  }
  return true;
}

/**
 * A restyle through the live document: only the start marker of the styled run changes, so
 * the words keep their formatting wherever the old markers sit (inside or outside it).
 * @param {string} oldName The marker words of the current style
 * @param {string} words The styled words, or '' when only the start marker is selected
 * @param {string} marker The new start marker
 * @returns {Promise<boolean>} true when the canvas took the change
 */
async function swapInLive(oldName, words, marker) {
  const oldMarker = `:start-${oldName}:`;
  const run = words ? `${oldMarker}${words}${END_MARKER}` : oldMarker;
  const live = liveTarget(run);
  if (!live) return false;
  const text = live.target.textContent;
  const pos = text.indexOf(run);
  if (pos < 0 || text.indexOf(run, pos + 1) >= 0) return false;
  const hit = textAt(live.target, pos);
  if (!hit || !hit.node.textContent.startsWith(oldMarker, hit.offset)) return false;
  const value = hit.node.textContent;
  hit.node.textContent = `${value.slice(0, hit.offset)}${marker}${value.slice(hit.offset + oldMarker.length)}`;
  return sendLive(live);
}

async function replaceInLive(find, words, marker) {
  const live = liveTarget(find);
  if (!live || !markInTarget(live.target, find, words, marker)) return false;
  return sendLive(live);
}

/*
 * Remove style: the selected words lose their markers and keep their words and formatting.
 * Experience Workspace: both markers of the run are cut out of the live document (a guarded
 * replace, as a restyle swaps its start marker). Elsewhere, a selection of the whole run
 * (markers and words, one formatting) is retyped as its words; otherwise the panel says which
 * two markers to delete.
 */
const cut = (value, at, length) => `${value.slice(0, at)}${value.slice(at + length)}`;
const TAGS = /<[^>]+>/g;

/** why Remove style can't be used for the selection ('' when it can) */
function removeUnfit() {
  if (!selectionFacts) return 'select the styled words in the document first';
  if (!selectionFacts.old) return 'the selected words have no Text style';
  return '';
}

function updateRemove() {
  if (!removeButton) return;
  const reason = removeUnfit();
  removeButton.classList.toggle('tm-unfit', !!reason);
  if (reason) removeButton.setAttribute('aria-disabled', 'true');
  else removeButton.removeAttribute('aria-disabled');
  removeButton.title = reason
    ? `Not available here: ${reason}.`
    : `Takes :start-${selectionFacts.old}: and :end: off the words; the words and their bold or italic stay.`;
}

async function unwrapInLive(oldName, words) {
  const oldMarker = `:start-${oldName}:`;
  const run = `${oldMarker}${words}${END_MARKER}`;
  const live = liveTarget(run);
  if (!live) return false;
  const text = live.target.textContent;
  const pos = text.indexOf(run);
  if (pos < 0 || text.indexOf(run, pos + 1) >= 0) return false;
  // the end marker first: cutting it leaves the start marker's place as it was
  const end = textAt(live.target, pos + oldMarker.length + words.length);
  if (!end || !end.node.textContent.startsWith(END_MARKER, end.offset)) return false;
  end.node.textContent = cut(end.node.textContent, end.offset, END_MARKER.length);
  const start = textAt(live.target, pos);
  if (!start || !start.node.textContent.startsWith(oldMarker, start.offset)) return false;
  start.node.textContent = cut(start.node.textContent, start.offset, oldMarker.length);
  return sendLive(live);
}

async function removeStyle() {
  if (!sdk || removeButton.getAttribute('aria-disabled') === 'true') return;
  const selected = await readSelection();
  const line = selected ? readLine(selected) : null;
  if (!line || !line.html.replace(TAGS, '').trim()) {
    setStatus('Select the styled words (with or without their markers), then “Remove style”.', 'error');
    return;
  }
  const { text, ok, markersApart } = analyseSelection(line.html);
  const inSelection = text.match(/:start-([a-z0-9-]+):/);
  const words = text.replace(MARKER_TEXT, '');
  const old = inSelection ? inSelection[1] : styleAround(words, liveText || await documentText());
  if (!old) {
    setStatus('These words have no Text style to remove.', 'error');
    return;
  }
  if (!words.trim()) {
    setStatus('Select the styled words too, not only the marker.', 'error');
    return;
  }
  const finish = () => {
    setStatus(`Removed the style :start-${old}: from “${words.trim()}”. The words keep their formatting.`, 'ok');
    previewLine = null;
    previewBlock = null;
    selectionFacts = null;
    lastSelection = '';
    updateLooks();
    updateRemove();
    updatePreview();
  };
  if (await unwrapInLive(old, words)) {
    finish();
    return;
  }
  // the whole run selected, markers inside one formatting: typing its words over it keeps them
  const trimmed = text.trim();
  const whole = inSelection && trimmed.startsWith(`:start-${old}:`) && trimmed.endsWith(END_MARKER);
  if (whole && ok && !markersApart && (text.match(MARKER_TEXT) || []).length === 2) {
    sdk.actions.sendText(words);
    finish();
    return;
  }
  setStatus(`To remove the style, delete “:start-${old}:” before the words and “:end:” after them. The words keep their formatting.`, 'info');
}

async function applyToSelection() {
  const marker = startMarker();
  if (!marker || !sdk) return;
  const selected = await readSelection();
  const line = selected ? readLine(selected) : { tag: 'P', html: '' };
  const inner = line && line.html;
  if (line === null) {
    setStatus('Select text within one paragraph or heading: markers style part of a single line.', 'error');
    return;
  }
  if (!inner || !inner.replace(/<[^>]+>/g, '').trim()) {
    setStatus('Nothing is selected. Select the words to style, or use “Insert at caret” (More options).', 'error');
    moreOptions.open = true;
    return;
  }
  const { text, ok, markersApart } = analyseSelection(inner);
  if (!ok) {
    setStatus('The selection has a link, a line break or mixed formatting, which rewriting it would lose. Use “Insert start” before the words and “Insert end” after them instead (More options).', 'error');
    moreOptions.open = true;
    return;
  }
  // a restyle: the selection includes the old markers, which the new ones replace
  const old = text.match(/:start-([a-z0-9-]+):/);
  const words = text.replace(MARKER_TEXT, '');
  const done = (from) => {
    setStatus(`Changed the style${words.trim() ? ` of “${words.trim()}”` : ''} from :start-${from}: to ${marker}`, 'ok');
    previewLine = null;
    previewBlock = null;
    lastSelection = '';
    updatePreview();
  };
  // only the start marker selected: it is swapped for the new one
  if (old && !words.trim() && /^\s*:start-[a-z0-9-]+:\s*$/.test(text)) {
    if (!(await swapInLive(old[1], '', marker))) sdk.actions.sendText(marker);
    done(old[1]);
    return;
  }
  if (!words.trim()) {
    setStatus('Only markers are selected. Select the words too.', 'error');
    return;
  }
  // the words alone, but already inside markers on the page: in Experience Workspace their
  // start marker is swapped; elsewhere wrapping them again would stack a second style
  const around = !old && styleAround(words, await documentText());
  if (around) {
    if (await swapInLive(around, words, marker)) {
      done(around);
      return;
    }
    setStatus(`These words already have the style :start-${around}:. To change it, select them together with their markers — from “:start-${around}:” to “:end:” — then click again.`, 'error');
    return;
  }
  if (old) {
    if (await swapInLive(old[1], words, marker)) {
      done(old[1]);
      return;
    }
    // markers outside the words' bold / italic: typing over the run would drop that
    // formatting, so only the start marker is swapped
    if (markersApart) {
      setStatus(`To change this style, select only its start marker “:start-${old[1]}:”, then click again.`, 'error');
      return;
    }
  }
  // Experience Workspace: a guarded replace of the block / line, so the canvas re-renders;
  // otherwise plain text replaces the selection inside its line (HTML would be inserted as a
  // new paragraph); bold / italic covering the whole selection is kept by the editor
  const live = await replaceInLive(text, words, marker);
  if (!live) sdk.actions.sendText(readable(`${marker}${words}${END_MARKER}`));
  setStatus(old
    ? `Changed the style of “${words.trim()}” from :start-${old[1]}: to ${marker}`
    : `Styled “${words.trim()}” with ${marker} … ${END_MARKER}`, 'ok');
  previewLine = null;
  previewBlock = null;
  lastSelection = '';
  updatePreview();
}

/**
 * Inserts text at the caret, refusing when words are selected (they would be replaced).
 * @param {string} text The text to insert
 * @param {string} done The status message on success
 */
async function insertText(text, done) {
  if (!sdk) return;
  if ((await readSelection()).replace(/<[^>]+>/g, '').trim()) {
    setStatus('Words are selected and would be replaced. Click where the markers go, with nothing selected.', 'error');
    return;
  }
  sdk.actions.sendText(text);
  setStatus(done, 'ok');
}

function insertAtCaret() {
  const marker = startMarker();
  if (!marker) return;
  insertText(`${marker}Your text${END_MARKER}`, 'Inserted the markers at the caret: replace “Your text” with your words.');
}

function insertStart() {
  const marker = startMarker();
  if (!marker) return;
  insertText(marker, `Inserted ${marker}. Now click after the words and use “Insert end”.`);
}

function insertEnd() {
  insertText(END_MARKER, `Inserted ${END_MARKER}. The words between the markers are styled on the page.`);
}

async function copyCode() {
  const marker = startMarker();
  if (!marker) return;
  try {
    await navigator.clipboard.writeText(`${marker}Your text${END_MARKER}`);
    setStatus('Copied. Paste it into the document and replace “Your text”.', 'ok');
  } catch {
    setStatus(`Copy this into the document: ${marker}Your text${END_MARKER}`, 'info');
  }
}

function render() {
  const root = document.querySelector('.tm');
  statusEl = el('p', { class: 'tm-status', role: 'status' });
  codeEl = el('code', { class: 'tm-code' });
  previewNote = el('p', { class: 'tm-hint' });
  previewFrame = el('iframe', { class: 'tm-preview', title: 'Preview', src: `/tools/text-markers/preview.html?v=${Date.now()}` });
  const frameBox = el('div', { class: 'tm-frame' }, previewFrame);
  const viewButtons = Object.keys(VIEWS).map((name) => el('button', {
    type: 'button',
    class: 'tm-choice',
    role: 'radio',
    'aria-checked': String(name === view),
    onclick: () => {
      view = name;
      viewButtons.forEach((b) => b.setAttribute('aria-checked', String(b.textContent.toLowerCase() === name)));
      updatePreview();
    },
  }, name === 'desktop' ? 'Desktop' : 'Phone'));
  viewToggle = el('div', { class: 'tm-choices', role: 'radiogroup', 'aria-label': 'Preview width' }, ...viewButtons);

  lookGroup = choiceGroup('Special look', lists.look, state.look, (v) => { state.look = v; });
  lookGroup.append(el('p', { class: 'tm-hint tm-reason', hidden: true }, 'Greyed out: select the words in the document first.'));
  const choices = el(
    'div',
    { class: 'tm-choices-wrap' },
    choiceGroup('Colour', lists.colour, state.colour, (v) => { state.colour = v; }, { swatch: true }),
    choiceGroup('Font', lists.font, state.font, (v) => { state.font = v; }),
    choiceGroup('Size (relative to the text around it)', lists.size, state.size, (v) => { state.size = v; }),
    lookGroup,
    el('p', { class: 'tm-hint' }, 'The gold rule goes under a heading; a box goes around a whole line. Looks that don’t fit the selection are greyed out: hover for why. Bold and italic stay normal editor formatting.'),
  );

  const apply = el('button', { type: 'button', class: 'tm-primary', onclick: applyToSelection }, 'Style selected text');
  const insert = el('button', { type: 'button', onclick: insertAtCaret }, 'Insert at caret');
  const start = el('button', { type: 'button', onclick: insertStart }, 'Insert start');
  const end = el('button', { type: 'button', onclick: insertEnd }, 'Insert end');
  const copy = el('button', { type: 'button', onclick: copyCode }, 'Copy code');
  removeButton = el('button', { type: 'button', class: 'tm-remove', onclick: removeStyle }, 'Remove style');
  noticeEl = el('p', { class: 'tm-hint tm-notice', hidden: true }, REVIEW_NOTE);
  columnsNote = el('p', { class: 'tm-hint tm-pointer', hidden: true }, 'In Columns, a look for the whole row’s text (large headline, serif lead, pull quotes) is in Block options → Text look.');
  applyButtons = [apply, insert, start];
  endButton = end;
  // the less common ways in: opened by the panel when it points the author to one of them
  moreOptions = el(
    'details',
    { class: 'tm-more' },
    el('summary', {}, 'More options'),
    el('div', { class: 'tm-actions' }, insert, copy),
    el('p', { class: 'tm-hint' }, '“Insert at caret” adds :start-…:Your text:end: where the cursor is (nothing selected); type over “Your text”. “Copy code” copies it to paste yourself.'),
    el('div', { class: 'tm-actions' }, start, end),
    el('p', { class: 'tm-hint' }, 'Words with a link or mixed formatting: click before them and use “Insert start”, then after them and use “Insert end”. Their formatting stays as it is.'),
  );

  root.append(
    el('h1', {}, 'Text style'),
    noticeEl,
    el('div', { class: 'tm-result' }, codeEl, previewNote, viewToggle, frameBox),
    el('div', { class: 'tm-actions' }, apply, removeButton),
    statusEl,
    moreOptions,
    choices,
    el('p', { class: 'tm-hint tm-pointer' }, 'Changing the whole block (box colour, layout, spacing)? Use Block options.'),
    columnsNote,
  );
  listenToPreview(choices);
  window.addEventListener('resize', sizePreview);
  updateLooks();
  updateRemove();
  updatePreview();
}

/**
 * Keeps the preview on the author's selection: the editor has no selection-change event for
 * extensions, so the panel asks for the selection about once a second while it is visible.
 */
function watchSelection() {
  let busy = false;
  const check = async () => {
    if (busy || document.hidden || !sdk) return;
    busy = true;
    const html = await readSelection();
    busy = false;
    if (html === lastSelection) return;
    lastSelection = html;
    const line = html ? readLine(html) : null;
    if (line) {
      // a selection that includes old markers is previewed without them
      const selectedText = line.html.replace(/<[^>]+>/g, '');
      line.old = (line.html.match(/:start-([a-z0-9-]+):/) || [])[1]
        || styleAround(selectedText, liveText || await documentText()) || '';
      line.html = line.html.replace(MARKER_TEXT, '');
      line.words = new DOMParser().parseFromString(`<p>${line.html}</p>`, 'text/html').body.textContent;
    }
    previewLine = line && line.words.trim() ? line : null;
    previewBlock = previewLine ? await findBlock(previewLine.words) : null;
    const whole = previewLine ? await isWholeLine(previewLine.words) : null;
    if (html !== lastSelection) return; // the selection moved on while the block was read
    selectionFacts = previewLine ? { tag: previewLine.tag, whole, old: previewLine.old || '' } : null;
    updateLooks();
    updateRemove();
    updatePreview();
  };
  setInterval(check, 1000);
  window.addEventListener('focus', check);
  document.addEventListener('pointerenter', check);
  check();
}

async function connect() {
  setStatus('Connecting to the editor…');
  try {
    const { default: DA_SDK } = await import(SDK_URL);
    const resolved = await Promise.race([
      DA_SDK,
      new Promise((resolve) => { setTimeout(() => resolve(null), 4000); }),
    ]);
    if (!resolved?.actions) {
      setStatus('Open this panel from the editor to apply styles. You can still build and copy the code here.', 'info');
      return;
    }
    sdk = resolved;
    noticeEl.hidden = !outsideReview(documentPath(sdk));
    // Experience Workspace shares the document: used to spot words that already have a style
    if (sdk.capabilities?.liveDocument === 1 && typeof sdk.actions.subscribeLiveDocument === 'function') {
      sdk.actions.subscribeLiveDocument(({ html, selection, editable }) => {
        liveHtml = html || '';
        liveText = new DOMParser().parseFromString(liveHtml, 'text/html').body.textContent;
        liveBlockIndex = Number.isInteger(selection?.blockIndex) ? selection.blockIndex : null;
        liveEditable = editable !== false;
      });
    }
    watchSelection();
    setStatus('Select words in the document, pick a style, then “Style selected text”.');
    updatePreview();
  } catch (error) {
    setStatus(`Could not connect to the editor: ${error.message}. You can still copy the code.`, 'error');
  }
}

await loadLists();
render();
connect();
