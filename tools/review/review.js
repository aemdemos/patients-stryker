/*
 * Review tool shell: the page under review as the base (config.js: the migrated page at its final
 * path, or the standard page under /std), compared with a snapshot of the source page
 * (www.stryker.com, capture-snapshots.mjs) or its as-is version (/rs, standard pages only); the
 * widths of config.js, flip / overlay / side by side, text-matched scroll sync, the page status,
 * comments, QA notes, saving; the design panel (the page's blocks with their variants) when
 * config.js has design on. Runs on preview hosts only (the branch preview, the workspace
 * preview); the frames are on the same host, so the shell reads and scrolls them directly.
 */
import { leaves, buildAnchors, mapY } from './sync.js';
import { createStore, call } from './store.js';
import { keysOfHtml, toPosition, toKey } from './blockkeys.js';
import {
  threadState, roleOf, pageState, STATES_BY_ROLE, isWithdrawn, firstText,
} from './threads.js';
import { createNotes, CATEGORIES } from './notes.js';
import { keepFresh } from './live.js';
import { mountBar } from './bar.js';
import {
  picturesOf, picturesIn, prepare, upload, keepPicture, MAX_PICTURES, TYPES as PICTURE_TYPES,
} from './pictures.js';
import { REVIEW, storageKey } from './config.js';
import loadPages, { editUrl } from './pages.js';
import {
  loadShots, loadVersion, requestShot, shotTag, changesText,
} from './shots.js';
import {
  loadOrganisation, getFilters, setFilters, areaOf, areaLabel, orgLabel, ORDERS, STATE_ORDER,
  clearFilters, filtersSet, onFiltersChange, matches, sortPages,
} from './batches.js';
import { mountPicker } from './picker.js';
import {
  ABOUT, NOTE, installed, latest, stateText, steps, downloadButton,
} from './pilot.js';

// the design panel (variants, widths, backgrounds, text sets, groups) and the switcher it needs:
// REVIEW.designPanel, else REVIEW.design (the standard review keeps design: true for the summary
// and the results, its pages' designs, with the panel off since 25 Nov 2026: nothing to save there)
const PANEL = REVIEW.designPanel ?? REVIEW.design;
const { hostname } = window.location;
// the workspace preview: the local dev server, also seen through the coder preview's address
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
// the workspace preview serves the imported documents under /content
const CONTENT = LOCAL ? '/content' : '';
// the page under review (config.js): its path prefix here (the migrated pages at their final
// paths; the standard pages under /std)
const BASE = LOCAL ? REVIEW.base.localPrefix : REVIEW.base.prefix;
const BASE_LABEL = REVIEW.base.label;
const BASE_WORD = BASE_LABEL.toLowerCase();
// the snapshot tiles: on the workspace preview the local copy, else Document Authoring's copy
// through the branch preview (upload-snapshots.sh)
const SNAPSHOTS = LOCAL ? REVIEW.snapshots.local : REVIEW.snapshots.preview;
const READY_TIMEOUT = 8000;
const NAME_KEY = storageKey('reviewer');
const MODES = ['flip', 'opacity', 'side'];
const COMPARE = {
  rs: 'as-is', src: 'source screenshot', live: 'source render', real: 'live stryker.com',
};
const WIDTHS = REVIEW.widths.map((w) => w.vp);

const params = new URLSearchParams(window.location.search);
const state = {
  page: params.get('page') || '',
  vp: WIDTHS.includes(Number(params.get('vp'))) ? Number(params.get('vp')) : WIDTHS[0],
  mode: MODES.includes(params.get('mode')) ? params.get('mode') : REVIEW.mode,
  cmp: REVIEW.compare.includes(params.get('cmp')) || (params.get('cmp') === 'real' && document.documentElement.dataset.reviewLive) ? params.get('cmp') : REVIEW.compare[0],
  show: ['rs', 'cmp'].includes(params.get('show')) ? 'cmp' : 'std',
  opacity: Number.isFinite(Number(params.get('op'))) && params.get('op') !== null ? Number(params.get('op')) : 50,
  sync: true,
};

const $ = (sel) => document.querySelector(sel);
const stage = $('.rv-stage');
const panes = {
  std: $('.rv-std'), rs: $('.rv-rs'), src: $('.rv-src'), live: $('.rv-live'), real: $('.rv-real'),
};
const frames = {
  std: panes.std.querySelector('iframe'),
  rs: panes.rs.querySelector('iframe'),
  live: panes.live.querySelector('iframe'),
  real: panes.real.querySelector('iframe'),
};
const scroller = panes.src.querySelector('.rv-src-scroller');
const ready = {
  std: false, rs: false, src: false, live: false, real: false,
};
const quietUntil = {
  std: 0, rs: 0, src: 0, live: 0, real: 0,
};
// the real stryker.com page (Compare with: Live), with the review extension (pilot, 25 Nov
// 2026: extension/): the extension lets stryker.com be framed here and tells, from inside it,
// where its texts and images are and where it is scrolled to (it can't be read from here)
const REAL_ORIGIN = 'https://www.stryker.com';
const HAS_REAL = !!document.documentElement.dataset.reviewLive && REVIEW.compare.includes('src');
const real = {
  url: '', leaves: [], y: 0, h: 0, at: '',
};
// the live copy of the source page (backend action live): what it was rendered for, its blob URL
const live = { key: '', url: '', prefetched: new Set() };
let anchors = [];
// the source snapshot of the page at the current width (meta.json of capture-snapshots.mjs)
let snapshot = null;
// the page's source shots (shots.js): its history, the full versions read so far, the one shown
// (null: the newest)
const shots = {
  page: null, data: null, full: new Map(), chosen: null,
};
// (the shot box reloads the snapshot, defined after it)
const shotHooks = { reload: () => {}, wait: () => {} };
// live source URLs of the pages with a snapshot (the meta's url)
const SOURCE = {};
// every page of the review, and the ones the batch / area filters let through (picker, stepping)
let allPages = [];
let pages = [];
// every page's organisation: path → { batch, group, representative } (batches.js)
let orgOf = new Map();
// every page's status and latest activity (the overview): for the filters and the order
let infoOf = new Map();
let picker = null;
let rebuildTimer;
let noteShown = false;
let targetShown = false;

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
  if (state.cmp !== REVIEW.compare[0]) p.set('cmp', state.cmp);
  if (state.mode === 'flip' && state.show === 'cmp') p.set('show', 'cmp');
  if (state.mode === 'opacity') p.set('op', state.opacity);
  window.history.replaceState(null, '', `${window.location.pathname}?${p}`);
}

/* ---------- layout: each frame at the viewport width, scaled to fit its pane ---------- */

// (the pages sit on a dark backdrop with this margin: where a page starts is never in doubt)
const STAGE_PAD = 10;

