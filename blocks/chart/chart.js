/*
 * Chart: the stryker.com bar and pie charts (docs/standardisation/chart.md), in review on draft
 * pages. No chart library: the bars, the axis and the pie are drawn with CSS.
 *
 * Authored rows:
 *   - an optional title (a row with one cell: its text, with Text style for sizes and fonts);
 *   - one row per bar or slice: label | value | colour (#rrggbb, the exact stryker.com colour);
 *   - optional settings rows: `Axis title` | text, `Axis maximum` | number, `Labels` | true.
 * Variants: `column` (default, vertical bars), `bar` (horizontal bars), `pie`.
 * Option: `data-labels` (the value above each column / at the end of each bar; pies always
 * show their values).
 */

// the earlier product-detail import (`chart-corp` blocks) also writes `Format` (shown only in
// stryker.com's tooltips, ignored) and `Labels` (true / false, as the data-labels option)
const SETTINGS = {
  'axis title': 'axisTitle',
  'axis maximum': 'axisMax',
  labels: 'labels',
  format: 'format',
};

/** The number in a cell ("8.6", "1,250", "34%") or NaN. */
const numberOf = (text) => Number(String(text).replace(/[^0-9.-]/g, ''));

/** #rgb / #rrggbb / rgb(a) → [r, g, b], or null. */
function rgbOf(value) {
  const v = String(value).trim();
  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = v.match(/^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  return m ? m.slice(1, 4).map(Number) : null;
}

/**
 * The colour of a value written on or above a bar, as on stryker.com: a darker shade (70%) of
 * the bar's colour, black for greys and black.
 */
function labelColour(rgb) {
  if (!rgb) return '';
  if (Math.max(...rgb) - Math.min(...rgb) < 24) return 'var(--color-black)';
  return `rgb(${rgb.map((c) => Math.round(c * 0.7)).join(' ')})`;
}

/**
 * A "nice" axis: the smallest step of 1, 2 or 5 × 10ⁿ that reaches the largest value in at most
 * `most` steps (stryker.com: 0-10-20-30, 0-50-100, 0 to 6, 0 to 300 by 50).
 */
function axisOf(max, most) {
  if (!(max > 0)) return { step: 1, top: 1 };
  const base = 10 ** Math.floor(Math.log10(max / most));
  const steps = [1, 2, 5, 10, 20, 50].map((s) => s * base);
  const step = steps.find((s) => Math.ceil(max / s - 1e-9) <= most) || steps[steps.length - 1];
  return { step, top: Math.ceil(max / step - 1e-9) * step };
}

const format = (n) => String(Math.round(n * 1000) / 1000);

/** Reads the authored rows. */
function readRows(block) {
  const data = { title: null, items: [] };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const first = cells[0] ? cells[0].textContent.trim() : '';
    const key = SETTINGS[first.toLowerCase()];
    if (key && cells[1]) {
      data[key] = cells[1].textContent.trim();
    } else if (cells.length === 1) {
      if (!data.title && !data.items.length) [data.title] = cells;
    } else if (cells.length >= 2 && !Number.isNaN(numberOf(cells[1].textContent))) {
      data.items.push({
        label: first,
        value: numberOf(cells[1].textContent),
        colour: cells[2] ? cells[2].textContent.trim() : '',
      });
    }
  });
  return data;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Column and bar charts: the ticks, gridlines, bars and labels. */
