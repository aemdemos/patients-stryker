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
  COLOURS, FONTS, SIZES, STEPS, parseMarker,
} from '../../scripts/span-markers.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';

const LABELS = {
  blue: 'Blue',
  gold: 'Gold',
  purple: 'Purple',
  teal: 'Teal',
  navy: 'Navy',
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
};
const STEP_LABELS = {
  xs: 'XS (5px)', s: 'S (10px)', m: 'M (15px)', l: 'L (20px)', xl: 'XL (30px)',
};
const SIDES = [
  ['', 'All sides'],
  ['t', 'Top'],
  ['r', 'Right'],
  ['b', 'Bottom'],
  ['l', 'Left'],
  ['x', 'Left and right'],
  ['y', 'Top and bottom'],
];

const state = {
  colour: '', font: '', upper: false, size: '', padding: { side: 'x', step: '' }, margin: { side: 'y', step: '' },
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
  if (state.upper) words.push('upper');
  if (state.size) words.push(state.size);
  [['p', state.padding], ['m', state.margin]].forEach(([kind, { side, step }]) => {
    if (step) words.push(`${kind}${side}`, step);
  });
  return words;
}

const startMarker = () => (markerWords().length ? `:start-${markerWords().join('-')}:` : '');
const END_MARKER = ':end:';

let sdk = null;
let statusEl;
let codeEl;
let previewFrame;
let applyButtons = [];
let endButton;
let previewNote;

function setStatus(text, kind = 'info') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

/* preview: an isolated frame with the site's styles, so the sample looks as on the page */
function previewDocument() {
  const { origin } = window.location;
  return `<!DOCTYPE html><html><head>
    <link rel="stylesheet" href="${origin}/styles/styles.css">
    <link rel="stylesheet" href="${origin}/styles/fonts.css">
    <link rel="stylesheet" href="${origin}/styles/styles-corp.css">
    <style>body{margin:0;padding:12px;background:#fff}main{padding:0}
    #stage > *, #stage-dark > *{margin:0}
    .tm-dark{background:#1f1f1f;padding:12px;margin-top:8px;color:#fff}</style>
    </head><body class="corp appear"><main><div id="stage"></div>
    <div class="tm-dark"><div id="stage-dark"></div></div>
    </main></body></html>`;
}

// the line being previewed: the author's selection in its paragraph / heading, or a sample
let previewLine = null;
let lastSelection = '';

/**
 * Renders the preview: the selected words (or a sample) styled with the current choice,
 * inside the same kind of line (paragraph or heading level) they sit in on the page.
 */
function renderPreview(classes, spacing) {
  const doc = previewFrame.contentDocument;
  ['stage', 'stage-dark'].forEach((id) => {
    const stage = doc.getElementById(id);
    if (!stage) return;
    const tag = previewLine ? previewLine.tag.toLowerCase() : 'p';
    const line = doc.createElement(tag);
    const span = doc.createElement('span');
    span.className = ['text-marker', ...classes].join(' ');
    spacing.forEach(([prop, value]) => { span.style[prop] = value; });
    if (previewLine) {
      // the selection's own inline markup (bold, italic, links), parsed inertly and imported
      const parsed = new DOMParser().parseFromString(`<p>${previewLine.html}</p>`, 'text/html');
      const nodes = [...parsed.body.firstElementChild.childNodes];
      span.append(...nodes.map((n) => doc.importNode(n, true)));
      line.append(span);
    } else {
      line.append('Preview: ', span, ' next to plain text.');
      span.textContent = 'Your styled text';
    }
    stage.replaceChildren(line);
  });
}

function updatePreview() {
  const marker = startMarker();
  codeEl.textContent = marker ? `${marker}Your text${END_MARKER}` : 'Pick a style below';
  applyButtons.forEach((b) => { b.disabled = !marker || !sdk; });
  if (endButton) endButton.disabled = !sdk;
  if (!previewFrame.contentDocument?.getElementById('stage')) return;
  const { classes, spacing } = parseMarker(markerWords().join('-'));
  renderPreview(classes, spacing);
  // the frame grows with the previewed line (a large heading wraps onto several lines)
  const main = previewFrame.contentDocument.querySelector('main');
  const height = Math.ceil(main.getBoundingClientRect().bottom) + 12;
  previewFrame.style.height = `${Math.min(Math.max(height, 80), 360)}px`;
  const kind = previewLine && (previewLine.tag === 'P' ? 'paragraph' : `heading ${previewLine.tag.slice(1)}`);
  let note = 'Select words in the document to preview them here.';
  if (previewLine) note = `Previewing your selection (${kind}).`;
  if (previewLine?.old) note = `Previewing your selection (${kind}), now styled :start-${previewLine.old}:.`;
  previewNote.textContent = note;
}

