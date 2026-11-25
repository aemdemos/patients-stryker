/*
 * The review's start page (launch.html, 25 Nov 2026): where invitation links open. Who you are
 * (from the link), where the review stands (kept up to date, live.js), the tools of the review
 * with what each one is for, and the way of working between the reviewers and the AOE team, with
 * the statuses in their colours (the AOE team in Adobe red, reviewers in blue).
 * DOM only (no innerHTML).
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
  'waiting-customer': 'Waiting for the reviewer',
  approved: 'Approved as is',
  resolved: 'Resolved',
  skipped: 'Skipped: not migrated',
};
const chip = (state) => el('span', { class: `ln-chip st-${state}` }, STATES[state]);

const CARDS = [
  {
    key: 'summary',
    href: './summary.html',
    title: 'Summary',
    cta: 'Open the summary',
    text: 'Everything said and decided so far, in one place: progress, comments, QA notes with the answers. Downloads for a spreadsheet.',
  },
  {
    key: 'status',
    href: './status.html',
    title: 'Status page',
    cta: 'See every page',
    text: 'Every page of the review with its status, its batch and group, and what happened last. Your list of what to review next.',
  },
  {
    key: 'review',
    href: './index.html',
    title: 'Review tool',
    cta: 'Start reviewing',
    text: 'One page at a time, next to the original stryker.com page (a snapshot, or rendered live), at every width. Comment, pin QA notes, approve.',
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
    text: 'The AOE team publishes the migrated pages, puts them in review batches, groups the pages built exactly the same way (one representative each), and sends each person taking part their own review link: one personal link per person (not one per page), which opens this start page and every page of the review they are invited to.',
  },
  {
    who: 'reviewer',
    title: 'Review a page',
    state: ['in-review'],
    text: 'The reviewer opens a batch on the status page, then each page in the review tool, and compares it with the original at every width: a message in the page\'s chat, or a QA note pinned on the spot that is wrong.',
  },
  {
    who: 'reviewer',
    title: 'Approve it, or send it to the AOE team',
    state: ['approved', 'waiting-aoe', 'skipped'],
    text: 'Right as it is: Approve. Something to change: Send to the AOE team. Not to be migrated: Skip. Approving a group\'s representative approves the whole group.',
  },
  {
    who: 'aoe',
    title: 'Answer and fix',
    state: ['waiting-customer'],
    text: 'The AOE team answers in the chats (in progress, done, won\'t do), fixes the page, and sends it back to the reviewer.',
  },
  {
    who: 'reviewer',
    title: 'Check and close',
    state: ['resolved'],
    text: 'The reviewer checks the fix, ticks the chats Done and approves: the page is Resolved. Not quite there? Say why and send it to the AOE team again.',
  },
];

let cardsFor = null;
function drawCards(role) {
  // (drawn again only when the role changes: a card being hovered is not replaced)
  if (cardsFor === role) return;
  cardsFor = role;
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
      el('span', { class: 'ln-step-who' }, s.who === 'aoe' ? 'AOE team' : 'Reviewer'),
      el('h3', { class: 'ln-step-title' }, s.title),
      el('p', { class: 'ln-step-text' }, s.text),
      el('div', { class: 'ln-step-states' }, ...s.state.map(chip)),
    ),
  )));
  $('.ln-legend').replaceChildren(...Object.keys(STATES).map(chip));
}

const TILES = ['Pages in the review', STATES['waiting-aoe'], STATES['waiting-customer'], 'In review', 'Approved'];
let statsKey = '';
/** the numbers: pages of the review (published), how many in each state (same for both sides) */
function drawStats(pages, states) {
  const by = new Map(states.map((s) => [s.page, s.state]));
  const count = (fn) => pages.filter((p) => fn(by.get(p.path) || 'unreviewed')).length;
  const tiles = [
    [TILES[0], pages.length, 'ln-tile-total'],
    [TILES[1], count((s) => s === 'waiting-aoe'), 'ln-tile-aoe'],
    [TILES[2], count((s) => s === 'waiting-customer'), 'ln-tile-reviewer'],
    [TILES[3], count((s) => s === 'in-review'), 'ln-tile-review'],
    [TILES[4], count((s) => s === 'approved' || s === 'resolved'), 'ln-tile-done'],
  ];
  const done = pages.length ? Math.round((100 * count((s) => ['approved', 'resolved', 'skipped'].includes(s))) / pages.length) : 0;
  // (drawn again only when a number changes)
  const key = `${tiles.map((t) => t[1]).join()}|${done}`;
  if (key === statsKey) return;
  statsKey = key;
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
  $('.ln-stats').replaceChildren(...TILES
    .map((label) => el('div', { class: 'ln-tile ln-tile-wait' }, el('span', { class: 'ln-tile-n' }, '…'), el('span', { class: 'ln-tile-label' }, label))));
  let pages = null;
  let helloFor = null;
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
    if (helloFor !== `${role}|${body.reviewer}`) {
      helloFor = `${role}|${body.reviewer}`;
      $('.ln-hello').replaceChildren('Welcome, ', el('b', {}, body.reviewer), el('span', { class: `ln-role ln-role-${role === 'aoe' ? 'aoe' : 'reviewer'}` }, role === 'aoe' ? 'AOE team' : 'Reviewer'));
      // in the order of the work: the summary, the list of pages, the review tool on each page
      const btn = (cls, href, text) => el('a', {
        class: `ln-btn ${cls}`, href, target: '_blank', rel: 'noopener',
      }, text);
      $('.ln-cta').replaceChildren(
        btn('ln-btn-primary', './summary.html', 'Get the Summary'),
        btn('ln-btn-primary', './status.html', role === 'aoe' ? 'See every page' : 'See my pages'),
        btn('', './index.html', 'Open the review tool'),
      );
    }
    pages = pages || (await loadPages()).filter((p) => p.published !== false);
    drawStats(pages, body.pages || []);
  };
  await load();
  // kept up to date (live.js)
  keepFresh(load);
}

start();
