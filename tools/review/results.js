/*
 * Review results: where the customer review stands and what it decided, from every entry the
 * invitation may see (store.js readAll: the review backend, an invitation with the results right,
 * opened as results.html?invite=…). Progress (pages reviewed), design decisions (group choices
 * and their reach, the page choices with block type and design), comments, QA notes with links
 * to their pins; CSV downloads of the to-do lists. Test entries are hidden by default.
 */
import { readAll, merge, inviteToken } from './store.js';
import { keysOfHtml, toPosition } from './blockkeys.js';
import { threadState, threadKindOf, roleOf } from './threads.js';
import { REVIEW } from './config.js';
import loadPages from './pages.js';

// the designs a block's content fits and the group labels: only with the design panel
// (standard pages); loaded on first use
const GROUPS_MODULE = './groups.js';
let groupsLib = null;
const loadGroups = async () => {
  if (!groupsLib) {
    groupsLib = REVIEW.design ? await import(GROUPS_MODULE)
      : { variantsOf: () => ({ list: [], widths: [] }), groupLabel: (k) => k };
  }
  return groupsLib;
};

const { hostname } = window.location;
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
// the pages under review (config.js): the migrated pages at their final paths, or /std
const BASE = LOCAL ? REVIEW.base.localPrefix : REVIEW.base.prefix;
const TEST_REVIEWERS = /^(tool test( b)?|save-route test|browser test|screenshot)$/i;
const NAMES = {
  columns: 'Columns', 'cards-corp': 'Cards', 'hero-corp': 'Hero', video: 'Video', 'page-nav': 'Page Nav',
};
const CATEGORIES = {
  text: 'Text', layout: 'Layout', image: 'Image', link: 'Link', other: 'Other',
};
const WIDTHS = Object.fromEntries(REVIEW.widths.map((w) => [w.vp, w.label.toLowerCase()]));
const TEXT_LABELS = {
  '': 'default (Humanist 14)',
  'text-large': 'large (Humanist 17.5)',
  'text-x-large': 'extra large (Humanist 21)',
  'text-serif': 'serif (Egyptienne 21)',
  'text-serif-subtitle': 'serif subtitle (Egyptienne 24.5)',
  'text-serif-title': 'serif title (Egyptienne 28)',
};

const $ = (sel) => document.querySelector(sel);
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat().filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
}
const when = (t) => (t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const design = (v) => (v === '' || v === null || v === undefined ? 'default' : String(v).replace(/-/g, ' '));
const set = (v) => v !== null && v !== undefined;
const toolLink = (page, extra = '') => `./index.html?page=${encodeURIComponent(page)}${extra}`;

function table(head, rows) {
  if (!rows.length) return el('p', { class: 'rs-none' }, 'Nothing yet.');
  return el(
    'table',
    {},
    el('thead', {}, el('tr', {}, ...head.map((h) => el('th', {}, h)))),
    el('tbody', {}, ...rows.map((r) => el('tr', {}, ...r.map((c) => el('td', {}, c))))),
  );
}

function csvLink(name, head, rows) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = [head, ...rows].map((r) => r.map(q).join(',')).join('\n');
  const a = el('a', { class: 'rs-download', download: name }, 'Download CSV');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  return a;
}

/** the switchable blocks of a standard page (id → type, standard design, group), from its source */
const htmlCache = new Map();
const htmlOf = (page) => {
  if (!htmlCache.has(page)) htmlCache.set(page, fetch(`${BASE}${page}.plain.html`).then((r) => (r.ok ? r.text() : '')));
  return htmlCache.get(page);
};
/** the page's block keys (blockkeys.js): entries are saved under them */
const keysOf = async (page) => keysOfHtml(await htmlOf(page));
const blockCache = new Map();
async function blocksOf(page) {
  if (!blockCache.has(page)) {
    const { variantsOf } = await loadGroups();
    blockCache.set(page, htmlOf(page).then((html) => {
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
      const out = {};
      [...doc.body.children].forEach((section, si) => {
        [...section.children].filter((c) => c.matches('div[class]') && !c.matches('.section-metadata, .metadata'))
          .forEach((block, bi) => {
            const { list, widths } = variantsOf(block);
            const style = [...section.querySelectorAll(':scope > .section-metadata > div')]
              .find((r) => r.firstElementChild?.textContent.trim() === 'style');
            const styles = style ? style.lastElementChild.textContent.split(',').map((x) => x.trim()) : [];
            const wide = [...block.classList].find((c) => c === 'wide-first' || c === 'wide-last');
            out[`s${si}b${bi}`] = {
              name: block.classList[0],
              variant: list[0] ?? null,
              width: widths.length ? (wide || '') : null,
              background: ['grey-band', 'gold-box', 'purple-band', 'blue-band'].find((x) => styles.includes(x)) || '',
            };
          });
      });
      return out;
    }));
  }
  return blockCache.get(page);
}

