/*
 * Review tool shell: the standard page (/std) as the base, compared with its as-is version (/rs)
 * or a snapshot of the source page (www.stryker.com, capture-snapshots.mjs); desktop or phone
 * width, flip / overlay / side by side, text-matched scroll sync, the page's blocks with their
 * variants, comments, saving. Runs on preview hosts only (the branch preview, the workspace
 * preview); the frames are on the same host, so the shell reads and scrolls them directly.
 */
import { leaves, buildAnchors, mapY } from './sync.js';
import { createStore } from './store.js';
import { createNotes, CATEGORIES } from './notes.js';

const { hostname } = window.location;
// the workspace preview: the local dev server, also seen through the coder preview's address
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
// the workspace preview serves the imported documents under /content
const CONTENT = LOCAL ? '/content' : '';
const READY_TIMEOUT = 8000;
const NAME_KEY = 'std-review-reviewer';
const MODES = ['flip', 'opacity', 'side'];
const COMPARE = { rs: 'as-is', src: 'source' };

const params = new URLSearchParams(window.location.search);
const state = {
  page: params.get('page') || '',
  vp: params.get('vp') === '375' ? 375 : 1440,
  mode: MODES.includes(params.get('mode')) ? params.get('mode') : 'flip',
  cmp: params.get('cmp') === 'src' ? 'src' : 'rs',
  show: ['rs', 'cmp'].includes(params.get('show')) ? 'cmp' : 'std',
  opacity: Number.isFinite(Number(params.get('op'))) && params.get('op') !== null ? Number(params.get('op')) : 50,
  sync: true,
};

const $ = (sel) => document.querySelector(sel);
const stage = $('.rv-stage');
const panes = { std: $('.rv-std'), rs: $('.rv-rs'), src: $('.rv-src') };
const frames = { std: panes.std.querySelector('iframe'), rs: panes.rs.querySelector('iframe') };
const scroller = panes.src.querySelector('.rv-src-scroller');
const ready = { std: false, rs: false, src: false };
const quietUntil = { std: 0, rs: 0, src: 0 };
let anchors = [];
// the source snapshot of the page at the current width (meta.json of capture-snapshots.mjs)
let snapshot = null;
// live source URLs of the pages with a snapshot (the meta's url)
const SOURCE = {};
let pages = [];
let rebuildTimer;

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat().filter((c) => c !== null && c !== undefined).forEach((c) => e.append(c));
  return e;
}

function writeUrl() {
  const p = new URLSearchParams();
  if (state.page) p.set('page', state.page);
  p.set('vp', state.vp);
  p.set('mode', state.mode);
  if (state.cmp === 'src') p.set('cmp', 'src');
  if (state.mode === 'flip' && state.show === 'cmp') p.set('show', 'cmp');
  if (state.mode === 'opacity') p.set('op', state.opacity);
  window.history.replaceState(null, '', `${window.location.pathname}?${p}`);
}

/* ---------- layout: each frame at the viewport width, scaled to fit its pane ---------- */

