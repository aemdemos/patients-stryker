/*
 * chart-corp — www.stryker.com charts (source animatedbarchart / pieChart, drawn there
 * with Google Charts). Rendered here as inline SVG with DOM APIs, no chart library.
 *
 * Variants: column (default), bar, pie.
 * Content: key/value rows first (Title, Subtitle, Format, Max, Axis title, Labels), then one
 * row per data item: label | value | colour keyword (the Statistics palette).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

// colour cell: a Statistics palette keyword (blocks/statistics/statistics.js) or an exact
// source colour (#rgb, #rrggbb, rgb(), rgba() — alpha is flattened onto white)
const COLORS = ['teal', 'gold', 'dark-gold', 'navy', 'sage', 'purple'];
const DEFAULT_COLOR = { keyword: 'teal' };

const CONFIG_KEYS = {
  title: 'title',
  subtitle: 'subtitle',
  format: 'format',
  max: 'max',
  'axis title': 'axisTitle',
  labels: 'labels',
};

// geometry measured on the source Google Charts (14px text, 18px wrapped-label lines)
const LINE = 18;
const TICK_GAP = 14; // tick label → plot edge
const STEM = 12; // value-label leader line
const COLUMN = {
  top: 38, plot: 124, minBottom: 38, labelBaseline: 15, minTickSpacing: 40,
};
const BAR = {
  top: 58, slot: 62, thickness: 31, tickBaseline: 21, titleBaseline: 45, minTickSpacing: 80,
};
const PIE_MAX = 360; // source chart area: 90% of the 400px chart height
const PIE_LABEL_RADIUS = 0.75;

const NICE = [1, 2, 2.5, 5];

function svg(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function svgText(content, attrs) {
  const el = svg('text', attrs);
  el.textContent = content;
  return el;
}

function tooltip(el, content) {
  const title = svg('title');
  title.textContent = content;
  el.append(title);
}

/** Margin each side of the plot: Google's default chart area, fitted to the source. */
function sideMargin(width, base, ratio) {
  return Math.round(base + ratio * width);
}

function mantissa(n) {
  return n / 10 ** Math.floor(Math.log10(n));
}

function isNice(n) {
  const m = mantissa(n);
  return NICE.some((v) => Math.abs(v - m) < 1e-9);
}

/**
 * Picks the axis ticks: the smallest "nice" step whose intervals are at least
 * minSpacing px apart, with the axis top rounded up to a whole step.
 */
function axisTicks(dataMax, length, minSpacing) {
  const max = dataMax > 0 ? dataMax : 1;
  const exp = Math.floor(Math.log10(max));
  const steps = [];
  for (let e = exp - 3; e <= exp + 1; e += 1) NICE.forEach((m) => steps.push(m * 10 ** e));
  const step = steps.find((s) => length / Math.ceil(max / s - 1e-9) >= minSpacing)
    || steps[steps.length - 1];
  const count = Math.ceil(max / step - 1e-9);
  const ticks = Array.from({ length: count + 1 }, (_, i) => +(i * step).toFixed(10));
  const minor = isNice(step / 2) ? ticks.slice(1).map((t) => +(t - step / 2).toFixed(10)) : [];
  return { top: count * step, ticks, minor };
}

const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');

/**
 * Validates the authored colour: a palette keyword, or #rgb / #rrggbb / rgb() / rgba()
 * normalised to opaque #rrggbb (rgba composited on white, as the source rendered it).
 * Anything else falls back to the default keyword.
 */
function parseColor(raw = '') {
  const text = raw.trim().toLowerCase();
  if (COLORS.includes(text)) return { keyword: text };
  let hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)?.[1];
  if (hex) {
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
    return { hex: `#${hex}` };
  }
  const rgb = text.match(
    /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*(\d*\.?\d+)(%?)\s*)?\)$/,
  );
  if (rgb) {
    const channels = rgb.slice(1, 4).map(Number);
    let alpha = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] ? 100 : 1);
    alpha = Math.min(Math.max(alpha, 0), 1);
    if (channels.every((c) => c <= 255)) {
      return { hex: `#${channels.map((c) => hex2(c * alpha + 255 * (1 - alpha))).join('')}` };
    }
  }
  return DEFAULT_COLOR;
}