const AOE_STATES = {
  progress: 'in progress', done: 'done', wontdo: "won't do", open: 'open again',
};

async function render(savedRows, pages) {
  // entries saved under a block key → the block's position on the page now (a key not on the page
  // any more keeps its key and drops out of the block lists: the summary lists it for a re-check)
  const keyed = [...new Set(savedRows.map((r) => r.page).filter((p) => p !== '*'))];
  const keysBy = new Map(await Promise.all(keyed.map(async (p) => [p, await keysOf(p)])));
  const allRows = savedRows.map((r) => {
    const keys = keysBy.get(r.page);
    const pos = keys ? toPosition(r.item, keys) : r.item;
    return pos ? { ...r, item: pos } : r;
  });
  // the AOE team (role aoe, or the command line's `AOE`) is no reviewer: its rows are kept apart;
  // threads (replies `reply:<comment|note>:<id>`, older status rows `status:<kind>`) give the state
  // and the AOE team's latest status of every comment and note
  const isAoe = (r) => r.role === 'aoe' || r.reviewer === 'AOE';
  const rows = allRows.filter((r) => !isAoe(r) && !/^(reply|status):/.test(r.kind));
  const json = (v) => {
    try {
      return JSON.parse(v);
    } catch (e) {
      return null;
    }
  };
  // a thread's state and the AOE team's latest status (threads.js)
  const aoeOf = (page, item, kind) => {
    const own = allRows
      .filter((r) => r.page === page && r.item === item && threadKindOf(r.kind) === kind);
    if (!own.some((r) => r.kind !== kind)) return '';
    const t = threadState(own);
    const answer = [...own].sort((x, y) => (x.time < y.time ? 1 : -1))
      .find((r) => roleOf(r) === 'aoe' && !r.kind.startsWith('status:') && (json(r.value) || {}).text);
    const status = t.status && AOE_STATES[t.status.state]
      ? [AOE_STATES[t.status.state], t.status.release && `in ${t.status.release}`, t.status.reason || (answer ? json(answer.value).text : '')].filter(Boolean).join(', ') : '';
    return [t.done ? 'done' : 'open', status].filter(Boolean).join(' · ');
  };
  const title = Object.fromEntries(pages.map((p) => [p.path, p.title]));
  const pageName = (p) => el('a', { href: toolLink(p) }, title[p] || p);
  const byPage = new Map();
  rows.filter((r) => r.page !== '*').forEach((r) => {
    if (!byPage.has(r.page)) byPage.set(r.page, []);
    byPage.get(r.page).push(r);
  });
  const state = new Map([...byPage].map(([p, list]) => [p, merge(list)]));
  const groups = merge(rows.filter((r) => r.page === '*'));
  const groupInfo = REVIEW.design ? (await (await fetch('./groups.json')).json()).groups : {};
  const { groupLabel } = await loadGroups();

  /* ---------- progress ---------- */
  // approved pages: the page state `approved`, or the older reviewed mark
  const approvedOf = (m) => {
    const chosen = m.get('page|state');
    if (chosen) return chosen.value === 'approved' ? chosen : null;
    return m.get('page|reviewed')?.value === true ? m.get('page|reviewed') : null;
  };
  const reviewed = [...state].filter(([, m]) => approvedOf(m))
    .map(([p, m]) => ({ page: p, ...approvedOf(m) }));
  const touched = [...state].filter(([, m]) => [...m.values()].some((e) => {
    if (e.kind === 'note') return e.value && !e.value.deleted;
    if (e.kind === 'comment') return !!e.value;
    if (e.kind === 'reviewed') return e.value === true;
    if (e.kind === 'state') return !!e.value;
    return set(e.value);
  })).map(([p]) => p);
  const reviewers = new Map();
  rows.forEach((r) => {
    const x = reviewers.get(r.reviewer) || { rows: 0, pages: new Set(), last: '' };
    x.rows += 1;
    if (r.page !== '*') x.pages.add(r.page);
    if (r.time > x.last) x.last = r.time;
    reviewers.set(r.reviewer, x);
  });
  const pct = Math.round((reviewed.length / pages.length) * 100);
  $('#progress .rs-body').replaceChildren(
    el(
      'div',
      { class: 'rs-tiles' },
      el('div', { class: 'rs-tile' }, el('b', {}, `${reviewed.length} / ${pages.length}`), el('span', {}, 'pages approved')),
      el('div', { class: 'rs-tile' }, el('b', {}, String(touched.length)), el('span', {}, 'pages with review activity')),
      el('div', { class: 'rs-tile' }, el('b', {}, String(pages.length - new Set([...touched, ...reviewed.map((r) => r.page)]).size)), el('span', {}, 'pages not opened for review')),
      el('div', { class: 'rs-tile' }, el('b', {}, String(reviewers.size)), el('span', {}, 'reviewers')),
    ),
    el('div', { class: 'rs-bar-meter', title: `${pct}% reviewed` }, el('div', { style: `width: ${pct}%` })),
    el('h3', {}, 'Reviewers'),
    table(['Reviewer', 'Saved changes', 'Pages', 'Last activity'], [...reviewers].sort((a, b) => (a[1].last < b[1].last ? 1 : -1))
      .map(([name, x]) => [name || 'someone', String(x.rows), String(x.pages.size), when(x.last)])),
    el('h3', {}, 'Pages approved'),
    table(['Page', 'By', 'When'], reviewed.sort((a, b) => (a.time < b.time ? 1 : -1))
      .map((r) => [pageName(r.page), r.reviewer, when(r.time)])),
  );

  /* ---------- design decisions ---------- */
  const groupRows = [...groups.values()]
    .filter((e) => e.item.startsWith('group:') && ['variant', 'text'].includes(e.kind) && set(e.value))
    .map((e) => {
      const key = e.item.slice('group:'.length);
      const width = groups.get(`${e.item}|width`)?.value;
      const info = groupInfo[key] || {};
      const chosen = e.kind === 'text' ? (TEXT_LABELS[e.value] || e.value) : design(e.value);
      return [groupLabel(key), `${chosen}${set(width) && width ? `, ${design(width)}` : ''}`,
        `${info.blocks || '?'} blocks on ${info.pages || '?'} pages`, e.reviewer, when(e.time)];
    });
  const choiceRows = [];
  const commentRows = [];
  const pageCommentRows = [];
  const noteRows = [];
  const blocksByPage = new Map(await Promise.all([...state.keys()]
    .map(async (page) => [page, await blocksOf(page)])));
  state.forEach((m, page) => {
    const blocks = blocksByPage.get(page);
    const per = new Map();
    m.forEach((e) => {
      if (/^s\d+$/.test(e.item) && ['text', 'background'].includes(e.kind) && set(e.value)) {
        const what = e.kind === 'text' ? `text style: ${TEXT_LABELS[e.value] || e.value}` : `background: ${design(e.value)}`;
        choiceRows.push([pageName(page), `Text (${e.item})`, what, e.reviewer, when(e.time)]);
      }
      if (/^s\d+$/.test(e.item) && e.kind === 'comment' && e.value) {
        commentRows.push({ type: 'Text', row: [pageName(page), `Text (${e.item})`, e.value, e.reviewer, when(e.time), aoeOf(page, e.item, 'comment')] });
      }
      if (/^s\d+b\d+$/.test(e.item)) {
        if (!per.has(e.item)) per.set(e.item, {});
        per.get(e.item)[e.kind] = e;
      }
      if (e.item === 'page' && e.kind === 'comment' && e.value) pageCommentRows.push([pageName(page), e.value, e.reviewer, when(e.time), aoeOf(page, 'page', 'comment')]);
      if (e.kind === 'note' && e.value && !e.value.deleted) {
        noteRows.push({
          page, ...e.value, reviewer: e.reviewer, time: e.time, aoe: aoeOf(page, e.item, 'note'),
        });
      }
    });
    per.forEach((k, id) => {
      const b = blocks[id] || { name: '?', variant: null };
      const name = `${NAMES[b.name] || b.name} (${id})`;
      // (a value equal to the block's own design is no decision: e.g. an old auto-save row)
      const picks = ['variant', 'width', 'background']
        .filter((kind) => k[kind] && set(k[kind].value) && k[kind].value !== b[kind]);
      if (picks.length) {
        const latest = picks.map((kind) => k[kind]).sort((a, c) => (a.time < c.time ? 1 : -1))[0];
        const parts = picks.map((kind) => (kind === 'variant' ? `${design(b.variant)} → ${design(k.variant.value)}` : `${kind}: ${design(k[kind].value)}`));
        choiceRows.push([pageName(page), name, parts.join('; '), latest.reviewer, when(latest.time)]);
      }
      if (k.comment && k.comment.value) {
        commentRows.push({
          type: NAMES[b.name] || b.name,
          row: [pageName(page), name, k.comment.value, k.comment.reviewer, when(k.comment.time), aoeOf(page, id, 'comment')],
        });
      }
    });
  });
  $('#designs').hidden = !REVIEW.design;
  $('#designs .rs-body').replaceChildren(
    el('h3', {}, `For all blocks like this (${groupRows.length})`),
    table(['Blocks like this', 'Design chosen', 'Reach', 'By', 'When'], groupRows),
    el('h3', {}, `On single blocks (${choiceRows.length})`),
    el('p', { class: 'rs-muted' }, 'A block\'s own choice wins over its group\'s; where both exist the block is an exception.'),
    table(['Page', 'Block', 'Change', 'By', 'When'], choiceRows),
  );

  /* ---------- comments ---------- */
  commentRows.sort((a, b) => a.type.localeCompare(b.type));
  const commentCsv = [...commentRows.map((c) => c.row), ...pageCommentRows.map((r) => [r[0], 'page', r[1], r[2], r[3], r[4]])]
    .map((r) => [r[0].textContent || r[0], r[1], r[2], r[3], r[4], r[5]]);
  $('#comments .rs-body').replaceChildren(
    el('h3', {}, `On blocks (${commentRows.length})`, commentRows.length || pageCommentRows.length ? csvLink('review-comments.csv', ['Page', 'Block', 'Comment', 'By', 'When', 'AOE'], commentCsv) : null),
    table(['Page', 'Block', 'Comment', 'By', 'When', 'AOE'], commentRows.map((c) => c.row)),
    el('h3', {}, `On pages (${pageCommentRows.length})`),
    table(['Page', 'Comment', 'By', 'When', 'AOE'], pageCommentRows),
  );

  /* ---------- QA notes ---------- */
  noteRows.sort((a, b) => {
    if (a.page !== b.page) return a.page.localeCompare(b.page);
    return a.created < b.created ? -1 : 1;
  });
  const numbers = new Map();
  noteRows.forEach((n) => {
    numbers.set(n.page, (numbers.get(n.page) || 0) + 1);
    n.n = numbers.get(n.page);
  });
  const open = noteRows.filter((n) => n.status !== 'resolved');
  const byCat = Object.keys(CATEGORIES)
    .map((c) => [CATEGORIES[c], noteRows.filter((n) => n.cat === c)])
    .filter(([, list]) => list.length);
  $('#notes .rs-body').replaceChildren(
    el(
      'div',
      { class: 'rs-tiles' },
      el('div', { class: 'rs-tile' }, el('b', {}, String(open.length)), el('span', {}, 'open')),
      el('div', { class: 'rs-tile' }, el('b', {}, String(noteRows.length - open.length)), el('span', {}, 'resolved')),
      ...byCat.map(([name, list]) => el('div', { class: 'rs-tile' }, el('b', {}, String(list.length)), el('span', {}, name))),
    ),
    noteRows.length ? csvLink('review-qa-notes.csv', ['Page', '#', 'Category', 'Note', 'Width', 'Status', 'By', 'When', 'AOE'], noteRows.map((n) => [title[n.page] || n.page, n.n, CATEGORIES[n.cat] || n.cat, n.text, WIDTHS[n.vp] || n.vp, n.status, n.reviewer, when(n.time), n.aoe])) : null,
    table(['Page', '#', 'Category', 'Note', 'Width', 'Status', 'By', 'When', 'AOE'], noteRows.map((n) => [
      pageName(n.page),
      el('a', { href: toolLink(n.page, `&vp=${n.vp}&note=${encodeURIComponent(n.id)}`), title: 'Open at the pin' }, String(n.n)),
      CATEGORIES[n.cat] || n.cat,
      n.text,
      WIDTHS[n.vp] || n.vp,
      el('span', { class: `rs-tag rs-${n.status === 'resolved' ? 'resolved' : 'open'}` }, n.status),
      n.reviewer,
      when(n.time),
      n.aoe,
    ])),
  );
}

async function start() {
  if (!PREVIEW) {
    $('.rs-blocked').hidden = false;
    return;
  }
  document.title = `${REVIEW.title}: results`;
  $('h1').textContent = `${REVIEW.title}: results`;
  const pages = await loadPages();
  let all = [];
  const draw = async () => {
    const hide = $('.rs-hide-tests').checked;
    const rows = all.filter((r) => !hide || (!TEST_REVIEWERS.test(r.reviewer) && r.page !== '/test' && !r.page.startsWith('/std/')));
    await render(rows, pages);
  };
  const load = async () => {
    $('.rs-updated').textContent = 'Loading the reviews…';
    try {
      all = await readAll();
      await draw();
      $('.rs-updated').textContent = `${all.length} saved changes · read ${when(new Date().toISOString())}`;
    } catch (e) {
      $('.rs-updated').textContent = e.code ? e.message : 'Could not read the reviews';
    }
  };
  // the invitation is kept in the browser, not in the address bar
  if (inviteToken() && new URLSearchParams(window.location.search).has('invite')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState(null, '', url);
  }
  $('.rs-hide-tests').addEventListener('change', draw);
  $('.rs-refresh').addEventListener('click', load);
  await load();
}

start();