function layout() {
  const { width: W, height: H } = stage.getBoundingClientRect();
  const side = state.mode === 'side';
  const gap = side ? 12 : 0;
  const paneW = side ? (W - gap) / 2 : W;
  const scale = Math.min(1, paneW / state.vp);
  const cmp = panes[state.cmp];
  Object.entries(panes).forEach(([key, pane]) => {
    const w = state.vp * scale;
    let left = (paneW - w) / 2;
    if (side && key !== 'std') left += paneW + gap;
    Object.assign(pane.style, { left: `${left}px`, width: `${w}px`, height: `${H}px` });
    Object.assign((frames[key] || scroller).style, {
      width: `${state.vp}px`, height: `${H / scale}px`, transform: `scale(${scale})`,
    });
    pane.classList.toggle('rv-off', key !== 'std' && key !== state.cmp);
  });
  document.body.classList.remove(...MODES.map((m) => `mode-${m}`));
  document.body.classList.add(`mode-${state.mode}`);
  panes.std.classList.toggle('rv-hidden', state.mode === 'flip' && state.show === 'cmp');
  cmp.classList.toggle('rv-hidden', state.mode === 'flip' && state.show === 'std');
  cmp.style.opacity = state.mode === 'opacity' ? state.opacity / 100 : '';
  cmp.style.zIndex = state.mode === 'flip' ? '' : '1';
  document.querySelectorAll('[data-vp]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.vp) === state.vp)));
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  document.querySelectorAll('[data-cmp]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cmp === state.cmp)));
  $('.rv-opacity input').value = state.opacity;
  $('.rv-opacity-label').textContent = COMPARE[state.cmp];
  const other = COMPARE[state.cmp];
  let showing = `Standard and ${other}`;
  if (state.mode === 'flip') showing = state.show === 'std' ? `Showing: standard (Space: ${other})` : `Showing: ${other} (Space: standard)`;
  else if (state.mode === 'opacity') showing = `${other[0].toUpperCase()}${other.slice(1)} over standard, ${state.opacity}%`;
  $('.rv-showing').textContent = showing;
  writeUrl();
}

/* ---------- sync ---------- */

// the snapshot pane behaves like a window for the sync: its scroller scrolls the picture
const snapshotWindow = {
  get scrollY() { return scroller.scrollTop; },
  get innerHeight() { return scroller.clientHeight; },
  scrollTo(x, y) { scroller.scrollTop = typeof x === 'object' ? x.top : y; },
};
const win = (side) => (side === 'src' ? snapshotWindow : frames[side].contentWindow);
const doc = (side) => frames[side].contentDocument;

// pinned QA notes on the standard page (notes.js); the editor and the list are set up below
const noteHooks = { place: () => {}, select: () => {}, render: () => {} };
const notes = createNotes({
  doc: () => (ready.std ? doc('std') : null),
  vp: () => state.vp,
  onPlace: (draft) => noteHooks.place(draft),
  onSelect: (id) => noteHooks.select(id),
});

function rebuildAnchors() {
  if (!ready.std || !ready[state.cmp]) return;
  try {
    const other = state.cmp === 'src' ? snapshot.leaves : leaves(doc('rs'));
    anchors = buildAnchors(leaves(doc('std')), other);
  } catch (e) {
    anchors = [];
  }
}

function scheduleRebuild() {
  window.clearTimeout(rebuildTimer);
  rebuildTimer = window.setTimeout(() => {
    rebuildAnchors();
    notes.render();
  }, 400);
}

function syncFrom(from) {
  if (!state.sync || !ready.std || !ready[state.cmp]) return;
  if (from !== 'std' && from !== state.cmp) return;
  const to = from === 'std' ? state.cmp : 'std';
  const src = win(from);
  const dst = win(to);
  const mid = src.scrollY + src.innerHeight / 2;
  const mapped = mapY(anchors, mid, from === 'std' ? 0 : 1);
  quietUntil[to] = Date.now() + 200;
  dst.scrollTo(0, Math.max(0, mapped - dst.innerHeight / 2));
}

/* ---------- the blocks of the standard page, and their variants ---------- */

// classes the page code adds while decorating (not authored variants)
const NOT_VARIANT = [/^block$/, /^sticky-nav/, /^columns-\d+-cols$/, /^columns-text$/, /^with-nested-blocks$/];
const NAMES = {
  columns: 'Columns',
  'cards-corp': 'Cards',
  'hero-corp': 'Hero',
  video: 'Video',
  'page-nav': 'Page Nav',
  statistics: 'Statistics',
  accordion: 'Accordion',
  tabs: 'Tabs',
  table: 'Table',
  'marketo-form': 'Form',
  'related-categories': 'Related Categories',
  'chart-corp': 'Chart',
  'gallery-corp': 'Gallery',
  fragment: 'Fragment',
};
const VARIANT_LABELS = { '': 'default', autoplay: 'autoplay', sticky: 'sticky' };
const WIDTH_LABELS = { '': 'equal widths', 'wide-first': 'wide first', 'wide-last': 'wide last' };
const BG_LABELS = {
  '': 'no background', 'grey-band': 'grey band', 'gold-box': 'gold box', 'purple-band': 'purple band', 'blue-band': 'blue band',
};
const label = (v, labels = VARIANT_LABELS) => (v in labels ? labels[v] : v.replace(/-/g, ' '));
const api = () => (ready.std ? win('std')?.stdReview : null);

/* ---------- saving (store.js: the review Google Sheet) ---------- */

// the page's saved state: `item|kind` → { value, reviewer, time }
let saved = new Map();
let savedLoad = Promise.resolve();
// this reviewer's unsaved changes on the page: `item|kind` → value; kept in the browser until Save
let drafts = new Map();
const DRAFTS_KEY = 'std-review-drafts';
const reviewer = () => $('.rv-reviewer').value.trim();
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const when = (t) => (t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
let storeStatus = { kind: 'saved', text: 'All changes saved' };

/** what a value was before this reviewer's unsaved changes: the saved one, else the page's own */
function baseOf(item, kind) {
  const s = saved.get(`${item}|${kind}`);
  if (s) return s.value;
  if (kind === 'comment') return '';
  if (kind === 'reviewed') return false;
  if (kind === 'note') return undefined;
  const block = api()?.list().find((i) => i.id === item);
  if (!block) return undefined;
  const own = {
    variant: block.standard, width: block.standardWidth, background: block.standardBackground,
  };
  return own[kind];
}

/** the current state of an item: this reviewer's unsaved change, else the saved one */
function savedOf(item, kind) {
  const key = `${item}|${kind}`;
  if (drafts.has(key)) {
    return {
      item, kind, value: drafts.get(key), reviewer: reviewer() || 'you', time: null, unsaved: true,
    };
  }
  return saved.get(key);
}

function renderStatus() {
  const box = $('.rv-status');
  const n = drafts.size;
  let { kind, text } = storeStatus;
  if (kind === 'saved' && n) {
    kind = 'unsaved';
    text = `${n} unsaved change${n > 1 ? 's' : ''}`;
  }
  box.className = `rv-status rv-${kind}`;
  box.querySelector('.rv-status-text').textContent = text;
  box.querySelector('.rv-retry').hidden = kind !== 'failed';
  const button = $('.rv-save');
  button.disabled = !n;
  button.textContent = n ? `Save (${n})` : 'Saved';
}

const store = createStore((kind, text) => {
  storeStatus = { kind, text };
  renderStatus();
});

function keepDrafts() {
  let all = {};
  try {
    all = JSON.parse(window.localStorage.getItem(DRAFTS_KEY)) || {};
  } catch (e) {
    all = {};
  }
  if (drafts.size) all[state.page] = Object.fromEntries(drafts);
  else delete all[state.page];
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
  renderStatus();
}

function draftsOf(page) {
  try {
    const all = JSON.parse(window.localStorage.getItem(DRAFTS_KEY)) || {};
    return new Map(Object.entries(all[page] || {}));
  } catch (e) {
    return new Map();
  }
}

/** a change: unsaved until Save; back at the value it had before, it is no change at all */
function saveRow(item, kind, value) {
  const key = `${item}|${kind}`;
  const neverSavedNote = kind === 'note' && value?.deleted && !saved.has(key);
  if (neverSavedNote || same(value, baseOf(item, kind))) drafts.delete(key);
  else drafts.set(key, value);
  keepDrafts();
}

/** a block choice: one change per property */
function keepChoice(id, patch) {
  Object.entries(patch).forEach(([kind, value]) => saveRow(id, kind, value));
}

/** Save: one row per unsaved change (its final value) */
function saveAll() {
  if (!drafts.size) return true;
  if (!reviewer()) {
    $('.rv-name').classList.add('rv-need');
    $('.rv-reviewer').focus();
    storeStatus = { kind: 'failed', text: 'Enter your name, then Save' };
    renderStatus();
    $('.rv-retry').hidden = true;
    return false;
  }
  $('.rv-name').classList.remove('rv-need');
  drafts.forEach((value, key) => {
    const [item, kind] = key.split('|');
    saved.set(key, store.save({
      page: state.page, item, kind, value, reviewer: reviewer(),
    }));
  });
  drafts = new Map();
  keepDrafts();
  return true;
}

/** a small dialog: resolves with the chosen button's value */
function ask(text, choices) {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'rv-dialog' });
    dialog.append(
      el('p', {}, text),
      el('div', { class: 'rv-note-actions' }, ...choices.map(([text2, value, cls]) => el('button', {
        type: 'button',
        class: `rv-btn-light ${cls || ''}`,
        onclick: () => {
          dialog.close();
          dialog.remove();
          resolve(value);
        },
      }, text2))),
    );
    document.body.append(dialog);
    dialog.showModal();
  });
}