/** Relative luminance (WCAG) of #rrggbb. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Colours an element: keyword → palette class; exact colour → validated custom properties. */
function applyColor(el, color, cls) {
  el.setAttribute('class', `${cls} chart-corp-${color.keyword || 'custom'}`);
  if (!color.hex) return;
  el.style.setProperty('--chart-corp-color', color.hex);
  // text on the fill: whichever of black / white contrasts more
  const onBlack = (luminance(color.hex) + 0.05) / 0.05;
  const onWhite = 1.05 / (luminance(color.hex) + 0.05);
  el.style.setProperty('--chart-corp-on', onBlack >= onWhite ? 'var(--text-color)' : 'var(--color-white)');
}

function readConfig(block) {
  const config = { labels: true };
  const items = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = CONFIG_KEYS[cells[0]?.textContent.trim().toLowerCase().replace(/:$/, '')];
    if (!items.length && key && cells.length <= 2) {
      const cell = cells[1];
      const text = cell?.textContent.trim() || '';
      if (key === 'title' || key === 'subtitle') {
        if (text) config[key] = cell;
      } else if (key === 'max') {
        const max = parseFloat(text.replace(/[^\d.-]/g, ''));
        if (Number.isFinite(max)) config.max = max;
      } else if (key === 'labels') {
        config.labels = !/^(false|no|off|0)$/i.test(text);
      } else if (text) {
        config[key] = text;
      }
      return;
    }
    const label = cells[0]?.textContent.trim() || '';
    const value = parseFloat((cells[1]?.textContent || '').replace(/[^\d.-]/g, ''));
    if (!label || !Number.isFinite(value)) return;
    items.push({ label, value, color: parseColor(cells[2]?.textContent) });
  });
  return { config, items };
}

/**
 * Value as the source tooltip showed it: Percentage → "8.6%",
 * Currency → "$175 USD" (from "Currency USD $"), Number → "8.6".
 */
function formatter(format = '') {
  const [type, ...rest] = format.trim().split(/\s+/);
  const kind = (type || '').toLowerCase();
  if (kind === 'percentage') return (v) => `${v}%`;
  if (kind === 'currency') {
    const code = rest.find((t) => /^[a-z]{3}$/i.test(t)) || '';
    const symbol = rest.find((t) => !/^[a-z]{3}$/i.test(t)) || '';
    return (v) => `${symbol}${v}${code ? ` ${code}` : ''}`;
  }
  return (v) => `${v}`;
}

function textMeasurer(probeParent) {
  const probe = svgText('', { class: 'chart-corp-measure' });
  probeParent.append(probe);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = getComputedStyle(probe).font;
  probe.remove();
  return (str) => ctx.measureText(str).width;
}