function layout() {
  const box = stage.getBoundingClientRect();
  const W = box.width - 2 * STAGE_PAD;
  const H = box.height - 2 * STAGE_PAD;
  const side = state.mode === 'side';
  const gap = side ? 12 : 0;
  const paneW = side ? (W - gap) / 2 : W;
  const scale = Math.min(1, paneW / state.vp);
  // (the pins keep their size however small the page is drawn: the pages are scaled down)
  const unscale = String(1 / scale);
  scroller.style.setProperty('--rv-unscale', unscale);
  const stdDoc = ready.std ? frames.std?.contentDocument : null;
  stdDoc?.documentElement?.style.setProperty('--rv-unscale', unscale);
  const cmp = panes[state.cmp];
  Object.entries(panes).forEach(([key, pane]) => {
    const w = state.vp * scale;
    let left = STAGE_PAD + (paneW - w) / 2;
    if (side && key !== 'std') left += paneW + gap;
    Object.assign(pane.style, {
      left: `${left}px`, top: `${STAGE_PAD}px`, width: `${w}px`, height: `${H}px`,
    });
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
  let showing = `${BASE_LABEL} and ${other}`;
  if (state.mode === 'flip') showing = state.show === 'std' ? `Showing: ${BASE_WORD} (Space: ${other})` : `Showing: ${other} (Space: ${BASE_WORD})`;
  else if (state.mode === 'opacity') showing = `${other[0].toUpperCase()}${other.slice(1)} over ${BASE_WORD}, ${state.opacity}%`;
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
// the real page: what its bridge last said, and scrolling it through the bridge
const realWindow = {
  get scrollY() { return real.y; },
  get innerHeight() { return real.h || frames.real.clientHeight; },
  scrollTo(x, y) {
    const top = typeof x === 'object' ? x.top : y;
    frames.real.contentWindow?.postMessage({ reviewLive: true, type: 'scrollTo', y: top }, REAL_ORIGIN);
  },
};
const win = (side) => {
  if (side === 'src') return snapshotWindow;
  if (side === 'real') return realWindow;
  return frames[side].contentWindow;
};
const doc = (side) => frames[side].contentDocument;

// pinned QA notes on the standard page (notes.js); the editor and the list are set up below
const noteHooks = {
  place: () => {}, select: () => {}, render: () => {}, showSource: async () => {},
};
const notes = createNotes({
  doc: () => (ready.std ? doc('std') : null),
  vp: () => state.vp,
  onPlace: (draft) => noteHooks.place(draft),
  onSelect: (id) => noteHooks.select(id),
  // notes on the source screenshot (25 Nov 2026)
  src: {
    page: () => (ready.src && snapshot ? panes.src.querySelector('.rv-src-page') : null),
    shot: () => (snapshot ? snapshot.id || 'first' : null),
    scrollTo: (y) => scroller.scrollTo({ top: Math.max(0, y - scroller.clientHeight / 3), behavior: 'smooth' }),
    show: (note) => noteHooks.showSource(note),
  },
});

function rebuildAnchors() {
  if (!ready.std || !ready[state.cmp]) return;
  try {
    let other;
    if (state.cmp === 'src') other = snapshot.leaves;
    else if (state.cmp === 'real') other = real.leaves;
    else other = leaves(doc(state.cmp));
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
const TEXT_LABELS = {
  '': 'default (Humanist 14)',
  'text-large': 'large (Humanist 17.5)',
  'text-x-large': 'extra large (Humanist 21)',
  'text-serif': 'serif (Egyptienne 21)',
  'text-serif-subtitle': 'serif subtitle (Egyptienne 24.5)',
  'text-serif-title': 'serif title (Egyptienne 28)',
};
const VARIANT_LABELS = { '': 'default', autoplay: 'autoplay', sticky: 'sticky' };
const WIDTH_LABELS = { '': 'equal widths', 'wide-first': 'wide first', 'wide-last': 'wide last' };
const BG_LABELS = {
  '': 'no background', 'grey-band': 'grey band', 'gold-box': 'gold box', 'purple-band': 'purple band', 'blue-band': 'blue band',
};
const label = (v, labels = VARIANT_LABELS) => (v in labels ? labels[v] : v.replace(/-/g, ' '));
const api = () => (ready.std ? win('std')?.stdReview : null);

/* ---------- saving (store.js: the review backend) ---------- */

// the page's saved state: `item|kind` → { value, reviewer, time } (items as positions, `s14b0`)
let saved = new Map();
// who is reviewing: from the invitation (name, role reviewer or aoe)
const me = { name: '', role: 'reviewer' };
// the page's block keys (blockkeys.js): saved entries are stored under them, shown by position
let pageKeys = { byId: {}, byKey: {} };
let savedLoad = Promise.resolve();
// this reviewer's changes not sent yet: `item|kind` → value; kept in the browser for the moment
// before they are sent (saveRow), or until there is a name to send them with
let drafts = new Map();
const DRAFTS_KEY = storageKey('drafts');
const reviewer = () => $('.rv-reviewer').value.trim();
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// `item|kind`: the item may hold `|` itself (a group key), the kind never does
const splitKey = (key) => [key.slice(0, key.lastIndexOf('|')), key.slice(key.lastIndexOf('|') + 1)];
const when = (t) => (t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
let storeStatus = { kind: 'saved', text: 'All changes saved' };

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

/** a group's chosen value for a kind (variant, width), undefined when it has none */
function groupValue(group, kind) {
  const g = savedOf(`group:${group}`, kind);
  return g && g.value !== null && g.value !== undefined ? g.value : undefined;
}

/** what a value was before this reviewer's unsaved changes: the saved one, else the page's own */
function baseOf(item, kind) {
  const s = saved.get(`${item}|${kind}`);
  if (kind === 'note' || item.startsWith('group:')) return s ? s.value : undefined;
  if (s && s.value !== null) return s.value;
  if (kind === 'comment') return '';
  if (kind === 'reviewed') return false;
  if (/^s\d+$/.test(item)) {
    const sec = api()?.sections().find((x) => x.id === item);
    if (!sec) return undefined;
    const fromGroup = kind === 'text' ? groupValue(sec.group, 'text') : undefined;
    if (fromGroup !== undefined) return fromGroup;
    return kind === 'text' ? sec.standard : sec.standardBackground;
  }
  const block = api()?.list().find((i) => i.id === item);
  if (!block) return undefined;
  // a block without its own choice follows its group's choice, else its own design
  const group = kind !== 'background' && block.group ? groupValue(block.group, kind) : undefined;
  if (group !== undefined) return group;
  const own = {
    variant: block.standard, width: block.standardWidth, background: block.standardBackground,
  };
  return own[kind];
}

// the page status follows every change (drawn further down)
const statusHooks = { render: () => {} };
// each message shows its sending state (sending…, not sent): updated in place, the chats are
// not drawn again (someone may be typing in them)
const sendingHooks = { update: () => {} };
// the panels a new message redraws (drawn further down)
const threadHooks = { redraw: () => {} };
// the page's help (help.js), told the viewer's side once the link is read
const helpHooks = { setRole: () => {} };

function renderStatus() {
  const box = $('.rv-status');
  const { kind, text } = storeStatus;
  box.className = `rv-status rv-${kind}`;
  box.querySelector('.rv-status-text').textContent = text;
  box.querySelector('.rv-retry').hidden = kind !== 'failed';
  statusHooks.render();
  sendingHooks.update();
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

/** sending: one row per change kept (its final value) */
function saveAll() {
  if (!drafts.size) return true;
  if (!reviewer()) {
    // (no name yet: without a review link; kept in this browser, sent once a name is there)
    $('.rv-name').classList.add('rv-need');
    storeStatus = { kind: 'failed', text: 'Open the tool with your review link to save (kept in this browser until then)' };
    renderStatus();
    $('.rv-retry').hidden = true;
    return false;
  }
  $('.rv-name').classList.remove('rv-need');
  drafts.forEach((value, key) => {
    const [item, kind] = splitKey(key);
    // (a group's choice is for every page)
    saved.set(key, {
      ...store.save({
        page: item.startsWith('group:') ? '*' : state.page, item: toKey(item, pageKeys), kind, value, reviewer: reviewer(),
      }),
      item,
      reviewer: me.name || reviewer(),
      role: me.role,
    });
  });
  drafts = new Map();
  keepDrafts();
  return true;
}

/**
 * a change, saved at once (since 25 Nov 2026: no Save button): kept in the browser for a moment
 * (several changes of one action go together, e.g. a QA note and its first message), then sent;
 * back at the value it had before, it is no change at all
 */
let flushing = 0;
function saveRow(item, kind, value) {
  const key = `${item}|${kind}`;
  const neverSavedNote = kind === 'note' && value?.deleted && !saved.has(key);
  if (neverSavedNote || same(value, baseOf(item, kind))) drafts.delete(key);
  else drafts.set(key, value);
  keepDrafts();
  window.clearTimeout(flushing);
  flushing = window.setTimeout(() => {
    if (saveAll()) threadHooks.redraw();
  }, 0);
}

/** a block choice: one change per property */
function keepChoice(id, patch) {
  Object.entries(patch).forEach(([kind, value]) => saveRow(id, kind, value));
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

/** before leaving a page: anything still kept is sent now */
async function leavePage() {
  window.clearTimeout(flushing);
  if (drafts.size) saveAll();
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

/* ---------- threads: the back and forth on a comment or QA note ---------- */

// the rules (thread states, handovers, page states) are shared: threads.js
const AOE_STATES = {
  progress: 'in progress', done: 'done', wontdo: "won't do", open: 'open again',
};
const replyId = () => {
  const bytes = window.crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * A thread's entries: the opener (comment / note) and its messages, saved ones and this
 * reviewer's unsaved ones (drafts), in time order (unsaved last); an older AOE status row too
 */
function threadEntries(item, kind) {
  const prefix = `${item}|reply:${kind}:`;
  const out = [];
  const opener = savedOf(item, kind);
  if (opener) out.push({ ...opener, item, kind });
  saved.forEach((e, k) => {
    if ((k.startsWith(prefix) || k === `${item}|status:${kind}`) && !drafts.has(k)) out.push(e);
  });
  drafts.forEach((value, k) => {
    if (k.startsWith(prefix)) {
      out.push({
        item, kind: k.slice(item.length + 1), value, reviewer: me.name || 'you', role: me.role, time: null, unsaved: true,
      });
    }
  });
  return out.sort((a, b) => ((a.time || '9') < (b.time || '9') ? -1 : 1));
}

/** a message for the thread: sent at once (its author may withdraw it later) */
function addMessage(item, kind, value) {
  saveRow(item, `reply:${kind}:${replyId()}`, value);
}

// what is typed in a chat's box and not sent yet: kept in this browser (a reload or another page
// keeps it), `<page>|<item>|<kind>` → text
const TYPING_KEY = storageKey('typing');
const typing = {
  all() {
    try {
      return JSON.parse(window.localStorage.getItem(TYPING_KEY)) || {};
    } catch (e) {
      return {};
    }
  },
  get(key) {
    return this.all()[`${state.page}|${key}`] || '';
  },
  set(key, text) {
    const all = this.all();
    if (text) all[`${state.page}|${key}`] = text;
    else delete all[`${state.page}|${key}`];
    window.localStorage.setItem(TYPING_KEY, JSON.stringify(all));
  },
};

/** a message's sending state, from the store: 'sending', 'failed' or null (saved) */
const sendingOf = (item, kind) => store.pendingOf(item.startsWith('group:') ? '*' : state.page, toKey(item, pageKeys), kind);

// the chats shown open (kept across redraws; the page's own chat is always open)
const openChats = new Set();
/** the attachment icon (a paper clip) of the message box's picture button */
function clipIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'pv-clip');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5');
  svg.append(path);
  const words = document.createElement('span');
  words.className = 'pv-sr';
  words.textContent = 'Attach a picture';
  return [svg, words];
}

// pictures in a chat's box, not sent yet (kept across redraws, not across reloads): key → [picture]
const attached = new Map();
// a chat whose pictures are on their way: key → what to show ('Sending picture 1 of 2…', an error)
const picturesSending = new Map();

/** the message box of a chat, once its panel is drawn again (the block list redraws late) */
function focusChat(key, tries = 20) {
  const area = document.querySelector(`[data-chat="${CSS.escape(key)}"] textarea`);
  if (area) area.focus();
  else if (tries > 0) window.setTimeout(() => focusChat(key, tries - 1), 50);
}

/** is this entry mine (the viewer's) */
const isMine = (e) => e.unsaved || ((e.reviewer || '') === me.name && roleOf(e) === me.role) || e.reviewer === 'you';

/**
 * A chat under a block, text section, the page or a QA note: its messages (newest at the bottom,
 * mine on the right), the message box, a Done tick. For comments the first message is the comment
 * itself; for QA notes the note is shown above, the chat holds the messages about it.
 */
function chatParts(item, kind) {
  const key = `${item}|${kind}`;
  const always = item === 'page';
  const entries = threadEntries(item, kind);
  const messages = entries.filter((e) => e.kind !== kind || (kind === 'comment' && e.value));
  const standing = messages.filter((e) => !isWithdrawn(e.value));
  const doneMark = savedOf(item, `done:${kind}`);
  const done = doneMark ? doneMark.value === true : threadState(entries.map((e, i) => ({ ...e, time: e.time || `9${i}` }))).done;
  const count = standing.length;
  const open = always || openChats.has(key);
  const tick = el('input', { type: 'checkbox', class: 'rv-done', 'aria-label': 'Done' });
  tick.checked = done;
  tick.addEventListener('change', () => {
    saveRow(item, `done:${kind}`, tick.checked);
    threadHooks.redraw();
  });
  let toggleLabel = open ? 'Hide comment box' : 'Comment';
  if (count) toggleLabel = `${open ? 'Hide' : 'Show'} comments (${count})`;
  const head = el(
    'div',
    { class: 'rv-chat-head' },
    always ? el('span', { class: 'rv-meta' }, count ? `${count} message${count > 1 ? 's' : ''}` : '') : el('button', {
      type: 'button',
      class: 'rv-comment-toggle',
      'aria-expanded': String(open),
      onclick: () => {
        if (open) openChats.delete(key);
        else openChats.add(key);
        threadHooks.redraw();
        if (!open) focusChat(key);
      },
    }, toggleLabel),
    count ? el('label', { class: 'rv-done-label', title: 'This is dealt with (either side can tick it)' }, tick, ' Done') : null,
  );
  if (!open) return [head];
  const list = el('div', { class: 'rv-chat' });
  messages.forEach((r) => {
    const gone = isWithdrawn(r.value);
    const v = (typeof r.value === 'object' && r.value) || {};
    const isStatusRow = r.kind.startsWith('status:');
    let text = '';
    if (!gone) text = r.kind === kind ? r.value : (v.text || (isStatusRow && v.reason) || '');
    let statusOf = null;
    if (!gone) statusOf = isStatusRow ? v : v.status;
    const status = statusOf && AOE_STATES[statusOf.state];
    const mine = isMine(r);
    // (its author may withdraw a message once it is saved: everyone then sees "withdrawn")
    const withdraw = mine && !gone && !r.kind.startsWith('status:') ? el('button', {
      type: 'button',
      class: 'rv-msg-withdraw',
      title: 'Withdraw this message: everyone sees that it was withdrawn',
      onclick: async () => {
        const sure = await ask('Withdraw this message? Everyone then sees "Message withdrawn" instead of it.', [['Withdraw', true, 'rv-danger'], ['Keep it', false]]);
        if (sure) saveRow(item, r.kind, { withdrawn: true });
      },
    }, 'Withdraw') : null;
    list.append(el(
      'div',
      { class: `rv-bubble${mine ? ' rv-mine' : ''}${roleOf(r) === 'aoe' ? ' rv-msg-aoe' : ''}${gone ? ' rv-msg-withdrawn' : ''}` },
      el(
        'div',
        { class: 'rv-bubble-head' },
        el('span', { class: 'rv-msg-who' }, r.reviewer === 'you' ? (me.name || 'you') : (r.reviewer || 'someone'), roleOf(r) === 'aoe' ? el('span', { class: 'rv-badge' }, 'AOE') : null),
        el('span', { class: 'rv-meta' }, when(r.time), ' ', el('span', { class: 'rv-msg-state', 'data-sending': `${item}|${r.kind}` }), withdraw),
      ),
      status ? el('p', { class: `rv-aoe rv-aoe-${statusOf.state}` }, el('b', {}, `AOE: ${status}`), statusOf.release ? ` in ${statusOf.release}` : '') : null,
      gone ? el('p', { class: 'rv-msg-text rv-msg-gone' }, 'Message withdrawn') : null,
      text ? el('p', { class: 'rv-msg-text' }, text) : null,
      !gone && Array.isArray(v.images) && v.images.length ? picturesOf(v.images) : null,
    ));
  });
  if (!messages.length) list.append(el('p', { class: 'rv-chat-empty' }, kind === 'note' ? 'No messages about this note yet.' : 'No comments yet: write the first one below.'));
  // the message box: Send (Ctrl+Enter) saves it at once; the AOE team may add a status; what is
  // typed and not sent stays in this browser
  const area = el('textarea', { class: 'rv-reply', rows: '2', placeholder: 'Write a message… (Ctrl+Enter sends)' });
  area.value = typing.get(key);
  area.addEventListener('input', () => typing.set(key, area.value));
  const pick = me.role === 'aoe' ? el('select', { class: 'rv-reply-status', 'aria-label': 'Status' }, el('option', { value: '' }, 'no status'), ...Object.entries(AOE_STATES).map(([k, v]) => el('option', { value: k }, v))) : null;
  // pictures (a screenshot of what a page shows after a click): the Picture button, pasting into
  // the box, dropping onto it; they go with the next message
  const strip = el('div', { class: 'pv-attach', 'aria-label': 'Pictures to send' });
  const progress = el('span', { class: `pv-progress${/^(Sending|Making)/.test(picturesSending.get(key) || '') ? '' : ' pv-error'}`, 'aria-live': 'polite' }, picturesSending.get(key) || '');
  const drawStrip = () => strip.replaceChildren(...(attached.get(key) || []).map((pic, i) => el(
    'div',
    { class: 'pv-attach-item' },
    el('img', { src: pic.url, alt: `Picture ${i + 1} to send` }),
    el('button', {
      type: 'button',
      class: 'pv-attach-remove',
      title: 'Remove this picture',
      'aria-label': 'Remove this picture',
      onclick: () => {
        attached.set(key, (attached.get(key) || []).filter((x) => x !== pic));
        URL.revokeObjectURL(pic.url);
        drawStrip();
      },
    }, '×'),
  )));
  drawStrip();
  const addPictures = async (files) => {
    const room = MAX_PICTURES - (attached.get(key) || []).length;
    if (!files.length) return;
    if (room <= 0) {
      progress.textContent = `Up to ${MAX_PICTURES} pictures in one message.`;
      progress.className = 'pv-progress pv-error';
      return;
    }
    progress.textContent = 'Making the picture ready…';
    progress.className = 'pv-progress';
    try {
      const prepared = await Promise.all(files.slice(0, room).map(prepare));
      attached.set(key, [...(attached.get(key) || []), ...prepared]);
      progress.textContent = files.length > room ? `Up to ${MAX_PICTURES} pictures in one message: the others were left out.` : '';
    } catch (e) {
      progress.textContent = 'This picture could not be read.';
      progress.className = 'pv-progress pv-error';
    }
    drawStrip();
    area.focus();
  };
  area.addEventListener('paste', (e) => {
    const files = picturesIn(e.clipboardData?.files);
    if (!files.length) return;
    e.preventDefault();
    addPictures(files);
  });
  const file = el('input', {
    type: 'file', accept: PICTURE_TYPES.join(','), multiple: true, 'aria-label': 'Add a picture',
  });
  file.addEventListener('change', () => {
    addPictures(picturesIn(file.files));
    file.value = '';
  });
  const pickPicture = el('label', { class: 'rv-btn-light pv-pick', title: 'Attach a picture (or paste one into the message box, or drop it here)' }, file, clipIcon());
  const sendNow = (words, images, status) => {
    // (the first message on a block, section or the page is the comment itself: its pictures
    // follow it as the chat's next message)
    if (kind === 'comment' && !savedOf(item, 'comment')?.value) {
      saveRow(item, 'comment', words || 'Picture');
      if (images) addMessage(item, kind, { images });
    } else {
      const value = { text: words || undefined };
      if (images) value.images = images;
      if (status) value.status = status;
      addMessage(item, kind, value);
    }
    typing.set(key, '');
    openChats.add(key);
  };
  const send = async () => {
    const words = area.value.trim();
    const pics = attached.get(key) || [];
    if (picturesSending.has(key) && /^Sending/.test(picturesSending.get(key))) return;
    if (!words && !pick?.value && !pics.length) return;
    const status = pick?.value ? { state: pick.value } : undefined;
    if (!pics.length) {
      sendNow(words, null, status);
      area.value = '';
      focusChat(key);
      return;
    }
    // the pictures first (in parts), then the message that shows them
    const show = (text) => {
      picturesSending.set(key, text);
      document.querySelectorAll(`[data-chat="${CSS.escape(key)}"] .pv-progress`).forEach((x) => {
        x.textContent = text;
        x.className = `pv-progress${/^Sending/.test(text) ? '' : ' pv-error'}`;
      });
    };
    try {
      const images = [];
      await pics.reduce(async (before, pic, i) => {
        await before;
        show(`Sending picture ${i + 1} of ${pics.length}…`);
        // (with its small version for the chat; both kept in this browser: never downloaded here)
        const id = await upload(state.page, pic);
        const t = pic.thumb ? await upload(state.page, pic.thumb) : undefined;
        keepPicture(id, pic.blob);
        if (t) keepPicture(t, pic.thumb.blob);
        images.push({
          id, t, w: pic.w, h: pic.h,
        });
      }, Promise.resolve());
      picturesSending.delete(key);
      attached.delete(key);
      pics.forEach((pic) => URL.revokeObjectURL(pic.url));
      sendNow(words, images, status);
      document.querySelectorAll(`[data-chat="${CSS.escape(key)}"] textarea`).forEach((x) => { x.value = ''; });
      threadHooks.redraw();
      focusChat(key);
    } catch (e) {
      show(`${e.message} Nothing was sent: try Send again.`);
    }
  };
  area.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  });
  const composer = el(
    'div',
    { class: 'rv-composer' },
    area,
    strip,
    el('div', { class: 'rv-reply-actions' }, pickPicture, pick, el('button', { type: 'button', class: 'rv-btn-light rv-primary', onclick: send }, 'Send'), progress),
  );
  composer.addEventListener('dragover', (e) => {
    if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
    e.preventDefault();
    composer.classList.add('pv-drop');
  });
  composer.addEventListener('dragleave', (e) => {
    if (!composer.contains(e.relatedTarget)) composer.classList.remove('pv-drop');
  });
  composer.addEventListener('drop', (e) => {
    composer.classList.remove('pv-drop');
    const files = picturesIn(e.dataTransfer?.files);
    if (!files.length) return;
    e.preventDefault();
    addPictures(files);
  });
  return [head, el('div', { class: 'rv-chat-box', 'data-chat': key }, list, composer)];
}

/** the chat of a block, text section or the page (comments) */
function commentParts(item) {
  return chatParts(item, 'comment');
}

/** every chat shows its newest message (they scroll to the bottom) */
function settleChats() {
  window.requestAnimationFrame(() => document.querySelectorAll('.rv-chat').forEach((c) => {
    c.scrollTop = c.scrollHeight;
  }));
}

/* ---------- groups: "blocks like this" (groups.js, counts in groups.json) ---------- */

let GROUPS = {};
// the block list is drawn further down; the group buttons redraw it through this
const panelHooks = { list: () => {} };
const ownValue = (id, kind) => {
  const own = savedOf(id, kind);
  return own && own.value !== null && own.value !== undefined ? own.value : undefined;
};

/** a block follows its group again: its saved own choice is cleared, its draft dropped */
function clearOwn(id, kind) {
  const key = `${id}|${kind}`;
  if (saved.has(key) && saved.get(key).value !== null) saveRow(id, kind, null);
  else {
    drafts.delete(key);
    keepDrafts();
  }
}

/** the group line of a block: how many are like it, its group's choice, use / stop for all */
function groupParts(item, review, busy, li) {
  const info = item.group && GROUPS[item.group];
  if (!info || info.blocks < 2) return null;
  const chosen = savedOf(`group:${item.group}`, 'variant');
  const value = groupValue(item.group, 'variant');
  const mine = ownValue(item.id, 'variant');
  const others = () => review.list().filter((o) => o.group === item.group && o.id !== item.id);
  const setOthers = async (variant, width) => {
    await others().filter((o) => ownValue(o.id, 'variant') === undefined)
      .reduce((chain, o) => chain.then(() => review.set(o.id, {
        variant, width: o.widths.length ? width : undefined,
      })), Promise.resolve());
  };
  let text = `${info.blocks} blocks like this on ${info.pages} pages`;
  if (value !== undefined) {
    const by = chosen.unsaved ? 'unsaved' : `${chosen.reviewer || 'someone'} · ${when(chosen.time)}`;
    text = `All ${info.blocks} like this: ${label(value)} (${by})`;
    if (mine !== undefined && mine !== value) text += ' · this block is an exception';
  }
  const useAll = el('button', {
    type: 'button',
    class: 'rv-comment-toggle rv-group-btn',
    title: `${info.label}: every block like this on every page gets this design, unless it has its own choice`,
    onclick: async () => {
      busy(li, true);
      saveRow(`group:${item.group}`, 'variant', item.variant);
      if (item.widths.length) saveRow(`group:${item.group}`, 'width', item.width);
      clearOwn(item.id, 'variant');
      clearOwn(item.id, 'width');
      await setOthers(item.variant, item.width);
      busy(li, false);
      panelHooks.list();
    },
  }, 'Use this design for all');
  const stop = el('button', {
    type: 'button',
    class: 'rv-comment-toggle rv-group-btn',
    title: 'Blocks like this go back to their own design (blocks with their own choice keep it)',
    onclick: async () => {
      busy(li, true);
      saveRow(`group:${item.group}`, 'variant', null);
      saveRow(`group:${item.group}`, 'width', null);
      const back = [item, ...others()].filter((o) => ownValue(o.id, 'variant') === undefined);
      await back.reduce((chain, o) => chain.then(() => review.set(o.id, {
        variant: o.standard, width: o.widths.length ? o.standardWidth : undefined,
      })), Promise.resolve());
      busy(li, false);
      panelHooks.list();
    },
  }, 'Stop');
  const allSame = value !== undefined && value === item.variant && mine === undefined;
  return el(
    'div',
    { class: 'rv-group-row', title: info.label },
    el('span', { class: 'rv-meta' }, text),
    el('span', {}, allSame ? null : useAll, value !== undefined ? ' ' : null, value !== undefined ? stop : null),
  );
}

/** the group line of a text section: sections with the same standard text set */
function sectionGroupParts(sec, review, busy, li) {
  const info = GROUPS[sec.group];
  if (!info || info.blocks < 2) return null;
  const chosen = savedOf(`group:${sec.group}`, 'text');
  const value = groupValue(sec.group, 'text');
  const mine = ownValue(sec.id, 'text');
  const others = () => review.sections().filter((o) => o.group === sec.group && o.id !== sec.id);
  let text = `${info.blocks} sections like this on ${info.pages} pages`;
  if (value !== undefined) {
    const by = chosen.unsaved ? 'unsaved' : `${chosen.reviewer || 'someone'} · ${when(chosen.time)}`;
    text = `All ${info.blocks} like this: ${label(value, TEXT_LABELS)} (${by})`;
    if (mine !== undefined && mine !== value) text += ' · this section is an exception';
  }
  const useAll = el('button', {
    type: 'button',
    class: 'rv-comment-toggle rv-group-btn',
    title: `${info.label}: every section like this on every page gets this text style, unless it has its own choice`,
    onclick: () => {
      busy(li, true);
      saveRow(`group:${sec.group}`, 'text', sec.set);
      clearOwn(sec.id, 'text');
      others().filter((o) => ownValue(o.id, 'text') === undefined).forEach((o) => review.setTextSet(o.id, sec.set));
      busy(li, false);
      panelHooks.list();
    },
  }, 'Use this text style for all');
  const stop = el('button', {
    type: 'button',
    class: 'rv-comment-toggle rv-group-btn',
    title: 'Sections like this go back to their own text style (sections with their own choice keep it)',
    onclick: () => {
      saveRow(`group:${sec.group}`, 'text', null);
      [sec, ...others()].filter((o) => ownValue(o.id, 'text') === undefined)
        .forEach((o) => review.setTextSet(o.id, o.standard));
      panelHooks.list();
    },
  }, 'Stop');
  const allSame = value !== undefined && value === sec.set && mine === undefined;
  return el(
    'div',
    { class: 'rv-group-row', title: info.label },
    el('span', { class: 'rv-meta' }, text),
    el('span', {}, allSame ? null : useAll, value !== undefined ? ' ' : null, value !== undefined ? stop : null),
  );
}

/** a section with text of its own: its text style (instant), background, group, comment */
function textRow(sec, review) {
  const changed = sec.set !== sec.standard || sec.background !== sec.standardBackground;
  const busy = (row, on) => row.classList.toggle('rv-busy', on);
  const li = el('li', {
    class: `rv-item rv-text-item${changed ? ' rv-changed' : ''}`,
    onmouseenter: () => review.highlightSection(sec.id, true),
    onmouseleave: () => review.highlightSection(sec.id, false),
  });
  li.append(el(
    'div',
    { class: 'rv-item-head' },
    el('button', {
      type: 'button', class: 'rv-name', title: sec.snippet, onclick: () => review.revealSection(sec.id),
    }, 'Text'),
    el('span', { class: 'rv-flags' }, changed ? 'changed' : '', sec.hidden ? ' hidden' : ''),
  ));
  li.append(el('div', { class: 'rv-snippet' }, `“${sec.snippet}…”`));
  const sets = review.textSets;
  const cycle = (dir) => {
    const i = sets.indexOf(sec.set);
    const next = sets[(i + dir + sets.length) % sets.length];
    if (review.setTextSet(sec.id, next)) {
      keepChoice(sec.id, { text: next });
      panelHooks.list();
    }
  };
  const controls = el('div', { class: 'rv-controls' }, el(
    'div',
    { class: 'rv-cycle' },
    el('button', {
      type: 'button', class: 'rv-step', 'aria-label': 'Previous text style', onclick: () => cycle(-1),
    }, '‹'),
    el('span', { class: 'rv-current' }, label(sec.set, TEXT_LABELS), el('small', {}, ` ${sets.indexOf(sec.set) + 1}/${sets.length}`)),
    el('button', {
      type: 'button', class: 'rv-step', 'aria-label': 'Next text style', onclick: () => cycle(1),
    }, '›'),
  ));
  if (!sec.hasBlocks) {
    const bg = el('select', {
      onchange: (e) => {
        if (review.setSectionBackground(sec.id, e.target.value)) {
          keepChoice(sec.id, { background: e.target.value });
          panelHooks.list();
        }
      },
    }, ...review.backgrounds.map((v) => el('option', { value: v }, label(v, BG_LABELS))));
    bg.value = sec.background;
    controls.append(bg);
  }
  li.append(controls);
  const group = sectionGroupParts(sec, review, busy, li);
  if (group) li.append(group);
  li.append(...commentParts(sec.id, 'Comment on this text (e.g. none of the text styles fit, because …)'));
  return li;
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
      if (await review.set(item.id, { variant: next })) {
        keepChoice(item.id, { variant: next });
        panelHooks.list();
      }
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
      if (await review.set(item.id, { width })) {
        keepChoice(item.id, { width });
        panelHooks.list();
      }
      busy(li, false);
    }));
  }
  controls.append(select(review.backgrounds, item.background, BG_LABELS, (background) => {
    if (review.setBackground(item.id, background)) {
      keepChoice(item.id, { background });
      panelHooks.list();
    }
  }));
  li.append(controls);
  const group = groupParts(item, review, busy, li);
  if (group) li.append(group);
  li.append(...commentParts(item.id, 'Comment on this block (e.g. none of these fit, because …)'));
  return li;
}

/* ---------- QA notes: the list and the editor ---------- */

const WIDTH_NAMES = Object.fromEntries(REVIEW.widths.map((w) => [w.vp, w.label.toLowerCase()]));
const noteId = () => (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * the page's notes from its saved state (the latest row of each note), deleted ones too (marked:
 * they keep their number, notes.js); a note's words: its chat's first message (older notes: their
 * own text)
 */
function savedNotes() {
  const keys = new Set([...saved.keys(), ...drafts.keys()].filter((k) => k.endsWith('|note')));
  return [...keys].map((k) => savedOf(...splitKey(k)))
    .filter((e) => e && e.value)
    .map((e) => {
      // (a note is resolved when its thread is ticked Done; before Done marks: its own status)
      const mark = savedOf(`note:${e.value.id}`, 'done:note');
      const words = firstText(threadEntries(`note:${e.value.id}`, 'note').map((x, i) => ({ ...x, time: x.time || `9${i}` })));
      return {
        ...e.value, words, status: mark ? (mark.value === true && 'resolved') || 'open' : e.value.status, reviewer: e.reviewer, time: e.time, unsaved: !!e.unsaved,
      };
    });
}

function saveNote(note) {
  saveRow(`note:${note.id}`, 'note', {
    id: note.id,
    created: note.created,
    vp: note.vp,
    cat: note.cat,
    // (older notes keep their own text; new ones have none: the chat's first message)
    ...(note.text ? { text: note.text } : {}),
    status: note.status,
    anchor: note.anchor,
    at: note.at,
    // (on the source: its screenshot)
    ...(note.side === 'src' ? { side: 'src', shot: note.shot } : {}),
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
  const isNew = !note.id;
  // a new note: what it is about is the first message of its chat (no subject of its own); an
  // existing note: its category, or delete it (its messages are withdrawn one by one)
  const text = isNew ? el('textarea', { rows: '4', placeholder: 'What is wrong or should change here? (the first message of this note\'s subject)' }) : null;
  box.replaceChildren(
    el('div', { class: 'rv-note-editor-head' }, isNew ? 'New QA note' : `QA note ${notes.list().find((n) => n.id === note.id)?.n || ''}`, el('span', { class: 'rv-meta' }, ` ${WIDTH_NAMES[note.vp] || note.vp}${note.side === 'src' ? ', on the source screenshot' : ''}`)),
    cat,
    text,
    el(
      'div',
      { class: 'rv-note-actions' },
      el('button', {
        type: 'button',
        class: 'rv-btn-light rv-primary',
        onclick: () => {
          if (isNew && !text.value.trim()) {
            text.focus();
            return;
          }
          const id = note.id || noteId();
          saveNote({ ...note, id, cat: cat.value });
          // (the note's chat starts with its first message, saved with the note)
          if (isNew) {
            addMessage(`note:${id}`, 'note', { text: text.value.trim() });
            openChats.add(`note:${id}|note`);
          }
          closeEditor();
        },
      }, isNew ? 'Add note' : 'Save'),
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
  (text || cat).focus();
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
      title: (n.side === 'src' && 'On the source screenshot: shows it, at its width, and the pin')
        || (n.vp === state.vp ? 'Show on the page' : `Found at ${WIDTH_NAMES[n.vp]} width: switches to it and shows the pin`),
      onclick: () => {
        if (n.vp === state.vp || n.side === 'src') {
          notes.select(n.id);
          return;
        }
        // a note from the other width: switch to it, then show the pin once the page reflowed
        document.querySelector(`[data-vp="${n.vp}"]`)?.click();
        window.setTimeout(() => notes.select(n.id), 900);
      },
    }, el('span', { class: 'rv-note-n' }, n.n), el('span', { class: 'rv-note-text' }, `${CATEGORIES[n.cat] || ''}${n.words ? ` · ${n.words}` : ''}`)),
    el(
      'div',
      { class: 'rv-item-foot' },
      el('span', { class: 'rv-meta' }, n.side === 'src' ? el('b', { class: 'rv-note-side' }, 'On the source · ') : '', `${WIDTH_NAMES[n.vp] || n.vp} · ${n.reviewer === 'you' ? (me.name || 'you') : (n.reviewer || 'someone')} · ${when(n.time)}`),
      el('button', { type: 'button', class: 'rv-comment-toggle', onclick: () => openEditor(n) }, 'Edit'),
    ),
    ...chatParts(`note:${n.id}`, 'note'),
  )));
  settleChats();
  if (!all.length) list.append(el('li', { class: 'rv-none' }, 'No QA notes yet. "Add QA note" (or N), then click the spot on the page.'));
}

function setNoteMode(on) {
  // (a note goes on the migrated page or the source screenshot: never on the rendered copy, which
  // isn't kept; in any view mode, Render becomes Screenshot)
  if (on && ['live', 'real'].includes(state.cmp) && REVIEW.compare.includes('src')) $('[data-cmp="src"]')?.click();
  notes.setAdding(on);
  $('[data-action="note"]').setAttribute('aria-pressed', String(on));
  $('.rv-stage').classList.toggle('rv-adding', on);
}

/** to a note on the source: Screenshot, its width, its screenshot (resolves once it is shown) */
noteHooks.showSource = async (note) => {
  if (state.cmp !== 'src') $('[data-cmp="src"]')?.click();
  if (state.mode === 'flip' && state.show !== 'cmp') {
    state.show = 'cmp';
    layout();
  }
  const shot = () => (snapshot ? snapshot.id || 'first' : null);
  if (state.vp !== note.vp) $(`[data-vp="${note.vp}"]`)?.click();
  else if (shot() !== note.shot) {
    shots.chosen = note.shot === 'first' ? null : note.shot;
    const pick = $('.rv-shot-pick');
    if (pick && note.shot !== 'first') pick.value = note.shot;
    shotHooks.reload();
  }
  // (the screenshot loads in the background: up to 6 s)
  await new Promise((done) => {
    const check = (n) => {
      if (n <= 0 || (ready.src && shot() === note.shot && state.vp === note.vp)) done();
      else window.setTimeout(() => check(n - 1), 100);
    };
    check(60);
  });
};

noteHooks.place = (draft) => openEditor(draft);
noteHooks.render = renderNotes;
noteHooks.select = (id) => {
  notes.select(id);
  document.querySelectorAll('.rv-note').forEach((li) => li.classList.toggle('rv-on', li.dataset.note === id));
};

/** this page: reviewed mark and page comment */
const STATUS_LABELS = {
  unreviewed: 'Not reviewed yet',
  'in-review': 'In review',
  'waiting-aoe': 'Waiting for the AOE team',
  'waiting-customer': 'Waiting for the reviewer',
  approved: 'Approved as is',
  resolved: 'Resolved',
  skipped: 'Skipped: not migrated',
};
const stateName = (st) => STATUS_LABELS[st] || st;
const STATUS_BUTTONS = {
  'in-review': 'In review',
  'waiting-aoe': 'Send to the AOE team',
  'waiting-customer': 'Send back to the reviewer',
  approved: 'Approve',
  skip: "Skip: don't migrate",
};

/** the page's entries as rows, this reviewer's unsaved changes included (threads.js reads them) */
function currentRows() {
  const rows = new Map(saved);
  drafts.forEach((value, k) => {
    const [item, kind] = splitKey(k);
    rows.set(k, {
      item, kind, value, reviewer: me.name || 'you', role: me.role, time: '9999', unsaved: true,
    });
  });
  return [...rows.values()].filter((e) => e && e.kind);
}

/** the status banner (Feedback panel) and the toolbar badge: whose turn it is, prominently */
function renderPageStatus() {
  const own = pageState(currentRows());
  // approving one page of a group approves the group (threads.js withGroupApproval)
  const g = !own.approved ? orgOf.get(state.page)?.groupApproved : null;
  const st = g && ['unreviewed', 'in-review'].includes(own.state) ? { ...own, state: 'approved' } : own;
  const pending = drafts.has('page|state') || !!sendingOf('page', 'state');
  const by = st.set && !pending ? `set by ${st.set.by}${st.set.role === 'aoe' ? ' (AOE)' : ''} · ${when(st.set.at)}` : '';
  $('.rv-status-banner').className = `rv-status-banner st-${st.state}`;
  $('.rv-status-banner').replaceChildren(...[
    el('span', { class: 'rv-status-kicker' }, 'Status of this page'),
    el('strong', {}, STATUS_LABELS[st.state]),
    el('span', { class: 'rv-status-by' }, pending ? 'saving…' : by),
    g ? el('span', { class: 'rv-status-group' }, `Approved with its group: ${g.page} approved by ${g.by}, ${when(g.at)}`) : null,
  ].filter(Boolean));
  const badge = $('.rv-page-badge');
  badge.className = `rv-page-badge st-${st.state}`;
  badge.textContent = STATUS_LABELS[st.state];
  badge.title = `Status of this page${by ? `, ${by}` : ''}`;
  // the buttons: each side its own statuses (threads.js); pressing the current one clears it
  $('.rv-status-actions').replaceChildren(...STATES_BY_ROLE[me.role === 'aoe' ? 'aoe' : 'reviewer'].map((value) => el('button', {
    type: 'button',
    class: `rv-page-state rv-page-state-${value}`,
    'aria-pressed': String(st.pageState === value),
    onclick: () => {
      saveRow('page', 'state', st.pageState === value ? '' : value);
      renderPageStatus();
    },
  }, STATUS_BUTTONS[value])));
}

function renderPageBox() {
  $('.rv-pagebox-body').replaceChildren(...commentParts('page'));
  renderPageStatus();
  settleChats();
}

function listBlocks() {
  if (!PANEL) return;
  // (a redraw keeps the panel where it was: emptying the list would scroll it to the top)
  const panel = $('.rv-panel');
  const panelTop = panel.scrollTop;
  const list = $('.rv-blocks');
  list.style.minHeight = `${list.offsetHeight}px`;
  list.replaceChildren();
  window.requestAnimationFrame(() => {
    list.style.minHeight = '';
    panel.scrollTop = panelTop;
  });
  if (!ready.std) return;
  const review = api();
  if (!review) {
    listRendered(list);
    return;
  }
  const items = review.list();
  const texts = review.sections ? review.sections() : [];
  if (!items.length && !texts.length) list.append(el('li', { class: 'rv-none' }, 'No blocks on this page itself'));
  [...texts.map((t) => ({ si: t.si, at: 0, row: () => textRow(t, review) })),
    ...items.map((i) => ({ si: i.si, at: 1, row: () => blockRow(i, review) }))]
    .sort((a, b) => a.si - b.si || a.at - b.at)
    .forEach((x) => list.append(x.row()));
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

panelHooks.list = listBlocks;

/** the page's saved choices (everyone's, latest per block), once its switcher is ready */
async function applySaved(review) {
  await savedLoad;
  // a block's own choice, else its group's (variant, width); backgrounds are the block's own
  const pick = (item, kind) => {
    const own = savedOf(item.id, kind);
    if (own && own.value !== null && own.value !== undefined) return own.value;
    return kind !== 'background' && item.group ? groupValue(item.group, kind) : undefined;
  };
  const todo = review.list().map((item) => ({
    id: item.id,
    variant: pick(item, 'variant'),
    width: pick(item, 'width'),
    background: pick(item, 'background'),
  })).filter((c) => c.variant !== undefined || c.width !== undefined || c.background !== undefined);
  await todo.reduce((chain, c) => chain.then(async () => {
    if (c.variant !== undefined || c.width !== undefined) {
      await review.set(c.id, { variant: c.variant, width: c.width });
    }
    if (c.background !== undefined) review.setBackground(c.id, c.background);
  }), Promise.resolve());
  // the text sections: their own text style, else their group's; their own background
  (review.sections ? review.sections() : []).forEach((sec) => {
    const own = ownValue(sec.id, 'text');
    const set = own !== undefined ? own : groupValue(sec.group, 'text');
    if (set !== undefined) review.setTextSet(sec.id, set);
    const bg = ownValue(sec.id, 'background');
    if (bg !== undefined) review.setSectionBackground(sec.id, bg);
  });
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

/** the Source shot box (Feedback panel): the history, the shot's details, Refresh (AOE team) */
function renderShotBox() {
  const box = $('.rv-shotbox-body');
  if (!box) return;
  const { data } = shots;
  if (!data) {
    box.replaceChildren(el('p', { class: 'rv-none' }, 'The history of source shots shows with your review link.'));
    return;
  }
  const n = data.versions.length;
  const newestFirst = [...data.versions].map((v, i) => ({ v, i })).reverse();
  const shown = data.versions.find((x) => x.id === shots.chosen) || data.versions[n - 1];
  const pick = n ? el('select', {
    class: 'rv-shot-pick',
    'aria-label': 'Source shot',
    onchange: (e) => {
      shots.chosen = e.target.value;
      shotHooks.reload();
      renderShotBox();
    },
  }, ...newestFirst.map(({ v, i }) => el('option', { value: v.id }, `${when(v.captured)}${shotTag(i, n, v) ? ` (${shotTag(i, n, v)})` : ''}`))) : null;
  if (pick) pick.value = shown.id;
  const req = data.request;
  let reqText = '';
  if (req?.status === 'pending') reqText = `New shot asked for by ${req.by}, ${when(req.at)}: the backend is taking it, it shows here within a few minutes.`;
  if (req?.status === 'failed') reqText = `The new shot asked for by ${req.by} could not be taken: ${req.reason}`;
  const refresh = el('button', {
    type: 'button',
    class: 'rv-shot-refresh rv-aoe-only',
    ...(req?.status === 'pending' ? { disabled: '' } : {}),
    title: 'Take a new shot of the source page at every width; every earlier shot is kept',
    onclick: async (e) => {
      e.target.disabled = true;
      const { page } = state;
      const r = await requestShot(page);
      if (state.page !== page) return;
      if (r.error) {
        e.target.disabled = false;
        $('.rv-shot-msg').textContent = r.error;
        return;
      }
      shots.data = { ...shots.data, request: r.request };
      renderShotBox();
      shotHooks.wait(page, shots.data.versions.length);
    },
  }, req?.status === 'failed' ? 'Ask again' : 'Refresh source shot');
  box.replaceChildren(...[
    n ? pick : el('p', { class: 'rv-none' }, REVIEW.pages.scope
      ? 'No source shot of this page yet: the backend takes the first one within 15 minutes of the page being published (with its source in the migration scope table).'
      : 'No shot history for this page yet: the source shown is the first shot kept with the tool (no Refresh until the first shots are in the history).'),
    n ? el('p', { class: 'rv-shot-info' }, `Taken ${when(shown.captured)} of `, el('a', { href: shown.url, target: '_blank', rel: 'noopener' }, shown.url.replace(/^https:\/\//, '')), `. ${n > 1 ? `${n} shots` : 'One shot'} so far, all kept with the date taken and a fingerprint (SHA-256) of every image.`) : null,
    reqText ? el('p', { class: `rv-shot-req rv-shot-${req.status}` }, reqText) : null,
    changesText(data.changes) ? el('p', { class: 'rv-shot-changes' }, changesText(data.changes)) : null,
    n ? refresh : null,
    el('p', { class: 'rv-shot-msg', 'aria-live': 'polite' }),
  ].filter(Boolean));
}

/** the page's shot history (read once per page) */
async function shotHistory() {
  const { page } = state;
  if (shots.page !== page) {
    shots.page = page;
    shots.data = null;
    shots.full = new Map();
    shots.chosen = null;
    const data = await loadShots(page);
    if (state.page !== page) return null;
    shots.data = data;
    renderShotBox();
  }
  return shots.data;
}

/** the version shown (the chosen one, else the newest) with its anchors, or null */
async function shownVersion() {
  const { page } = state;
  const data = await shotHistory();
  if (!data || !data.versions.length || state.page !== page) return null;
  const newest = data.versions[data.versions.length - 1];
  const v = data.versions.find((x) => x.id === shots.chosen) || newest;
  if (!Object.values(v.widths).some((s) => typeof s.leaves === 'number')) return v;
  if (!shots.full.has(v.id)) {
    const full = await loadVersion(page, v.id);
    if (!full) return v;
    shots.full.set(v.id, full);
  }
  return shots.full.get(v.id);
}

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
  const version = await shownVersion();
  if (version) {
    // a shot of the page's history (the backend): its folder, the first shots at the old place
    const s = version.widths[state.vp];
    meta = s ? {
      ...s,
      url: version.url,
      dir: version.dir,
      captured: s.captured,
      store: version.store,
      id: version.id,
    } : null;
  } else if (!shots.data?.versions.length) {
    try {
      // no history (no backend): the first shots' facts, committed with the tool
      const resp = await fetch(`./snapshot-meta${state.page}.json`);
      if (resp.ok) meta = (await resp.json())[state.vp] || null;
    } catch (e) {
      meta = null;
    }
  }
  if (`${state.page}|${state.vp}` !== want) return;
  none.hidden = !!meta;
  if (!meta) {
    panes.src.querySelector('.rv-tag').textContent = 'Screenshot: none yet';
    return;
  }
  snapshot = meta;
  SOURCE[state.page] = meta.url;
  const liveLink = [...document.querySelectorAll('.rv-links a')].find((a) => a.textContent === 'Live stryker.com page');
  if (liveLink) liveLink.href = meta.url;
  $('.rv-open-link[data-open="src"]').href = meta.url;
  pageEl.style.height = `${meta.height}px`;
  // (newer shots only in Document Authoring: through the preview, also on the workspace)
  const tilesAt = meta.dir ? `${REVIEW.snapshots.preview}${state.page}${meta.dir}` : `${SNAPSHOTS}${state.page}`;
  // (shots taken by the backend: in its own storage, through its tile action)
  const tileSrc = (file) => (meta.store === 'files'
    ? `${REVIEW.backend}/tile?${new URLSearchParams({
      space: REVIEW.space, page: state.page, version: meta.id, vp: String(state.vp), file,
    })}`
    : `${tilesAt}/${state.vp}/${file}`);
  meta.tiles.forEach((t) => pageEl.append(el('img', {
    src: tileSrc(t.file),
    alt: '',
    loading: 'lazy',
    width: String(meta.width),
    height: String(t.h),
    style: `top: ${t.y}px`,
  })));
  const day = new Date(meta.captured).toLocaleDateString([], { dateStyle: 'medium' });
  const older = version && shots.data.versions[shots.data.versions.length - 1].id !== version.id;
  panes.src.querySelector('.rv-tag').textContent = `Screenshot (stryker.com, ${day})${older ? ', an earlier one' : ''}`;
  scroller.scrollTop = 0;
  ready.src = true;
  rebuildAnchors();
  syncFrom('std');
  // (its notes' pins)
  notes.render();
}

shotHooks.reload = loadSnapshot;

/**
 * the real stryker.com page (Compare with: Live, the review extension): the page's source, loaded
 * when Live is shown; its bridge then says where its texts and images are (message listener)
 */
function loadReal() {
  if (!HAS_REAL || state.cmp !== 'real' || !state.page) return;
  const url = SOURCE[state.page] || allPages.find((p) => p.path === state.page)?.source;
  if (!url || url === real.url) return;
  real.url = url;
  real.leaves = [];
  real.synced = false;
  ready.real = false;
  panes.real.querySelector('.rv-tag').textContent = 'Live stryker.com: loading…';
  frames.real.src = url;
}

/**
 * the live copy of the source page, when Live is the comparison: rendered by the backend at the
 * current width (stryker.com builds some parts with its scripts per width), kept there 10
 * minutes; fresh: render again now
 */
async function loadLive(fresh = false) {
  if (!REVIEW.compare.includes('live') || state.cmp !== 'live' || !state.page) return;
  const key = `${state.page}|${state.vp}`;
  if (!fresh && live.key === key) return;
  live.key = key;
  ready.live = false;
  const msg = panes.live.querySelector('.rv-live-msg');
  const tag = panes.live.querySelector('.rv-tag');
  const again = panes.live.querySelector('.rv-live-again');
  // the backdrop: over the page shown before, until the new copy is there
  const width = REVIEW.widths.find((w) => w.vp === state.vp)?.label || `${state.vp} px`;
  msg.classList.remove('rv-live-error');
  msg.replaceChildren(
    el('span', { class: 'rv-live-spinner', 'aria-hidden': 'true' }),
    el('strong', {}, 'Rendering the live stryker.com page'),
    el('span', {}, `${width} width · a few seconds`),
  );
  msg.hidden = false;
  again.hidden = true;
  tag.textContent = 'Render of stryker.com: rendering…';
  const q = new URLSearchParams({
    page: state.page, vp: String(state.vp), ...(SOURCE[state.page] ? { source: SOURCE[state.page] } : {}), ...(fresh ? { fresh: '1' } : {}),
  });
  const { status, body } = await call(`live?${q}`).catch(() => ({ status: 0, body: null }));
  if (live.key !== key) return;
  again.hidden = false;
  if (status !== 200 || !body?.html) {
    msg.classList.add('rv-live-error');
    msg.replaceChildren(
      el('strong', {}, 'No live copy'),
      el('span', {}, body?.error?.message || 'The review backend did not answer.'),
    );
    tag.textContent = 'Render of stryker.com';
    return;
  }
  if (live.url) URL.revokeObjectURL(live.url);
  live.url = URL.createObjectURL(new Blob([body.html], { type: 'text/html' }));
  // (the backdrop goes once the new copy has loaded in the frame)
  frames.live.addEventListener('load', () => {
    if (live.key === key) msg.hidden = true;
  }, { once: true });
  frames.live.src = live.url;
  // the other widths, made in the background now: switching widths is then instant
  if (!live.prefetched.has(state.page)) {
    live.prefetched.add(state.page);
    const { page } = state;
    REVIEW.widths.map((w) => w.vp).filter((vp) => vp !== state.vp)
      .reduce((chain, vp) => chain.then(() => call(`live?${new URLSearchParams({
        page, vp: String(vp), ...(SOURCE[page] ? { source: SOURCE[page] } : {}),
      })}`).catch(() => null)), Promise.resolve());
  }
  const at = new Date(body.at).toLocaleTimeString([], { timeStyle: 'short' });
  tag.textContent = `Render of stryker.com, ${at}${body.cached ? '' : ' (now)'}`;
}
// after a Refresh: the backend takes the shot within minutes; look every 20 s for 8 minutes
shotHooks.wait = (page, had) => {
  let tries = 0;
  const look = async () => {
    tries += 1;
    if (state.page !== page || tries > 24) return;
    const data = await loadShots(page);
    if (state.page !== page) return;
    if (data && (data.versions.length > had || data.request?.status === 'failed')) {
      shots.data = data;
      shots.chosen = null;
      renderShotBox();
      loadSnapshot();
      return;
    }
    window.setTimeout(look, 20000);
  };
  window.setTimeout(look, 20000);
};

/**
 * entries saved under a block key → the block's position now (a key not on the page any more:
 * its content changed; left out here, the summary lists it for a re-check)
 */
function positioned(m, keys) {
  return new Map([...m].map(([k, e]) => {
    const at = k.lastIndexOf('|');
    const pos = toPosition(k.slice(0, at), keys);
    return pos ? [`${pos}|${k.slice(at + 1)}`, { ...e, item: pos }] : null;
  }).filter(Boolean));
}

/** the block keys of a page's document */
const keysOf = (page) => fetch(`${BASE}${page}.plain.html`)
  .then((r) => (r.ok ? r.text() : ''))
  .then((html) => keysOfHtml(html))
  .catch(() => ({ byId: {}, byKey: {} }));
// the page of the address: its saved reviews and its document, asked for at once (25 Nov 2026)
let early = null;

function loadPage() {
  if (!state.page) return;
  ready.std = false;
  ready.rs = false;
  anchors = [];
  // (?review loads the design switcher in the standard page)
  frames.std.src = `${BASE}${state.page}${PANEL ? '?review=1' : ''}`;
  if (REVIEW.compare.includes('rs')) frames.rs.src = `${CONTENT}/rs${state.page}`;
  const i = pages.findIndex((p) => p.path === state.page);
  const page = pages[i];
  picker?.update();
  $('.rv-count').textContent = i >= 0 ? `${i + 1} / ${pages.length}` : `– / ${pages.length}`;
  $('.rv-batch-badge').textContent = orgLabel(orgOf.get(state.page));
  document.title = `Review: ${page ? page.title : state.page}`;
  $('.rv-open-link[data-open="eds"]').href = `${BASE}${state.page}`;
  // (the source: from the shot, else the scope's row)
  if (!SOURCE[state.page] && page?.source) SOURCE[state.page] = page.source;
  $('.rv-open-link[data-open="src"]').href = SOURCE[state.page] || 'https://www.stryker.com/';
  $('.rv-links').replaceChildren(...[
    el('li', {}, el('a', { href: `${BASE}${state.page}`, target: '_blank', rel: 'noopener' }, `${BASE_LABEL} page`)),
    REVIEW.compare.includes('rs') ? el('li', {}, el('a', { href: `${CONTENT}/rs${state.page}`, target: '_blank', rel: 'noopener' }, 'As-is page')) : null,
    el('li', {}, el('a', { href: SOURCE[state.page] || 'https://www.stryker.com/', target: '_blank', rel: 'noopener' }, 'Live stryker.com page')),
    el('li', {}, el('a', { href: './status.html', target: '_blank', rel: 'noopener' }, 'Review status of every page')),
    el('li', {}, el('a', { href: './summary.html', target: '_blank', rel: 'noopener' }, 'Review summary')),
    // (the AOE team's: editing needs Document Authoring rights anyway)
    editUrl(state.page) ? el('li', { class: 'rv-aoe-only' }, el('a', { href: editUrl(state.page), target: '_blank', rel: 'noopener' }, 'Edit in Document Authoring')) : null,
    el('li', { class: 'rv-aoe-only' }, el('a', { href: './invites.html', target: '_blank', rel: 'noopener' }, 'Invitations: make and revoke')),
  ].filter(Boolean));
  if (PANEL) $('.rv-blocks').replaceChildren(el('li', { class: 'rv-none' }, 'Loading…'));
  $('.rv-pagebox-body').replaceChildren(el('p', { class: 'rv-none' }, 'Loading the saved reviews…'));
  const loading = state.page;
  saved = new Map();
  drafts = draftsOf(loading);
  renderStatus();
  closeEditor();
  notes.setNotes([]);
  loadSnapshot();
  // (a new page: its live copy when Live is the comparison)
  live.key = '';
  loadLive();
  real.url = '';
  loadReal();
  pageKeys = { byId: {}, byKey: {} };
  // (the page of the address was asked for at the start, with the page list)
  const pre = early && early.page === loading ? early : null;
  early = null;
  const keysLoad = pre ? pre.keys : keysOf(loading);
  savedLoad = Promise.all([pre ? pre.saved : store.load(loading), keysLoad]).then(([m, keys]) => {
    if (state.page !== loading) return;
    pageKeys = keys;
    saved = positioned(m, keys);
    renderPageBox();
    notes.setNotes(savedNotes());
    renderNotes();
    // changes of this page kept in the browser and not sent (the tab closed at once): sent now,
    // with the name from the link
    if (drafts.size) {
      store.identity.then(() => {
        if (state.page === loading && saveAll()) threadHooks.redraw();
      });
    }
  });
  writeUrl();
}

/** what the page's entries say, to tell whether a refresh brought anything new */
const stampOf = (m) => [...m].map(([k, e]) => `${k}=${e.time}=${JSON.stringify(e.value)}`).sort().join('|');

/**
 * the open page's entries read again (live.js, every 15 s while the tab is visible): drawn again
 * only when something changed; not while changes of this viewer are on their way, a dialog is
 * open or a chat's status field is in use
 */
async function refreshSaved() {
  const { page } = state;
  const active = document.activeElement;
  if (!page || drafts.size || store.busy() || document.querySelector('dialog[open]')) return;
  if (active?.closest?.('.rv-composer') && !active.classList.contains('rv-reply')) return;
  await savedLoad;
  const next = positioned(await store.load(page), pageKeys);
  if (state.page !== page || stampOf(next) === stampOf(saved)) return;
  saved = next;
  threadHooks.redraw();
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
  // (the live copy is a finished page: nothing loads in it)
  if (side === 'live') return Promise.resolve();
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
  // (the live frame before its first copy is an empty page)
  if (side === 'live' && !live.url) return;
  await whenReady(side);
  const style = d.createElement('style');
  style.textContent = '.rv-hl { outline: 3px solid #ffb500 !important; outline-offset: 2px; }';
  d.head.append(style);
  win(side).addEventListener('scroll', () => {
    if (Date.now() < quietUntil[side]) return;
    window.requestAnimationFrame(() => syncFrom(side));
  }, { passive: true });
  d.addEventListener('keydown', frameKeys);
  // the live copy's links: the real page, in a new tab (the copy itself can't navigate)
  if (side === 'live') {
    d.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      e.preventDefault();
      if (a && /^https?:/.test(a.href)) window.open(a.href, '_blank', 'noopener');
    });
  }
  new ResizeObserver(scheduleRebuild).observe(d.body);
  ready[side] = true;
  rebuildAnchors();
  // late content (fragments, lazy images) moves things: rebuild once more
  window.setTimeout(rebuildAnchors, 2500);
  if (side !== 'std') return;
  notes.attach();
  // (its pins' size: set by the layout, now that the frame has its page)
  layout();
  setNoteMode(notes.adding);
  if (PANEL) $('.rv-blocks').replaceChildren(el('li', { class: 'rv-none' }, 'Preparing the variants…'));
  const review = PANEL ? await whenSwitcher() : null;
  if (review) {
    d.addEventListener('std-review-change', () => {
      scheduleRebuild();
      listBlocks();
      notes.render();
    });
    await applySaved(review);
  }
  listBlocks();
  // opened from the results at a note (?note=<id>): show its pin, once
  const wanted = params.get('note');
  if (wanted && !noteShown) {
    noteShown = true;
    await savedLoad;
    window.setTimeout(() => noteHooks.select(wanted), 600);
  }
  // opened from the AOE summary at a block (?block=s1b0) or a text section (?section=s3): once
  // (links from the summary may name a block or section by its key: known once the page loaded)
  if (params.get('block') || params.get('section')) await savedLoad;
  const block = params.get('block') && toPosition(params.get('block'), pageKeys);
  const section = params.get('section') && toPosition(params.get('section'), pageKeys);
  if (review && (block || section) && !targetShown) {
    targetShown = true;
    const on = (v) => (block ? review.highlight(block, v) : review.highlightSection(section, v));
    // the page may still settle (late blocks, the first sync) and move back: scroll again until
    // the target stays near the top, at most a few times
    const show = (tries) => {
      if (block) review.reveal(block);
      else review.revealSection(section);
      window.setTimeout(() => {
        const target = d.querySelector('.rv-hl');
        const top = target ? target.getBoundingClientRect().top : 0;
        if ((top < 0 || top > win('std').innerHeight / 2) && tries > 1) show(tries - 1);
        else window.setTimeout(() => on(false), 2500);
      }, 1500);
    };
    window.setTimeout(() => {
      on(true);
      show(4);
    }, 600);
  }
}

/* ---------- start ---------- */

/** the filter button's icon (a funnel) */
function funnelIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'rv-funnel');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'M3 5h18l-7 8v6l-4 2v-8z');
  svg.append(path);
  return svg;
}

