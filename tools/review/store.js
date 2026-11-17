/*
 * Review tool: saving and loading the review state, in the review backend on App Builder
 * (tools/review/backend): reviewers open the tool with their invitation link (`?invite=`), which
 * the browser keeps; the reviewer's name comes from it. Changes are saved at once, each with the
 * rev it started from (a change someone else made meanwhile is a conflict, never overwritten).
 * Until the backend has a change it stays in the browser (pending) and counts as saved here.
 * Row: page, item (block id, section id, `page`, `note:<id>`, `group:<key>`), kind, value (JSON),
 * reviewer, time (ISO), rev. (The pilot's Google Sheet route was retired on 2026-11-17.)
 */

export const CONFIG = {
  // where the tool runs for reviewers (links in the summary, invitations)
  toolHost: 'standardise-v3--stryker-com--strykerenterprise.aem.page',
  // the review backend (App Builder web actions, Stage workspace)
  backend: 'https://892544-strykerstdreview-stage.adobeioruntime.net/api/v1/web/std-review',
};
const ID = '__id__';
const INVITE_KEY = 'std-review-invite';
const PENDING_KEY = 'std-review-pending-backend';

/** CSV text → rows of fields (quoted fields, doubled quotes, line breaks inside quotes) */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const decode = (v) => {
  try {
    return JSON.parse(v);
  } catch (e) {
    return v;
  }
};

/** the latest row per item + kind (rows sorted by time; later wins) */
export function merge(rows) {
  const state = new Map();
  [...rows].sort((a, b) => (a.time < b.time ? -1 : 1)).forEach((r) => {
    state.set(`${r.item}|${r.kind}`, {
      item: r.item,
      kind: r.kind,
      value: decode(r.value),
      reviewer: r.reviewer,
      time: r.time,
      role: r.role,
    });
  });
  return state;
}

/** the invitation token: from the link (kept in the browser), else the one kept earlier */
export function inviteToken() {
  const invite = new URLSearchParams(window.location.search).get('invite');
  if (invite) window.localStorage.setItem(INVITE_KEY, invite);
  return window.localStorage.getItem(INVITE_KEY) || '';
}

async function call(path, opts = {}) {
  const resp = await fetch(`${CONFIG.backend}/${path}`, {
    ...opts,
    headers: { 'x-review-invite': inviteToken(), ...(opts.body ? { 'content-type': 'application/json' } : {}) },
  });
  let body = null;
  try {
    body = await resp.json();
  } catch (e) {
    body = null;
  }
  return { status: resp.status, body };
}

const MESSAGES = {
  'no-invite': 'Open the tool with your review link to save',
  'bad-invite': 'This review link is not valid: ask for a new one',
  expired: 'Your review link has expired: ask for a new one',
  revoked: 'Your review link was withdrawn: ask for a new one',
  'out-of-scope': 'This page is not part of your review',
  'no-results': 'Your review link does not include the results',
};

