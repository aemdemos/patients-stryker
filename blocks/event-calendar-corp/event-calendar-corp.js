import { toCamelCase, toClassName } from '../../scripts/aem.js';
import {
  fetchPlaceholders, fetchQueryIndex, getLocalePrefix, toIndexPath,
} from '../../scripts/utils.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const US_NAMES = ['united states of america', 'usa', 'us'];
const DAY_MS = 86400000;
let blockCount = 0;

/* facets in source order; `key` = the index column (approved event-* page metadata) */
const FACETS = [
  { id: 'region', label: 'Region' },
  { id: 'type', key: 'event-type', label: 'Event type' },
  { id: 'audience', key: 'event-audience', label: 'Audience' },
  { id: 'unit', key: 'event-business-unit', label: 'Business unit' },
  { id: 'specialty', key: 'event-specialty', label: 'Speciality' },
];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const svg = (paths) => {
  const icon = document.createElementNS(SVG_NS, 'svg');
  icon.setAttribute('viewBox', '0 0 20 20');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  paths.forEach(([x, y, w, h]) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    Object.entries({
      x, y, width: w, height: h,
    }).forEach(([k, v]) => rect.setAttribute(k, v));
    icon.append(rect);
  });
  return icon;
};

/* source view icons: a 4 x 4 grid of squares (calendar) and three bars (list) */
const gridIcon = () => svg([0, 5, 10, 15].flatMap((y) => [0, 5, 10, 15].map((x) => [x, y, 4, 4])));
const listIcon = () => svg([[1, 3, 18, 2], [1, 9, 18, 2], [1, 15, 18, 2]]);

/** Key/value rows: Path, Title, optional Index (query index URL). */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const key = toClassName(keyCell.textContent);
    const link = valueCell.querySelector('a[href]');
    config[key] = key !== 'title' && link ? link.getAttribute('href') : valueCell.textContent.trim();
  });
  return config;
}

/**
 * Event date-times are read as the wall-clock time they are written in (the time shown on
 * the event page), so `2018-01-07T08:00:00-05:00` is 7 January, 8 am in every browser.
 * Unix seconds (an index column parsed as a date) fall back to UTC.
 * @returns {{day: number, hour: number|null, minute: number}|null} day = days since epoch
 */
