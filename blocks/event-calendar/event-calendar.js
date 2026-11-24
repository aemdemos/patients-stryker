/*
 * Event Calendar (corp): the stryker.com events calendar (docs/standardisation/event-calendar.md),
 * in review on draft pages. The events are the event pages of a folder, read from the page
 * index: their `event-start` / `event-end` metadata place them on the calendar; `event-country`,
 * `event-state`, `event-type`, `audience`, `business-unit` and `specialty` fill the filters.
 *
 * Authored rows (settings only):
 *   Folder | /us/en/global-events/sports-medicine   (the folder of the event pages)
 *   Source | /us/en/query-index.json                (optional: another index or sheet)
 *
 * As on stryker.com: a Filters box beside the calendar (a FILTER button on phones), a month
 * grid with DAY and WEEK lists, a list view of the month, previous / next / TODAY.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FACETS = [
  ['region', 'Region'],
  ['type', 'Event type'],
  ['audience', 'Audience'],
  ['bu', 'Business unit'],
  ['specialty', 'Speciality'],
];
const LANES = 4;
const DAY_MS = 86400000;

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
// several values are separated by semicolons (some titles hold commas)
const list = (v) => String(v || '').split(';').map((s) => s.trim()).filter(Boolean);
const dayOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => dayOf(a).getTime() === dayOf(b).getTime();
const short = (d) => MONTHS[d.getMonth()].slice(0, 3);

/** "1 pm", "12:30 pm" (stryker.com's time format) */
function timeOf(d) {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${String(m).padStart(2, '0')}` : ''} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}

/** a local date from an ISO-like value without converting time zones ("2018-01-07T13:00:00") */
function parseDate(value) {
  const m = String(value || '').match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
}

function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [key, value] = row.children;
    if (!key || !value) return;
    const link = value.querySelector('a');
    config[key.textContent.trim().toLowerCase()] = (link ? link.getAttribute('href') : value.textContent).trim();
  });
  return config;
}

async function loadEvents(source, folder) {
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    const rows = Array.isArray(json.data) ? json.data : (json.data && json.data.data) || [];
    const base = folder.replace(/\/$/, '');
    return rows.filter((r) => r.path && (!base || r.path.startsWith(`${base}/`)) && parseDate(r['event-start']))
      .map((r) => {
        const start = parseDate(r['event-start']);
        const end = parseDate(r['event-end']) || start;
        return {
          title: r.title || r.path,
          url: r.path,
          start,
          end: end < start ? start : end,
          country: r['event-country'] || '',
          state: r['event-state'] || '',
          city: r['event-city'] || '',
          location: r['event-location'] || '',
          type: list(r['event-type']),
          audience: list(r.audience),
          bu: list(r['business-unit']),
          specialty: list(r.specialty),
        };
      })
      .sort((a, b) => a.start - b.start);
  } catch (e) {
    return [];
  }
}

/** association meetings are teal on stryker.com, the other events grey */
const colourOf = (event) => (event.type.some((t) => /association/i.test(t)) ? 'teal' : 'gray');

/* ---- filters ---- */

function facetValues(events, id) {
  if (id === 'region') {
    const countries = new Map();
    events.forEach((e) => {
      if (!e.country) return;
      if (!countries.has(e.country)) countries.set(e.country, new Set());
      if (e.state) countries.get(e.country).add(e.state);
    });
    return countries;
  }
  return new Set(events.flatMap((e) => e[id]));
}

function checkbox(name, value, label) {
  const lab = el('label');
  const input = el('input');
  input.type = 'checkbox';
  input.name = name;
  input.value = value;
  lab.append(input, document.createTextNode(` ${label}`));
  return lab;
}

/** stryker.com shows "US" for the United States */
const countryLabel = (c) => (/^united states/i.test(c) ? 'US' : c);

function buildFilters(events, onApply) {
  const box = el('div', 'event-calendar-filters');
  box.id = `event-calendar-filters-${Math.random().toString(36).slice(2, 8)}`;
  box.append(el('h3', 'event-calendar-filters-title', 'Filters'), el('hr'));
  FACETS.forEach(([id, label]) => {
    const head = el('button', 'event-calendar-facet', label);
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    const content = el('div', 'event-calendar-facet-content');
    content.hidden = true;
    const all = checkbox(id, '', id === 'region' ? 'All countries' : 'All');
    all.classList.add('event-calendar-all');
    content.append(all);
    const values = facetValues(events, id);
    if (id === 'region') {
      values.forEach((states, country) => {
        const item = checkbox('country', country, countryLabel(country));
        if (states.size) {
          const ul = el('ul');
          states.forEach((s) => { const li = el('li'); li.append(checkbox('state', s, s)); ul.append(li); });
          item.append(ul);
        }
        content.append(item);
      });
    } else {
      values.forEach((v) => content.append(checkbox(id, v, v)));
    }
    head.addEventListener('click', () => {
      const open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!open));
      content.hidden = open;
    });
    // "All" ticks or clears the others
    all.querySelector('input').addEventListener('change', (ev) => {
      content.querySelectorAll('input').forEach((i) => { i.checked = ev.target.checked; });
    });
    box.append(head, content, el('hr'));
  });
  const buttons = el('div', 'event-calendar-filter-buttons');
  const apply = el('button', 'event-calendar-apply', 'Apply');
  const reset = el('button', 'event-calendar-reset', 'Reset');
  apply.type = 'button';
  reset.type = 'button';
  buttons.append(apply, reset);
  box.append(buttons);

  const selection = () => {
    const sel = {};
    box.querySelectorAll('input:checked').forEach((i) => {
      if (!i.value) return;
      (sel[i.name] = sel[i.name] || []).push(i.value);
    });
    return sel;
  };
  apply.addEventListener('click', () => onApply(selection()));
  reset.addEventListener('click', () => {
    box.querySelectorAll('input').forEach((i) => { i.checked = false; });
    onApply({});
  });
  return box;
}

function matches(event, sel) {
  const any = (values, picked) => !picked || values.some((v) => picked.includes(v));
  const region = (sel.country || []).includes(event.country)
    || (sel.state || []).includes(event.state);
  if ((sel.country || sel.state) && !region) return false;
  return any(event.type, sel.type) && any(event.audience, sel.audience)
    && any(event.bu, sel.bu) && any(event.specialty, sel.specialty);
}

/* ---- views ---- */

function toolbar(title, nav, views) {
  const bar = el('div', 'event-calendar-toolbar');
  const left = el('div', 'event-calendar-nav');
  [['prev', 'Previous'], ['next', 'Next']].forEach(([dir, label]) => {
    const b = el('button', `event-calendar-${dir}`);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => nav(dir === 'prev' ? -1 : 1));
    left.append(b);
  });
  if (views) {
    const today = el('button', 'event-calendar-today', 'Today');
    today.type = 'button';
    today.addEventListener('click', () => nav(0));
    left.append(today);
  }
  bar.append(left, el('h2', 'event-calendar-title', title));
  if (views) bar.append(views);
  return bar;
}

function eventLink(event, withTime) {
  const a = el('a', `event-calendar-event ${colourOf(event)}`);
  a.href = event.url;
  // the time in bold (a span: a bold link would be a button under the authoring conventions)
  if (withTime) a.append(el('span', 'event-calendar-time', timeOf(event.start)), document.createTextNode(' '));
  a.append(el('span', 'event-calendar-event-title', event.title));
  a.title = event.title;
  return a;
}

/** one week row of the month grid: the day cells, then each event as a bar across its days */
function weekRow(weekStart, date, events) {
  const week = el('div', 'event-calendar-week');
  const today = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(weekStart, i);
    const cell = el('div', 'event-calendar-cell');
    if (d.getMonth() !== date.getMonth()) cell.classList.add('other-month');
    if (sameDay(d, today)) cell.classList.add('today');
    cell.style.gridColumn = String(i + 1);
    cell.append(el('span', 'event-calendar-date', String(d.getDate())));
    week.append(cell);
  }
  const weekEnd = addDays(weekStart, 7);
  const lanes = [];
  events.filter((e) => e.start < weekEnd && dayOf(e.end) >= weekStart).forEach((e) => {
    const from = Math.max(0, Math.round((dayOf(e.start) - weekStart) / DAY_MS));
    const to = Math.min(6, Math.round((dayOf(e.end) - weekStart) / DAY_MS));
    let lane = lanes.findIndex((used) => used.every(([a, b]) => to < a || from > b));
    if (lane < 0) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push([from, to]);
    if (lane >= LANES) return;
    const bar = eventLink(e, dayOf(e.start) >= weekStart);
    if (dayOf(e.end) >= weekEnd) bar.classList.add('continues');
    bar.style.gridColumn = `${from + 1} / ${to + 2}`;
    bar.style.gridRow = String(lane + 2);
    week.append(bar);
  });
  return week;
}

function monthGrid(date, events) {
  const grid = el('div', 'event-calendar-month');
  const head = el('div', 'event-calendar-days');
  DAYS.forEach((d) => head.append(el('div', 'event-calendar-day-name', d.slice(0, 3))));
  grid.append(head);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  // six weeks, from the Sunday before the 1st, as stryker.com
  for (let w = 0; w < 6; w += 1) {
    grid.append(weekRow(addDays(first, 7 * w - first.getDay()), date, events));
  }
  return grid;
}

/** the DAY and WEEK views: a list per day, as stryker.com's (FullCalendar list views) */
function dayList(from, days, events) {
  const table = el('div', 'event-calendar-agenda');
  let any = false;
  for (let i = 0; i < days; i += 1) {
    const d = addDays(from, i);
    const next = addDays(d, 1);
    const todays = events.filter((e) => e.start < next && dayOf(e.end) >= d);
    if (todays.length) {
      any = true;
      const head = el('div', 'event-calendar-agenda-day');
      head.append(el('span', '', DAYS[d.getDay()]), el('span', '', `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`));
      table.append(head);
      todays.forEach((e) => {
        const row = el('div', `event-calendar-agenda-item ${colourOf(e)}`);
        const allDay = !sameDay(e.start, d) && !sameDay(e.end, d);
        let time = 'all-day';
        if (sameDay(e.start, d)) time = sameDay(e.end, d) ? `${timeOf(e.start)} - ${timeOf(e.end)}` : timeOf(e.start);
        else if (!allDay) time = `until ${timeOf(e.end)}`;
        const link = el('a', '', e.title);
        link.href = e.url;
        row.append(el('span', 'event-calendar-agenda-time', time), el('span', 'event-calendar-dot'), link);
        table.append(row);
      });
    }
  }
  if (!any) table.append(el('p', 'event-calendar-empty', 'No events to display'));
  return table;
}

/** the list view of the month (stryker.com's list icon, and the phone view) */
function monthList(date, events) {
  const wrap = el('div', 'event-calendar-list');
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const inMonth = events.filter((e) => e.start < next && dayOf(e.end) >= first);
  inMonth.forEach((e, i) => {
    if (i) wrap.append(el('hr'));
    const item = el('div', 'event-calendar-item');
    const when = el('div', 'event-calendar-when');
    const days = el('p', 'event-calendar-days-range');
    const range = sameDay(e.start, e.end) ? `${e.start.getDate()}` : `${e.start.getDate()} - ${e.end.getDate()}`;
    days.append(document.createTextNode(range), el('span', '', short(e.start).toUpperCase()));
    when.append(days, el('p', 'event-calendar-year', String(e.start.getFullYear())));
    const desc = el('div', 'event-calendar-desc');
    const place = [e.city, e.state, e.country].filter(Boolean).join(', ');
    desc.append(el('h3', '', place ? `${e.title} (${place})` : e.title));
    const facts = el('p');
    [['Event type:', e.type.join(', ')], ['Location:', e.location]].filter(([, v]) => v).forEach(([k, v], j) => {
      if (j) facts.append(el('br'));
      facts.append(el('strong', '', k), document.createTextNode(v));
    });
    if (facts.childNodes.length) desc.append(facts);
    const more = el('a', 'event-calendar-more', 'More information');
    more.href = e.url;
    desc.append(more);
    item.append(when, desc);
    wrap.append(item);
  });
  if (!inMonth.length) wrap.append(el('p', 'event-calendar-empty', 'No events to display'));
  return wrap;
}

function titleOf(view, date) {
  if (view === 'day') return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  if (view === 'week') {
    const from = addDays(date, -date.getDay());
    const to = addDays(from, 6);
    if (from.getMonth() === to.getMonth()) return `${short(from)} ${from.getDate()} – ${to.getDate()}, ${to.getFullYear()}`;
    return `${short(from)} ${from.getDate()} – ${short(to)} ${to.getDate()}, ${to.getFullYear()}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // in review: renders on draft pages only (docs/standardisation/event-calendar.md)
  if (!document.body.classList.contains('std-draft')) return;
  const config = readConfig(block);
  const folder = config.folder || '';
  const events = await loadEvents(config.source || '/us/en/query-index.json', folder);

  const state = {
    view: 'month', list: false, date: new Date(), sel: {},
  };
  const main = el('div', 'event-calendar-main');
  const shown = () => events.filter((e) => matches(e, state.sel));

  const icons = el('div', 'event-calendar-icons');
  // render and nav call each other, so they are methods of one object
  const cal = {
    nav(step) {
      const d = state.date;
      if (step === 0) state.date = new Date();
      else if (state.view === 'month') state.date = new Date(d.getFullYear(), d.getMonth() + step, 1);
      else state.date = addDays(d, step * (state.view === 'week' ? 7 : 1));
      cal.render();
    },
    navMonth(step) {
      const d = state.date;
      state.date = step === 0 ? new Date() : new Date(d.getFullYear(), d.getMonth() + step, 1);
      cal.render();
    },
    render() {
      const views = el('div', 'event-calendar-views');
      ['day', 'week', 'month'].forEach((v) => {
        const b = el('button', `event-calendar-view${state.view === v ? ' active' : ''}`, v);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(state.view === v));
        b.addEventListener('click', () => { state.view = v; cal.render(); });
        views.append(b);
      });
      const data = shown();
      // the calendar (from 600px) and the list of the month (the list icon, and phones)
      const calendar = el('div', 'event-calendar-calendar');
      calendar.append(toolbar(titleOf(state.view, state.date), cal.nav, views));
      if (state.view === 'month') calendar.append(monthGrid(state.date, data));
      else {
        const from = state.view === 'week' ? addDays(dayOf(state.date), -state.date.getDay()) : dayOf(state.date);
        calendar.append(dayList(from, state.view === 'week' ? 7 : 1, data));
      }
      const listView = el('div', 'event-calendar-listview');
      listView.append(toolbar(titleOf('month', state.date), cal.navMonth), monthList(state.date, data));
      main.classList.toggle('list', state.list);
      icons.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.classList.contains('list') === state.list)));
      main.replaceChildren(icons, calendar, listView);
    },
  };
  [['grid', 'Calendar view', false], ['list', 'List view', true]].forEach(([name, label, isList]) => {
    const b = el('button', `event-calendar-icon ${name}`);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.title = label;
    b.addEventListener('click', () => { state.list = isList; cal.render(); });
    icons.append(b);
  });
  const render = () => cal.render();

  const filters = buildFilters(events, (sel) => { state.sel = sel; render(); });
  const toggle = el('button', 'event-calendar-filter-toggle', 'Filter');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', filters.id);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    filters.classList.toggle('open', !open);
  });
  render();
  block.replaceChildren(toggle, filters, main);
}