/** before leaving a page with unsaved changes: save them, or keep them in this browser */
async function leavePage() {
  if (!drafts.size) return;
  const n = drafts.size;
  const choice = await ask(
    `You have ${n} unsaved change${n > 1 ? 's' : ''} on this page.`,
    [['Save now', 'save', 'rv-primary'], ['Keep for later', 'keep']],
  );
  if (choice === 'save') saveAll();
}

function blockLabel(block) {
  const name = block.dataset.blockName || block.classList[0];
  const variant = [...block.classList]
    .filter((c) => c !== name && !NOT_VARIANT.some((re) => re.test(c))).join(' ');
  return { name, variant };
}

/** without the switcher (it failed to load): the rendered blocks, read only */
function listRendered(list) {
  const blocks = [...doc('std').querySelectorAll('main .block')].filter((b) => !b.closest('header, footer'));
  blocks.forEach((block) => {
    const { name, variant } = blockLabel(block);
    list.append(el('li', {
      onmouseenter: () => block.classList.add('rv-hl'),
      onmouseleave: () => block.classList.remove('rv-hl'),
    }, el('span', {}, name), el('span', { class: 'rv-variant' }, variant || 'default')));
  });
}

/** the latest saved change of an item: "Name · date" */
function lastBy(item) {
  if ([...drafts.keys()].some((k) => k.startsWith(`${item}|`))) return 'unsaved change';
  const latest = ['variant', 'width', 'background', 'comment', 'reviewed']
    .map((k) => savedOf(item, k)).filter(Boolean).sort((a, b) => (a.time < b.time ? 1 : -1))[0];
  return latest ? `${latest.reviewer || 'someone'} · ${when(latest.time)}` : '';
}