function parseDateTime(value) {
  if (value === undefined || value === null || value === '') return null;
  const iso = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (iso) {
    const [, y, m, d, h, min] = iso;
    return {
      day: Date.UTC(+y, +m - 1, +d) / DAY_MS,
      hour: h === undefined ? null : +h,
      minute: min === undefined ? 0 : +min,
    };
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return null;
  const date = new Date(num > 1e11 ? num : num * 1000);
  return {
    day: Math.floor(date.getTime() / DAY_MS),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

const dayToDate = (day) => new Date(day * DAY_MS);
const splitList = (value) => String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
/* the source stores some locations with <br> line breaks */
const cleanText = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, ', ')
  .replace(/\s*\n\s*/g, ' ')
  .replace(/(,\s*)+$/, '')
  .replace(/\s*,\s*,/g, ',')
  .trim();

const isUS = (country) => US_NAMES.includes(String(country).toLowerCase());

function toEvent(row) {
  const start = parseDateTime(row['event-start']);
  if (!start || !row.title) return null;
  const end = parseDateTime(row['event-end']);
  return {
    path: toIndexPath(row.path),
    title: row.title,
    start,
    endDay: end && end.day >= start.day ? end.day : start.day,
    location: cleanText(row['event-location']),
    city: cleanText(row['event-city']),
    state: cleanText(row['event-state']),
    country: cleanText(row['event-country']),
    type: splitList(row['event-type']),
    audience: splitList(row['event-audience']),
    unit: splitList(row['event-business-unit']),
    specialty: splitList(row['event-specialty']),
  };
}

/**
 * Builds the text helpers: tag labels come from the locale placeholders (Key = the tag ID,
 * e.g. `stryker:event-type/associationmeetings`), else from the tag's last segment.
 */
function textHelpers(placeholders) {
  const lang = document.documentElement.lang || 'en';
  const locale = lang.startsWith('en') ? 'en-US' : lang;
  const fmt = (options) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options });
  const monthTitle = fmt({ month: 'long', year: 'numeric' });
  const monthShort = fmt({ month: 'short' });
  const weekdayShort = fmt({ weekday: 'short' });
  const weekdayLong = fmt({ weekday: 'long' });
  const fullDate = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
  const t = (key, fallback) => placeholders[key] || fallback;
  return {
    t,
    tag: (id) => {
      const known = placeholders[toCamelCase(id)];
      if (known) return known;
      const label = id.split(/[/:]/).pop().replace(/[-_]+/g, ' ').trim();
      return label.charAt(0).toUpperCase() + label.slice(1);
    },
    country: (name) => (isUS(name) ? t('calendarUs', 'US') : name),
    monthTitle: (day) => monthTitle.format(dayToDate(day)),
    monthShort: (day) => monthShort.format(dayToDate(day)).replace(/\.$/, ''),
    weekdayShort: (day) => weekdayShort.format(dayToDate(day)),
    weekdayLong: (day) => weekdayLong.format(dayToDate(day)),
    fullDate: (day) => fullDate.format(dayToDate(day)),
    /* source FullCalendar timeFormat 'h(:mm) a': 8 am, 1:30 pm */
    time: ({ hour, minute }) => {
      if (hour === null) return '';
      const suffix = hour < 12 ? 'am' : 'pm';
      const h = hour % 12 || 12;
      return minute ? `${h}:${String(minute).padStart(2, '0')} ${suffix}` : `${h} ${suffix}`;
    },
  };
}

/** Facet options from the events under the path, in order of first appearance. */
function buildOptions(events, text) {
  const options = {};
  FACETS.filter((f) => f.key).forEach((facet) => {
    const ids = [...new Set(events.flatMap((e) => e[facet.id]))];
    options[facet.id] = ids.map((id) => ({ value: id, label: text.tag(id) }));
  });
  const countries = new Map();
  events.filter((e) => e.country).forEach((e) => {
    if (!countries.has(e.country)) countries.set(e.country, new Set());
    if (e.state && isUS(e.country)) countries.get(e.country).add(e.state);
  });
  options.region = [...countries].map(([country, states]) => ({
    value: country, label: text.country(country), states: [...states],
  }));
  return options;
}

/* source rules: options of one facet are OR-ed, facets AND-ed; ticking a US state limits the
   US to those states; an empty facet does not filter */
function matches(event, selected) {
  const { countries, states } = selected.region;
  if (countries.length || states.length) {
    const inCountry = countries.some((c) => c.toLowerCase() === event.country.toLowerCase());
    const usStates = isUS(event.country) && states.length;
    const regionMatch = usStates
      ? states.some((s) => s.toLowerCase() === event.state.toLowerCase())
      : inCountry;
    if (!regionMatch) return false;
  }
  return FACETS.filter((f) => f.key).every(({ id }) => !selected[id].length
    || selected[id].some((value) => event[id].includes(value)));
}

function checkbox(name, value, label, className) {
  const wrapper = el('label', className);
  const input = el('input');
  input.type = 'checkbox';
  input.name = name;
  input.value = value;
  wrapper.append(input, document.createTextNode(label));
  return wrapper;
}

