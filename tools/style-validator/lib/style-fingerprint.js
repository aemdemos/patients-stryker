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
];

/** Per-field tolerance / comparison rules. */
const SIZE_EPSILON_PX = 0.5;

function familyName(fontFamily) {
  return (fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
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
 * Compute the per-field delta between a source and migrated fingerprint.
 * @returns {Array<{field, source, migrated}>} only the fields that differ
 */
export function fingerprintDelta(sourceFp, migratedFp, fields = DEFAULT_FINGERPRINT_FIELDS) {
  const delta = [];
  for (const field of fields) {
    const s = sourceFp[field];
    const m = migratedFp[field];
    if (!fieldEqual(field, s, m)) {
      delta.push({ field, source: s, migrated: m });
    }
  }
  return delta;
}

/** Stable key for clustering identical deltas across pages. Normalizes family
 * to its primary name and size to a rounded px so trivial variance collapses. */
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