/** a page with its status and latest activity (the overview) */
const withInfo = (p) => {
  const i = infoOf.get(p.path);
  return { ...p, state: i?.state || 'unreviewed', last: i?.last || null };
};

/** what the filters show, in words ('' for none) */
function filterWords(f = getFilters()) {
  return [
    f.search.trim() ? `"${f.search.trim()}"` : '',
    f.states.length ? f.states.map(stateName).join(', ') : '',
    f.template ? `template ${f.template}` : '',
    f.batches.length ? f.batches.map((b) => (b === 'none' ? 'no batch' : `batch ${b}`)).join(', ') : '',
    f.group === 'none' ? 'no group' : (f.group && `group ${f.group}`) || '',
    f.reps ? 'representatives' : '',
    f.area ? areaLabel(f.area) : '',
  ].filter(Boolean).join(' · ');
}

/**
 * the pages the filters let through, in the chosen order (the same filters as the status page,
 * batches.js), the picker's list and the filter button
 */
function applyFilters() {
  const f = getFilters();
  const through = allPages.map(withInfo).filter((p) => matches(p, orgOf.get(p.path), f));
  pages = sortPages(through, f.order, me.role);
  const n = filtersSet(f);
  const summary = $('.rv-filter summary');
  summary.replaceChildren(funnelIcon(), 'Filter', n ? el('span', { class: 'rv-filter-n' }, String(n)) : '');
  summary.classList.toggle('rv-filter-on', n > 0);
  summary.title = n ? `Showing: ${filterWords(f)} (${ORDERS[f.order]})` : `All pages (${ORDERS[f.order]}): filter them`;
  const i = pages.findIndex((p) => p.path === state.page);
  $('.rv-count').textContent = i >= 0 ? `${i + 1} / ${pages.length}` : `– / ${pages.length}`;
  $('.rv-count').title = i >= 0 ? 'Where this page is in the list the filters show' : 'This page is not among the pages the filters show';
  picker?.update();
}

