/*
 * Review status of every page: where each page stands in the back and forth between the reviewers
 * and the AOE team, so nobody needs a call to find out (states: backend/lib/states.mjs, from the
 * web action `overview`). Every page of the invitation's scope, pages without entries as not
 * reviewed yet; filters (template, business unit, state, search, new since my last visit); the
 * order puts what waits for the viewer first (reviewers: answered by the AOE team; the AOE team:
 * open feedback); links into the review tool. State = a colour and a label.
 */
import { call, inviteToken } from './store.js';
import { REVIEW, storageKey } from './config.js';
import loadPages, { editUrl, scopeFacts } from './pages.js';
import {
  getFilters, setFilters, pagesOf, markOrg, makeRepresentatives, areaLabel, orgLabel, passes,
  markFirstRepresentatives,
} from './batches.js';

const { hostname } = window.location;
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
const VISIT_KEY = storageKey('status-visit');
// the page's own state, kept on refresh (the filters shared with the tool are batches.js's)
const VIEW_KEY = storageKey('status-view');
// the "last visit" of this tab: kept for its reloads, so a refresh is no new visit
const TAB_VISIT_KEY = storageKey('status-tab-visit');
const PAGE_SIZE = 300;
const $ = (sel) => document.querySelector(sel);

/** the states, worded for the viewer's side */
const STATES = {
  'waiting-customer': { reviewer: 'Waiting for the customer', aoe: 'Waiting for the customer' },
  'waiting-aoe': { reviewer: 'Waiting for the AOE team', aoe: 'Waiting for the AOE team' },
  'in-review': { reviewer: 'In review', aoe: 'In review' },
  resolved: { reviewer: 'Resolved', aoe: 'Resolved' },
  approved: { reviewer: 'Approved as is', aoe: 'Approved as is' },
  unreviewed: { reviewer: 'Not reviewed yet', aoe: 'Not reviewed yet' },
  skipped: { reviewer: 'Skipped: not migrated', aoe: 'Skipped: not migrated' },
  // (in the migration scope, not published yet: the AOE team's lists only)
  unpublished: { reviewer: 'Not published yet', aoe: 'Not published yet' },
};
const ORDER = {
  reviewer: ['waiting-customer', 'waiting-aoe', 'in-review', 'resolved', 'approved', 'unreviewed', 'skipped', 'unpublished'],
  aoe: ['waiting-aoe', 'waiting-customer', 'in-review', 'resolved', 'approved', 'unreviewed', 'skipped', 'unpublished'],
};

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  children.flat()
    .filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
}
const when = (t) => (t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const inScope = (scope, page) => (scope.paths || []).some((p) => p === '/' || page === p || page.startsWith(p.endsWith('/') ? p : `${p}/`));

let all = [];
let me = { name: '', role: 'reviewer' };
let previousVisit = '';
let shown = PAGE_SIZE;
const picked = new Set();
// the table is drawn further down; the state tiles redraw it through this
const hooks = { draw: () => {} };

/** the saved state of the page: { search, template, state, order, onlyNew, picked, scroll } */
function savedView() {
  try {
    return JSON.parse(window.localStorage.getItem(VIEW_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveView(extra = {}) {
  window.localStorage.setItem(VIEW_KEY, JSON.stringify({
    ...savedView(),
    search: $('.st-search').value,
    template: $('.st-template').value,
    state: $('.st-state').value,
    order: $('.st-order').value,
    onlyNew: $('.st-new').checked,
    picked: [...picked],
    ...extra,
  }));
}
// the selects filled from the pages (template, state) get their saved value on the first load
let restoredSelects = false;

function label(state) {
  return STATES[state][me.role === 'aoe' ? 'aoe' : 'reviewer'];
}

function filtered() {
  const q = $('.st-search').value.trim().toLowerCase();
  const template = $('.st-template').value;
  const unit = $('.st-unit').value;
  const state = $('.st-state').value;
  const onlyNew = $('.st-new').checked;
  // batches, group, representatives only (the area is the select's own, below)
  const org = { ...getFilters(), area: '' };
  return all.filter((p) => (!q || p.title.toLowerCase().includes(q) || p.path.includes(q))
    && (!template || p.template === template)
    && (!unit || p.unit === unit)
    && passes(p.path, p, org)
    && (!state || p.state === state)
    && (!picked.size || picked.has(p.state))
    && (!onlyNew || p.isNew));
}

function sorted(list) {
  const order = $('.st-order').value;
  const rank = ORDER[me.role === 'aoe' ? 'aoe' : 'reviewer'];
  const recent = (a, b) => ((b.last?.at || '') < (a.last?.at || '') ? -1 : 1);
  if (order === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
  if (order === 'recent') return [...list].sort(recent);
  return [...list].sort((a, b) => rank.indexOf(a.state) - rank.indexOf(b.state)
    || Number(b.isNew) - Number(a.isNew)
    || recent(a, b));
}

function tiles() {
  const count = (s) => all.filter((p) => p.state === s).length;
  // (Not published yet: only when there are such pages, the AOE team's lists)
  const rank = ORDER[me.role === 'aoe' ? 'aoe' : 'reviewer'].filter((s) => s !== 'unpublished' || count(s));
  $('.st-tiles').replaceChildren(...rank.map((s) => el('button', {
    type: 'button',
    class: `st-tile st-${s}${picked.has(s) ? ' st-picked' : ''}`,
    'aria-pressed': String(picked.has(s)),
    onclick: () => {
      if (picked.has(s)) picked.delete(s);
      else picked.add(s);
      saveView();
      shown = PAGE_SIZE;
      hooks.draw();
    },
  }, el('b', {}, String(count(s))), el('span', {}, label(s)))));
  $('.st-meter').replaceChildren(...rank.filter(count).map((s) => el('div', {
    class: `st-${s}`, style: `flex-grow: ${count(s)}`, title: `${label(s)}: ${count(s)}`,
  })));
}

/** the group mark's explanation */
function repTitle(p) {
  if (p.representative) return 'The representative page of its group (chosen): the customer reviews it for the whole group';
  if (p.representativeAuto) return 'The first page of its group: its representative while none is chosen';
  return '';
}

/** approved: by whom and when, or with its group (approving one page approves the group) */
function approvedText(p) {
  if (p.approved) return `${p.approved.by} · ${when(p.approved.at)}`;
  if (!p.groupApproved) return '';
  const g = p.groupApproved;
  return el('span', { class: 'st-group-ok', title: `Approved with its group: ${g.page} was approved` }, `With its group · ${g.by} · ${when(g.at)}`);
}

/** the migration scope's facts for the AOE team: counts and what to look at */
function drawScope() {
  const box = $('.st-scope');
  const f = scopeFacts();
  box.hidden = me.role !== 'aoe' || !f;
  if (box.hidden) return;
  const published = all.filter((p) => p.published).length;
  const { waiting = [], lastRun, health } = f.capture || {};
  const toCorrect = waiting.filter((w) => w.problem);
  const issues = f.notInScope.length + f.problems.length + toCorrect.length
    + (health && !health.ok ? 1 : 0);
  box.open = box.open || issues > 0;
  const list = (title, items, row) => (items.length ? [el('h3', {}, `${title} (${items.length})`), el('ul', { class: 'st-scope-list' }, ...items.slice(0, 200).map((i) => el('li', {}, row(i))))] : []);
  $('.st-scope-sum').textContent = `Migration scope: ${all.length} pages, ${published} published${issues ? ` · ${issues} to look at` : ''}`;
  $('.st-scope-body').replaceChildren(
    el('p', { class: 'rs-muted' }, 'The scope is the table review/migration-scope in Document Authoring (source, eds, template; preview it after a change). Reviewers see the published pages of the scope; a page joins when it is published, and the backend takes its first source shot within 15 minutes.'),
    ...list('Published, not in the scope table', f.notInScope, (i) => [el('a', { href: `./index.html?page=${encodeURIComponent(i.path)}`, target: '_blank', rel: 'noopener' }, i.path), ` ${i.title}`]),
    ...list('Rows of the scope table to correct', f.problems, (i) => `Row ${i.row}: ${i.eds || ''} ${i.source || ''}: ${i.detail}`),
    ...list('Sources to correct (the first shot failed)', toCorrect, (i) => [el('b', {}, i.path), ` ${i.source}: ${i.problem.reason} (${when(i.problem.at)})`]),
    ...list('Waiting for their first shot', waiting.filter((w) => !w.problem), (i) => `${i.path} (published, seen ${when(i.since)})`),
    el('p', { class: 'rs-muted' }, [
      lastRun ? `Last capture ${when(lastRun.at)}: ${lastRun.done.length} shot${lastRun.done.length === 1 ? '' : 's'}, ${lastRun.failed.length} failed${lastRun.waiting ? `, ${lastRun.waiting} for the next run` : ''}.` : 'No capture run yet.',
      health ? ` Browser check ${when(health.at)}: ${health.ok ? 'working' : `NOT WORKING (${health.detail})`}.` : '',
    ].join('')),
  );
}

function threadsText(t) {
  if (!t) return '';
  return [t.open && `${t.open} open`, t.done && `${t.done} done`].filter(Boolean).join(' · ');
}

/** the batch chips: every batch with its page count, and the pages in no batch; several at once */
function batchChips() {
  const { batches: chosen } = getFilters();
  const numbers = [...new Set(all.map((p) => p.batch).filter(Boolean))].sort((a, b) => a - b);
  const count = (b) => all.filter((p) => (p.batch || 'none') === b).length;
  const toggle = (b) => {
    const f = getFilters();
    f.batches = f.batches.includes(b) ? f.batches.filter((x) => x !== b) : [...f.batches, b];
    setFilters(f);
    shown = PAGE_SIZE;
    hooks.draw();
  };
  const chip = (b, text) => el('button', {
    type: 'button', class: 'st-batch', 'aria-pressed': String(chosen.includes(b)), onclick: () => toggle(b),
  }, text);
  $('.st-batches').replaceChildren(
    el('span', {}, 'Batches:'),
    el('button', {
      type: 'button',
      class: 'st-batch',
      'aria-pressed': String(!chosen.length),
      onclick: () => {
        setFilters({ ...getFilters(), batches: [] });
        hooks.draw();
      },
    }, `All (${all.length})`),
    ...numbers.map((b) => chip(b, `Batch ${b} (${count(b)})`)),
    count('none') ? chip('none', `No batch (${count('none')})`) : null,
  );
}

function draw() {
  batchChips();
  tiles();
  const list = sorted(filtered());
  $('.st-count').textContent = `${list.length} of ${all.length} pages${all.some((p) => p.isNew) ? ` · ${all.filter((p) => p.isNew).length} with news since your last visit` : ''}`;
  // (template and design choices: only where the pages have them)
  const templates = all.some((p) => p.template);
  const head = ['State', 'Page', 'Batch / group', 'Area', templates && 'Template', 'Threads', REVIEW.design && 'Design choices', 'Approved', 'Latest activity'].filter(Boolean);
  const rows = list.slice(0, shown).map((p) => el(
    'tr',
    { class: p.isNew ? 'st-row-new' : '' },
    el('td', {}, el('span', { class: `st-chip st-${p.state}` }, label(p.state))),
    el(
      'td',
      {},
      el('a', { href: `./index.html?page=${encodeURIComponent(p.path)}`, target: '_blank', rel: 'noopener' }, p.title),
      el('br'),
      el('small', { class: 'rs-muted' }, p.path),
      // (the AOE team's: open the page's document to edit)
      me.role === 'aoe' && editUrl(p.path) ? [' ', el('a', {
        class: 'st-edit', href: editUrl(p.path), target: '_blank', rel: 'noopener', title: 'Open the page in Document Authoring to edit it',
      }, 'Edit in DA')] : null,
    ),
    el('td', {}, orgLabel(p) ? el('span', { class: `st-batch-tag${p.representative || p.representativeAuto ? ' st-rep' : ''}`, title: repTitle(p) }, orgLabel(p)) : ''),
    el('td', {}, areaLabel(p.unit || '')),
    templates ? el('td', {}, p.template) : null,
    el('td', {}, threadsText(p.threads)),
    REVIEW.design ? el('td', {}, p.choices ? String(p.choices) : '') : null,
    el('td', {}, approvedText(p)),
    el('td', {}, p.last ? [`${p.last.by}${p.last.role === 'aoe' ? ' (AOE)' : ''} · ${when(p.last.at)}`, p.isNew ? el('span', { class: 'st-new-badge' }, 'new') : null] : ''),
  ));
  $('.st-table').replaceChildren(list.length
    ? el('table', {}, el('thead', {}, el('tr', {}, ...head.map((h) => el('th', {}, h)))), el('tbody', {}, ...rows))
    : el('p', { class: 'rs-none' }, 'No pages match.'));
  $('.st-more').hidden = list.length <= shown;
  $('.st-more').textContent = `Show more (${list.length - shown} more)`;
}

hooks.draw = draw;

function options(select, values) {
  const keep = select.value;
  select.replaceChildren(el('option', { value: '' }, 'All'), ...values.map((v) => el('option', { value: v.value ?? v }, v.label ?? v)));
  select.value = keep;
}

async function load() {
  $('.rs-updated').textContent = 'Loading…';
  // (the AOE team: every page of the migration scope; reviewers: the published ones)
  const [{ status, body }, pages] = await Promise.all([call('overview'), loadPages({ all: true })]);
  if (status !== 200) {
    $('.rs-updated').textContent = body?.error?.message || 'Could not read the review status: open this page with your review link.';
    return;
  }
  me = { name: body.reviewer, role: body.role || 'reviewer' };
  $('.st-results').hidden = !body.scope.results;
  $('.st-invites').hidden = body.role !== 'aoe';
  const states = new Map(body.pages.map((p) => [p.page, p]));
  all = pages.filter((p) => inScope(body.scope, p.path)).map((p) => {
    const s = states.get(p.path) || { state: 'unreviewed' };
    // news: activity by someone else since this viewer's last visit
    const isNew = !!(previousVisit && s.last && s.last.at > previousVisit && s.last.by !== me.name);
    // (a page of the scope that isn't published yet, with no review of its own)
    const state = p.published === false && s.state === 'unreviewed' ? 'unpublished' : s.state;
    return {
      ...p, ...s, state, page: undefined, isNew,
    };
  });
  // the first published page of a group without a chosen representative
  markFirstRepresentatives(all.filter((p) => p.published !== false));
  drawScope();
  options($('.st-template'), [...new Set(all.map((p) => p.template).filter(Boolean))].sort());
  $('.st-template').closest('label').hidden = !all.some((p) => p.template);
  options($('.st-unit'), [...new Set(all.map((p) => p.unit).filter(Boolean))].sort()
    .map((u) => ({ value: u, label: areaLabel(u) })));
  // the area, group and representatives only, kept with the tool's filters
  $('.st-unit').value = getFilters().area;
  const groups = [...new Set(all.map((p) => p.group).filter(Boolean))].sort((a, b) => a - b);
  const groupCount = (g) => all.filter((p) => p.group === g).length;
  options($('.st-group'), [
    ...groups.map((g) => ({ value: String(g), label: `Group ${g} (${groupCount(g)})` })),
    { value: 'none', label: 'In no group' },
  ]);
  $('.st-group').value = String(getFilters().group);
  $('.st-reps').checked = getFilters().reps;
  // the AOE team marks pages for a batch
  $('.st-mark').hidden = me.role !== 'aoe';
  options($('.st-state'), ORDER[me.role === 'aoe' ? 'aoe' : 'reviewer'].map((s) => ({ value: s, label: label(s) })));
  if (!restoredSelects) {
    restoredSelects = true;
    const v = savedView();
    if (v.template) $('.st-template').value = v.template;
    if (v.state) $('.st-state').value = v.state;
  }
  $('.rs-updated').textContent = `${me.name}${me.role === 'aoe' ? ' (AOE)' : ''} · read ${when(body.at)}`;
  draw();
  window.localStorage.setItem(VISIT_KEY, body.at);
}

async function start() {
  if (!PREVIEW) {
    $('.rs-blocked').hidden = false;
    return;
  }
  // the invitation is kept in the browser, not in the address bar
  inviteToken();
  if (new URLSearchParams(window.location.search).has('invite')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState(null, '', url);
  }
  document.title = `${REVIEW.title}: status of every page`;
  previousVisit = window.sessionStorage.getItem(TAB_VISIT_KEY)
    ?? (window.localStorage.getItem(VISIT_KEY) || '');
  window.sessionStorage.setItem(TAB_VISIT_KEY, previousVisit);
  // the page as it was: search, order, only new, the picked status tiles
  const view = savedView();
  $('.st-search').value = view.search || '';
  if (view.order) $('.st-order').value = view.order;
  $('.st-new').checked = !!view.onlyNew;
  (view.picked || []).forEach((st) => picked.add(st));
  $('.st-unit').addEventListener('change', () => setFilters({ ...getFilters(), area: $('.st-unit').value }));
  $('.st-group').addEventListener('change', () => {
    const v = $('.st-group').value;
    setFilters({ ...getFilters(), group: v === '' || v === 'none' ? v : Number(v) });
  });
  $('.st-reps').addEventListener('change', () => setFilters({ ...getFilters(), reps: $('.st-reps').checked }));
  const result = (text) => {
    $('.st-mark-result').textContent = text;
  };
  const pasted = () => {
    // (the scope table's pairs first: source path → EDS path)
    const bySource = new Map(all.filter((p) => p.source)
      .map((p) => [new URL(p.source).pathname, p.path]));
    const { found, missing } = pagesOf($('.st-mark-list').value, all.map((p) => p.path), bySource);
    if (!found.length) {
      result(missing.length ? `None of these is a page of this review:\n${missing.join('\n')}` : 'Paste the pages first.');
    }
    return { found, missing };
  };
  const report = (lines, missing) => result([...lines, missing.length ? `Not pages of this review (${missing.length}), left out:\n${missing.join('\n')}` : '']
    .filter(Boolean).join('\n\n'));
  const mark = async (value) => {
    const kind = $('.st-mark-kind').value;
    const { found, missing } = pasted();
    if (!found.length) return;
    result(`Saving ${found.length} page${found.length > 1 ? 's' : ''}…`);
    const { done, failed } = await markOrg(found, kind, value);
    report([
      `${done} page${done === 1 ? '' : 's'} ${value ? `marked for ${kind} ${value}` : `taken out of their ${kind}`}.`,
      failed.length ? `Not saved (${failed.length}):\n${failed.join('\n')}` : '',
    ], missing);
    await load();
  };
  $('.st-mark-go').addEventListener('click', () => {
    const n = Number($('.st-mark-batch').value);
    if (!Number.isInteger(n) || n < 1 || n > 999) {
      result(`Give the ${$('.st-mark-kind').value} number (1 to 999).`);
      return;
    }
    mark(n);
  });
  $('.st-mark-clear').addEventListener('click', () => mark(null));
  $('.st-mark-rep').addEventListener('click', async () => {
    const { found, missing } = pasted();
    if (!found.length) return;
    result('Saving…');
    const org = new Map(all.filter((p) => p.group).map((p) => [p.path, p]));
    const { done, failed, refused } = await makeRepresentatives(found, org);
    report([
      `${done} page${done === 1 ? ' is now the representative of its group' : 's are now the representatives of their groups'}.`,
      refused.length ? `Not made representatives (${refused.length}):\n${refused.join('\n')}` : '',
      failed.length ? `Not saved (${failed.length}):\n${failed.join('\n')}` : '',
    ], missing);
    await load();
  });
  $('.st-mark-shown').addEventListener('click', () => {
    // (the source of the scope table: the EDS path doesn't give it back)
    $('.st-mark-list').value = sorted(filtered()).map((p) => p.source || `https://www.stryker.com${p.path}.html`).join('\n');
  });
  ['.st-search', '.st-template', '.st-unit', '.st-group', '.st-reps', '.st-state', '.st-order', '.st-new'].forEach((sel) => {
    $(sel).addEventListener(sel === '.st-search' ? 'input' : 'change', () => {
      shown = PAGE_SIZE;
      saveView();
      draw();
    });
  });
  // the scroll position, kept too (put back once the table is there)
  let scrollTimer = 0;
  window.addEventListener('scroll', () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      saveView({ scroll: Math.round(window.scrollY), shown });
    }, 200);
  });
  if (view.shown > PAGE_SIZE) shown = view.shown;
  $('.st-more').addEventListener('click', () => {
    shown += PAGE_SIZE;
    draw();
  });
  $('.st-refresh').addEventListener('click', load);
  await load();
  if (view.scroll) window.scrollTo(0, view.scroll);
}

start();
