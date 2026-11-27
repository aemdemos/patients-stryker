/*
 * Review tool: the people of the review (branch da-app-v3, 27 Nov 2026; backend web action
 * `people`), for the AOE team, instead of invitation links. Add a person (the email of their
 * Adobe account, name, role, pages), change their role or pages, remove them (asked first, in the
 * tool's one confirmation, ask.js: their access ends at once, what they wrote stays). One's own
 * entry can't be removed or made a reviewer.
 */
import { call, sessionToken, signInUrl } from './store.js';
import { REVIEW } from './config.js';
import { mountBar } from './bar.js';
import ask, { askMessage } from './ask.js';

const { hostname } = window.location;
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
const PREVIEW = LOCAL || /\.aem\.(page|live)$/.test(hostname);
const $ = (sel) => document.querySelector(sel);

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
const day = (t) => (t ? new Date(t).toLocaleDateString([], { dateStyle: 'medium' }) : '');
const roleChip = (role) => el('span', { class: `ui-role ui-role-${role === 'aoe' ? 'aoe' : 'reviewer'}` }, role === 'aoe' ? 'AOE team' : 'Reviewer');
const pathsOf = (text) => text.split('\n').map((p) => p.trim()).filter(Boolean);

let people = [];
const hooks = { draw: () => {}, load: async () => {} };

async function post(body) {
  return call('people', { method: 'POST', body: JSON.stringify(body) });
}

/** a person's row editor: role and pages */
function editor(p, cell) {
  const role = el('select', { class: 'pp-ed-role', 'aria-label': `Role of ${p.name}` }, ...['reviewer', 'aoe'].map((r) => el('option', { value: r, ...(p.role === r ? { selected: '' } : {}) }, r === 'aoe' ? 'AOE team' : 'Reviewer')));
  const paths = el('textarea', { class: 'pp-ed-paths', rows: '2', 'aria-label': `Pages of ${p.name}` });
  paths.value = p.paths.join('\n');
  const err = el('p', { class: 'iv-error', hidden: '' });
  cell.replaceChildren(el(
    'div',
    { class: 'pp-ed' },
    el('label', {}, 'Role ', role),
    el('label', {}, 'Pages ', paths),
    el(
      'div',
      {},
      el('button', {
        type: 'button',
        class: 'rs-btn pp-ed-save',
        onclick: async () => {
          const { status, body } = await post({
            op: 'change', email: p.email, role: role.value, paths: pathsOf(paths.value),
          });
          if (status !== 200) {
            err.hidden = false;
            err.textContent = body?.error?.message || `Not saved (${status}).`;
            return;
          }
          await hooks.load();
        },
      }, 'Save'),
      ' ',
      el('button', { type: 'button', class: 'rs-btn pp-ed-cancel', onclick: () => hooks.draw() }, 'Cancel'),
    ),
    err,
  ));
}

/** Remove, asked first: access ends at once */
async function remove(p) {
  const message = askMessage({
    head: `Remove ${p.name} from the review?`,
    parts: [{ title: p.email, items: [`${p.role === 'aoe' ? 'AOE team' : 'Reviewer'} · pages: ${p.paths.join(', ')}`] }],
    foot: 'Their sign-in stops working at once. What they wrote in the review stays; you can add them again later.',
  });
  if (!(await ask(message, [['Remove', true, 'danger'], ['Cancel', false]]))) return;
  const { status, body } = await post({ op: 'remove', email: p.email });
  if (status !== 200) {
    $('.pp-made').replaceChildren(el('p', { class: 'iv-error' }, body?.error?.message || `Not removed (${status}).`));
    return;
  }
  await hooks.load();
}

