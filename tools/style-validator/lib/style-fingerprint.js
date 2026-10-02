/* eslint-disable no-restricted-syntax, no-continue, no-shadow */
/*
 * Computed-style fingerprint of a text run, and the delta between two of them.
 *
 * The fingerprint captures only what determines how text reads. Structure is
 * deliberately excluded — two runs of the same text in the same visual role
 * should compare equal regardless of how the source authored the markup.
 */

/** Fields compared by default. Override via config to extend/narrow. */
export const DEFAULT_FINGERPRINT_FIELDS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'color',
  'textDecorationLine',
  'lineHeight',
];

/**
 * SIZING fields: frequently responsive or inconsistent in a hand-edited source,
 * so they are reported but excluded from the "non-size" progress metric / series
 * gate, and only auto-applied by the CSS fixer with --include-size.
 */
export const SIZE_FIELDS = new Set(['fontSize', 'lineHeight']);

/** Per-field tolerance / comparison rules. */
const SIZE_EPSILON_PX = 0.5;

/**
 * Line height is compared as a RATIO of the run's own font size (the unitless
 * line-height a designer would author), not in px. A px comparison would report
 * a line-height mismatch every time the font size is wrong (21px text at a 1.15
 * ratio has a different px line-height than 17.5px text at the same 1.15) — the
 * same root cause reported twice. As a ratio, line-height only differs when the
 * LEADING itself differs (e.g. 1.15 on the source vs 1.06 migrated).
 */
const LINE_HEIGHT_RATIO_EPSILON = 0.05;
// Computed `line-height: normal` has no px value; browsers render it ≈1.2 × font-size.
const NORMAL_LINE_HEIGHT_RATIO = 1.2;

/**
 * Font-family aliases: names that denote the SAME typeface and must compare
 * equal. A source site and its migration frequently reference the identical
 * licensed font under DIFFERENT family names — e.g. a foundry license exposes a
 * font one way on the source ("Some Font for AcmeCo") while the migrated project
 * bundles the same face under its stock name ("SomeFontW01"). Without aliasing,
 * every text run in that face reports a fontFamily mismatch even though the
 * rendered glyphs/metrics are identical. Populate this per project via config
 * (`fontFamilyAliases`): an object mapping each family name to a shared canonical
 * token, e.g. { "Some Font for AcmeCo": "somefont", "SomeFontW01": "somefont" }.
 * Empty by default so the tool ships project-agnostic.
 */
let familyAliases = {};

/** Set alias pairs from config. Keys are lower-cased for case-insensitive match. */
export function setFamilyAliases(extra) {
  if (!extra || typeof extra !== 'object') return;
  const merged = {};
  for (const [k, v] of Object.entries(extra)) merged[k.toLowerCase()] = v;
  familyAliases = merged;
}

function familyName(fontFamily) {
  const raw = (fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
  const alias = familyAliases[raw.toLowerCase()];
  return alias || raw;
}

function pxNumber(size) {
  const m = /([\d.]+)px/.exec(size || '');
  return m ? parseFloat(m[1]) : null;
}

/** Are two fingerprint field values equal within tolerance? */
export function fieldEqual(field, a, b) {
  if (field === 'fontFamily') return familyName(a) === familyName(b);
  if (field === 'fontSize') {
    const na = pxNumber(a);
    const nb = pxNumber(b);
    if (na == null || nb == null) return a === b;
    return Math.abs(na - nb) <= SIZE_EPSILON_PX;
  }
  // fontWeight, fontStyle, color (already rgb() from getComputedStyle),
  // textDecorationLine — exact string compare.
  return a === b;
}

/**
 * Line-height of a fingerprint as a unitless ratio of its font size, rounded to
 * 2 decimals (e.g. "1.15"). Returns null when it can't be derived (no line-height
 * captured, or a non-px font size).
 */
export function lineHeightRatio(fp) {
  const fs = pxNumber(fp && fp.fontSize);
  if (!fs) return null;
  const lh = fp.lineHeight;
  if (!lh) return null;
  if (lh === 'normal') return NORMAL_LINE_HEIGHT_RATIO.toFixed(2);
  const px = pxNumber(lh);
  if (px != null) return (px / fs).toFixed(2);
  const unitless = parseFloat(lh);
  return Number.isFinite(unitless) ? unitless.toFixed(2) : null;
}

/**
 * Compute the per-field delta between a source and migrated fingerprint.
 * `lineHeight` is compared as a font-size ratio (see LINE_HEIGHT_RATIO_EPSILON);
 * its delta entry carries the ratios as `source`/`migrated` (the value a CSS fix
 * should author, unitless) plus the raw px values for readability.
 * @returns {Array<{field, source, migrated}>} only the fields that differ
 */
export function fingerprintDelta(sourceFp, migratedFp, fields = DEFAULT_FINGERPRINT_FIELDS) {
  const delta = [];
  for (const field of fields) {
    if (field === 'lineHeight') {
      const s = lineHeightRatio(sourceFp);
      const m = lineHeightRatio(migratedFp);
      // skip when either side lacks a derivable value (older captures, odd units)
      if (s != null && m != null && Math.abs(Number(s) - Number(m)) > LINE_HEIGHT_RATIO_EPSILON) {
        delta.push({
          field,
          source: s,
          migrated: m,
          sourcePx: sourceFp.lineHeight,
          migratedPx: migratedFp.lineHeight,
        });
      }
      continue;
    }
    const s = sourceFp[field];
    const m = migratedFp[field];
    if (!fieldEqual(field, s, m)) {
      delta.push({ field, source: s, migrated: m });
    }
  }
  return delta;
}

/** Stable key for clustering identical deltas across pages. Normalizes family
 * to its primary name and size to a rounded px so trivial variance collapses.
 * lineHeight entries already carry font-size ratios (e.g. 1.15→1.06), so the
 * same leading mismatch clusters together regardless of the run's font size. */
export function deltaClusterKey(delta) {
  return delta
    .map(({ field, source, migrated }) => {
      const norm = (field, v) => {
        if (field === 'fontFamily') return familyName(v);
        if (field === 'fontSize') {
          const n = pxNumber(v);
          return n == null ? v : `${Math.round(n * 2) / 2}px`;
        }
        return v;
      };
      return `${field}:${norm(field, source)}→${norm(field, migrated)}`;
    })
    .sort()
    .join(' | ');
}
