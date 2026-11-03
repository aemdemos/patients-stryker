import loadGoogleCharts from './google-charts.js';
import { domEl } from '../../scripts/dom-helpers.js';

const TYPES = ['pie', 'doughnut', 'bar', 'column'];
const PALETTE = [
  '--color-navy-bright', '--color-primary-dark', '--color-purple',
  '--color-secondary', '--color-accent-link-hover', '--color-primary-active',
];
const NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const HEX_COLOR = /^#(?:[a-f\d]{3}|[a-f\d]{6})$/i;
const SYMBOL = /^[$€£¥₹₩₽]{1,4}$/;

export function chartType(block) {
  const types = TYPES.filter((type) => block.classList.contains(type));
  return types.length === 1 ? types[0] : null;
}

export function chartContext(block) {
  const section = block.closest('.section');
  const heading = [...(section?.querySelectorAll('.default-content-wrapper h1, .default-content-wrapper h2, .default-content-wrapper h3, .default-content-wrapper h4, .default-content-wrapper h5, .default-content-wrapper h6') || [])]
    .filter((element) => element.compareDocumentPosition(block)
      === Node.DOCUMENT_POSITION_FOLLOWING)
    .at(-1);
  return {
    format: section?.dataset.format,
    currency: section?.dataset.currency,
    axisTitle: section?.dataset.axisTitle,
    label: heading?.textContent.trim() || 'Chart',
  };
}

export function parseChartRows(rows, type, settings = {}) {
  const config = {
    format: (settings.format?.trim() || 'number').toLowerCase(),
    currency: settings.currency?.trim() || 'USD',
    axisTitle: settings.axisTitle?.trim() || '',
    label: settings.label || 'Chart',
  };
  const data = [];
  const errors = [];
  const warnings = [];
  let header = -1;
  rows.forEach((cells, index) => {
    const [first = '', second = '', third = '', ...extra] = cells;
    if (cells.every((cell) => !cell)) return;
    if (extra.some(Boolean)) errors.push(`Row ${index + 1}: expected at most three cells.`);
    if (header < 0) {
      if (first.toLowerCase() === 'category' && second.toLowerCase() === 'value'
        && (!third || third.toLowerCase() === 'color')) {
        header = index;
      } else {
        errors.push(`Row ${index + 1}: expected a Category / Value header. Use regular headings and section metadata, not chart configuration rows.`);
      }
      return;
    }
    const value = NUMERIC.test(second) ? Number(second) : NaN;
    if (!first || !Number.isFinite(value)) {
      errors.push(`Row ${index + 1}: category and a finite, unformatted numeric value are required.`);
    }
    if (['pie', 'doughnut'].includes(type) && value < 0) {
      errors.push(`Row ${index + 1}: pie and doughnut values cannot be negative.`);
    }
    const color = HEX_COLOR.test(third) ? third : null;
    if (third && !color) warnings.push(`Row ${index + 1}: invalid hex color; using the default palette.`);
    data.push({ category: first, value, color });
  });
  if (!type) errors.push('Choose exactly one chart variant: pie, doughnut, bar, or column.');
  if (!['number', 'percentage', 'currency'].includes(config.format)) {
    errors.push('Format must be Number, Percentage, or Currency.');
  }
  if (config.format === 'currency'
    && !/^[a-z]{3}$/i.test(config.currency) && !SYMBOL.test(config.currency)) {
    errors.push('Currency must be a three-letter currency code or a supported currency symbol.');
  }
  if (header < 0 || !data.length) errors.push('A Category / Value header and at least one data row are required.');
  if (['pie', 'doughnut'].includes(type)) {
    const total = data.reduce((sum, row) => sum + row.value, 0);
    if (!Number.isFinite(total) || total <= 0) errors.push('Pie and doughnut values must have a finite, positive total.');
  }
  return {
    ...config, type, data, errors, warnings, source: rows, header,
  };
}

export function valueFormatter(config, locale = document.documentElement.lang || 'en-US') {
  if (config.format === 'currency' && /^[a-z]{3}$/i.test(config.currency)) {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency', currency: config.currency.toUpperCase(),
    });
    return (value) => formatter.format(value);
  }
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    ...(config.format === 'percentage' ? { style: 'percent' } : {}),
  });
  return (value) => {
    const formatted = formatter.format(config.format === 'percentage' ? value / 100 : value);
    return config.format === 'currency' ? `${config.currency}${formatted}` : formatted;
  };
}

