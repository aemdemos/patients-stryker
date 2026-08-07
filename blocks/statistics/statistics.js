import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

// Per-stat color is authored as a keyword in the row's first cell (real content,
// so it persists through DA → preview → publish, unlike an editor-only class).
// Map each keyword to its CSS class; the cell is consumed during decoration.
const COLOR_CLASSES = {
  teal: 'statistics-teal',
  gold: 'statistics-gold',
  'dark-gold': 'statistics-dark-gold',
  navy: 'statistics-navy',
  sage: 'statistics-sage',
  purple: 'statistics-purple',
};

// default color when the authored keyword is missing or unrecognized (e.g. an
// author typed it wrong in DA); mirrors the model's default option
const DEFAULT_COLOR_CLASS = 'statistics-teal';

// read the authored column count from the `cols-N` variant class (default 3);
// rows are not set — the grid flows them automatically from the item count
function readColumns(block) {
  const match = [...block.classList]
    .map((c) => c.match(/^cols-(\d+)$/))
    .find(Boolean);
  return match ? Number(match[1]) : 3;
}

// count-up animation duration in ms (from 0 to each stat's authored value)
const COUNTUP_DURATION = 2000;

// parse the first numeric token out of a stat value, keeping any surrounding
// text (e.g. "$", "%", "x", "M"). Returns null when there is no number to animate.
function parseStatNumber(text) {
  const match = text.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const raw = match[0];
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return {
    prefix: text.slice(0, match.index),
    suffix: text.slice(match.index + raw.length),
    target: parseFloat(raw.replace(/,/g, '')),
    decimals,
    grouped: raw.includes(','),
  };
}

// format an in-progress value back into the original shape (prefix/suffix,
// decimal places, and thousands grouping if the source used it)
function formatStatNumber(value, {
  prefix, suffix, decimals, grouped,
}) {
  const safe = value + 0 === 0 ? 0 : value; // normalize -0 → 0
  const number = grouped
    ? safe.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : safe.toFixed(decimals);
  return `${prefix}${number}${suffix}`;
}

/**
 * Wires up the count-up animation for a statistics block: each stat's number
 * counts from 0 to its value over COUNTUP_DURATION whenever the block scrolls
 * into view, resetting to 0 when it leaves so it replays on return.
 * @param {Element} block the decorated statistics block
 */
function setupCountUp(block) {
  // honor reduced-motion: leave the authored values untouched, no animation
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // collect only the stats that actually contain a number
  const stats = [...block.querySelectorAll('.statistics-value')]
    .map((el) => {
      const target = el.querySelector('p') || el;
      const parsed = parseStatNumber(target.textContent.trim());
      return parsed ? { el, target, parsed } : null;
    })
    .filter(Boolean);
  if (!stats.length) return;

  let raf = null;

  const render = (progress) => {
    stats.forEach(({ target, parsed }) => {
      const value = progress >= 1 ? parsed.target : progress * parsed.target;
      target.textContent = formatStatNumber(value, parsed);
    });
  };

  // Reserve each value's final (widest) width and pin its text to the right, so
  // the number counting up from 0 expands leftward instead of the whole centered
  // value re-flowing and nudging the % / x / M suffix as digits are added (the
  // residual count-up CLS). The final value has the most digits, and the CSS
  // tabular-nums keeps digits equal-width, so no in-between frame is ever wider
  // than this reserved width.
  // MUST run only when the block is laid out (i.e. once it is in the viewport) —
  // during decorate() the block has no layout box yet, so getBoundingClientRect()
  // returns 0 and the reservation would be a no-op. The width>0 guard makes any
  // premature/hidden call safely skip rather than lock in a zero width.
  const reserveWidths = () => {
    stats.forEach(({ el, target, parsed }) => {
      const shown = target.textContent;
      target.textContent = formatStatNumber(parsed.target, parsed);
      el.style.minWidth = '0';
      const finalWidth = el.getBoundingClientRect().width;
      if (finalWidth > 0) el.style.minWidth = `${Math.ceil(finalWidth)}px`;
      target.textContent = shown;
    });
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  const run = () => {
    stop();
    const start = performance.now();
    const tick = (now) => {
      // clamp to [0, 1] — the lower guard avoids a first-frame negative progress
      // (which would render "-0") if `now` is marginally before `start`
      const progress = Math.max(0, Math.min((now - start) / COUNTUP_DURATION, 1));
      render(progress);
      raf = progress < 1 ? requestAnimationFrame(tick) : null;
    };
    raf = requestAnimationFrame(tick);
  };

  // hold at 0 until the block first enters the viewport
  render(0);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Reserve the final width now that the block is laid out and (almost
        // always) the brand font has resolved, then start the count. Re-reserving
        // on every entry is cheap and keeps the reservation correct if a late
        // font swap or resize changed glyph widths since the last pass.
        reserveWidths();
        run();
      } else {
        stop();
        render(0);
      }
    });
  });
  observer.observe(block);
}

/**
 * loads and decorates the statistics block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.style.setProperty('--statistics-columns', readColumns(block));

  const list = document.createElement('ul');
  list.className = 'statistics-list';

  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    item.className = 'statistics-item';
    moveInstrumentation(row, item);

    const cells = [...row.children];
    // A full stat row is [color, value, description] (3 cells). The first cell is
    // the color keyword — consume it and apply the matching class, falling back
    // to the default color for a missing/mistyped keyword. Rows with only 2 cells
    // (no color authored) keep the default color and are treated as [value, desc].
    if (cells.length >= 3) {
      const keyword = cells[0].textContent.trim().toLowerCase();
      item.classList.add(COLOR_CLASSES[keyword] || DEFAULT_COLOR_CLASS);
      cells.shift().remove();
    } else {
      item.classList.add(DEFAULT_COLOR_CLASS);
    }

    const [value, desc] = cells;
    if (value) {
      value.className = 'statistics-value';
      item.append(value);
    }
    if (desc) {
      desc.className = 'statistics-desc';
      item.append(desc);
    }

    list.append(item);
  });

  block.replaceChildren(list);

  // optional count-up animation, enabled via the `count-up` authoring variant
  if (block.classList.contains('count-up')) setupCountUp(block);
}
