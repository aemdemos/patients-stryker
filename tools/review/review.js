/*
 * Review tool shell: the standard page (/std) as the base, its as-is version (/rs) to compare,
 * desktop or phone width, flip / overlay / side by side, text-matched scroll sync, and the
 * page's blocks. Runs on preview hosts only (the branch preview, localhost); the frames are on
 * the same host, so the shell reads and scrolls them directly.
 * Next steps (see the plan): variant switcher, source snapshots, comments and QA notes, saving.
 */
import { leaves, buildAnchors, mapY } from './sync.js';
import { createStore } from './store.js';

const { hostname } = window.location;
// the workspace preview: the local dev server, also seen through the coder preview's address
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
// the workspace preview serves the imported documents under /content
const CONTENT = LOCAL ? '/content' : '';
const READY_TIMEOUT = 8000;
const NAME_KEY = 'std-review-reviewer';
const MODES = ['flip', 'opacity', 'side'];

const params = new URLSearchParams(window.location.search);
const state = {
  page: params.get('page') || '',
  vp: params.get('vp') === '375' ? 375 : 1440,
  mode: MODES.includes(params.get('mode')) ? params.get('mode') : 'flip',
  show: params.get('show') === 'rs' ? 'rs' : 'std',
  opacity: Number.isFinite(Number(params.get('op'))) && params.get('op') !== null ? Number(params.get('op')) : 50,
  sync: true,
};

const $ = (sel) => document.querySelector(sel);
const stage = $('.rv-stage');
const panes = { std: $('.rv-std'), rs: $('.rv-rs') };
const frames = { std: panes.std.querySelector('iframe'), rs: panes.rs.querySelector('iframe') };
const ready = { std: false, rs: false };
const quietUntil = { std: 0, rs: 0 };
let anchors = [];
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
  if (state.mode === 'flip' && state.show === 'rs') p.set('show', 'rs');
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
  Object.entries(panes).forEach(([key, pane]) => {
    const w = state.vp * scale;
    let left = (paneW - w) / 2;
    if (side && key === 'rs') left += paneW + gap;
    Object.assign(pane.style, { left: `${left}px`, width: `${w}px`, height: `${H}px` });
    Object.assign(frames[key].style, {
      width: `${state.vp}px`, height: `${H / scale}px`, transform: `scale(${scale})`,
    });
  });
  document.body.classList.remove(...MODES.map((m) => `mode-${m}`));
  document.body.classList.add(`mode-${state.mode}`);
  panes.std.classList.toggle('rv-hidden', state.mode === 'flip' && state.show === 'rs');
  panes.rs.classList.toggle('rv-hidden', state.mode === 'flip' && state.show === 'std');
  panes.rs.style.opacity = state.mode === 'opacity' ? state.opacity / 100 : '';
  panes.rs.style.zIndex = state.mode === 'flip' ? '' : '1';
  document.querySelectorAll('[data-vp]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.vp) === state.vp)));
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  $('.rv-opacity input').value = state.opacity;
  let showing = 'Standard and as-is';
  if (state.mode === 'flip') showing = state.show === 'std' ? 'Showing: standard (Space: as-is)' : 'Showing: as-is (Space: standard)';
  else if (state.mode === 'opacity') showing = `As-is over standard, ${state.opacity}%`;
  $('.rv-showing').textContent = showing;
  writeUrl();
}

/* ---------- sync ---------- */

const win = (side) => frames[side].contentWindow;
const doc = (side) => frames[side].contentDocument;

function rebuildAnchors() {
  if (!ready.std || !ready.rs) return;
  try {
    anchors = buildAnchors(leaves(doc('std')), leaves(doc('rs')));
  } catch (e) {
    anchors = [];
  }
}

function scheduleRebuild() {
  window.clearTimeout(rebuildTimer);
  rebuildTimer = window.setTimeout(rebuildAnchors, 400);
}

function syncFrom(from) {
  if (!state.sync || !ready.std || !ready.rs) return;
  const to = from === 'std' ? 'rs' : 'std';
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

const store = createStore((kind, text) => {
  const box = $('.rv-status');
  box.className = `rv-status rv-${kind}`;
  box.querySelector('.rv-status-text').textContent = text;
  box.querySelector('.rv-retry').hidden = kind !== 'failed';
});
// the page's saved state: `item|kind` → { value, reviewer, time }
let saved = new Map();
let savedLoad = Promise.resolve();
// changes made before a name was entered: saved once there is one
const waiting = [];
const reviewer = () => $('.rv-reviewer').value.trim();
const savedOf = (item, kind) => saved.get(`${item}|${kind}`);
const when = (t) => (t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');

function saveRow(item, kind, value) {
  if (!reviewer()) {
    waiting.push({ item, kind, value });
    $('.rv-name').classList.add('rv-need');
    $('.rv-reviewer').focus();
    $('.rv-status-text').textContent = 'Enter your name to save';
    return;
  }
  const entry = store.save({
    page: state.page, item, kind, value, reviewer: reviewer(),
  });
  saved.set(`${item}|${kind}`, entry);
}

/** a block choice: one row per changed property */
function keepChoice(id, patch) {
  Object.entries(patch).forEach(([kind, value]) => saveRow(id, kind, value));
}

function flushWaiting() {
  if (!reviewer()) return;
  $('.rv-name').classList.remove('rv-need');
  waiting.splice(0).forEach(({ item, kind, value }) => saveRow(item, kind, value));
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
  );
  $('.rv-blocks').replaceChildren(el('li', { class: 'rv-none' }, 'Loading…'));
  $('.rv-pagebox-body').replaceChildren(el('p', { class: 'rv-none' }, 'Loading the saved reviews…'));
  const loading = state.page;
  saved = new Map();
  savedLoad = store.load(loading).then((m) => {
    if (state.page !== loading) return;
    saved = m;
    renderPageBox();
  });
  writeUrl();
}

function step(delta) {
  const i = pages.findIndex((p) => p.path === state.page);
  const next = pages[Math.min(pages.length - 1, Math.max(0, i + delta))];
  if (next && next.path !== state.page) {
    state.page = next.path;
    loadPage();
  }
}

function frameKeys(e) {
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (e.code === 'Space' && state.mode === 'flip') {
    e.preventDefault();
    state.show = state.show === 'std' ? 'rs' : 'std';
    layout();
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
  $('.rv-blocks').replaceChildren(el('li', { class: 'rv-none' }, 'Preparing the variants…'));
  const review = await whenSwitcher();
  if (review) {
    d.addEventListener('std-review-change', () => {
      scheduleRebuild();
      listBlocks();
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
    if (hit) {
      state.page = hit.path;
      loadPage();
    }
  });
  document.querySelectorAll('[data-action]').forEach((b) => b.addEventListener('click', () => step(b.dataset.action === 'prev' ? -1 : 1)));
  document.querySelectorAll('[data-vp]').forEach((b) => b.addEventListener('click', () => {
    state.vp = Number(b.dataset.vp);
    layout();
    scheduleRebuild();
  }));
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
    flushWaiting();
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
