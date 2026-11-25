/*
 * The review's start page (launch.html, 25 Nov 2026): where invitation links open. Who you are
 * (from the link), where the review stands (kept up to date, live.js), the pages of the review
 * with what each one is for, and the way of working between the customer's reviewers and the AOE
 * team, with the statuses in their colours. DOM only (no innerHTML).
 */
import { call, inviteToken } from './store.js';
import { REVIEW } from './config.js';
import loadPages from './pages.js';
import { keepFresh } from './live.js';
import { mountHelp } from './help.js';

const $ = (s) => document.querySelector(s);
const SVG = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  });
  children.flat().filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => e.append(c));
  return e;
};
// a small line icon: paths in a 24 × 24 box
const icon = (paths) => {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  paths.forEach((d) => {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    s.append(p);
  });
  return s;
};
const ICONS = {
  review: ['M3 5h8v14H3z', 'M13 5h8v14h-8z', 'M6 9h2M6 12h2M16 9h2M16 12h2'],
  status: ['M4 6h16M4 12h16M4 18h16', 'M7 4v4M7 10v4M7 16v4'],
  summary: ['M5 4h14v16H5z', 'M8 9h8M8 13h8M8 17h5'],
  invites: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
};

const { hostname } = window.location;
const PREVIEW = ['localhost', '127.0.0.1'].includes(hostname) || /\.aem\.(page|live)$/.test(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);

const STATES = {
  unreviewed: 'Not reviewed yet',
  'in-review': 'In review',
  'waiting-aoe': 'Waiting for the AOE team',
  'waiting-customer': 'Waiting for the customer',
  approved: 'Approved as is',
  resolved: 'Resolved',
  skipped: 'Skipped: not migrated',
};
const chip = (state) => el('span', { class: `ln-chip st-${state}` }, STATES[state]);

const CARDS = [
  {
    key: 'review',
    href: './index.html',
    title: 'Review tool',
    cta: 'Start reviewing',
    text: 'One page at a time, next to the original stryker.com page (a snapshot, or rendered live), at every width. Comment, pin QA notes, approve.',
  },
  {
    key: 'status',
    href: './status.html',
    title: 'Status page',
    cta: 'See every page',
    text: 'Every page of the review with its status, its batch and group, and what happened last. Your list of what to review next.',
  },
  {
    key: 'summary',
    href: './summary.html',
    title: 'Summary',
    cta: 'Open the summary',
    text: 'Everything said and decided so far, in one place: progress, comments, QA notes with the answers. Downloads for a spreadsheet.',
  },
  {
    key: 'invites',
    href: './invites.html',
    title: 'Invitations',
    cta: 'Manage links',
    aoe: true,
    text: 'The AOE team makes and withdraws the review links of the people taking part.',
  },
];

const FLOW = [
  {
    who: 'aoe',
    title: 'Pages are published and organised',
    state: ['unreviewed'],
    text: 'The AOE team publishes the migrated pages, puts them in review batches, groups the pages built exactly the same way (one representative each), and sends you your review link.',
  },
  {
    who: 'customer',
    title: 'Review a page',
    state: ['in-review'],
    text: 'Open your batch on the status page, then each page in the review tool: compare it with the original at every width. Write in the page\'s chat, or pin a QA note on the spot that is wrong.',
  },
  {
    who: 'customer',
    title: 'Approve it, or send it to the AOE team',
    state: ['approved', 'waiting-aoe', 'skipped'],
    text: 'Right as it is: Approve. Something to change: Send to the AOE team. Not to be migrated: Skip. Approving a group\'s representative approves the whole group.',
  },
  {
    who: 'aoe',
    title: 'Answer and fix',
    state: ['waiting-customer'],
    text: 'The AOE team answers in the chats (in progress, done, won\'t do, and the release a fix ships in), fixes the page, and sends it back to you.',
  },
  {
    who: 'customer',
    title: 'Check and close',
    state: ['resolved'],
    text: 'Check the fix, tick the chats Done and approve: the page is Resolved. Not quite there? Say why and send it to the AOE team again.',
  },
];

function drawCards(role) {
  $('.ln-cards').replaceChildren(...CARDS.filter((c) => !c.aoe || role === 'aoe').map((c) => el(
    'a',
    {
      class: `ln-card ln-card-${c.key}`, href: c.href, target: '_blank', rel: 'noopener',
    },
    el('span', { class: 'ln-card-icon' }, icon(ICONS[c.key])),
    el('span', { class: 'ln-card-title' }, c.title, c.aoe ? el('span', { class: 'ln-tag' }, 'AOE team') : null),
    el('span', { class: 'ln-card-text' }, c.text),
    el('span', { class: 'ln-card-cta' }, c.cta, ' →'),
  )));
}

