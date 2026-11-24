/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

/**
 * `sheet` (stryker.com patent lists, docs/standardisation/table.md): a block whose only content
 * is a link to a sheet (its .json) gets the sheet's rows, the column names as the header row
 * (none with `no-header`). Any other `sheet` block keeps its authored rows.
 * @param {Element} block The block
 */
async function sheetRows(block) {
  const links = block.querySelectorAll('a[href]');
  if (links.length !== 1 || block.textContent.trim() !== links[0].textContent.trim()) return;
  const url = new URL(links[0].getAttribute('href'), window.location.href);
  if (!url.pathname.endsWith('.json')) return;
  const status = document.createElement('p');
  status.className = 'table-sheet-status';
  status.textContent = 'Loading…';
  block.replaceChildren(status);
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.status);
    const json = await resp.json();
    const sheet = json.data ? json : json[(json[':names'] || [])[0]];
    const data = (sheet && sheet.data) || [];
    const keys = data.length ? Object.keys(data[0]) : [];
    const row = (values) => {
      const div = document.createElement('div');
      values.forEach((value) => {
        const cell = document.createElement('div');
        cell.textContent = value;
        div.append(cell);
      });
      return div;
    };
    const rows = data.map((entry) => row(keys.map((k) => entry[k] ?? '')));
    if (!block.classList.contains('no-header')) rows.unshift(row(keys));
    block.replaceChildren(...rows);
  } catch (e) {
    status.textContent = 'The list could not be loaded.';
  }
}

/**
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  if (block.classList.contains('sheet')) await sheetRows(block);
  if (block.querySelector(':scope > .table-sheet-status')) return;
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');

    [...row.children].forEach((cell) => {
      const td = document.createElement(i === 0 && header ? 'th' : 'td');

      if (i === 0) td.setAttribute('scope', 'column');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });
    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(table);
}
