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

  // Measure the final value's width in the system fallback font, off-screen.
  // The fallback can be wider than the brand webfont, so we reserve the max of
  // both to avoid the suffix shifting when the webfont swaps in.
  const fallbackWidth = (target, finalText) => {
    const cs = window.getComputedStyle(target);
    // drop the first (brand) family so the probe renders in the fallback face
    const fallbackStack = cs.fontFamily.split(',').slice(1).join(',');
    if (!fallbackStack) return 0;
    const probe = document.createElement('span');
    probe.textContent = finalText;
    probe.style.cssText = `position:absolute;left:-99999px;top:0;white-space:nowrap;font:${cs.font};font-family:${fallbackStack};font-variant-numeric:${cs.fontVariantNumeric};letter-spacing:${cs.letterSpacing};`;
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  };

  // Reserve each value's final width so the count-up expands leftward instead of
  // reflowing the suffix as digits are added. Reserves max(brand, fallback) width
  // so it fits whichever font is rendering. Must run once laid out (in viewport);
  // the width>0 guard skips premature/hidden calls rather than locking in 0.
  const reserveWidths = () => {
    stats.forEach(({ el, target, parsed }) => {
      const shown = target.textContent;
      const finalText = formatStatNumber(parsed.target, parsed);
      target.textContent = finalText;
      el.style.minWidth = '0';
      const brandWidth = el.getBoundingClientRect().width;
      const widest = Math.max(brandWidth, fallbackWidth(target, finalText));
      if (widest > 0) el.style.minWidth = `${Math.ceil(widest)}px`;
      target.textContent = shown;
    });
  };

  // Resolve once the brand display font is loaded, so reserveWidths() measures
  // the final brand-font glyph widths rather than the fallback. Never rejects (a
  // load failure still resolves, so we measure whatever is rendered).
  const displayFontReady = () => {
    const { fonts } = document;
    const cs = window.getComputedStyle(stats[0].target);
    // primary family only — the full stack contains fallback names that
    // document.fonts.load() cannot resolve
    const primary = cs.fontFamily.split(',')[0].trim();
    const spec = `${cs.fontWeight} ${cs.fontSize} ${primary}`;
    if (!fonts || typeof fonts.load !== 'function' || fonts.check(spec)) {
      return Promise.resolve();
    }
    return fonts.load(spec).catch(() => {});
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
  let visible = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        visible = true;
        // reserve immediately and hold at 0 so the box is never unreserved while
        // text paints; this first pass is overflow-safe in either font
        reserveWidths();
        render(0);
        // start the count-up only once the brand font is loaded and laid out (two
        // frames, since fonts.check can resolve before relayout). Re-reserving
        // here only ever keeps or widens the box, never shrinks it.
        displayFontReady().then(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (!visible) return; // scrolled back out while the font was loading
            reserveWidths();
            run();
          }));
        });
      } else {
        visible = false;
        stop();
        render(0);
      }
    });
  });
  observer.observe(block);
}

/**
 * Reserve each description's rendered height as a min-height so a font swap that
 * re-wraps the text to a different line count cannot push the content below it.
 * size-adjust can't guarantee identical wrapping across two typefaces, so instead
 * of preventing the re-wrap we keep it from moving anything: reserve the current
 * height and keep the max across a re-measure once fonts settle. min-height only
 * holds or grows, so shorter text settles inside the reserved box — worst case a
 * few px of harmless bottom whitespace.
 * @param {Element} block The decorated statistics block
 */
function reserveDescriptionHeights(block) {
  const descs = [...block.querySelectorAll('.statistics-desc')];
  if (!descs.length) return;

  const reserve = () => {
    descs.forEach((el) => {
      const prev = parseFloat(el.style.minHeight) || 0;
      el.style.minHeight = ''; // measure natural height in the current font
      const natural = el.getBoundingClientRect().height;
      const reserved = Math.max(prev, natural);
      // synchronous clear→set: no paint occurs between, so no transient shift
      if (reserved > 0) el.style.minHeight = `${Math.ceil(reserved)}px`;
    });
  };

  // Reserve on the next frame (layout settled) and again once fonts resolve, in
  // case the body font swaps and changes wrapping. Max keeps it monotonic.
  requestAnimationFrame(reserve);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(reserve));
  }
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

  // reserve description heights so a font-swap re-wrap can't push content;
  // runs for every variant, independent of the count-up animation
  reserveDescriptionHeights(block);

  // optional count-up animation, enabled via the `count-up` authoring variant
  if (block.classList.contains('count-up')) setupCountUp(block);
}