/** colour swatches take their colour from the site's own color-* classes */
function paintSwatches(container) {
  const doc = previewFrame.contentDocument;
  if (!doc?.body) return;
  container.querySelectorAll('[data-colour]').forEach((button) => {
    const probe = doc.createElement('span');
    probe.className = `color-${button.dataset.colour}`;
    probe.textContent = 'x';
    doc.querySelector('main').append(probe);
    button.style.setProperty('--swatch', doc.defaultView.getComputedStyle(probe).color);
    probe.remove();
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
  [['', 'None'], ...options.map((o) => [o, LABELS[o] || o])].forEach(([value, label]) => {
    const button = el('button', {
      type: 'button',
      role: 'radio',
      class: `tm-choice${swatch && value ? ' tm-swatch' : ''}`,
      'data-value': value,
      'aria-checked': String(value === current),
      title: value ? `${label} — word “${value}”` : 'No change',
      onclick: () => select(value),
    }, swatch && value ? el('span', { class: 'tm-dot', 'aria-hidden': 'true' }) : null, label);
    if (swatch && value) button.dataset.colour = value;
    buttons.push(button);
    row.append(button);
  });
  group.append(row);
  return group;
}

function spacingGroup(title, kind) {
  const value = state[kind];
  const sideSelect = el('select', { 'aria-label': `${title} side`, onchange: (e) => { value.side = e.target.value; updatePreview(); } });
  SIDES.forEach(([v, label]) => sideSelect.append(el('option', { value: v, selected: v === value.side }, label)));
  const stepSelect = el('select', { 'aria-label': `${title} size`, onchange: (e) => { value.step = e.target.value; updatePreview(); } });
  stepSelect.append(el('option', { value: '' }, 'None'));
  Object.keys(STEPS).forEach((step) => stepSelect.append(el('option', { value: step }, STEP_LABELS[step] || step)));
  return el('fieldset', { class: 'tm-group' }, el('legend', {}, title), el('div', { class: 'tm-row' }, sideSelect, stepSelect));
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
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) {
      const marks = [];
      let node = walker.currentNode.parentElement;
      while (node && node !== line) {
        if (node.matches(FORMATTING)) marks.push(node.tagName.replace(/^B$/, 'STRONG').replace(/^I$/, 'EM'));
        node = node.parentElement;
      }
      formats.add(marks.sort().join(','));
    }
  }
  return { text, ok: formats.size <= 1 };
}

// the markers as authors see them in the document text
const MARKER_TEXT = /:(?:start-[a-z0-9-]+|end):/g;

// the document's text, when the editor shares it (Experience Workspace's live document)
let liveText = '';

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
 * The document's text: Experience Workspace shares it live; the DA editor does not, so it is
 * read from the document's saved source (the editor saves as the author types).
 * @returns {Promise<string>} The text, or '' when it cannot be read
 */