function buildFilters(id, options, text) {
  const form = el('form', 'event-calendar-corp-filters');
  form.id = `${id}-filters`;
  const heading = el('h3', 'event-calendar-corp-filters-title', text.t('calendarFilters', 'Filters'));
  heading.id = `${id}-filters-title`;
  form.setAttribute('aria-labelledby', heading.id);
  form.append(heading);

  FACETS.forEach((facet) => {
    const opts = options[facet.id];
    if (!opts.length) return;
    const label = text.t(`calendar${facet.id.charAt(0).toUpperCase()}${facet.id.slice(1)}`, facet.label);
    const group = el('div', 'event-calendar-corp-facet');
    const h = el('h4', 'event-calendar-corp-facet-title');
    const toggle = el('button', 'event-calendar-corp-facet-toggle', label);
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', `${id}-facet-${facet.id}`);
    toggle.append(el('span', 'event-calendar-corp-caret'));
    toggle.lastChild.setAttribute('aria-hidden', 'true');
    h.append(toggle);

    const fieldset = el('fieldset', 'event-calendar-corp-facet-panel');
    fieldset.id = `${id}-facet-${facet.id}`;
    fieldset.hidden = true;
    fieldset.append(el('legend', 'event-calendar-corp-sr-only', label));
    const allLabel = facet.id === 'region'
      ? text.t('calendarAllCountries', 'All countries')
      : text.t('calendarAll', 'All');
    fieldset.append(checkbox('all', '', allLabel, 'event-calendar-corp-all'));
    opts.forEach((opt) => {
      const name = facet.id === 'region' ? 'country' : facet.id;
      fieldset.append(checkbox(name, opt.value, opt.label));
      if (opt.states?.length) {
        const ul = el('ul', 'event-calendar-corp-states');
        opt.states.forEach((state) => {
          const li = el('li');
          li.append(checkbox('state', state, state));
          ul.append(li);
        });
        fieldset.append(ul);
      }
    });

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      fieldset.hidden = !open;
    });
    /* "All" ticks / clears the group; clearing an option clears "All" (source behaviour) */
    fieldset.addEventListener('change', (e) => {
      const all = fieldset.querySelector('input[name="all"]');
      if (e.target === all) {
        fieldset.querySelectorAll('input:not([name="all"])').forEach((input) => {
          input.checked = all.checked;
        });
      } else if (!e.target.checked) all.checked = false;
    });

    group.append(h, fieldset);
    form.append(group);
  });

  const actions = el('div', 'event-calendar-corp-actions');
  const apply = el('button', 'button primary', text.t('calendarApply', 'Apply'));
  apply.type = 'submit';
  const reset = el('button', 'button event-calendar-corp-reset', text.t('calendarReset', 'Reset'));
  reset.type = 'reset';
  actions.append(apply, reset);
  form.append(actions);
  return form;
}

function readSelection(form) {
  const values = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
  const selected = { region: { countries: values('country'), states: values('state') } };
  FACETS.filter((f) => f.key).forEach(({ id }) => { selected[id] = values(id); });
  return selected;
}

/* ---- month grid: a 6-week table; an event spanning days is one bar per week row ---- */

function weekSegments(events, weekStart) {
  const weekEnd = weekStart + 6;
  const segs = events
    .filter((e) => e.start.day <= weekEnd && e.endDay >= weekStart)
    .map((e) => {
      const from = Math.max(e.start.day, weekStart) - weekStart;
      const to = Math.min(e.endDay, weekEnd) - weekStart;
      return {
        event: e,
        from,
        span: to - from + 1,
        isStart: e.start.day >= weekStart,
        isEnd: e.endDay <= weekEnd,
      };
    })
    .sort((a, b) => a.from - b.from || b.span - a.span);
  /* stack: each bar takes the first level free on all of its days */
  const levels = [];
  segs.forEach((seg) => {
    let level = levels.findIndex((used) => !used.some((s) => s.from <= seg.from + seg.span - 1
      && seg.from <= s.from + s.span - 1));
    if (level < 0) {
      level = levels.length;
      levels.push([]);
    }
    levels[level].push(seg);
    seg.level = level;
  });
  return { segs, levelCount: levels.length };
}

