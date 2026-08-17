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

  // Measure the final value's rendered width in the system fallback font (the
  // display stack with the brand webfont family removed), off-screen. The stat's
  // fallback (Futura → Arial-metric) can be a few px WIDER than the brand webfont
  // at the same size, so reserving only the brand width would let the fallback
  // overflow the box and shift the % / x / M suffix when the webfont swaps in.
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

  // Reserve each value's final width and pin its text to the right, so the number
  // counting up from 0 expands leftward instead of the whole centered value
  // re-flowing and nudging the % / x / M suffix as digits are added (the residual
  // count-up CLS). Reserve the MAX of the brand-font and fallback-font widths so
  // the value fits whichever font is currently rendering — otherwise a fallback
  // that is wider than the brand overflows the box and shifts on swap. tabular-nums
  // keeps digits equal-width so no in-between count frame exceeds the final width.
  // MUST run only when the block is laid out (i.e. once it is in the viewport) —
  // during decorate() the block has no layout box yet, so getBoundingClientRect()
  // returns 0 and the reservation would be a no-op. The width>0 guard makes any
  // premature/hidden call safely skip rather than lock in a zero width.
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

  // Resolve once the brand display font that renders the numbers is actually
  // loaded, so reserveWidths() measures the FINAL brand-font glyph widths — not
  // the narrower system fallback. With font-display: swap the value first paints
  // in the fallback and swaps to the brand font whenever it arrives; if we reserve
  // during that fallback window we lock in a too-small min-width (e.g. 166px), and
  // the later swap grows the box to the brand width (216px), shifting the % / x / M
  // suffix — the min-width "flapping between refreshes" bug. Awaiting the font
  // makes the reservation deterministic. Resolves synchronously-ish when the font
  // is already cached, and never rejects (a font load failure still resolves so we
  // fall back to measuring whatever is rendered rather than hanging).
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
        // Reserve IMMEDIATELY and hold the value at 0, so there is never a window
        // where the box is unreserved (min-width unset) while text paints — that
        // gap is what shifts on slow loads. reserveWidths() reserves max(brand,
        // fallback) width, so this first pass is overflow-safe whichever font is
        // currently rendering.
        reserveWidths();
        render(0);
        // Only START the count-up once the brand font is loaded AND laid out (two
        // frames after the load resolves, since fonts.check can resolve a frame
        // before relayout). This keeps every animated digit inside a font-stable,
        // reserved box: the number never grows digits while the font is still
        // swapping, so the count-up cannot contribute layout shift. Re-reserving
        // here can only keep or widen the box (we reserve the max), never shrink.
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
 *
 * The system fallback (Arial-metric) is a different typeface than the brand body
 * font (HumanistSlab), and no CSS metric override can make two different typefaces
 * wrap identically — size-adjust matches AVERAGE advance width, but line breaks
 * depend on the width at each specific break point, so a sentence sitting on a
 * wrap boundary can flip between (e.g.) 4 and 5 lines when the webfont swaps in.
 * That re-wrap is the statistics-page mobile CLS: the taller fallback shrinks a
 * line when HumanistSlab loads and every stat below jumps up.
 *
 * Since we can't stop the re-wrap, we stop it from MOVING anything: reserve the
 * currently-rendered height (the fallback is present at first paint — its face is
 * eager+local — and wraps >= the brand font for this pair), then keep the MAX
 * across a re-measure once fonts settle. min-height only ever holds or grows, so
 * the shorter brand text just settles inside the reserved box — no shift. Worst
 * case is a few px of bottom whitespace under a long description, which is
 * imperceptible next to a layout shift.
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

  // Reserve description heights so a font-swap re-wrap can't push content (the
  // statistics-page CLS). Runs for every variant — the reflow is independent of
  // the count-up animation.
  reserveDescriptionHeights(block);

  // optional count-up animation, enabled via the `count-up` authoring variant
  if (block.classList.contains('count-up')) setupCountUp(block);
}