function drawFlow() {
  $('.ln-flow').replaceChildren(...FLOW.map((s, i) => el(
    'li',
    { class: `ln-step ln-who-${s.who}` },
    el('span', { class: 'ln-step-n' }, String(i + 1)),
    el(
      'div',
      { class: 'ln-step-body' },
      el('span', { class: 'ln-step-who' }, s.who === 'aoe' ? 'AOE team' : 'Customer'),
      el('h3', { class: 'ln-step-title' }, s.title),
      el('p', { class: 'ln-step-text' }, s.text),
      el('div', { class: 'ln-step-states' }, ...s.state.map(chip)),
    ),
  )));
  $('.ln-legend').replaceChildren(...Object.keys(STATES).map(chip));
}

/** the numbers: pages of the review (published), and how many are in each state */
function drawStats(role, pages, states) {
  const by = new Map(states.map((s) => [s.page, s.state]));
  const count = (fn) => pages.filter((p) => fn(by.get(p.path) || 'unreviewed')).length;
  const mine = role === 'aoe' ? 'waiting-aoe' : 'waiting-customer';
  const tiles = [
    ['Pages in your review', pages.length, 'ln-tile-total'],
    ['Waiting for you', count((s) => s === mine || (role !== 'aoe' && s === 'unreviewed')), 'ln-tile-you'],
    [role === 'aoe' ? 'Waiting for the customer' : 'Waiting for the AOE team', count((s) => s === (role === 'aoe' ? 'waiting-customer' : 'waiting-aoe')), 'ln-tile-them'],
    ['In review', count((s) => s === 'in-review'), 'ln-tile-review'],
    ['Approved', count((s) => s === 'approved' || s === 'resolved'), 'ln-tile-done'],
  ];
  const done = pages.length ? Math.round((100 * count((s) => ['approved', 'resolved', 'skipped'].includes(s))) / pages.length) : 0;
  $('.ln-stats').replaceChildren(
    ...tiles.map(([label, n, cls]) => el('div', { class: `ln-tile ${cls}` }, el('span', { class: 'ln-tile-n' }, String(n)), el('span', { class: 'ln-tile-label' }, label))),
    el(
      'div',
      { class: 'ln-progress', role: 'img', 'aria-label': `${done}% of the pages approved or skipped` },
      el('span', { class: 'ln-progress-label' }, `${done}% done`),
      el('span', { class: 'ln-progress-bar' }, el('span', { class: 'ln-progress-fill', style: `width: ${done}%` })),
    ),
  );
}

async function start() {
  if (!PREVIEW) {
    $('.ln-blocked').hidden = false;
    return;
  }
  // the invitation is kept in the browser, not in the address bar
  if (inviteToken() && new URLSearchParams(window.location.search).has('invite')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState(null, '', url);
  }
  document.title = `${REVIEW.title}: start`;
  $('.ln-title').textContent = REVIEW.title;
  const help = mountHelp('launch', $('.ln-bar'));
  drawFlow();
  drawCards('reviewer');
  // (the tiles' places at once: the numbers follow when the review is read, the page doesn't jump)
  $('.ln-stats').replaceChildren(...['Pages in your review', 'Waiting for you', 'Waiting for the other side', 'In review', 'Approved']
    .map((label) => el('div', { class: 'ln-tile ln-tile-wait' }, el('span', { class: 'ln-tile-n' }, '…'), el('span', { class: 'ln-tile-label' }, label))));
  let pages = null;
  const load = async () => {
    const { status, body } = await call('overview');
    if (status !== 200) {
      $('.ln-hello').textContent = body?.error?.message || 'Open this page with your review link to see where the review stands.';
      $('.ln-stats').hidden = true;
      return;
    }
    const role = body.role || 'reviewer';
    help.setRole(role);
    drawCards(role);
    $('.ln-hello').replaceChildren('Welcome, ', el('b', {}, body.reviewer), role === 'aoe' ? el('span', { class: 'ln-role' }, 'AOE team') : el('span', { class: 'ln-role ln-role-customer' }, 'Reviewer'));
    $('.ln-cta').replaceChildren(
      el('a', {
        class: 'ln-btn ln-btn-primary', href: './status.html', target: '_blank', rel: 'noopener',
      }, role === 'aoe' ? 'See every page' : 'See my pages'),
      el('a', {
        class: 'ln-btn', href: './index.html', target: '_blank', rel: 'noopener',
      }, 'Open the review tool'),
    );
    pages = pages || (await loadPages()).filter((p) => p.published !== false);
    drawStats(role, pages, body.pages || []);
  };
  await load();
  // kept up to date (live.js)
  keepFresh(load);
}

start();