/** a comment toggle and box for an item (a block id or `page`), saved when it changes */
function commentParts(item, placeholder) {
  const current = savedOf(item, 'comment')?.value || '';
  const meta = el('span', { class: 'rv-meta' }, lastBy(item));
  const box = el('textarea', { class: 'rv-comment', rows: '3', placeholder });
  box.value = current;
  box.hidden = !current && item !== 'page';
  box.addEventListener('change', () => {
    saveRow(item, 'comment', box.value.trim());
    meta.textContent = lastBy(item);
  });
  if (item === 'page') return [box, meta];
  const toggle = el('button', {
    type: 'button',
    class: 'rv-comment-toggle',
    onclick: () => {
      box.hidden = !box.hidden;
      if (!box.hidden) box.focus();
    },
  }, current ? 'Comment ✎' : 'Add a comment');
  return [el('div', { class: 'rv-item-foot' }, toggle, meta), box];
}

function blockRow(item, review) {
  const changed = item.variant !== item.standard || item.width !== item.standardWidth
    || item.background !== item.standardBackground;
  const busy = (li, on) => li.classList.toggle('rv-busy', on);
  const li = el('li', {
    class: `rv-item${changed ? ' rv-changed' : ''}`,
    onmouseenter: () => review.highlight(item.id, true),
    onmouseleave: () => review.highlight(item.id, false),
  });
  const head = el(
    'div',
    { class: 'rv-item-head' },
    el('button', {
      type: 'button', class: 'rv-name', title: 'Scroll to this block', onclick: () => review.reveal(item.id),
    }, NAMES[item.name] || item.name),
    el('span', { class: 'rv-flags' }, changed ? 'changed' : '', item.hidden ? ' hidden' : ''),
  );
  li.append(head);
  const controls = el('div', { class: 'rv-controls' });
  if (item.list.length > 1) {
    const cycle = async (dir) => {
      const i = item.list.indexOf(item.variant);
      const next = item.list[(i + dir + item.list.length) % item.list.length];
      busy(li, true);
      if (await review.set(item.id, { variant: next })) keepChoice(item.id, { variant: next });
      busy(li, false);
    };
    controls.append(el(
      'div',
      { class: 'rv-cycle' },
      el('button', {
        type: 'button', class: 'rv-step', 'aria-label': 'Previous variant', onclick: () => cycle(-1),
      }, '‹'),
      el('span', { class: 'rv-current' }, label(item.variant), el('small', {}, ` ${item.list.indexOf(item.variant) + 1}/${item.list.length}`)),
      el('button', {
        type: 'button', class: 'rv-step', 'aria-label': 'Next variant', onclick: () => cycle(1),
      }, '›'),
    ));
  } else {
    controls.append(el('span', { class: 'rv-current rv-only' }, item.list.length ? label(item.variant) : 'one design'));
  }
  const select = (values, current, labels, onchange) => {
    const s = el('select', { onchange: (e) => onchange(e.target.value) }, ...values.map((v) => el('option', { value: v }, label(v, labels))));
    s.value = current;
    return s;
  };
  if (item.widths.length) {
    controls.append(select(item.widths, item.width, WIDTH_LABELS, async (width) => {
      busy(li, true);
      if (await review.set(item.id, { width })) keepChoice(item.id, { width });
      busy(li, false);
    }));
  }
  controls.append(select(review.backgrounds, item.background, BG_LABELS, (background) => {
    if (review.setBackground(item.id, background)) keepChoice(item.id, { background });
  }));
  li.append(controls);
  li.append(...commentParts(item.id, 'Comment on this block (e.g. none of these fit, because …)'));
  return li;
}