function buildEventLink(seg, text) {
  const { event } = seg;
  const link = el('a', 'event-calendar-corp-event');
  link.href = event.path;
  if (event.type.some((t) => t.endsWith('/associationmeetings'))) link.classList.add('is-meeting');
  if (!seg.isStart) link.classList.add('is-continued');
  if (!seg.isEnd) link.classList.add('is-continuing');
  link.style.setProperty('--span', seg.span);
  const time = seg.isStart ? text.time(event.start) : '';
  if (time) link.append(el('span', 'event-calendar-corp-event-time', time), ' ');
  link.append(el('span', 'event-calendar-corp-event-title', event.title));
  if (event.endDay > event.start.day) {
    const range = `${text.fullDate(event.start.day)} – ${text.fullDate(event.endDay)}`;
    link.append(el('span', 'event-calendar-corp-sr-only', `, ${range}`));
  }
  /* the bar that continues into the next week repeats the event: announce it once */
  if (!seg.isStart) {
    link.setAttribute('aria-hidden', 'true');
    link.tabIndex = -1;
  }
  return link;
}

function renderGrid(table, events, view, text, today) {
  const first = Date.UTC(view.year, view.month, 1) / DAY_MS;
  const gridStart = first - dayToDate(first).getUTCDay();
  const thead = el('thead');
  const headRow = el('tr');
  for (let i = 0; i < 7; i += 1) {
    const th = el('th', '', text.weekdayShort(gridStart + i));
    th.scope = 'col';
    th.abbr = text.weekdayLong(gridStart + i);
    headRow.append(th);
  }
  thead.append(headRow);
  const tbody = el('tbody');
  for (let w = 0; w < 6; w += 1) {
    const weekStart = gridStart + w * 7;
    const { segs, levelCount } = weekSegments(events, weekStart);
    const row = el('tr');
    for (let d = 0; d < 7; d += 1) {
      const day = weekStart + d;
      const date = dayToDate(day);
      const td = el('td');
      if (date.getUTCMonth() !== view.month) td.classList.add('is-other-month');
      if (day === today) {
        td.classList.add('is-today');
        td.setAttribute('aria-current', 'date');
      }
      const number = el('span', 'event-calendar-corp-day', date.getUTCDate());
      td.append(number);
      const covering = segs.filter((s) => s.from <= d && d < s.from + s.span);
      if (covering.length) {
        const stack = el('div', 'event-calendar-corp-day-events');
        const lastLevel = Math.max(...covering.map((s) => s.level));
        for (let level = 0; level <= lastLevel && level < levelCount; level += 1) {
          const seg = covering.find((s) => s.level === level);
          if (seg && seg.from === d) stack.append(buildEventLink(seg, text));
          else {
            const filler = el('span', 'event-calendar-corp-slot');
            filler.setAttribute('aria-hidden', 'true');
            stack.append(filler);
          }
        }
        td.append(stack);
      }
      row.append(td);
    }
    tbody.append(row);
  }
  table.replaceChildren(thead, tbody);
}

/* ---- list (from 600px the list view; below 600px the only view, as on the source) ---- */

function formatDateBox(event, text) {
  const start = dayToDate(event.start.day);
  const end = dayToDate(event.endDay);
  const sMonth = text.monthShort(event.start.day);
  const eMonth = text.monthShort(event.endDay);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth()
    && start.getUTCFullYear() === end.getUTCFullYear();
  if (!sameMonth) {
    return [`${start.getUTCDate()} ${sMonth} - `, `${end.getUTCDate()} ${eMonth}`];
  }
  if (event.endDay === event.start.day) return [`${start.getUTCDate()}`, sMonth];
  return [`${start.getUTCDate()} - ${end.getUTCDate()}`, sMonth];
}

function formatDateLine(event, text) {
  const part = (day) => {
    const date = dayToDate(day);
    return `${date.getUTCDate()} ${text.monthShort(day)} ${date.getUTCFullYear()}`;
  };
  return event.endDay === event.start.day ? part(event.start.day)
    : `${part(event.start.day)} - ${part(event.endDay)}`;
}

