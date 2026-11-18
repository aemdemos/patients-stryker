/*
 * Block options — an Experience Workspace / DA sidebar extension. Authors pick a block's
 * options (e.g. hero-corp's headline box, column, height) from named choices instead of
 * typing option names into the block's name row. The choices come from options.js; a preview
 * renders the block with the new options using the site's own code (the Text style panel's
 * preview page).
 *
 * Experience Workspace: the block holding the cursor is read from the live document and
 * replaced with its new options (sendHTML replace, as the Block Inspector extension does).
 * DA editor: it shares no document, so the author selects the block's name row
 * ("hero-corp (image-slide, …)") and the panel rewrites that text.
 */
import { BLOCK_OPTIONS, knownOptions } from './options.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';
const PREVIEW = '/tools/text-markers/preview.html';
const VIEWS = { desktop: 1200, phone: 375 };

const toClassName = (s) => s.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

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

let sdk = null;
let live = null; // Experience Workspace: { html, selection: { blockIndex }, editable }
let sourceCache = { at: 0, html: '' };
// the block being edited: { name, options: [...], html, sectionStyles, from: 'live' | 'header' }
let current = null;
let draft = []; // the options as the author is changing them
const touched = new Set(); // groups the author changed (their older free values are dropped)
let view = 'desktop';
let previewReady = false;
let previewHeight = 160;

let root;
let statusEl;
let titleEl;
let groupsEl;
let otherEl;
let applyButton;
let previewFrame;
let frameBox;

function setStatus(text, kind = 'info') {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

/* ---------------------------------------------------------------- the document */

function sourceBlocks(doc) {
  return [...doc.querySelectorAll('main > div > div[class]')]
    .filter((b) => !/^(section-metadata|metadata|da-metadata|library-metadata)$/.test(b.classList[0]));
}

function sectionStylesOf(block) {
  const meta = block.parentElement.querySelector(':scope > .section-metadata');
  const row = meta && [...meta.children]
    .find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'style');
  return row ? row.children[1].textContent.split(',').map(toClassName).filter(Boolean) : [];
}

/** a block's name row as authored: "hero-corp (image-slide, box-gold)" → name + options */
function parseHeader(text) {
  const m = text.trim().match(/^([a-z0-9][a-z0-9 -]*?)\s*(?:\(([^)]*)\))?$/i);
  if (!m) return null;
  return { name: toClassName(m[1]), options: (m[2] || '').split(',').map(toClassName).filter(Boolean) };
}

async function daSource() {
  if (Date.now() - sourceCache.at < 4000) return sourceCache.html;
  const ctx = sdk.context || sdk.project || {};
  let html = '';
  if (ctx.org && ctx.repo && ctx.path && typeof sdk.actions.daFetch === 'function') {
    try {
      const resp = await sdk.actions.daFetch(`https://admin.da.live/source/${ctx.org}/${ctx.repo}${ctx.path}.html`);
      if (resp.ok) html = await resp.text();
    } catch { html = ''; }
  }
  sourceCache = { at: Date.now(), html };
  return html;
}

/* ---------------------------------------------------------------- options */

const def = () => current && BLOCK_OPTIONS[current.name];
const layoutOf = (options) => {
  const layout = def()?.groups.find((g) => g.required);
  return layout && layout.options.map(([v]) => v).find((v) => options.includes(v));
};
const visibleGroups = () => def().groups.filter((g) => !g.when || g.when === layoutOf(draft));

/** the options no group knows (older free values, or ones the panel has no choice for) */
function otherOptions(options) {
  const known = knownOptions(def());
  return options.filter((o) => !known.has(o) && !def().groups
    .some((g) => g.replaces && touched.has(g.id) && g.replaces.test(o)));
}

function pick(group, value) {
  const values = group.options.map(([v]) => v).filter(Boolean);
  touched.add(group.id);
  draft = draft.filter((o) => !values.includes(o) && !(group.replaces && group.replaces.test(o)));
  if (value) draft.push(value);
}

function toggle(flag, on) {
  draft = draft.filter((o) => o !== flag);
  if (on) draft.push(flag);
}

/** the options in a stable order: the groups' order, then the others as authored */
function ordered(options) {
  const order = def().groups.flatMap((g) => (g.options || g.flags).map(([v]) => v));
  const known = options.filter((o) => order.includes(o))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...known, ...options.filter((o) => !order.includes(o))];
}

/* ---------------------------------------------------------------- preview */