/** Greedy word wrap to maxWidth. */
function wrap(text, maxWidth, measure) {
  const lines = [];
  text.split(/\s+/).forEach((word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last} ${word}`) <= maxWidth) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  });
  return lines;
}

function renderColumn(svgEl, width, data, measure) {
  const { config, items, format } = data;
  const n = items.length;
  const { top, plot } = COLUMN;
  const dataMax = Math.max(config.max ?? 0, ...items.map((i) => i.value));
  const axis = axisTicks(dataMax, plot, COLUMN.minTickSpacing);
  const tickWidth = Math.max(...axis.ticks.map((t) => measure(`${t}`)));
  const titleLines = config.axisTitle ? wrap(config.axisTitle, plot, measure) : [];
  const titleWidth = titleLines.length ? titleLines.length * LINE + TICK_GAP : 0;
  const needed = tickWidth + TICK_GAP + titleWidth;
  const side = Math.max(sideMargin(width, 41, 0.064), Math.ceil(needed));
  const plotWidth = Math.max(width - 2 * side, n);
  const slot = plotWidth / n;
  const barWidth = Math.max(Math.round(slot / 2), 1);
  const labelLines = items.map((item) => wrap(item.label, slot - 4, measure));
  const maxLines = Math.max(...labelLines.map((l) => l.length));
  const bottom = Math.max(COLUMN.minBottom, COLUMN.labelBaseline + (maxLines - 1) * LINE + 5);
  const height = top + plot + bottom;
  // the plot's 1px lines sit inside its height: lines at top … top + plot - 1
  const y = (v) => top + (plot - 1) * (1 - v / axis.top);

  svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);

  axis.minor.forEach((t) => svgEl.append(svg('rect', {
    class: 'chart-corp-grid-minor', x: side, y: Math.round(y(t)), width: plotWidth, height: 1,
  })));
  axis.ticks.forEach((t) => {
    const gy = Math.round(y(t));
    svgEl.append(svg('rect', {
      class: 'chart-corp-grid', x: side, y: gy, width: plotWidth, height: 1,
    }));
    svgEl.append(svgText(`${t}`, {
      class: 'chart-corp-tick', x: side - TICK_GAP, y: gy + 5, 'text-anchor': 'end',
    }));
  });

  const base = Math.round(y(0));
  items.forEach((item, i) => {
    const cx = side + slot * i + slot / 2;
    const barTop = Math.round(y(item.value));
    const bar = svg('rect', {
      x: Math.round(cx - barWidth / 2),
      y: barTop,
      width: barWidth,
      height: Math.max(base - barTop, 0),
    });
    applyColor(bar, item.color, 'chart-corp-bar');
    tooltip(bar, `${item.label}: ${format(item.value)}`);
    svgEl.append(bar);
    labelLines[i].forEach((line, j) => svgEl.append(svgText(line, {
      class: 'chart-corp-label',
      x: cx,
      y: top + plot + COLUMN.labelBaseline + j * LINE,
      'text-anchor': 'middle',
    })));
  });

  svgEl.append(svg('rect', {
    class: 'chart-corp-baseline', x: side, y: base, width: plotWidth, height: 1,
  }));

  if (config.labels) {
    items.forEach((item, i) => {
      const cx = Math.round(side + slot * i + slot / 2);
      const barTop = Math.round(y(item.value));
      const group = svg('g', { class: 'chart-corp-annotation' });
      group.append(svg('rect', {
        class: 'chart-corp-stem', x: cx, y: barTop - STEM, width: 1, height: STEM,
      }));
      group.append(svgText(`${item.value}`, {
        class: 'chart-corp-value', x: cx, y: barTop - TICK_GAP, 'text-anchor': 'middle',
      }));
      svgEl.append(group);
    });
  }

  if (titleLines.length) {
    const cy = top + plot / 2;
    const lastX = side - TICK_GAP - tickWidth - TICK_GAP;
    titleLines.forEach((line, j) => {
      const x = lastX - (titleLines.length - 1 - j) * LINE;
      svgEl.append(svgText(line, {
        class: 'chart-corp-axis-title', x, y: cy, 'text-anchor': 'middle', transform: `rotate(-90 ${x} ${cy})`,
      }));
    });
  }
}

function renderBar(svgEl, width, data, measure) {
  const { config, items, format } = data;
  const longestWord = Math.max(...items.flatMap((i) => i.label.split(/\s+/).map(measure)));
  const side = Math.max(sideMargin(width, 33, 0.0956), Math.ceil(longestWord) + 4);
  const labelLines = items.map((item) => wrap(item.label, side - 4, measure));
  const slots = labelLines.map((l) => Math.max(BAR.slot, l.length * LINE + 8));
  const plot = slots.reduce((a, b) => a + b, 0);
  const valueWidth = config.labels
    ? Math.max(...items.map((i) => measure(`${i.value}`))) + STEM + TICK_GAP : 0;
  const right = Math.max(sideMargin(width, 33, 0.0956), Math.ceil(valueWidth));
  const plotWidth = Math.max(width - side - right, 1);
  const dataMax = Math.max(config.max ?? 0, ...items.map((i) => i.value));
  const axis = axisTicks(dataMax, plotWidth, BAR.minTickSpacing);
  const { top } = BAR;
  const bottom = config.axisTitle ? BAR.top : BAR.tickBaseline + 11;
  const height = top + plot + bottom;
  const x = (v) => side + (v / axis.top) * (plotWidth - 1);

  svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);

  axis.minor.forEach((t) => svgEl.append(svg('rect', {
    class: 'chart-corp-grid-minor', x: Math.round(x(t)), y: top, width: 1, height: plot,
  })));
  axis.ticks.forEach((t) => {
    const gx = Math.round(x(t));
    svgEl.append(svg('rect', {
      class: 'chart-corp-grid', x: gx, y: top, width: 1, height: plot,
    }));
    svgEl.append(svgText(`${t}`, {
      class: 'chart-corp-tick', x: gx + 0.5, y: top + plot + BAR.tickBaseline, 'text-anchor': 'middle',
    }));
  });

  const base = Math.round(x(0));
  let slotTop = top;
  items.forEach((item, i) => {
    const cy = slotTop + slots[i] / 2;
    const barEnd = Math.round(x(item.value));
    const bar = svg('rect', {
      x: base + 1,
      y: Math.round(cy - BAR.thickness / 2),
      width: Math.max(barEnd - base - 1, 0),
      height: BAR.thickness,
    });
    applyColor(bar, item.color, 'chart-corp-bar');
    tooltip(bar, `${item.label}: ${format(item.value)}`);
    svgEl.append(bar);
    const lines = labelLines[i];
    const firstBaseline = cy - ((lines.length - 1) * LINE) / 2 + 5;
    lines.forEach((line, j) => svgEl.append(svgText(line, {
      class: 'chart-corp-label', x: side - 2, y: firstBaseline + j * LINE, 'text-anchor': 'end',
    })));
    if (config.labels) {
      const group = svg('g', { class: 'chart-corp-annotation' });
      group.append(svg('rect', {
        class: 'chart-corp-stem', x: barEnd, y: Math.round(cy), width: STEM, height: 1,
      }));
      group.append(svgText(`${item.value}`, {
        class: 'chart-corp-value', x: barEnd + STEM + 2, y: Math.round(cy) + 5, 'text-anchor': 'start',
      }));
      svgEl.append(group);
    }
    slotTop += slots[i];
  });

  svgEl.append(svg('rect', {
    class: 'chart-corp-baseline', x: base, y: top, width: 1, height: plot,
  }));

  if (config.axisTitle) {
    svgEl.append(svgText(config.axisTitle, {
      class: 'chart-corp-axis-title', x: side + plotWidth / 2, y: top + plot + BAR.titleBaseline, 'text-anchor': 'middle',
    }));
  }
}

function renderPie(svgEl, size, data, measure) {
  const { items, format, config } = data;
  const r = size / 2;
  const total = items.reduce((sum, i) => sum + Math.max(i.value, 0), 0) || 1;
  svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svgEl.setAttribute('width', size);
  svgEl.setAttribute('height', size);

  const point = (angle, radius) => [r + radius * Math.sin(angle), r - radius * Math.cos(angle)];
  let start = 0;
  items.forEach((item) => {
    const share = Math.max(item.value, 0) / total;
    const end = start + share * 2 * Math.PI;
    let slice;
    if (share >= 1) {
      slice = svg('circle', { cx: r, cy: r, r });
    } else {
      const [x1, y1] = point(start, r);
      const [x2, y2] = point(end, r);
      slice = svg('path', {
        d: `M${r},${r}L${x1},${y1}A${r},${r},0,${share > 0.5 ? 1 : 0},1,${x2},${y2}Z`,
      });
    }
    applyColor(slice, item.color, 'chart-corp-slice');
    tooltip(slice, `${item.label}: ${format(item.value)}`);
    svgEl.append(slice);

    // value inside the slice, hidden when the slice is too narrow to hold it
    const text = `${item.value}`;
    const labelRadius = r * PIE_LABEL_RADIUS;
    if (config.labels && share * 2 * Math.PI * labelRadius >= measure(text) + 8) {
      const [lx, ly] = point((start + end) / 2, labelRadius);
      const value = svgText(text, { x: lx, y: ly + 5, 'text-anchor': 'middle' });
      applyColor(value, item.color, 'chart-corp-slice-value');
      svgEl.append(value);
    }
    start = end;
  });
}

function buildTable(data) {
  const { config, items, format } = data;
  const table = document.createElement('table');
  table.className = 'chart-corp-table';
  const caption = document.createElement('caption');
  caption.textContent = [config.title?.textContent.trim(), config.subtitle?.textContent.trim()]
    .filter(Boolean).join(' ') || 'Chart data';
  const thead = document.createElement('thead');
  const head = document.createElement('tr');
  ['Category', config.axisTitle || 'Value'].forEach((label) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    head.append(th);
  });
  thead.append(head);
  const tbody = document.createElement('tbody');
  items.forEach((item) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = item.label;
    const td = document.createElement('td');
    td.textContent = format(item.value);
    tr.append(th, td);
    tbody.append(tr);
  });
  table.append(caption, thead, tbody);
  return table;
}

function buildLegend(items) {
  const legend = document.createElement('ul');
  legend.className = 'chart-corp-legend';
  legend.setAttribute('aria-hidden', 'true');
  items.forEach((item) => {
    const li = document.createElement('li');
    const swatch = document.createElement('span');
    applyColor(swatch, item.color, 'chart-corp-swatch');
    const label = document.createElement('span');
    label.textContent = item.label;
    li.append(swatch, label);
    legend.append(li);
  });
  return legend;
}

function moveContent(cell, target) {
  const only = cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
    ? cell.firstElementChild : cell;
  target.append(...only.childNodes);
}

/** Animates the bars growing once the chart scrolls into view (motion allowed only). */
function animateOnView(block) {
  if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    || typeof IntersectionObserver !== 'function') return;
  block.classList.add('chart-corp-pending');
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    requestAnimationFrame(() => block.classList.remove('chart-corp-pending'));
  }, { threshold: 0.3 });
  observer.observe(block);
}

/**
 * loads and decorates the chart-corp block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const { config, items } = readConfig(block);
  let variant = 'column';
  if (block.classList.contains('pie')) variant = 'pie';
  else if (block.classList.contains('bar')) variant = 'bar';
  const data = { config, items, format: formatter(config.format) };

  const figure = document.createElement('figure');
  figure.className = 'chart-corp-figure';
  if (config.title || config.subtitle) {
    const caption = document.createElement('figcaption');
    caption.className = 'chart-corp-caption';
    [['title', 'chart-corp-title'], ['subtitle', 'chart-corp-subtitle']].forEach(([key, cls]) => {
      if (!config[key]) return;
      const p = document.createElement('p');
      p.className = cls;
      moveContent(config[key], p);
      caption.append(p);
    });
    figure.append(caption);
  }

  const svgEl = svg('svg', { class: 'chart-corp-svg', 'aria-hidden': 'true', focusable: 'false' });
  const canvas = document.createElement('div');
  canvas.className = 'chart-corp-canvas';
  let plotArea = canvas;
  if (variant === 'pie') {
    plotArea = document.createElement('div');
    plotArea.className = 'chart-corp-pie-plot';
    plotArea.append(svgEl);
    canvas.append(plotArea, buildLegend(items));
  } else {
    canvas.append(svgEl);
  }
  figure.append(canvas, buildTable(data));
  block.replaceChildren(figure);
  if (!items.length) return;

  let lastWidth = 0;
  const render = (force) => {
    const width = Math.floor(plotArea.getBoundingClientRect().width);
    if (!width || (!force && width === lastWidth)) return;
    lastWidth = width;
    svgEl.replaceChildren();
    const measure = textMeasurer(svgEl);
    if (variant === 'pie') renderPie(svgEl, Math.min(width, PIE_MAX), data, measure);
    else if (variant === 'bar') renderBar(svgEl, width, data, measure);
    else renderColumn(svgEl, width, data, measure);
  };

  if (variant !== 'pie') animateOnView(block);
  let frame = null;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => render(false));
  }).observe(plotArea);
  // re-measure the labels once the web fonts are in
  document.fonts?.ready.then(() => render(true));
}
