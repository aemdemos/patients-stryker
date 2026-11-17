/*
 * Review tool: saving and loading the review state. Each change is one row appended to the review
 * Google Sheet (`incoming` tab) by Adobe's form submission service; the state is read back from
 * the sheet's CSV export (no sign-in; a new row shows within about a minute). Until a row shows
 * there, it stays in the browser (pending) and counts as saved for this reviewer.
 * Row: __id__, page, item (block id or `page`), kind, value (JSON), reviewer, time (ISO).
 * The second store, the review backend on App Builder (tools/review/backend), is used when the
 * tool is opened with an invitation link (`?invite=`) or `?store=backend`; `?store=sheet` goes
 * back to the sheet.
 */

export const CONFIG = {
  sheet: '1YY_9uQPsvceiui3HQEqjeA8Gvf5JN-zq-eUTeAp0aso',
  gid: 0,
  // the form definition, read by the service from a host anyone can read (the branch preview)
  formPath: '/tools/review/review-form.json',
  formHost: 'standardise-v3--stryker-com--strykerenterprise.aem.page',
  submit: 'https://forms.adobe.com/adobe/forms/af/submit/',
  // the review backend (App Builder web actions, Stage workspace)
  backend: 'https://892544-strykerstdreview-stage.adobeioruntime.net/api/v1/web/std-review',
};
const PENDING_KEY = 'std-review-pending';
// the sheet's row id column (the form service's own field name)
const ID = '__id__';
const FIELDS = [ID, 'page', 'item', 'kind', 'value', 'reviewer', 'time'];

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

const pendingAll = () => {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY)) || [];
  } catch (e) {
    return [];
  }
};
const keepPending = (rows) => window.localStorage.setItem(PENDING_KEY, JSON.stringify(rows));

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
      item: r.item, kind: r.kind, value: decode(r.value), reviewer: r.reviewer, time: r.time,
    });
  });
  return state;
}

/** every row of the review sheet (its CSV export) */
export async function readSheet() {
  const resp = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheet}/export?format=csv&gid=${CONFIG.gid}&ck=${Date.now()}`);
  if (!resp.ok) throw new Error(`sheet: ${resp.status}`);
  const rows = parseCsv(await resp.text());
  const head = rows.shift() || [];
  const at = Object.fromEntries(FIELDS.map((f) => [f, head.indexOf(f)]));
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(FIELDS.map((f) => [f, r[at[f]] ?? ''])));
}

/** every row: the sheet's and this browser's not yet in it */
export async function readAll() {
  const remote = await readSheet();
  const seen = new Set(remote.map((r) => r[ID]));
  return [...remote, ...pendingAll().filter((r) => !seen.has(r[ID]))];
}

function createSheetStore(onStatus = () => {}) {
  let sending = 0;
  let failed = 0;
  const status = () => {
    if (sending) onStatus('saving', `Saving… (${sending})`);
    else if (failed) onStatus('failed', `${failed} change${failed > 1 ? 's' : ''} not saved`);
    else onStatus('saved', 'All changes saved');
  };

  /** every saved row of a page (sheet + this browser's pending ones), merged */
  async function load(page) {
    let remote = [];
    try {
      remote = await readSheet();
    } catch (e) {
      onStatus('failed', 'Could not read the saved reviews');
    }
    const seen = new Set(remote.map((r) => r[ID]));
    // pending rows the sheet now has are done
    const pending = pendingAll().filter((r) => !seen.has(r[ID]));
    keepPending(pending);
    failed = pending.filter((r) => r.failed).length;
    status();
    // (`*`: rows for every page, e.g. a group's choice)
    return merge([...remote, ...pending].filter((r) => r.page === page || r.page === '*'));
  }

  async function send(row) {
    sending += 1;
    status();
    let ok = false;
    try {
      const data = Object.fromEntries(FIELDS.map((f) => [f, row[f]]));
      const resp = await fetch(`${CONFIG.submit}${btoa(CONFIG.formPath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-adobe-form-hostname': CONFIG.formHost },
        body: JSON.stringify({ data }),
      });
      ok = resp.ok;
    } catch (e) {
      ok = false;
    }
    const all = pendingAll();
    const mine = all.find((r) => r[ID] === row[ID]);
    if (mine) mine.failed = !ok;
    keepPending(all);
    sending -= 1;
    failed = all.filter((r) => r.failed).length;
    status();
    return ok;
  }

  /** saves one change; it counts at once (pending), the sheet has it within about a minute */
  function save({
    page, item, kind, value, reviewer,
  }) {
    const row = {
      [ID]: (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      page,
      item,
      kind,
      value: JSON.stringify(value),
      reviewer,
      time: new Date().toISOString(),
    };
    keepPending([...pendingAll(), row]);
    send(row);
    return {
      item, kind, value, reviewer, time: row.time,
    };
  }

  /** sends again the changes that could not be saved */
  async function retry() {
    const again = pendingAll().filter((r) => r.failed);
    await again.reduce((chain, r) => chain.then(() => send(r)), Promise.resolve());
  }

  return {
    load, save, retry, status,
  };
}