export function chartColors(config, styles) {
  return config.data.map((row, index) => row.color
    || styles.getPropertyValue(PALETTE[index % PALETTE.length]).trim());
}

function sliceTextColor(color, styles) {
  const hex = color.slice(1);
  const expanded = hex.length === 3 ? [...hex].map((digit) => digit.repeat(2)).join('') : hex;
  const channels = expanded.match(/../g).map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045
      ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return styles.getPropertyValue(blackContrast >= whiteContrast ? '--color-black' : '--color-white').trim();
}

export function chartOptions(config, styles, colors, reducedMotion = false) {
  const textStyle = {
    color: styles.getPropertyValue('--color-black').trim(),
    fontSize: parseFloat(styles.fontSize),
  };
  const pie = ['pie', 'doughnut'].includes(config.type);
  const range = config.data.reduce((result, row) => ({
    min: Math.min(result.min, row.value),
    max: Math.max(result.max, row.value),
  }), { min: Infinity, max: -Infinity });
  const valueAxis = {
    title: config.axisTitle,
    format: '',
    baseline: 0,
    titleTextStyle: textStyle,
    viewWindow: {
      ...(range.min >= 0 ? { min: 0 } : {}),
      ...(range.max < 0 ? { max: 0 } : {}),
    },
  };
  let axisFormat = '#,##0.##';
  if (config.format === 'percentage') axisFormat += "'%'";
  if (config.format === 'currency') axisFormat = `'${config.currency.toUpperCase()}' ${axisFormat}`;
  valueAxis.format = axisFormat;
  return {
    backgroundColor: styles.getPropertyValue('--color-white').trim(),
    fontName: styles.fontFamily.split(',')[0].replace(/"/g, '').trim(),
    fontSize: textStyle.fontSize,
    colors,
    legend: { position: pie ? 'bottom' : 'none', textStyle },
    tooltip: { textStyle, showColorCode: true, ...(pie ? { text: 'value' } : {}) },
    chartArea: pie
      ? {
        left: '5%', top: '5%', width: '90%', height: '75%',
      }
      : {
        left: '25%', top: '10%', width: '65%', height: '65%',
      },
    pieHole: config.type === 'doughnut' ? 0.5 : 0,
    pieSliceText: 'value',
    pieSliceTextStyle: textStyle,
    ...(pie ? {
      slices: colors.map((color) => ({
        textStyle: { ...textStyle, color: sliceTextColor(color, styles) },
      })),
    } : {}),
    pieSliceBorderColor: styles.getPropertyValue('--color-white').trim(),
    pieResidueSliceLabel: 'Other categories',
    sliceVisibilityThreshold: 0,
    annotations: { alwaysOutside: true, textStyle },
    hAxis: {
      textStyle,
      ...(config.type === 'bar' ? valueAxis : {}),
    },
    vAxis: {
      textStyle,
      ...(config.type === 'column' ? valueAxis : {}),
    },
    ...(pie ? {} : {
      animation: { startup: !reducedMotion, duration: reducedMotion ? 0 : 500, easing: 'out' },
    }),
  };
}

export function buildDataTable(api, config, colors, format) {
  const table = new api.DataTable();
  table.addColumn('string', 'Category');
  table.addColumn('number', config.axisTitle || 'Value');
  const pie = ['pie', 'doughnut'].includes(config.type);
  if (!pie) {
    table.addColumn({ type: 'string', role: 'style' });
    table.addColumn({ type: 'string', role: 'annotation' });
  }
  config.data.forEach((row, index) => {
    const value = { v: row.value, f: format(row.value) };
    table.addRow(pie
      ? [row.category, value]
      : [row.category, value, `color: ${colors[index]}`, format(row.value)]);
  });
  return table;
}

export function visualizationType(api, type) {
  if (type === 'bar') return api.BarChart;
  if (type === 'column') return api.ColumnChart;
  return api.PieChart;
}

export function dataFallback(config, format) {
  const valid = !config.errors.length;
  const head = domEl('thead', domEl(
    'tr',
    domEl('th', { scope: 'col' }, 'Category'),
    domEl('th', { scope: 'col' }, 'Value'),
    domEl('th', { scope: 'col' }, 'Color'),
  ));
  const body = domEl('tbody');
  const rows = valid
    ? config.data.map((row) => [row.category, format(row.value), row.color || 'Default palette'])
    : config.source.slice(config.header >= 0 ? config.header + 1 : 0);
  rows.forEach(([category = '', value = '', color = '', ...extra]) => {
    body.append(domEl(
      'tr',
      domEl('th', { scope: 'row' }, category),
      domEl('td', value),
      domEl('td', [color, ...extra].join(' ')),
    ));
  });
  const table = domEl(
    'table',
    domEl('caption', `${config.label} - ${valid ? 'data' : 'authored content'}`),
    head,
    body,
  );
  return domEl(
    'div',
    { class: 'chart-data' },
    domEl('div', { class: 'chart-table-scroll' }, table),
  );
}

export default async function decorate(block) {
  const rows = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));
  const config = parseChartRows(rows, chartType(block), chartContext(block));
  config.warnings.forEach((warning) => console.warn(`[Chart: ${config.label}] ${warning}`));
  let format;
  try {
    format = valueFormatter(config);
  } catch (error) {
    config.errors.push(`Number formatting failed: ${error.message}`);
  }
  const fallback = dataFallback(config, format);
  const visual = domEl('div', {
    class: 'chart-visual',
    role: 'img',
    'aria-label': config.label,
    hidden: '',
  });
  const status = domEl('p', { class: 'chart-status', role: 'status' }, 'Loading chart. Chart data is available below.');
  block.replaceChildren(
    status,
    visual,
    fallback,
  );
  if (config.errors.length) {
    console.warn(`[Chart: ${config.label}] ${config.errors.join(' ')}`);
    status.textContent = 'This chart could not be displayed. Review the authored data below.';
    return;
  }
  let chart;
  let observer;
  let frame;
  let resize;
  let listeners = [];
  const fail = (error) => {
    console.warn(`[Chart: ${config.label}] Rendering failed:`, error);
    visual.hidden = true;
    status.hidden = false;
    status.textContent = 'The chart is unavailable. View the chart data below.';
    fallback.hidden = false;
    observer?.disconnect();
    if (resize) window.removeEventListener('resize', resize);
    if (frame) cancelAnimationFrame(frame);
    listeners.forEach((listener) => window.google.visualization.events.removeListener(listener));
    listeners = [];
    chart?.clearChart();
  };
  try {
    const api = await loadGoogleCharts();
    if (!block.isConnected) return;
    visual.hidden = false;
    const styles = getComputedStyle(block);
    const colors = chartColors(config, styles);
    const options = chartOptions(config, styles, colors, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const table = buildDataTable(api, config, colors, format);
    const Chart = visualizationType(api, config.type);
    chart = new Chart(visual);
    let firstDraw = true;
    let lastWidth = -1;
    let lastHeight = -1;
    listeners = [
      api.events.addListener(chart, 'error', (event) => fail(new Error(event.message || 'Google Charts drawing error.'))),
      api.events.addListener(chart, 'ready', () => {
        status.hidden = true;
        fallback.hidden = true;
        firstDraw = false;
      }),
    ];
    const draw = () => {
      if (!block.isConnected) {
        observer?.disconnect();
        if (resize) window.removeEventListener('resize', resize);
        listeners.forEach((listener) => api.events.removeListener(listener));
        chart.clearChart();
        return;
      }
      const { width, height } = visual.getBoundingClientRect();
      if (width <= 0 || height <= 0 || (width === lastWidth && height === lastHeight)) return;
      lastWidth = width;
      lastHeight = height;
      try {
        chart.draw(table, {
          ...options,
          ...(options.animation ? {
            animation: firstDraw ? options.animation : { startup: false, duration: 0 },
          } : {}),
        });
      } catch (error) {
        fail(error);
      }
    };
    resize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(resize);
      observer.observe(visual);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }
    draw();
  } catch (error) {
    fail(error);
  }
}
