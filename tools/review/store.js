/*
 * Review tool: saving and loading the review state. Each change is one row appended to the review
 * Google Sheet (`incoming` tab) by Adobe's form submission service; the state is read back from
 * the sheet's CSV export (no sign-in; a new row shows within about a minute). Until a row shows
 * there, it stays in the browser (pending) and counts as saved for this reviewer.
 * Row: __id__, page, item (block id or `page`), kind, value (JSON), reviewer, time (ISO).
 */

export const CONFIG = {
  sheet: '1YY_9uQPsvceiui3HQEqjeA8Gvf5JN-zq-eUTeAp0aso',
  gid: 0,
  // the form definition, read by the service from a host anyone can read (the branch preview)
  formPath: '/tools/review/review-form.json',
  formHost: 'standardise-v3--stryker-com--strykerenterprise.aem.page',
  submit: 'https://forms.adobe.com/adobe/forms/af/submit/',
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
function merge(rows) {
  const state = new Map();
  [...rows].sort((a, b) => (a.time < b.time ? -1 : 1)).forEach((r) => {
    state.set(`${r.item}|${r.kind}`, {
      item: r.item, kind: r.kind, value: decode(r.value), reviewer: r.reviewer, time: r.time,
    });
  });
  return state;
}

export function createStore(onStatus = () => {}) {
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
      const resp = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheet}/export?format=csv&gid=${CONFIG.gid}&ck=${Date.now()}`);
      const rows = parseCsv(await resp.text());
      const head = rows.shift() || [];
      const at = Object.fromEntries(FIELDS.map((f) => [f, head.indexOf(f)]));
      remote = rows.map((r) => Object.fromEntries(FIELDS.map((f) => [f, r[at[f]] ?? ''])));
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
