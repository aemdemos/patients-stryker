/*
 * Review status of every page: where each page stands in the back and forth between the reviewers
 * and the AOE team, so nobody needs a call to find out (states: backend/lib/states.mjs, from the
 * web action `overview`). Every page of the invitation's scope, pages without entries as not
 * reviewed yet; filters (template, business unit, state, search, new since my last visit); the
 * order puts what waits for the viewer first (reviewers: answered by the AOE team; the AOE team:
 * open feedback); links into the review tool. State = a colour and a label.
 */
import { call, inviteToken } from './store.js';

const { hostname } = window.location;
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.page$/.test(hostname);
const VISIT_KEY = 'std-review-status-visit';
const PAGE_SIZE = 300;
const $ = (sel) => document.querySelector(sel);

/** the states, worded for the viewer's side */
const STATES = {
  'waiting-reviewer': { reviewer: 'Answered: waiting for you', aoe: 'Waiting for the reviewers' },
  'waiting-aoe': { reviewer: 'Waiting for the AOE team', aoe: 'Waiting for you' },
  'in-review': { reviewer: 'In review', aoe: 'In review' },
  resolved: { reviewer: 'Resolved', aoe: 'Resolved' },
  approved: { reviewer: 'Approved as is', aoe: 'Approved as is' },
  unreviewed: { reviewer: 'Not reviewed yet', aoe: 'Not reviewed yet' },
  skipped: { reviewer: 'Skipped: not migrated', aoe: 'Skipped: not migrated' },
};
const ORDER = {
  reviewer: ['waiting-reviewer', 'waiting-aoe', 'in-review', 'resolved', 'approved', 'unreviewed', 'skipped'],
  aoe: ['waiting-aoe', 'waiting-reviewer', 'in-review', 'resolved', 'approved', 'unreviewed', 'skipped'],
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
  return all.filter((p) => (!q || p.title.toLowerCase().includes(q) || p.path.includes(q))
    && (!template || p.template === template)
    && (!unit || p.unit === unit)
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
  const aoe = me.role === 'aoe';
  return [
    t['waiting-aoe'] && `${t['waiting-aoe']} ${aoe ? 'for you' : 'with the AOE team'}`,
    t['waiting-reviewer'] && `${t['waiting-reviewer']} ${aoe ? 'with the reviewers' : 'for you'}`,
    t.resolved && `${t.resolved} resolved`,
    t.internal && `${t.internal} internal`,
  ].filter(Boolean).join(' · ');
}

function draw() {
  tiles();
  const list = sorted(filtered());
  $('.st-count').textContent = `${list.length} of ${all.length} pages${all.some((p) => p.isNew) ? ` · ${all.filter((p) => p.isNew).length} with news since your last visit` : ''}`;
  const head = ['State', 'Page', 'Business unit', 'Template', 'Threads', 'Design choices', 'Approved', 'Latest activity'];
  const rows = list.slice(0, shown).map((p) => el(
    'tr',
    { class: p.isNew ? 'st-row-new' : '' },
    el('td', {}, el('span', { class: `st-chip st-${p.state}` }, label(p.state))),
    el('td', {}, el('a', { href: `./index.html?page=${encodeURIComponent(p.path)}` }, p.title), el('br'), el('small', { class: 'rs-muted' }, p.path)),
    el('td', {}, p.unit),
    el('td', {}, p.template),
    el('td', {}, threadsText(p.threads)),
    el('td', {}, p.choices ? String(p.choices) : ''),
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
  const [{ status, body }, pagesResp] = await Promise.all([call('overview'), fetch('./pages.json')]);
  if (status !== 200) {
    $('.rs-updated').textContent = body?.error?.message || 'Could not read the review status: open this page with your review link.';
    return;
  }
  me = { name: body.reviewer, role: body.role || 'reviewer' };
  $('.st-results').hidden = !body.scope.results;
  const states = new Map(body.pages.map((p) => [p.page, p]));
  const { pages } = await pagesResp.json();
  all = pages.filter((p) => inScope(body.scope, p.path)).map((p) => {
    const s = states.get(p.path) || { state: 'unreviewed' };
    // news: activity by someone else since this viewer's last visit
    const isNew = !!(previousVisit && s.last && s.last.at > previousVisit && s.last.by !== me.name);
    return {
      ...p, ...s, page: undefined, isNew,
    };
  });
  options($('.st-template'), [...new Set(all.map((p) => p.template).filter(Boolean))].sort());
  options($('.st-unit'), [...new Set(all.map((p) => p.unit).filter(Boolean))].sort());
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
  previousVisit = window.localStorage.getItem(VISIT_KEY) || '';
  ['.st-search', '.st-template', '.st-unit', '.st-state', '.st-order', '.st-new'].forEach((sel) => {
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