function buildListItem(event, text) {
  const li = el('li', 'event-calendar-corp-item');
  const box = el('div', 'event-calendar-corp-date-box');
  box.setAttribute('aria-hidden', 'true');
  const [days, month] = formatDateBox(event, text);
  const dates = el('p', 'event-calendar-corp-date-days', days);
  dates.append(el('span', '', month));
  box.append(dates, el('p', 'event-calendar-corp-date-year', dayToDate(event.start.day).getUTCFullYear()));

  const body = el('div', 'event-calendar-corp-item-body');
  const when = el('p', 'event-calendar-corp-date-line');
  const time = el('time', '', formatDateLine(event, text));
  time.dateTime = dayToDate(event.start.day).toISOString().slice(0, 10);
  when.append(time);
  const place = [event.city, event.state, event.country].filter(Boolean).join(', ');
  const title = el('h4', 'event-calendar-corp-item-title', place ? `${event.title} (${place})` : event.title);
  const facts = el('p', 'event-calendar-corp-item-facts');
  if (event.type.length) {
    facts.append(el('b', '', text.t('calendarEventTypeLabel', 'Event type:')), event.type.map(text.tag).join(','));
  }
  if (event.location) {
    if (facts.childNodes.length) facts.append(el('br'));
    facts.append(el('b', '', text.t('calendarLocationLabel', 'Location:')), event.location);
  }
  const more = el('a', 'event-calendar-corp-more', text.t('calendarMoreInformation', 'more information'));
  more.href = event.path;
  title.id = `event-calendar-corp-item-${toClassName(event.path).slice(-60)}-${event.start.day}`;
  more.setAttribute('aria-describedby', title.id);
  body.append(when, title);
  if (facts.childNodes.length) body.append(facts);
  const moreP = el('p');
  moreP.append(more);
  body.append(moreP);
  li.append(box, body);
  return li;
}