/**
 * the filter popover: the same filters as the status page (batches.js, shared with it): a search,
 * states, template, batches, group, representatives only, area, and the order; Clear all
 */
function filterPanel() {
  const f = getFilters();
  const set = (change) => {
    setFilters(change);
    applyFilters();
  };
  const numbers = [...new Set(allPages.map((p) => orgOf.get(p.path)?.batch).filter(Boolean))]
    .sort((a, b) => a - b);
  const count = (b) => allPages.filter((p) => (orgOf.get(p.path)?.batch || 'none') === b).length;
  const box = (b, text) => el('label', { class: 'rv-check' }, el('input', {
    type: 'checkbox',
    ...(f.batches.includes(b) ? { checked: '' } : {}),
    onchange: (e) => {
      const now = getFilters();
      set({ batches: e.target.checked ? [...now.batches, b] : now.batches.filter((x) => x !== b) });
    },
  }), text);
  const select = (name, value, choices, onchange) => {
    const sel = el('select', { 'aria-label': name, onchange: (e) => onchange(e.target.value) }, ...choices.map(([v, t]) => el('option', { value: v }, t)));
    sel.value = value;
    return sel;
  };
  const areas = [...new Set(allPages.map((p) => areaOf(p.path)))].sort();
  const templates = [...new Set(allPages.map((p) => p.template).filter(Boolean))].sort();
  const groups = [...new Set(allPages.map((p) => orgOf.get(p.path)?.group).filter(Boolean))]
    .sort((a, b) => a - b);
  const inGroup = (g) => allPages.filter((p) => orgOf.get(p.path)?.group === g).length;
  const stateCount = (st) => allPages.filter((p) => withInfo(p).state === st).length;
  const search = el('input', {
    type: 'search', class: 'rv-filter-search', placeholder: 'Words of the title or path', 'aria-label': 'Search', value: f.search,
  });
  search.addEventListener('input', () => set({ search: search.value }));
  const states = STATE_ORDER[me.role === 'aoe' ? 'aoe' : 'reviewer'].filter((st) => st !== 'unpublished')
    .map((st) => el('label', { class: 'rv-check rv-filter-state' }, el('input', {
      type: 'checkbox',
      ...(f.states.includes(st) ? { checked: '' } : {}),
      onchange: (e) => {
        const now = getFilters().states.filter((x) => x !== st);
        set({ states: e.target.checked ? [...now, st] : now });
      },
    }), el('span', { class: `rv-dot st-${st}` }), `${stateName(st)} (${stateCount(st)})`));
  $('.rv-filter-body').replaceChildren(...[
    el('div', { class: 'rv-filter-top' }, el('b', {}, filtersSet(f) ? `Filtered: ${filtersSet(f)}` : 'No filter'), el('button', {
      type: 'button',
      class: 'rv-btn-light rv-filter-clear',
      ...(filtersSet(f) ? {} : { disabled: '' }),
      title: 'Every filter off (the order stays); the status page\'s filters are the same',
      onclick: () => {
        clearFilters();
        applyFilters();
        filterPanel();
      },
    }, 'Clear all filters')),
    el('p', { class: 'rv-filter-note' }, 'The same filters as on the status page: a change here shows there too.'),
    el('p', { class: 'rv-filter-head' }, 'Search'),
    search,
    el('p', { class: 'rv-filter-head' }, 'Order'),
    select('Order', f.order, Object.entries(ORDERS), (v) => set({ order: v })),
    el('p', { class: 'rv-filter-head' }, 'Status (none ticked: all)'),
    el('div', { class: 'rv-filter-states' }, ...states),
    templates.length ? el('p', { class: 'rv-filter-head' }, 'Template') : null,
    templates.length ? select('Template', f.template, [['', 'All templates'], ...templates.map((t) => [t, t])], (v) => set({ template: v })) : null,
    el('p', { class: 'rv-filter-head' }, 'Area'),
    select('Area', f.area, [['', 'All areas'], ...areas.map((a) => [a, areaLabel(a)])], (v) => set({ area: v })),
    el('p', { class: 'rv-filter-head' }, 'Batches (none ticked: all)'),
    ...numbers.map((b) => box(b, `Batch ${b} (${count(b)})`)),
    count('none') && numbers.length ? box('none', `No batch (${count('none')})`) : null,
    numbers.length ? null : el('p', { class: 'rv-none' }, 'No batches yet.'),
    el('p', { class: 'rv-filter-head' }, 'Group'),
    select('Group', String(f.group), [['', 'All groups'], ...groups.map((g) => [String(g), `Group ${g} (${inGroup(g)})`]), ['none', 'In no group']], (v) => set({ group: v === '' || v === 'none' ? v : Number(v) })),
    el('label', { class: 'rv-check' }, el('input', {
      type: 'checkbox',
      ...(f.reps ? { checked: '' } : {}),
      onchange: (e) => set({ reps: e.target.checked }),
    }), 'Representative pages only'),
  ].filter(Boolean));
}