/* ---------- QA notes: the list and the editor ---------- */

const WIDTH_NAMES = { 1440: 'desktop', 375: 'phone' };
const noteId = () => (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** the page's notes from its saved state (the latest row of each note), deleted ones aside */
function savedNotes() {
  const keys = new Set([...saved.keys(), ...drafts.keys()].filter((k) => k.endsWith('|note')));
  return [...keys].map((k) => savedOf(...k.split('|'))).filter((e) => e && e.value && !e.value.deleted)
    .map((e) => ({
      ...e.value, reviewer: e.reviewer, time: e.time, unsaved: !!e.unsaved,
    }));
}

function saveNote(note) {
  saveRow(`note:${note.id}`, 'note', {
    id: note.id,
    created: note.created,
    vp: note.vp,
    cat: note.cat,
    text: note.text,
    status: note.status,
    anchor: note.anchor,
    at: note.at,
    deleted: !!note.deleted,
  });
  notes.setNotes(savedNotes());
  noteHooks.render();
}

function closeEditor() {
  const box = $('.rv-note-editor');
  box.hidden = true;
  box.replaceChildren();
  notes.clearDraft();
}

function openEditor(note) {
  const box = $('.rv-note-editor');
  const cat = el('select', { 'aria-label': 'Category' }, ...Object.entries(CATEGORIES).map(([k, v]) => el('option', { value: k }, v)));
  cat.value = note.cat || 'text';
  const text = el('textarea', { rows: '4', placeholder: 'What is wrong or should change here?' });
  text.value = note.text || '';
  const isNew = !note.id;
  box.replaceChildren(
    el('div', { class: 'rv-note-editor-head' }, isNew ? 'New QA note' : `QA note ${notes.list().find((n) => n.id === note.id)?.n || ''}`, el('span', { class: 'rv-meta' }, ` ${WIDTH_NAMES[note.vp] || note.vp}`)),
    cat,
    text,
    el(
      'div',
      { class: 'rv-note-actions' },
      el('button', {
        type: 'button',
        class: 'rv-btn-light rv-primary',
        onclick: () => {
          if (!text.value.trim()) {
            text.focus();
            return;
          }
          saveNote({
            ...note, id: note.id || noteId(), cat: cat.value, text: text.value.trim(),
          });
          closeEditor();
        },
      }, 'Save note'),
      el('button', { type: 'button', class: 'rv-btn-light', onclick: closeEditor }, 'Cancel'),
      isNew ? null : el('button', {
        type: 'button',
        class: 'rv-btn-light rv-danger',
        onclick: () => {
          saveNote({ ...note, deleted: true });
          closeEditor();
        },
      }, 'Delete'),
    ),
  );
  box.hidden = false;
  text.focus();
}

function renderNotes() {
  const list = $('.rv-notes');
  const all = notes.list();
  $('.rv-notes-count').textContent = all.length ? `(${all.filter((n) => n.status !== 'resolved').length} open)` : '';
  list.replaceChildren(...all.map((n) => el(
    'li',
    { class: `rv-note${n.status === 'resolved' ? ' rv-note-resolved' : ''}`, 'data-note': n.id },
    el('button', {
      type: 'button',
      class: 'rv-note-main',
      title: n.vp === state.vp ? 'Show on the page' : `Found at ${WIDTH_NAMES[n.vp]} width: switch to see its pin`,
      onclick: () => {
        if (n.vp !== state.vp) return;
        notes.select(n.id);
      },
    }, el('span', { class: 'rv-note-n' }, n.n), el('span', { class: 'rv-note-text' }, `${CATEGORIES[n.cat] || ''} · ${n.text}`)),
    el(
      'div',
      { class: 'rv-item-foot' },
      el('span', { class: 'rv-meta' }, `${WIDTH_NAMES[n.vp] || n.vp} · ${n.unsaved ? 'unsaved' : `${n.reviewer || 'someone'} · ${when(n.time)}`}`),
      el(
        'span',
        {},
        el('button', {
          type: 'button',
          class: 'rv-comment-toggle',
          onclick: () => saveNote({ ...n, status: n.status === 'resolved' ? 'open' : 'resolved' }),
        }, n.status === 'resolved' ? 'Reopen' : 'Resolve'),
        ' ',
        el('button', { type: 'button', class: 'rv-comment-toggle', onclick: () => openEditor(n) }, 'Edit'),
      ),
    ),
  )));
  if (!all.length) list.append(el('li', { class: 'rv-none' }, 'No QA notes yet. "Add QA note" (or N), then click the spot on the page.'));
}

function setNoteMode(on) {
  notes.setAdding(on);
  $('[data-action="note"]').setAttribute('aria-pressed', String(on));
  $('.rv-stage').classList.toggle('rv-adding', on);
}

noteHooks.place = (draft) => openEditor(draft);
noteHooks.render = renderNotes;
noteHooks.select = (id) => {
  notes.select(id);
  document.querySelectorAll('.rv-note').forEach((li) => li.classList.toggle('rv-on', li.dataset.note === id));
};

/** this page: reviewed mark and page comment */
function renderPageBox() {
  const box = $('.rv-pagebox-body');
  const reviewed = el('input', { type: 'checkbox', class: 'rv-reviewed' });
  reviewed.checked = !!savedOf('page', 'reviewed')?.value;
  reviewed.addEventListener('change', () => saveRow('page', 'reviewed', reviewed.checked));
  box.replaceChildren(
    el('label', { class: 'rv-reviewed-label' }, reviewed, ' I have reviewed this page'),
    ...commentParts('page', 'Comments on this page: layout, QA findings, anything else'),
  );
}

function listBlocks() {
  const list = $('.rv-blocks');
  list.replaceChildren();
  if (!ready.std) return;
  const review = api();
  if (!review) {
    listRendered(list);
    return;
  }
  const items = review.list();
  if (!items.length) list.append(el('li', { class: 'rv-none' }, 'No blocks on this page itself'));
  items.forEach((item) => list.append(blockRow(item, review)));
  // blocks from fragments or built by the page (tabs, accordions): shown, not switchable here
  const why = {
    fragment: 'From a shared fragment: not switchable on this page yet',
    built: 'Built by the page from its sections',
  };
  (review.others ? review.others() : []).forEach((o) => list.append(el(
    'li',
    { class: 'rv-other', title: why[o.where] },
    el('span', {}, NAMES[o.name] || o.name),
    el('span', { class: 'rv-variant rv-none' }, o.where === 'fragment' ? 'in a fragment' : 'built by the page'),
  )));
}

/** the page's saved choices (everyone's, latest per block), once its switcher is ready */
async function applySaved(review) {
  await savedLoad;
  const ids = new Set(review.list().map((i) => i.id));
  const todo = [...ids].map((id) => ({
    id,
    variant: savedOf(id, 'variant'),
    width: savedOf(id, 'width'),
    background: savedOf(id, 'background'),
  })).filter((c) => c.variant || c.width || c.background);
  await todo.reduce((chain, c) => chain.then(async () => {
    if (c.variant || c.width) {
      await review.set(c.id, { variant: c.variant?.value, width: c.width?.value });
    }
    if (c.background) review.setBackground(c.id, c.background.value);
  }), Promise.resolve());
}

/** the switcher in the standard frame: wait for it (it loads after the page) */
function whenSwitcher() {
  const started = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const review = win('std')?.stdReview;
      if (review || Date.now() - started > READY_TIMEOUT + 6000) resolve(review || null);
      else window.setTimeout(check, 250);
    };
    check();
  });
}