function sizePreview() {
  const width = VIEWS[view];
  const scale = Math.min(1, frameBox.clientWidth / width);
  previewFrame.style.width = `${width}px`;
  previewFrame.style.height = `${previewHeight}px`;
  previewFrame.style.transform = `scale(${scale})`;
  frameBox.style.height = `${Math.ceil(previewHeight * scale)}px`;
}

function updatePreview() {
  if (!previewReady || !current?.html) return;
  const doc = new DOMParser().parseFromString(current.html, 'text/html');
  const block = doc.body.firstElementChild;
  block.className = [current.name, ...ordered(draft)].join(' ');
  sizePreview();
  previewFrame.contentWindow.postMessage({
    action: 'tm-preview-render', block: block.outerHTML, sectionStyles: current.sectionStyles, words: '', marker: '',
  }, window.location.origin);
}

/* ---------------------------------------------------------------- panel */

function renderGroups() {
  groupsEl.replaceChildren();
  otherEl.replaceChildren();
  if (!current) {
    titleEl.textContent = 'No block selected';
    applyButton.disabled = true;
    frameBox.hidden = true;
    return;
  }
  if (!def()) {
    titleEl.textContent = `${current.name}: no options defined in this panel yet`;
    applyButton.disabled = true;
    frameBox.hidden = true;
    return;
  }
  titleEl.textContent = `${def().label} (${current.name})`;
  frameBox.hidden = !current.html;
  visibleGroups().forEach((group) => {
    const fieldset = el('fieldset', { class: 'tm-group' }, el('legend', {}, group.label));
    const row = el('div', { class: 'tm-choices', role: group.flags ? 'group' : 'radiogroup', 'aria-label': group.label });
    if (group.flags) {
      group.flags.forEach(([value, label]) => {
        row.append(el('label', { class: 'tm-check' }, el('input', {
          type: 'checkbox',
          checked: draft.includes(value),
          onchange: (e) => { toggle(value, e.target.checked); renderGroups(); updatePreview(); },
        }), label));
      });
    } else {
      const selected = group.options.map(([v]) => v).find((v) => v && draft.includes(v)) || '';
      group.options.forEach(([value, label]) => {
        row.append(el('button', {
          type: 'button',
          role: 'radio',
          class: 'tm-choice',
          'aria-checked': String(value === selected),
          title: value ? `Option “${value}”` : 'No option',
          onclick: () => { pick(group, value); renderGroups(); updatePreview(); },
        }, label));
      });
    }
    fieldset.append(row);
    groupsEl.append(fieldset);
  });
  const others = otherOptions(draft);
  if (others.length) {
    otherEl.append(el('p', { class: 'tm-hint' }, 'Other options on this block (kept as they are; older position or spacing values are replaced when you pick in the matching group):'));
    const row = el('div', { class: 'tm-choices' });
    others.forEach((o) => row.append(el('button', {
      type: 'button',
      class: 'tm-choice',
      title: `Remove “${o}”`,
      onclick: () => { draft = draft.filter((x) => x !== o); renderGroups(); updatePreview(); },
    }, `${o} ✕`)));
    otherEl.append(row);
  }
  const changed = ordered(draft).join(',') !== ordered(current.options).join(',');
  applyButton.disabled = !changed;
  applyButton.textContent = changed ? 'Apply options' : 'No changes';
}

function setBlock(next) {
  const same = current && next && current.name === next.name
    && current.options.join(',') === next.options.join(',') && current.from === next.from;
  if (same) {
    if (next.html && next.html !== current.html) { current = next; updatePreview(); }
    return;
  }
  current = next;
  draft = next ? [...next.options] : [];
  touched.clear();
  renderGroups();
  updatePreview();
}

/* Experience Workspace: the block holding the cursor, from the live document */
function onLiveDocument(value) {
  live = value;
  const doc = new DOMParser().parseFromString(value.html || '', 'text/html');
  const block = sourceBlocks(doc)[value.selection?.blockIndex];
  if (!block) { setBlock(null); return; }
  const [name, ...options] = [...block.classList];
  setBlock({
    name, options, html: block.outerHTML, sectionStyles: sectionStylesOf(block), from: 'live',
  });
}

/* DA editor: the block's name row, selected by the author */
async function readHeaderSelection() {
  let html = '';
  try {
    html = await Promise.race([
      sdk.actions.getSelection(),
      new Promise((resolve) => { setTimeout(() => resolve(''), 1500); }),
    ]);
  } catch { html = ''; }
  const text = html ? new DOMParser().parseFromString(html, 'text/html').body.textContent : '';
  const header = text && parseHeader(text);
  if (!header || !BLOCK_OPTIONS[header.name]) {
    if (current?.from === 'header') setBlock(null);
    return;
  }
  const doc = new DOMParser().parseFromString(await daSource(), 'text/html');
  const block = sourceBlocks(doc).find((b) => b.classList[0] === header.name
    && [...b.classList].slice(1).join(',') === header.options.join(','));
  setBlock({
    ...header, html: block?.outerHTML || '', sectionStyles: block ? sectionStylesOf(block) : [], from: 'header',
  });
}