/** the toolbar and the panels of this review (config.js) */
function setUpShell() {
  document.title = REVIEW.title;
  // the batch / area filter by the page picker, the page's batch by its status badge
  const filter = el(
    'details',
    { class: 'rv-filter' },
    el('summary', { title: 'Filter and order the pages (the same filters as the status page)' }, funnelIcon(), 'Filter'),
    el('div', { class: 'rv-filter-body' }),
  );
  filter.addEventListener('toggle', () => {
    if (filter.open) filterPanel();
  });
  $('.rv-count').after(filter);
  // the page's two pages in a new tab, by the page box (the panel's links scroll away)
  $('.rv-page-badge').after(el(
    'span',
    { class: 'rv-open', role: 'group', 'aria-label': 'Open in a new tab' },
    el('a', {
      class: 'rv-open-link', 'data-open': 'eds', target: '_blank', rel: 'noopener', title: `The ${BASE_WORD} page (EDS) in a new tab`,
    }, 'EDS ↗'),
    el('a', {
      class: 'rv-open-link', 'data-open': 'src', target: '_blank', rel: 'noopener', title: 'The stryker.com page in a new tab',
    }, 'Source ↗'),
  ));
  $('.rv-page-badge').after(el('span', { class: 'rv-batch-badge', 'aria-live': 'polite' }));
  // the page picker: the page's title and short path; its list right below it (picker.js)
  picker = mountPicker($('.rv-pick-box'), {
    list: () => pages.map((p) => ({ ...p, stateLabel: stateName(p.state) })),
    total: () => allPages.length,
    paths: () => allPages.map((p) => p.path),
    current: () => state.page,
    find: (path) => allPages.find((p) => p.path === path),
    go: (path) => leavePage().then(() => {
      state.page = path;
      loadPage();
    }),
    filters: () => filterWords(),
    clear: () => {
      clearFilters();
      applyFilters();
    },
    extra: (p) => orgLabel(orgOf.get(p.path)),
  });
  // the widths
  const widths = $('[aria-label="Viewport"]');
  widths.replaceChildren(...REVIEW.widths.map((w) => el('button', {
    type: 'button', class: 'rv-btn', 'data-vp': String(w.vp), title: `${w.label}, ${w.vp} px wide`,
  }, w.label)));
  // the compare options: only this review's (one alone stays, as what the page is compared with)
  document.querySelectorAll('[data-cmp]').forEach((b) => {
    if (!REVIEW.compare.includes(b.dataset.cmp) && !(b.dataset.cmp === 'real' && HAS_REAL)) b.remove();
  });
  if (!REVIEW.compare.includes('rs')) panes.rs.remove();
  if (!REVIEW.compare.includes('live')) panes.live.remove();
  if (!HAS_REAL) panes.real.remove();
  panes.std.querySelector('.rv-tag').textContent = BASE_LABEL;
  panes.std.querySelector('iframe').title = `${BASE_LABEL} page`;
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.title = b.title.replace(/the standard page/g, `the ${BASE_WORD} page`);
  });
  $('[data-action="note"]').title = `Then click the spot on the ${BASE_WORD} page (N; Esc to stop)`;
  // the source shot box (its history, Refresh), in the feedback panel
  $('.rv-panel-right .rv-panel-body').append(el('section', { class: 'rv-shotbox' }, el('h3', {}, 'Source shot'), el('div', { class: 'rv-shotbox-body' })));
  // no design panel: its links go to the feedback panel
  if (!PANEL) {
    const links = $('.rv-links');
    $('.rv-panel-right .rv-panel-body').append(el('section', { class: 'rv-linksbox' }, el('h3', {}, 'Open in a new tab'), links));
    $('.rv-panel-left').remove();
  }
}