/* ---------- frames ---------- */

/** the source snapshot of the page at the current width: its tiles and its anchors */
async function loadSnapshot() {
  ready.src = false;
  snapshot = null;
  const pageEl = panes.src.querySelector('.rv-src-page');
  const none = panes.src.querySelector('.rv-src-none');
  pageEl.replaceChildren();
  pageEl.style.height = '0';
  const want = `${state.page}|${state.vp}`;
  let meta = null;
  try {
    const resp = await fetch(`./snapshots${state.page}/${state.vp}/meta.json`);
    if (resp.ok) meta = await resp.json();
  } catch (e) {
    meta = null;
  }
  if (`${state.page}|${state.vp}` !== want) return;
  none.hidden = !!meta;
  if (!meta) {
    panes.src.querySelector('.rv-tag').textContent = 'Source: no snapshot yet';
    return;
  }
  snapshot = meta;
  SOURCE[state.page] = meta.url;
  const live = [...document.querySelectorAll('.rv-links a')].find((a) => a.textContent === 'Live stryker.com page');
  if (live) live.href = meta.url;
  pageEl.style.height = `${meta.height}px`;
  meta.tiles.forEach((t) => pageEl.append(el('img', {
    src: `./snapshots${state.page}/${state.vp}/${t.file}`,
    alt: '',
    loading: 'lazy',
    width: String(meta.width),
    height: String(t.h),
    style: `top: ${t.y}px`,
  })));
  const day = new Date(meta.captured).toLocaleDateString([], { dateStyle: 'medium' });
  panes.src.querySelector('.rv-tag').textContent = `Source (stryker.com, ${day})`;
  scroller.scrollTop = 0;
  ready.src = true;
  rebuildAnchors();
  syncFrom('std');
}

