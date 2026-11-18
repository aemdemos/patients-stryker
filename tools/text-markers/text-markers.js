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
    <style>body{margin:0;padding:12px;background:#fff}main{padding:0}p{margin:0}
    .tm-dark{background:#545857;padding:12px;margin-top:8px}</style>
    </head><body class="corp appear"><main><p id="line">Preview: <span id="sample">Your styled text</span> next to plain text.</p>
    <div class="tm-dark"><p id="line-dark">On a dark background: <span id="sample-dark">Your styled text</span></p></div>
    </main></body></html>`;
}

function updatePreview() {
  const marker = startMarker();
  codeEl.textContent = marker ? `${marker}Your text${END_MARKER}` : 'Pick a style below';
  applyButtons.forEach((b) => { b.disabled = !marker || !sdk; });
  if (endButton) endButton.disabled = !sdk;
  const doc = previewFrame.contentDocument;
  if (!doc || !doc.getElementById('sample')) return;
  const { classes, spacing } = parseMarker(markerWords().join('-'));
  ['sample', 'sample-dark'].forEach((id) => {
    const span = doc.getElementById(id);
    span.className = ['text-marker', ...classes].join(' ');
    span.removeAttribute('style');
    spacing.forEach(([prop, value]) => { span.style[prop] = value; });
  });
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

/**
 * The selected text's HTML without a single wrapping paragraph / heading; null when the
 * selection spans several lines (markers style part of one line).
 * @param {string} html The selection as the editor returns it
 * @returns {string|null} The inline HTML to wrap
 */
function unwrapSelection(html) {
  // parsed in an inert document: nothing is rendered or run
  const { body } = new DOMParser().parseFromString(html.trim(), 'text/html');
  const blocks = [...body.children].filter((c) => /^(P|H[1-6]|LI|UL|OL|DIV|TABLE)$/.test(c.tagName));
  if (blocks.length > 1) return null;
  if (blocks.length === 1 && body.children.length === 1) return blocks[0].innerHTML;
  return body.innerHTML;
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

async function applyToSelection() {
  const marker = startMarker();
  if (!marker || !sdk) return;
  const selected = await readSelection();
  const inner = selected ? unwrapSelection(selected) : '';
  if (inner === null) {
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
  // plain text replaces the selection inside its line (HTML would be inserted as a new
  // paragraph); bold / italic covering the whole selection is kept by the editor
  sdk.actions.sendText(`${marker}${text}${END_MARKER}`);
  setStatus(`Styled “${text.trim()}” with ${marker} … ${END_MARKER}`, 'ok');
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
    el('div', { class: 'tm-result' }, codeEl, previewFrame),
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
    setStatus('Select words in the document, pick a style, then “Style selected text”.');
    updatePreview();
  } catch (error) {
    setStatus(`Could not connect to the editor: ${error.message}. You can still copy the code.`, 'error');
  }
}

render();
connect();