/**
 * Event Calendar Corp: the event pages under a path (query index rows with `event-start`),
 * as a month grid or a month list with Region / Event type / Audience / Business unit /
 * Speciality filters (source c-event / FullCalendar). Rows: Path | Title | Index (optional
 * query index URL, default the locale's query-index.json).
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readConfig(block);
  const path = toIndexPath(config.path || window.location.pathname);
  const localePrefix = path.match(/^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/i)?.[0].toLowerCase() || getLocalePrefix();
  const indexUrl = config.index ? new URL(config.index, window.location.href).pathname : undefined;
  const [index, placeholders] = await Promise.all([
    fetchQueryIndex(localePrefix, indexUrl),
    fetchPlaceholders(getLocalePrefix()),
  ]);
  const text = textHelpers(placeholders);
  const events = [...index.values()]
    .filter((r) => toIndexPath(r.path || '').startsWith(`${path}/`))
    .map(toEvent)
    .filter(Boolean)
    .sort((a, b) => a.start.day - b.start.day
      || (a.start.hour ?? -1) * 60 + a.start.minute - ((b.start.hour ?? -1) * 60 + b.start.minute));

  blockCount += 1;
  const id = `event-calendar-corp-${blockCount}`;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
  const view = { year: now.getFullYear(), month: now.getMonth(), mode: 'month' };
  let shown = events;

  const content = [];
  if (config.title) {
    const title = el('h2', 'event-calendar-corp-title', config.title);
    content.push(title);
  }

  const filters = buildFilters(id, buildOptions(events, text), text);
  const filterToggle = el('button', 'button primary event-calendar-corp-filter-toggle', text.t('calendarFilter', 'Filter'));
  filterToggle.type = 'button';
  filterToggle.setAttribute('aria-expanded', 'false');
  filterToggle.setAttribute('aria-controls', filters.id);
  filterToggle.addEventListener('click', () => {
    const open = filterToggle.getAttribute('aria-expanded') !== 'true';
    filterToggle.setAttribute('aria-expanded', open);
    block.classList.toggle('filters-open', open);
  });

  const main = el('div', 'event-calendar-corp-main');
  const views = el('div', 'event-calendar-corp-views');
  views.setAttribute('role', 'group');
  views.setAttribute('aria-label', text.t('calendarView', 'View'));
  const viewButtons = [
    ['month', text.t('calendarCalendarView', 'Calendar View'), gridIcon()],
    ['list', text.t('calendarListView', 'List View'), listIcon()],
  ].map(([mode, label, icon]) => {
    const button = el('button', 'event-calendar-corp-view');
    button.type = 'button';
    button.dataset.mode = mode;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.append(icon);
    views.append(button);
    return button;
  });

  const toolbar = el('div', 'event-calendar-corp-toolbar');
  const nav = el('div', 'event-calendar-corp-nav');
  const navButton = (className, label, glyph) => {
    const button = el('button', `event-calendar-corp-${className}`);
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-controls', `${id}-panel`);
    const icon = el('span', 'event-calendar-corp-arrow', glyph);
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    return button;
  };
  const prev = navButton('prev', text.t('calendarPreviousMonth', 'Previous month'), '‹');
  const next = navButton('next', text.t('calendarNextMonth', 'Next month'), '›');
  const todayButton = el('button', 'event-calendar-corp-today', text.t('calendarToday', 'today'));
  todayButton.type = 'button';
  nav.append(prev, next, todayButton);
  const monthTitle = el('h3', 'event-calendar-corp-month');
  monthTitle.id = `${id}-month`;
  monthTitle.setAttribute('aria-live', 'polite');
  toolbar.append(nav, monthTitle);

  const panel = el('div', 'event-calendar-corp-panel');
  panel.id = `${id}-panel`;
  const table = el('table', 'event-calendar-corp-grid');
  table.setAttribute('aria-labelledby', monthTitle.id);
  const list = el('ul', 'event-calendar-corp-list');
  list.setAttribute('aria-labelledby', monthTitle.id);
  const empty = el('p', 'event-calendar-corp-empty', text.t('calendarNoEvents', 'No scheduled events'));
  empty.setAttribute('role', 'status');
  panel.append(table, list, empty);
  main.append(views, toolbar, panel);

  const render = () => {
    const first = Date.UTC(view.year, view.month, 1) / DAY_MS;
    const last = Date.UTC(view.year, view.month + 1, 0) / DAY_MS;
    monthTitle.textContent = text.monthTitle(first);
    const isCurrent = today >= first && today <= last;
    todayButton.disabled = isCurrent;
    block.dataset.view = view.mode;
    viewButtons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === view.mode));
    renderGrid(table, shown, view, text, today);
    /* source list: events starting or ending in the month */
    const inMonth = shown.filter((e) => (e.start.day >= first && e.start.day <= last)
      || (e.endDay >= first && e.endDay <= last));
    list.replaceChildren(...inMonth.map((e) => buildListItem(e, text)));
    list.hidden = !inMonth.length;
    empty.hidden = Boolean(inMonth.length);
  };

  const step = (delta) => {
    const date = new Date(Date.UTC(view.year, view.month + delta, 1));
    view.year = date.getUTCFullYear();
    view.month = date.getUTCMonth();
    render();
  };
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  todayButton.addEventListener('click', () => {
    view.year = now.getFullYear();
    view.month = now.getMonth();
    render();
    prev.focus();
  });
  viewButtons.forEach((button) => button.addEventListener('click', () => {
    view.mode = button.dataset.mode;
    render();
  }));

  filters.addEventListener('submit', (e) => {
    e.preventDefault();
    const selected = readSelection(filters);
    shown = events.filter((event) => matches(event, selected));
    render();
    // below 600px the filters cover the list: close them (source hides them on Apply)
    if (block.classList.contains('filters-open')) filterToggle.click();
  });
  filters.addEventListener('reset', () => {
    shown = events;
    render();
  });

  const layout = el('div', 'event-calendar-corp-layout');
  layout.append(filterToggle, filters, main);
  content.push(layout);
  render();
  block.replaceChildren(...content);
}