function loadPage() {
  if (!state.page) return;
  ready.std = false;
  ready.rs = false;
  anchors = [];
  frames.std.src = `${CONTENT}/std${state.page}?review=1`;
  frames.rs.src = `${CONTENT}/rs${state.page}`;
  const i = pages.findIndex((p) => p.path === state.page);
  const page = pages[i];
  $('.rv-page').value = page ? `${page.title} — ${page.path}` : state.page;
  $('.rv-count').textContent = i >= 0 ? `${i + 1} / ${pages.length}` : '';
  document.title = `Review: ${page ? page.title : state.page}`;
  $('.rv-links').replaceChildren(
    el('li', {}, el('a', { href: `${CONTENT}/std${state.page}`, target: '_blank', rel: 'noopener' }, 'Standard page')),
    el('li', {}, el('a', { href: `${CONTENT}/rs${state.page}`, target: '_blank', rel: 'noopener' }, 'As-is page')),
    el('li', {}, el('a', { href: SOURCE[state.page] || 'https://www.stryker.com/', target: '_blank', rel: 'noopener' }, 'Live stryker.com page')),
  );
  $('.rv-blocks').replaceChildren(el('li', { class: 'rv-none' }, 'Loading…'));
  $('.rv-pagebox-body').replaceChildren(el('p', { class: 'rv-none' }, 'Loading the saved reviews…'));
  const loading = state.page;
  saved = new Map();
  drafts = draftsOf(loading);
  renderStatus();
  closeEditor();
  notes.setNotes([]);
  loadSnapshot();
  savedLoad = store.load(loading).then((m) => {
    if (state.page !== loading) return;
    saved = m;
    renderPageBox();
    notes.setNotes(savedNotes());
    renderNotes();
  });
  writeUrl();
}

async function step(delta) {
  const i = pages.findIndex((p) => p.path === state.page);
  const next = pages[Math.min(pages.length - 1, Math.max(0, i + delta))];
  if (next && next.path !== state.page) {
    await leavePage();
    state.page = next.path;
    loadPage();
  }
}

function frameKeys(e) {
  const t = e.target;
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    $('.rv-save').click();
    return;
  }
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (e.code === 'Space' && state.mode === 'flip') {
    e.preventDefault();
    state.show = state.show === 'std' ? 'cmp' : 'std';
    layout();
  } else if ((e.key === 'n' || e.key === 'N') && !e.altKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    setNoteMode(!notes.adding);
  } else if (e.key === 'Escape' && notes.adding) {
    setNoteMode(false);
  } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    step(e.key === 'ArrowLeft' ? -1 : 1);
  }
}

function whenReady(side) {
  const d = doc(side);
  const started = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const sections = [...d.querySelectorAll('main .section')];
      const loaded = sections.length && sections.every((s) => s.dataset.sectionStatus === 'loaded');
      if (loaded || Date.now() - started > READY_TIMEOUT) resolve();
      else window.setTimeout(check, 250);
    };
    check();
  });
}