/* ---------- the review backend (App Builder) ---------- */

const INVITE_KEY = 'std-review-invite';
const MODE_KEY = 'std-review-store';
const BACKEND_PENDING_KEY = 'std-review-pending-backend';

/** which store the tool uses: an invitation link (or ?store=backend) chooses the backend */
export function storeMode() {
  const q = new URLSearchParams(window.location.search);
  const invite = q.get('invite');
  if (invite) {
    window.localStorage.setItem(INVITE_KEY, invite);
    window.localStorage.setItem(MODE_KEY, 'backend');
  }
  const asked = q.get('store');
  if (asked === 'backend' || asked === 'sheet') window.localStorage.setItem(MODE_KEY, asked);
  return window.localStorage.getItem(MODE_KEY) === 'backend' ? 'backend' : 'sheet';
}

const MESSAGES = {
  'no-invite': 'Open the tool with your review link to save',
  'bad-invite': 'This review link is not valid: ask for a new one',
  expired: 'Your review link has expired: ask for a new one',
  revoked: 'Your review link was withdrawn: ask for a new one',
  'out-of-scope': 'This page is not part of your review',
};

function createBackendStore(onStatus = () => {}) {
  const invite = () => window.localStorage.getItem(INVITE_KEY) || '';
  const pending = () => {
    try {
      return JSON.parse(window.localStorage.getItem(BACKEND_PENDING_KEY)) || [];
    } catch (e) {
      return [];
    }
  };
  const keep = (rows) => window.localStorage.setItem(BACKEND_PENDING_KEY, JSON.stringify(rows));
  // the stored rev of every entry seen (`page|item|kind`), sent back with a change
  const revs = new Map();
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
  const call = async (path, opts = {}) => {
    const resp = await fetch(`${CONFIG.backend}/${path}`, {
      ...opts,
      headers: { 'x-review-invite': invite(), ...(opts.body ? { 'content-type': 'application/json' } : {}) },
    });
    let body = null;
    try {
      body = await resp.json();
    } catch (e) {
      body = null;
    }
    return { status: resp.status, body };
  };

  async function load(path) {
    page = path;
    let rows = [];
    try {
      const { status: code, body } = await call(`state?page=${encodeURIComponent(path)}`);
      if (code === 200) {
        problem = '';
        resolveIdentity({ name: body.reviewer, scope: body.scope, expires: body.expires });
        rows = body.rows;
        rows.forEach((r) => revs.set(`${r.page}|${r.item}|${r.kind}`, r.rev));
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

  async function send(rows) {
    if (!rows.length) return;
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
    load, save, retry, status, identity, mode: 'backend',
  };
}

/** the store the tool uses (see storeMode) */
export function createStore(onStatus = () => {}) {
  return storeMode() === 'backend' ? createBackendStore(onStatus) : { ...createSheetStore(onStatus), mode: 'sheet' };
}