export function createStore(onStatus = () => {}) {
  // (kept from the link at once: the tool rewrites the address bar before its first request)
  inviteToken();
  const pending = () => {
    try {
      return JSON.parse(window.localStorage.getItem(PENDING_KEY)) || [];
    } catch (e) {
      return [];
    }
  };
  const keep = (rows) => window.localStorage.setItem(PENDING_KEY, JSON.stringify(rows));
  // the stored rev of every entry seen (`page|item|kind`), sent back with a change
  const revs = new Map();
  // the changes this visit is sending (any other pending change was interrupted)
  const inflight = new Set();
  let page = '';
  let sending = 0;
  let problem = '';
  let resolveIdentity;
  const identity = new Promise((resolve) => {
    resolveIdentity = resolve;
  });
  const status = () => {
    const failed = pending().filter((r) => r.failed).length;
    if (sending) onStatus('saving', `Saving… (${sending})`);
    else if (problem) onStatus('failed', problem);
    else if (failed) onStatus('failed', `${failed} change${failed > 1 ? 's' : ''} not saved`);
    else onStatus('saved', 'All changes saved');
  };
  async function send(rows) {
    if (!rows.length) return;
    rows.forEach((r) => inflight.add(r[ID]));
    sending += rows.length;
    status();
    let result = null;
    try {
      const { status: code, body } = await call('save', {
        method: 'POST',
        body: JSON.stringify({
          page: rows[0].sentFrom,
          changes: rows.map((r) => ({
            page: r.page === '*' ? '*' : undefined,
            item: r.item,
            kind: r.kind,
            value: r.value,
            rev: revs.get(`${r.page}|${r.item}|${r.kind}`) || 0,
          })),
        }),
      });
      if (code === 200) result = body.results;
      else problem = MESSAGES[body?.error?.code] || `Could not save (${code})`;
    } catch (e) {
      problem = 'Could not reach the review service';
    }
    const ids = new Set(rows.map((r) => r[ID]));
    let conflicts = 0;
    const rest = pending().filter((r) => {
      if (!ids.has(r[ID])) return true;
      const i = rows.findIndex((x) => x[ID] === r[ID]);
      const res = result?.[i];
      if (res?.ok) {
        revs.set(`${r.page}|${r.item}|${r.kind}`, res.rev);
        return false;
      }
      // someone else changed it meanwhile: this change is dropped, the reload shows theirs
      if (res?.conflict) {
        conflicts += 1;
        return false;
      }
      Object.assign(r, { failed: true });
      return true;
    });
    keep(rest);
    rows.forEach((r) => inflight.delete(r[ID]));
    if (conflicts) problem = `${conflicts} change${conflicts > 1 ? 's were' : ' was'} changed by someone else meanwhile: reload the page to see it`;
    sending -= rows.length;
    status();
  }

  // the changes of one Save go out in one request
  let queue = [];
  const flush = () => {
    const rows = queue;
    queue = [];
    send(rows);
  };

  async function load(path) {
    page = path;
    let rows = [];
    try {
      const { status: code, body } = await call(`state?page=${encodeURIComponent(path)}`);
      if (code === 200) {
        problem = '';
        resolveIdentity({
          name: body.reviewer, role: body.role || 'reviewer', scope: body.scope, expires: body.expires,
        });
        rows = body.rows;
        rows.forEach((r) => revs.set(`${r.page}|${r.item}|${r.kind}`, r.rev));
        // changes of this page still waiting from an earlier visit (the tab was closed while they
        // were sent, or sending failed): sent again, with the revs just read
        const waiting = pending().filter((r) => r.sentFrom === path && !inflight.has(r[ID]));
        if (waiting.length) send(waiting);
      } else {
        problem = MESSAGES[body?.error?.code] || 'Could not read the saved reviews';
        if (code === 401) resolveIdentity(null);
      }
    } catch (e) {
      problem = 'Could not reach the review service';
    }
    status();
    const mine = pending().filter((r) => r.page === path || r.page === '*');
    return merge([...rows, ...mine]);
  }

  function save({
    page: rowPage, item, kind, value,
  }) {
    const row = {
      [ID]: (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      page: rowPage,
      item,
      kind,
      value: JSON.stringify(value),
      time: new Date().toISOString(),
      sentFrom: page,
    };
    keep([...pending(), row]);
    if (!queue.length) window.setTimeout(flush, 0);
    queue.push(row);
    return {
      item, kind, value, reviewer: 'you', time: row.time,
    };
  }

  async function retry() {
    problem = '';
    const again = pending().filter((r) => r.failed);
    const byPage = new Map();
    again.forEach((r) => {
      if (!byPage.has(r.sentFrom)) byPage.set(r.sentFrom, []);
      byPage.get(r.sentFrom).push(r);
    });
    await [...byPage.values()]
      .reduce((chain, rows) => chain.then(() => send(rows)), Promise.resolve());
  }

  return {
    load, save, retry, status, identity, busy: () => sending > 0 || queue.length > 0,
  };
}

/** every row the invitation may see (the results page: an invitation with the results right) */
export async function readAll() {
  const { status, body } = await call('results');
  if (status !== 200) {
    const err = new Error(MESSAGES[body?.error?.code] || body?.error?.message || `results: ${status}`);
    err.code = body?.error?.code;
    throw err;
  }
  return body.rows;
}