async function apply() {
  if (!current || !sdk) return;
  const options = ordered(draft);
  if (current.from === 'live') {
    const doc = new DOMParser().parseFromString(live.html, 'text/html');
    const block = sourceBlocks(doc)[live.selection.blockIndex];
    block.className = [current.name, ...options].join(' ');
    const result = await sdk.actions.sendHTML(block.outerHTML, {
      replace: true, expected: { html: live.html, blockIndex: live.selection.blockIndex },
    });
    if (!result?.ok) {
      setStatus(`The block was not changed: ${result?.message || result?.error || 'the editor refused the change'}. Click in the block and try again.`, 'error');
      return;
    }
    if (typeof result.html === 'string') onLiveDocument(result);
  } else {
    // the name row is still the selection (it is replaced as text, inside its cell)
    const html = await sdk.actions.getSelection().catch(() => '');
    const text = html ? new DOMParser().parseFromString(html, 'text/html').body.textContent : '';
    const header = parseHeader(text || '');
    if (!header || header.name !== current.name) {
      setStatus('Select the block’s name row again (e.g. “hero-corp (image-slide, …)”), then apply.', 'error');
      return;
    }
    sdk.actions.sendText(`${current.name}${options.length ? ` (${options.join(', ')})` : ''}`);
    sourceCache.at = 0;
    current = { ...current, options };
  }
  touched.clear();
  draft = [...options];
  current = { ...current, options };
  renderGroups();
  setStatus(`Applied: ${current.name}${options.length ? ` (${options.join(', ')})` : ''}`, 'ok');
}

function render() {
  root = document.querySelector('.tm');
  statusEl = el('p', { class: 'tm-status', role: 'status' });
  titleEl = el('p', { class: 'tm-block-name' });
  groupsEl = el('div', { class: 'tm-choices-wrap' });
  otherEl = el('div', { class: 'tm-group' });
  applyButton = el('button', { type: 'button', class: 'tm-primary', onclick: apply }, 'No changes');
  previewFrame = el('iframe', { class: 'tm-preview', title: 'Preview', src: `${PREVIEW}?v=${Date.now()}` });
  frameBox = el('div', { class: 'tm-frame' }, previewFrame);
  const viewButtons = Object.keys(VIEWS).map((name) => el('button', {
    type: 'button',
    class: 'tm-choice',
    role: 'radio',
    'aria-checked': String(name === view),
    onclick: () => {
      view = name;
      viewButtons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.view === name)));
      updatePreview();
    },
    'data-view': name,
  }, name === 'desktop' ? 'Desktop' : 'Phone'));
  root.append(
    el('h1', {}, 'Block options'),
    titleEl,
    el('div', { class: 'tm-choices', role: 'radiogroup', 'aria-label': 'Preview width' }, ...viewButtons),
    frameBox,
    el('div', { class: 'tm-actions' }, applyButton),
    statusEl,
    groupsEl,
    otherEl,
  );
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin || e.source !== previewFrame.contentWindow) return;
    if (e.data?.action === 'tm-preview-ready') { previewReady = true; updatePreview(); }
    if (e.data?.action === 'tm-preview-rendered') {
      previewHeight = Math.max(60, Math.min(e.data.height, 1600));
      sizePreview();
    }
  });
  window.addEventListener('resize', sizePreview);
  renderGroups();
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
      setStatus('Open this panel from the editor to change block options.', 'info');
      return;
    }
    sdk = resolved;
    if (sdk.capabilities?.liveDocument === 1 && sdk.capabilities?.sendHTMLReplace === 1) {
      sdk.actions.subscribeLiveDocument(onLiveDocument);
      setStatus('Click in a block to see its options.');
    } else {
      // DA editor: no shared document; the author selects the block's name row
      setStatus('Select a block’s name row (e.g. “hero-corp (image-slide, …)”) to see its options.');
      let busy = false;
      setInterval(async () => {
        if (busy || document.hidden) return;
        busy = true;
        await readHeaderSelection();
        busy = false;
      }, 1000);
    }
  } catch (error) {
    setStatus(`Could not connect to the editor: ${error.message}.`, 'error');
  }
}

render();
connect();