async function documentText() {
  if (liveText) return liveText;
  const ctx = sdk.context || sdk.project || {};
  if (!ctx.org || !ctx.repo || !ctx.path || typeof sdk.actions.daFetch !== 'function') return '';
  try {
    const resp = await Promise.race([
      sdk.actions.daFetch(`https://admin.da.live/source/${ctx.org}/${ctx.repo}${ctx.path}.html`),
      new Promise((resolve) => { setTimeout(() => resolve(null), 3000); }),
    ]);
    if (!resp?.ok) return '';
    return new DOMParser().parseFromString(await resp.text(), 'text/html').body.textContent;
  } catch {
    return '';
  }
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
    setStatus('Nothing is selected. Select the words to style, or use “Insert at caret”.', 'error');
    return;
  }
  const { text, ok } = analyseSelection(inner);
  if (!ok) {
    setStatus('The selection has a link, a line break or mixed formatting, which rewriting it would lose. Use “Insert start” before the words and “Insert end” after them instead.', 'error');
    return;
  }
  // a restyle: the selection includes the old markers, which the new ones replace
  const old = text.match(/:start-([a-z0-9-]+):/);
  const words = text.replace(MARKER_TEXT, '');
  if (!words.trim()) {
    setStatus('Only markers are selected. Select the words too.', 'error');
    return;
  }
  // the words alone, but already inside markers on the page: wrapping them again would
  // stack a second style on the first, so ask for the markers to be selected too
  const around = !old && styleAround(words, await documentText());
  if (around) {
    setStatus(`These words already have the style :start-${around}:. To change it, select them together with their markers — from “:start-${around}:” to “:end:” — then click again.`, 'error');
    return;
  }
  // plain text replaces the selection inside its line (HTML would be inserted as a new
  // paragraph); bold / italic covering the whole selection is kept by the editor
  sdk.actions.sendText(`${marker}${words}${END_MARKER}`);
  setStatus(old
    ? `Changed the style of “${words.trim()}” from :start-${old[1]}: to ${marker}`
    : `Styled “${words.trim()}” with ${marker} … ${END_MARKER}`, 'ok');
  previewLine = null;
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
  previewFrame = el('iframe', { class: 'tm-preview', title: 'Preview', srcdoc: previewDocument() });

  const choices = el(
    'div',
    { class: 'tm-choices-wrap' },
    choiceGroup('Colour', COLOURS, state.colour, (v) => { state.colour = v; }, { swatch: true }),
    choiceGroup('Font', FONTS.filter((f) => f !== 'upper'), state.font, (v) => { state.font = v; }),
    el('label', { class: 'tm-check' }, el('input', { type: 'checkbox', onchange: (e) => { state.upper = e.target.checked; updatePreview(); } }), 'Capitals (word “upper”)'),
    choiceGroup('Size (relative to the text around it)', SIZES, state.size, (v) => { state.size = v; }),
    spacingGroup('Padding', 'padding'),
    spacingGroup('Margin', 'margin'),
    el('p', { class: 'tm-hint' }, 'Top and bottom spacing applies when the whole line is styled; inside a line only left and right show. Bold and italic stay normal editor formatting.'),
  );

  const apply = el('button', { type: 'button', class: 'tm-primary', onclick: applyToSelection }, 'Style selected text');
  const insert = el('button', { type: 'button', onclick: insertAtCaret }, 'Insert at caret');
  const start = el('button', { type: 'button', onclick: insertStart }, 'Insert start');
  const end = el('button', { type: 'button', onclick: insertEnd }, 'Insert end');
  const copy = el('button', { type: 'button', onclick: copyCode }, 'Copy code');
  applyButtons = [apply, insert, start];
  endButton = end;

  root.append(
    el('h1', {}, 'Text style'),
    el('div', { class: 'tm-result' }, codeEl, previewNote, previewFrame),
    el('div', { class: 'tm-actions' }, apply, insert, copy),
    el('div', { class: 'tm-actions' }, start, end),
    el('p', { class: 'tm-hint' }, 'Words with a link or mixed formatting: click before them and use “Insert start”, then after them and use “Insert end”. Their formatting stays as it is.'),
    statusEl,
    choices,
  );
  previewFrame.addEventListener('load', () => {
    paintSwatches(choices);
    updatePreview();
  });
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
      line.old = (line.html.match(/:start-([a-z0-9-]+):/) || [])[1] || styleAround(line.html.replace(/<[^>]+>/g, '')) || '';
      line.html = line.html.replace(MARKER_TEXT, '');
    }
    previewLine = line && line.html.replace(/<[^>]+>/g, '').trim() ? line : null;
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
    // Experience Workspace shares the document: used to spot words that already have a style
    if (sdk.capabilities?.liveDocument === 1 && typeof sdk.actions.subscribeLiveDocument === 'function') {
      sdk.actions.subscribeLiveDocument(({ html }) => {
        liveText = new DOMParser().parseFromString(html || '', 'text/html').body.textContent;
      });
    }
    watchSelection();
    setStatus('Select words in the document, pick a style, then “Style selected text”.');
    updatePreview();
  } catch (error) {
    setStatus(`Could not connect to the editor: ${error.message}. You can still copy the code.`, 'error');
  }
}

render();
connect();
