/*
 * Metadata Rules Block
 * Renders the per-URL nav/footer mapping table live from the site's
 * `metadata.json` spreadsheet, so this authoring-guide doc always reflects the
 * mapping of whichever environment it is viewed on (preview vs. live) with zero
 * manual upkeep.
 *
 * Authoring contract: a single-cell block. An optional cell value overrides the
 * default metadata source path (`/metadata.json`).
 */

const DEFAULT_SOURCE = '/metadata.json';

// columns we surface, in display order; keyed by the metadata.json column names
const COLUMNS = [
  { key: 'URL', label: 'URL pattern' },
  { key: 'nav', label: 'Header (nav)' },
  { key: 'footer', label: 'Footer' },
];

// render a single cell value; empty -> a muted "(inherited / default)" note so
// authors can tell a blank rule apart from a missing one
function renderValue(td, value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    const em = document.createElement('em');
    em.className = 'metadata-rules-empty';
    em.textContent = '— (default)';
    td.append(em);
    return;
  }
  // a leading-slash value is a fragment path; render it as inline code
  if (trimmed.startsWith('/')) {
    const code = document.createElement('code');
    code.textContent = trimmed;
    td.append(code);
  } else {
    td.textContent = trimmed;
  }
}

function buildTable(rows) {
  const table = document.createElement('table');
  table.className = 'metadata-rules-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  COLUMNS.forEach(({ label }) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    COLUMNS.forEach(({ key }) => {
      const td = document.createElement('td');
      td.className = `metadata-rules-col-${key.toLowerCase()}`;
      renderValue(td, row[key]);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  return table;
}

function renderMessage(text, isError = false) {
  const p = document.createElement('p');
  p.className = isError ? 'metadata-rules-error' : 'metadata-rules-note';
  p.textContent = text;
  return p;
}

/**
 * loads and decorates the metadata-rules block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // an optional authored cell value overrides the default source path
  const authored = block.textContent.trim();
  const source = authored && authored.startsWith('/') ? authored : DEFAULT_SOURCE;

  block.textContent = '';

  let rows = [];
  try {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    rows = Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    block.append(renderMessage(`Could not load ${source} — ${e.message}`, true));
    return;
  }

  if (!rows.length) {
    block.append(renderMessage(`No rules found in ${source}.`));
    return;
  }

  block.append(buildTable(rows));

  const note = renderMessage(
    `Live from ${source} — ${rows.length} rule${rows.length === 1 ? '' : 's'}. `
    + 'Reflects the environment this page is viewed on (preview vs. published).',
  );
  block.append(note);
}
