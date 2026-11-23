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
import loadPages from './pages.js';
import {
  getFilters, setFilters, pagesOf, markOrg, makeRepresentatives, areaLabel, orgLabel, passes,
} from './batches.js';

const { hostname } = window.location;
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
const VISIT_KEY = storageKey('status-visit');
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
};
const ORDER = {
  reviewer: ['waiting-customer', 'waiting-aoe', 'in-review', 'resolved', 'approved', 'unreviewed', 'skipped'],
  aoe: ['waiting-aoe', 'waiting-customer', 'in-review', 'resolved', 'approved', 'unreviewed', 'skipped'],
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
  const rank = ORDER[me.role === 'aoe' ? 'aoe' : 'reviewer'];
  const count = (s) => all.filter((p) => p.state === s).length;
  $('.st-tiles').replaceChildren(...rank.map((s) => el('button', {
    type: 'button',
    class: `st-tile st-${s}${picked.has(s) ? ' st-picked' : ''}`,
    'aria-pressed': String(picked.has(s)),
    onclick: () => {
      if (picked.has(s)) picked.delete(s);
      else picked.add(s);
      shown = PAGE_SIZE;
      hooks.draw();
    },
  }, el('b', {}, String(count(s))), el('span', {}, label(s)))));
  $('.st-meter').replaceChildren(...rank.filter(count).map((s) => el('div', {
    class: `st-${s}`, style: `flex-grow: ${count(s)}`, title: `${label(s)}: ${count(s)}`,
  })));
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
    el('td', {}, el('a', { href: `./index.html?page=${encodeURIComponent(p.path)}` }, p.title), el('br'), el('small', { class: 'rs-muted' }, p.path)),
    el('td', {}, orgLabel(p) ? el('span', { class: `st-batch-tag${p.representative ? ' st-rep' : ''}`, title: p.representative ? 'The representative page of its group: the customer reviews it for the whole group' : '' }, orgLabel(p)) : ''),
    el('td', {}, areaLabel(p.unit || '')),
    templates ? el('td', {}, p.template) : null,
    el('td', {}, threadsText(p.threads)),
    REVIEW.design ? el('td', {}, p.choices ? String(p.choices) : '') : null,
    el('td', {}, p.approved ? `${p.approved.by} · ${when(p.approved.at)}` : ''),
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
  const [{ status, body }, pages] = await Promise.all([call('overview'), loadPages()]);
  if (status !== 200) {
    $('.rs-updated').textContent = body?.error?.message || 'Could not read the review status: open this page with your review link.';
    return;
  }
  me = { name: body.reviewer, role: body.role || 'reviewer' };
  $('.st-results').hidden = !body.scope.results;
  const states = new Map(body.pages.map((p) => [p.page, p]));
  all = pages.filter((p) => inScope(body.scope, p.path)).map((p) => {
    const s = states.get(p.path) || { state: 'unreviewed' };
    // news: activity by someone else since this viewer's last visit
    const isNew = !!(previousVisit && s.last && s.last.at > previousVisit && s.last.by !== me.name);
    return {
      ...p, ...s, page: undefined, isNew,
    };
  });
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
  previousVisit = window.localStorage.getItem(VISIT_KEY) || '';
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
    const { found, missing } = pagesOf($('.st-mark-list').value, all.map((p) => p.path));
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
    $('.st-mark-list').value = sorted(filtered()).map((p) => `https://www.stryker.com${p.path}.html`).join('\n');
  });
  ['.st-search', '.st-template', '.st-unit', '.st-group', '.st-reps', '.st-state', '.st-order', '.st-new'].forEach((sel) => {
    $(sel).addEventListener(sel === '.st-search' ? 'input' : 'change', () => {
      shown = PAGE_SIZE;
      draw();
    });
  });
  $('.st-more').addEventListener('click', () => {
    shown += PAGE_SIZE;
    draw();
  });
  $('.st-refresh').addEventListener('click', load);
  await load();
}

start();