async function onFrameLoad(side) {
  ready[side] = false;
  const d = doc(side);
  if (!d) return;
  await whenReady(side);
  const style = d.createElement('style');
  style.textContent = '.rv-hl { outline: 3px solid #ffb500 !important; outline-offset: 2px; }';
  d.head.append(style);
  win(side).addEventListener('scroll', () => {
    if (Date.now() < quietUntil[side]) return;
    window.requestAnimationFrame(() => syncFrom(side));
  }, { passive: true });
  d.addEventListener('keydown', frameKeys);
  new ResizeObserver(scheduleRebuild).observe(d.body);
  ready[side] = true;
  rebuildAnchors();
  // late content (fragments, lazy images) moves things: rebuild once more
  window.setTimeout(rebuildAnchors, 2500);
  if (side !== 'std') return;
  notes.attach();
  setNoteMode(notes.adding);
  $('.rv-blocks').replaceChildren(el('li', { class: 'rv-none' }, 'Preparing the variants…'));
  const review = await whenSwitcher();
  if (review) {
    d.addEventListener('std-review-change', () => {
      scheduleRebuild();
      listBlocks();
      notes.render();
    });
    await applySaved(review);
  }
  listBlocks();
}

/* ---------- start ---------- */

async function start() {
  if (!PREVIEW) {
    $('.rv-blocked').hidden = false;
    return;
  }
  Object.keys(frames).forEach((side) => frames[side].addEventListener('load', () => onFrameLoad(side)));
  const resp = await fetch('./pages.json');
  pages = resp.ok ? (await resp.json()).pages : [];
  $('#rv-page-list').replaceChildren(...pages.map((p) => el('option', { value: `${p.title} — ${p.path}` })));
  if (!state.page && pages.length) state.page = pages[0].path;

  $('.rv-page').addEventListener('change', (e) => {
    const v = e.target.value.trim();
    const low = v.toLowerCase();
    const hit = pages.find((p) => v.endsWith(p.path))
      || pages.find((p) => p.title.toLowerCase() === low)
      || pages.find((p) => p.path.includes(v) || p.title.toLowerCase().includes(low));
    if (hit && hit.path !== state.page) {
      leavePage().then(() => {
        state.page = hit.path;
        loadPage();
      });
    }
  });
  document.querySelectorAll('[data-action="prev"], [data-action="next"]').forEach((b) => b.addEventListener('click', () => step(b.dataset.action === 'prev' ? -1 : 1)));
  $('[data-action="note"]').addEventListener('click', () => setNoteMode(!notes.adding));
  document.querySelectorAll('[data-vp]').forEach((b) => b.addEventListener('click', () => {
    if (state.vp === Number(b.dataset.vp)) return;
    state.vp = Number(b.dataset.vp);
    layout();
    scheduleRebuild();
    loadSnapshot();
  }));
  document.querySelectorAll('[data-cmp]').forEach((b) => b.addEventListener('click', () => {
    state.cmp = b.dataset.cmp;
    layout();
    rebuildAnchors();
    syncFrom('std');
  }));
  scroller.addEventListener('scroll', () => {
    if (Date.now() < quietUntil.src) return;
    window.requestAnimationFrame(() => syncFrom('src'));
  }, { passive: true });
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    state.mode = b.dataset.mode;
    layout();
    scheduleRebuild();
  }));
  $('.rv-opacity input').addEventListener('input', (e) => {
    state.opacity = Number(e.target.value);
    layout();
  });
  $('.rv-sync').addEventListener('change', (e) => {
    state.sync = e.target.checked;
    if (state.sync) syncFrom('std');
  });
  const name = $('.rv-reviewer');
  name.value = window.localStorage.getItem(NAME_KEY) || '';
  name.addEventListener('change', () => {
    window.localStorage.setItem(NAME_KEY, name.value.trim());
    if (name.value.trim()) $('.rv-name').classList.remove('rv-need');
  });
  $('.rv-save').addEventListener('click', () => {
    if (saveAll()) {
      listBlocks();
      notes.setNotes(savedNotes());
      renderNotes();
      renderPageBox();
    }
  });
  window.addEventListener('beforeunload', (e) => {
    if (!drafts.size) return;
    e.preventDefault();
    e.returnValue = '';
  });
  $('.rv-retry').addEventListener('click', () => store.retry());
  document.addEventListener('keydown', frameKeys);
  window.addEventListener('resize', () => {
    layout();
    scheduleRebuild();
  });
  layout();
  loadPage();
}

start();