function draw() {
  const q = $('.pp-search').value.trim().toLowerCase();
  const all = $('.pp-all').checked;
  const list = people.filter((p) => (all || !p.removed) && (!q || `${p.name} ${p.email}`.toLowerCase().includes(q)));
  const active = people.filter((p) => !p.removed).length;
  $('.pp-count').textContent = `${list.length} shown · ${active} taking part${people.length > active ? `, ${people.length - active} removed` : ''}`;
  const head = ['Name', 'Email', 'Role', 'Pages', 'Added', ''];
  const rows = list.map((p) => {
    const actions = el('td', { class: 'pp-actions' });
    if (!p.removed && !p.me) {
      actions.append(
        el('button', { type: 'button', class: 'rs-btn pp-change', onclick: () => editor(p, actions) }, 'Change'),
        ' ',
        el('button', { type: 'button', class: 'rs-btn iv-revoke pp-remove', onclick: () => remove(p) }, 'Remove'),
      );
    }
    return el(
      'tr',
      { class: p.removed ? 'pp-removed' : '' },
      el('td', {}, p.name, p.me ? el('span', { class: 'iv-me' }, ' (you)') : null),
      el('td', {}, p.email),
      el('td', {}, roleChip(p.role)),
      el('td', {}, p.paths.join(', ')),
      el(
        'td',
        {},
        `${day(p.addedAt)}${p.addedBy ? ` by ${p.addedBy}` : ''}`,
        p.removed ? [el('br'), el('small', { class: 'rs-muted' }, `Removed ${when(p.removedAt)}${p.removedBy ? ` by ${p.removedBy}` : ''}`)] : null,
      ),
      actions,
    );
  });
  $('.pp-table').replaceChildren(list.length
    ? el('table', {}, el('thead', {}, el('tr', {}, ...head.map((h) => el('th', {}, h)))), el('tbody', {}, ...rows))
    : el('p', { class: 'rs-muted' }, 'No people to show.'));
}
hooks.draw = draw;

let bar = null;
async function load() {
  const { status, body } = await call('people');
  if (status !== 200) {
    const denied = $('.iv-denied');
    denied.hidden = false;
    denied.textContent = status === 403
      ? 'Only the AOE team manages the people of the review.'
      : 'Sign in to the review to manage its people.';
    $('.rs-updated').textContent = '';
    return false;
  }
  ({ people } = body);
  $('.rs-updated').textContent = `Last read ${when(new Date().toISOString())}`;
  bar?.setRole('aoe', people.find((p) => p.me)?.name);
  draw();
  return true;
}
hooks.load = load;

async function start() {
  if (!PREVIEW) {
    $('.rs-blocked').hidden = false;
    return;
  }
  document.title = `${REVIEW.title}: people`;
  sessionToken();
  bar = mountBar('people', $('.rs-bar'));
  if (!(await load())) return;
  $('.pp-new').hidden = false;
  $('.pp-list').hidden = false;
  const address = signInUrl('/tools/review/launch.html');
  $('.pp-address').href = address;
  $('.pp-address').textContent = address;
  $('.pp-search').addEventListener('input', draw);
  $('.pp-all').addEventListener('change', draw);
  $('.pp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const made = $('.pp-made');
    $('.pp-add').disabled = true;
    made.replaceChildren(el('p', {}, 'Adding…'));
    const { status, body } = await post({
      op: 'add',
      email: $('.pp-email').value,
      name: $('.pp-name').value,
      role: $('.pp-form input[name="pp-role"]:checked').value,
      paths: pathsOf($('.pp-paths').value),
    });
    $('.pp-add').disabled = false;
    if (status !== 200) {
      made.replaceChildren(el('p', { class: 'iv-error' }, body?.error?.message || `Not added (${status}).`));
      return;
    }
    made.replaceChildren(el('p', {}, el('b', {}, `${body.person.name} added`), ` (${body.person.email}, ${body.person.role === 'aoe' ? 'AOE team' : 'reviewer'}). Send them the review's address; they sign in with that Adobe account.`));
    $('.pp-email').value = '';
    $('.pp-name').value = '';
    await load();
  });
}

start();
