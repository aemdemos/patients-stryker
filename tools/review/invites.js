/*
 * Review tool: the AOE team's invitations (backend web action `invites`): make invitations for
 * reviewers and for the AOE team, see every invitation of this review (who made it, its pages,
 * until when, its state) and revoke one. AOE invitations only. A new link is shown once, here: the
 * backend keeps no tokens.
 */
import { call, inviteToken } from './store.js';
import { REVIEW } from './config.js';
import { mountBar } from './bar.js';
import ask, { askMessage } from './ask.js';

const { hostname } = window.location;
const LOCAL = ['localhost', '127.0.0.1'].includes(hostname) || /^preview-aemcoder\.adobe\.io$/.test(hostname);
// (the published site too since the DA sign-in, 27 Nov 2026: the reviewers' host)
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
const STATES = { active: 'Active', expired: 'Expired', revoked: 'Revoked' };

let invites = [];
let myPaths = ['/'];
// the table is drawn further down; a revoke redraws it through this
const hooks = { draw: () => {} };

/** a link with a Copy button */
const linkRow = (label, url) => {
  const input = el('input', {
    type: 'text', readonly: '', value: url, 'aria-label': label,
  });
  return el(
    'div',
    { class: 'iv-link' },
    el('b', {}, label),
    input,
    el('button', {
      type: 'button',
      class: 'rs-btn',
      onclick: async (e) => {
        input.select();
        try {
          await navigator.clipboard.writeText(url);
          e.target.textContent = 'Copied';
        } catch (err) {
          e.target.textContent = 'Select and copy';
        }
      },
    }, 'Copy'),
  );
};

/**
 * Revoke, asked first in the tool's one confirmation (ask.js): a revoked link stops working at
 * once and can't be brought back
 */
function revokeCell(i) {
  const cell = el('div', { class: 'iv-revoke-cell' });
  const revoke = async (button) => {
    const message = askMessage({
      head: `Revoke the invitation of ${i.name}?`,
      foot: 'Their link stops working at once, for good. What they wrote in the review stays.',
    });
    if (!(await ask(message, [['Revoke', true, 'danger'], ['Cancel', false]]))) return;
    Object.assign(button, { disabled: true });
    const { status, body } = await call('invites', { method: 'POST', body: JSON.stringify({ op: 'revoke', id: i.id }) });
    if (status !== 200) {
      cell.replaceChildren(el('span', { class: 'iv-error' }, body?.error?.message || `Failed (${status})`));
      return;
    }
    Object.assign(i, body.invite);
    hooks.draw();
  };
  cell.append(el('button', {
    type: 'button',
    class: 'rs-btn iv-revoke',
    onclick: (e) => revoke(e.currentTarget),
  }, 'Revoke'));
  return cell;
}

function draw() {
  const q = $('.iv-search').value.trim().toLowerCase();
  const all = $('.iv-all').checked;
  const list = invites.filter((i) => (all || i.state === 'active') && (!q || i.name.toLowerCase().includes(q)));
  const active = invites.filter((i) => i.state === 'active').length;
  $('.iv-count').textContent = `${list.length} shown · ${active} active of ${invites.length}`;
  const head = ['Name', 'Role', 'Pages', 'Made', 'Valid until', 'State', ''];
  const rows = list.map((i) => el(
    'tr',
    {},
    el('td', {}, i.name, i.me ? el('span', { class: 'iv-me' }, ' (you)') : null),
    el('td', {}, el('span', { class: `ui-role ui-role-${i.role === 'aoe' ? 'aoe' : 'reviewer'}` }, i.role === 'aoe' ? 'AOE team' : 'Reviewer')),
    el('td', {}, i.paths.join(', ')),
    el('td', {}, `${day(i.created)}${i.createdBy ? ` by ${i.createdBy}` : ''}`),
    el('td', {}, day(i.expires)),
    el(
      'td',
      {},
      el('span', { class: `iv-state iv-state-${i.state}` }, STATES[i.state]),
      i.state === 'revoked' && (i.revokedBy || i.revokedAt) ? el('br') : null,
      i.state === 'revoked' && (i.revokedBy || i.revokedAt) ? el('small', { class: 'rs-muted' }, `${when(i.revokedAt)}${i.revokedBy ? ` by ${i.revokedBy}` : ''}`) : null,
    ),
    el('td', {}, i.state === 'active' && !i.me ? revokeCell(i) : null),
  ));
  $('.iv-table').replaceChildren(list.length
    ? el('table', {}, el('thead', {}, el('tr', {}, ...head.map((h) => el('th', {}, h)))), el('tbody', {}, ...rows))
    : el('p', { class: 'rs-muted' }, 'No invitations to show.'));
}
hooks.draw = draw;

let bar = null;
async function load() {
  const { status, body } = await call('invites');
  if (status !== 200) {
    const denied = $('.iv-denied');
    denied.hidden = false;
    denied.textContent = status === 403
      ? 'Only the AOE team manages the invitations: open this page with an AOE review link.'
      : 'Open this page with your review link (from the review tool) to manage the invitations.';
    $('.rs-updated').textContent = '';
    return false;
  }
  invites = body.invites;
  const mine = invites.find((i) => i.me);
  myPaths = mine?.paths?.length ? mine.paths : ['/'];
  $('.rs-updated').textContent = `Last read ${when(new Date().toISOString())}`;
  bar?.setRole('aoe', mine?.name);
  draw();
  return true;
}

async function start() {
  if (!PREVIEW) {
    $('.rs-blocked').hidden = false;
    return;
  }
  document.title = `${REVIEW.title}: invitations`;
  inviteToken();
  bar = mountBar('invites', $('.rs-bar'));
  if (!(await load())) return;
  $('.iv-new').hidden = false;
  $('.iv-list').hidden = false;
  $('.iv-paths').value = myPaths.join('\n');
  $('.iv-search').addEventListener('input', draw);
  $('.iv-all').addEventListener('change', draw);
  $('.iv-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const made = $('.iv-made');
    const paths = $('.iv-paths').value.split('\n').map((p) => p.trim()).filter(Boolean);
    $('.iv-create').disabled = true;
    made.replaceChildren(el('p', {}, 'Creating…'));
    const { status, body } = await call('invites', {
      method: 'POST',
      body: JSON.stringify({
        op: 'create',
        name: $('.iv-name').value,
        role: $('.iv-role input:checked').value,
        days: Number($('.iv-days').value),
        paths,
      }),
    });
    $('.iv-create').disabled = false;
    if (status !== 200) {
      made.replaceChildren(el('p', { class: 'iv-error' }, body?.error?.message || `The invitation could not be made (${status}).`));
      return;
    }
    const { invite } = body;
    made.replaceChildren(...[
      el('p', {}, el('b', {}, `Invitation for ${invite.name}`), ` (${invite.scope.role === 'aoe' ? 'AOE team' : 'reviewer'}, until ${day(invite.expires)}). Copy the link now and send it to them only: it is shown once and works like a password.`),
      linkRow('Review tool', invite.link),
      linkRow('Summary', invite.summary || invite.results),
    ].filter(Boolean));
    $('.iv-name').value = '';
    await load();
  });
}

start();