/**
 * the AOE team's Extension button (the pilot): what the review extension does, whether it is
 * installed here (or a newer one is out), how to install it, the download; under the button
 */
function setUpExtensionButton() {
  const body = el('div', { class: 'rv-ext-body' });
  const box = el(
    'details',
    { class: 'rv-ext', hidden: '' },
    el('summary', { title: 'The review extension (pilot): the real stryker.com page here' }, '⬇ Extension'),
    body,
  );
  const draw = async () => {
    const offer = await latest();
    const s = stateText(installed(), offer);
    box.querySelector('summary').classList.toggle('rv-ext-update', s.state === 'update');
    body.replaceChildren(
      el('p', { class: 'rv-filter-head' }, 'Live stryker.com: the review extension (pilot)'),
      el('p', { class: 'rv-ext-about' }, ABOUT),
      el('p', { class: `rv-ext-state rv-ext-${s.state}` }, s.text),
      downloadButton('rv-ext-download'),
      el('p', { class: 'rv-filter-head' }, 'Install it'),
      steps(),
      el('p', { class: 'rv-ext-note' }, NOTE),
    );
  };
  box.addEventListener('toggle', () => {
    if (box.open) draw();
  });
  // (closes on a click elsewhere or Esc)
  document.addEventListener('mousedown', (e) => {
    if (box.open && !box.contains(e.target)) box.open = false;
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') box.open = false;
  });
  $('[aria-label="Compare with"]').after(box);
  // (an update out: the button says so, before it is opened)
  latest().then((offer) => {
    if (stateText(installed(), offer).state === 'update') box.querySelector('summary').classList.add('rv-ext-update');
  });
  return box;
}
let extensionButton = null;