function barChart(data, horizontal, labels) {
  const values = data.items.map((i) => i.value);
  const authoredMax = numberOf(data.axisMax || '');
  const largest = Math.max(authoredMax || 0, ...values);
  const plot = el('div', 'chart-plot');
  plot.style.setProperty('--chart-count', data.items.length);
  const grid = el('div', 'chart-grid');
  grid.setAttribute('aria-hidden', 'true');
  const list = el('ul', 'chart-bars');
  const items = data.items.map((item) => {
    const li = el('li', 'chart-item');
    const rgb = rgbOf(item.colour);
    if (rgb) li.style.setProperty('--chart-colour', `rgb(${rgb.join(' ')})`);
    li.style.setProperty('--chart-label-colour', labelColour(rgb));
    const bar = el('span', 'chart-bar');
    const value = el('span', labels ? 'chart-value' : 'chart-value chart-value-hidden', format(item.value));
    bar.append(value);
    li.append(bar, el('span', 'chart-label', item.label));
    li.title = `${item.label}: ${format(item.value)}`;
    list.append(li);
    return { li, value: item.value };
  });

  // the axis: at most 4 steps up a column chart; along a bar chart one step per 100px (2 to
  // 6), as stryker.com (0 to 300 by 50 at 1,440px, 0-200-400 on phones)
  let shown = 0;
  const draw = (most) => {
    if (most === shown) return;
    shown = most;
    const axis = axisOf(largest, most);
    plot.style.setProperty('--chart-top', axis.top);
    items.forEach(({ li, value }) => li.style.setProperty('--chart-value', value / axis.top));
    // ticks and gridlines (a light line at each step, a lighter one half way)
    const ticks = [];
    for (let v = 0; v <= axis.top + 1e-9; v += axis.step) {
      const tick = el('span', 'chart-tick');
      tick.style.setProperty('--chart-at', v / axis.top);
      tick.append(el('span', 'chart-tick-label', format(v)));
      ticks.push(tick);
      if (v + axis.step <= axis.top + 1e-9) {
        const minor = el('span', 'chart-tick chart-tick-minor');
        minor.style.setProperty('--chart-at', (v + axis.step / 2) / axis.top);
        ticks.push(minor);
      }
    }
    grid.replaceChildren(...ticks);
  };
  draw(horizontal ? 6 : 4);
  if (horizontal && 'ResizeObserver' in window) {
    new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      if (width) draw(Math.min(6, Math.max(2, Math.floor(width / 100))));
    }).observe(plot);
  }
  plot.append(grid, list);
  return plot;
}

/** Pie: the slices (a conic gradient), their values and the legend. */
function pieChart(data) {
  const total = data.items.reduce((sum, i) => sum + i.value, 0) || 1;
  const wrap = el('div', 'chart-pie-wrap');
  const pie = el('div', 'chart-pie');
  pie.setAttribute('role', 'img');
  const stops = [];
  let start = 0;
  const legend = el('ul', 'chart-legend');
  data.items.forEach((item) => {
    const share = item.value / total;
    const rgb = rgbOf(item.colour);
    const colour = rgb ? `rgb(${rgb.join(' ')})` : 'var(--color-secondary)';
    stops.push(`${colour} ${start * 360}deg ${(start + share) * 360}deg`);
    // the value in the middle of its slice (clockwise from the top)
    const mid = (start + share / 2) * 2 * Math.PI;
    const value = el('span', 'chart-slice-value', format(item.value));
    value.style.setProperty('--chart-x', Math.sin(mid));
    value.style.setProperty('--chart-y', -Math.cos(mid));
    value.setAttribute('aria-hidden', 'true');
    pie.append(value);
    const entry = el('li', 'chart-legend-item', item.label);
    entry.style.setProperty('--chart-colour', colour);
    legend.append(entry);
    start += share;
  });
  pie.style.setProperty('--chart-slices', stops.join(', '));
  pie.setAttribute('aria-label', data.items.map((i) => `${i.label}: ${format(i.value)}`).join(', '));
  wrap.append(pie, legend);
  return wrap;
}

export default function decorate(block) {
  // in review: only draft pages render it (body.std-draft, scripts/corp.js)
  if (!document.body.classList.contains('std-draft')) return;
  const data = readRows(block);
  const figure = el('figure', 'chart-figure');
  if (data.title) {
    const caption = el('figcaption', 'chart-title');
    caption.append(...data.title.childNodes);
    figure.append(caption);
  }
  if (block.classList.contains('pie')) {
    figure.append(pieChart(data));
  } else {
    const horizontal = block.classList.contains('bar');
    const labels = block.classList.contains('data-labels') || /^true$/i.test(data.labels || '');
    figure.append(barChart(data, horizontal, labels));
    if (data.axisTitle) figure.append(el('p', 'chart-axis-title', data.axisTitle));
    if (data.axisTitle) figure.classList.add('chart-has-axis-title');
  }
  block.replaceChildren(figure);
}
