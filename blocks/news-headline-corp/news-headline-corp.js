/*
 * news-headline-corp — the news-detail article head: the headline followed by the
 * publish date / event location row. Single-column rows:
 *   1 headline (<h1>)
 *   2 publish date (e.g. "01-Apr-2025")
 *   3 event location (optional — event news only)
 * A one-row authoring (h1 + date in the same cell) is split on the <h1>.
 * EW contract: authored nodes are MOVED into layout wrappers (append), never rebuilt;
 * the wrappers carry the layout classes.
 */

/** moves every child of `from` into a new wrapper div (moved, not rebuilt) */
function slot(from, className) {
  const wrapper = document.createElement('div');
  wrapper.className = className;
  while (from.firstChild) wrapper.append(from.firstChild);
  return wrapper;
}

export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((row) => row.firstElementChild || row);

  let title;
  let date;
  let location;
  const heading = cells[0] && cells[0].querySelector('h1, h2, h3');
  if (rows.length === 1 && heading) {
    // single-cell authoring: the heading is the title, whatever follows is the date
    title = document.createElement('div');
    title.className = 'news-headline-corp-title';
    title.append(heading);
    date = slot(cells[0], 'news-headline-corp-date');
  } else {
    if (cells[0]) title = slot(cells[0], 'news-headline-corp-title');
    if (cells[1]) date = slot(cells[1], 'news-headline-corp-date');
    if (cells[2]) location = slot(cells[2], 'news-headline-corp-location');
  }
  rows.forEach((row) => row.remove());

  if (title) block.append(title);
  const meta = document.createElement('div');
  meta.className = 'news-headline-corp-meta';
  [date, location]
    .filter((part) => part && part.textContent.trim())
    .forEach((part) => meta.append(part));
  block.append(meta);
}