async function start() {
  setUpShell();
  // the two panels fold to a strip (kept per browser); the page view takes the space
  document.querySelectorAll('.rv-collapse').forEach((button) => {
    const panel = button.closest('.rv-panel');
    const key = storageKey(`panel-${button.dataset.panel}`);
    const fold = (folded) => {
      panel.classList.toggle('rv-collapsed', folded);
      button.setAttribute('aria-expanded', String(!folded));
      button.textContent = (button.dataset.panel === 'left') === folded ? '›' : '‹';
      button.title = folded ? 'Show this panel' : 'Hide this panel';
      window.localStorage.setItem(key, folded ? '1' : '');
      layout();
    };
    fold(window.localStorage.getItem(key) === '1');
    button.addEventListener('click', () => fold(!panel.classList.contains('rv-collapsed')));
  });
  // the right panel's width: drag its left edge (kept per browser)
  const rightPanel = $('.rv-panel-right');
  const WIDTH_KEY = storageKey('panel-right-width');
  const keptWidth = Number(window.localStorage.getItem(WIDTH_KEY));
  if (keptWidth) rightPanel.style.setProperty('--rv-panel-right', `${keptWidth}px`);
  $('.rv-resize').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    document.body.classList.add('rv-resizing');
    let { width } = rightPanel.getBoundingClientRect();
    const move = (ev) => {
      // (between 260 px and what leaves the page view 480 px)
      const most = Math.max(260, window.innerWidth - 480);
      width = Math.round(Math.min(Math.max(window.innerWidth - ev.clientX, 260), most));
      rightPanel.style.setProperty('--rv-panel-right', `${width}px`);
      layout();
    };
    const up = () => {
      document.body.classList.remove('rv-resizing');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.localStorage.setItem(WIDTH_KEY, String(width));
      layout();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  // a new message redraws the panels that show chats; the panels keep their place, and a message
  // box being typed in keeps its focus and cursor (its text: kept in the browser, `typing`)
  threadHooks.redraw = () => {
    const right = $('.rv-panel-right');
    const top = right.scrollTop;
    const active = document.activeElement;
    const chat = active?.classList?.contains('rv-reply') ? active.closest('[data-chat]')?.dataset.chat : null;
    const at = chat ? [active.selectionStart, active.selectionEnd] : null;
    listBlocks();
    renderPageBox();
    notes.setNotes(savedNotes());
    renderNotes();
    right.scrollTop = top;
    settleChats();
    sendingHooks.update();
    if (chat) {
      const area = document.querySelector(`[data-chat="${CSS.escape(chat)}"] textarea.rv-reply`);
      if (area) {
        area.focus();
        area.setSelectionRange(...at);
      }
    }
  };
  statusHooks.render = renderPageStatus;
  if (!PREVIEW) {
    $('.rv-blocked').hidden = false;
    return;
  }
  Object.keys(frames).forEach((side) => {
    if (side === 'std' || REVIEW.compare.includes(side)) frames[side].addEventListener('load', () => onFrameLoad(side));
  });
  // (the page of the address: its reviews and document asked for now, not after the page list)
  if (state.page) {
    early = { page: state.page, saved: store.load(state.page), keys: keysOf(state.page) };
  }
  allPages = await loadPages();
  // (the first page of a group without a chosen representative: among the pages shown)
  const organisation = await loadOrganisation(allPages.map((p) => p.path));
  orgOf = organisation.org;
  infoOf = new Map((organisation.body?.pages || []).map((p) => [p.page, p]));
  applyFilters();
  // (the status page changed the filters, in another tab)
  onFiltersChange(() => {
    applyFilters();
    if ($('.rv-filter').open) filterPanel();
  });
  if (PANEL) {
    const groupsResp = await fetch('./groups.json');
    GROUPS = groupsResp.ok ? (await groupsResp.json()).groups : {};
  }
  if (!state.page && pages.length) state.page = pages[0].path;

  document.querySelectorAll('[data-action="prev"], [data-action="next"]').forEach((b) => b.addEventListener('click', () => step(b.dataset.action === 'prev' ? -1 : 1)));
  $('[data-action="note"]').addEventListener('click', () => setNoteMode(!notes.adding));
  document.querySelectorAll('[data-vp]').forEach((b) => b.addEventListener('click', () => {
    if (state.vp === Number(b.dataset.vp)) return;
    state.vp = Number(b.dataset.vp);
    layout();
    scheduleRebuild();
    loadSnapshot();
    loadLive();
  }));
  document.querySelectorAll('[data-cmp]').forEach((b) => b.addEventListener('click', () => {
    state.cmp = b.dataset.cmp;
    layout();
    rebuildAnchors();
    syncFrom('std');
    loadLive();
    loadReal();
  }));
  // the real page's bridge (the review extension): where its texts and images are, its scrolling
  window.addEventListener('message', (e) => {
    if (!HAS_REAL || e.origin !== REAL_ORIGIN || !e.data?.reviewLive) return;
    if (e.source !== frames.real.contentWindow) return;
    const m = e.data;
    real.y = Number(m.y) || 0;
    real.h = Number(m.h) || real.h;
    if (m.type === 'leaves') {
      real.leaves = Array.isArray(m.leaves) ? m.leaves : [];
      real.at = m.url || '';
      ready.real = true;
      const elsewhere = real.url && real.at && real.at.split('#')[0] !== real.url.split('#')[0];
      panes.real.querySelector('.rv-tag').textContent = elsewhere ? 'Live stryker.com: another page (clicked through)' : 'Live stryker.com';
      rebuildAnchors();
      if (!real.synced) {
        real.synced = true;
        syncFrom('std');
      }
    } else if (m.type === 'scroll' && Date.now() >= quietUntil.real) {
      window.requestAnimationFrame(() => syncFrom('real'));
    }
  });
  frames.real?.addEventListener('load', () => {
    frames.real.contentWindow?.postMessage({ reviewLive: true, type: 'hello' }, REAL_ORIGIN);
  });
  panes.live?.querySelector('.rv-live-again').addEventListener('click', () => loadLive(true));
  extensionButton = setUpExtensionButton();
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
  // with the review backend the name is the one of the review link, not typed
  store.identity?.then((who) => {
    if (!who) return;
    me.name = who.name;
    me.role = who.role || 'reviewer';
    helpHooks.setRole(me.role, who.name);
    // (the order "what waits for me first" depends on the side)
    if (allPages.length) applyFilters();
    // (the extension pilot: the AOE team's)
    if (extensionButton) extensionButton.hidden = me.role !== 'aoe';
    document.body.classList.toggle('rv-role-aoe', me.role === 'aoe');
    threadHooks.redraw();
    name.value = me.role === 'aoe' ? `${who.name} (AOE)` : who.name;
    name.readOnly = true;
    name.title = `From your review link${who.expires ? `, valid until ${when(who.expires)}` : ''}`;
    $('.rv-name').classList.remove('rv-need');
  });
  window.addEventListener('beforeunload', (e) => {
    // changes still on their way to the review service
    window.clearTimeout(flushing);
    if (drafts.size) saveAll();
    if (!drafts.size && !store.busy()) return;
    e.preventDefault();
    e.returnValue = '';
  });
  $('.rv-retry').addEventListener('click', () => store.retry());
  // each message's sending state, in place
  sendingHooks.update = () => {
    document.querySelectorAll('[data-sending]').forEach((span) => {
      const [item, kind] = splitKey(span.dataset.sending);
      const st = sendingOf(item, kind);
      span.textContent = { sending: 'sending…', failed: 'not sent: Retry above' }[st] || '';
      span.className = `rv-msg-state${st ? ` rv-msg-${st}` : ''}`;
    });
  };
  document.addEventListener('keydown', frameKeys);
  window.addEventListener('resize', () => {
    layout();
    scheduleRebuild();
  });
  layout();
  loadPage();
  // the open page kept up to date (live.js)
  keepFresh(refreshSaved);
  Object.assign(helpHooks, mountBar('review', $('.rv-appbar')));
  if (me.name) helpHooks.setRole(me.role, me.name);
}

start();
