/* eslint-disable no-restricted-syntax, no-continue */
/*
 * Text normalization + three-tier matching.
 *
 * Algorithm adapted (clean-room reimplementation) from the QA tool at
 * https://github.com/iustinp/qa-tool (lib/visible-text.js `normalizeTextLine`,
 * lib/text-audit.js `auditVisibleText`). We match a migrated text run to its
 * source counterpart by content — deliberately ignoring DOM structure, which is
 * unreliable on hand-edited pages — using exact -> substring -> contiguous-token
 * coverage, in that order.
 *
 * (eslint-disable: this is Node import-tooling, matching the convention of the
 * peer scripts under tools/importer/ — loops/continue are intentional here.)
 */

// BOM + zero-width characters, built by codepoint to avoid invisible literals
// in source: U+FEFF (BOM), U+200B..U+200D (ZW space/non-joiner/joiner).
const ZERO_WIDTH_RE = new RegExp(`[${String.fromCharCode(0xFEFF, 0x200B, 0x200C, 0x200D)}]`, 'g');

/** Collapse a raw string to the normalized comparison form: strip BOM +
 * zero-width chars, collapse whitespace, trim, lowercase. */
export function normalizeTextLine(raw) {
  return (raw || '')
    .replace(ZERO_WIDTH_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Token-only form (letters/digits, space-separated) for substring / coverage
 * matching — drops punctuation so "pain.11" and "pain 11" tokenize alike. */
export function tokenForm(normalized) {
  return (normalized || '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(normalized) {
  const t = tokenForm(normalized);
  return t ? t.split(' ') : [];
}

/** Cookie/consent boilerplate that appears on every page and is not content. */
const BOILERPLATE_SUBSTRINGS = [
  'accept all', 'accept cookies', 'cookie preferences',
  'we use cookies', 'this website uses cookies', 'cookies settings',
  'reject all',
];

export function isBoilerplateLine(normalized, minLength = 2) {
  if (!normalized || normalized.length < minLength) return true;
  return BOILERPLATE_SUBSTRINGS.some((s) => normalized.includes(s));
}

/**
 * Longest run of consecutive source tokens that appears as a contiguous token
 * sequence anywhere in the target, expressed as a fraction of source tokens.
 * Mirrors qa-tool's longestContiguousTokenCoverage.
 */
export function longestContiguousTokenCoverage(srcTokens, tgtTokens) {
  if (!srcTokens.length || !tgtTokens.length) return 0;
  const tgt = tgtTokens.join(' ');
  let best = 0;
  for (let i = 0; i < srcTokens.length; i += 1) {
    for (let j = srcTokens.length; j > i + best; j -= 1) {
      const run = srcTokens.slice(i, j);
      if (tgt.includes(run.join(' '))) {
        if (run.length > best) best = run.length;
        break;
      }
    }
  }
  return best / srcTokens.length;
}

/**
 * Classify how a source run matches within a target corpus.
 * @returns {{type:'exact'|'substring'|'partial'|'missing', coverage:number|null}}
 */
export function classifyMatch(srcNorm, target, opts = {}) {
  const {
    minSubstringLength = 8,
    minCoverage = 0.8,
    minCoverageTokens = 4,
  } = opts;
  if (target.exactSet.has(srcNorm)) return { type: 'exact', coverage: 1 };

  const srcTokenForm = tokenForm(srcNorm);
  if (srcTokenForm.length >= minSubstringLength
    && target.tokenBlob.includes(srcTokenForm)) {
    return { type: 'substring', coverage: 1 };
  }

  const srcTokens = srcTokenForm ? srcTokenForm.split(' ') : [];
  if (srcTokens.length >= minCoverageTokens) {
    const coverage = longestContiguousTokenCoverage(srcTokens, target.allTokens);
    if (coverage >= minCoverage) return { type: 'partial', coverage };
    return { type: 'missing', coverage };
  }
  return { type: 'missing', coverage: null };
}

/** Build the lookup structures a target corpus needs for classifyMatch. */
export function buildTargetIndex(normalizedLines) {
  const exactSet = new Set(normalizedLines);
  const tokenForms = normalizedLines.map(tokenForm).filter(Boolean);
  return {
    exactSet,
    tokenBlob: ` ${tokenForms.join(' ')} `,
    allTokens: tokenForms.join(' ').split(' ').filter(Boolean),
  };
}
