/* eslint-disable no-restricted-syntax, no-continue */
/* eslint-disable object-curly-newline, object-property-newline */
/*
 * Pair migrated text runs to source text runs (by content + role, order-stable
 * for duplicates), compute per-run style deltas, and cluster identical deltas
 * across pages.
 *
 * Guards (added after first-run review) prevent false pairs and 3rd-party noise
 * from becoming "fixable" clusters:
 *   - role-aware pairing: a migrated run is paired to a source run in the SAME
 *     coarse role bucket (heading/sup/link/listitem/body), so identical short
 *     text in different roles (e.g. a nav "Resources" vs a heading "Resources")
 *     does not pair.
 *   - context exclusion: runs whose context hint matches an excludeContexts
 *     pattern (e.g. the Marketo form iframe) are dropped before diffing.
 *   - short-run gate: exact style mismatches on runs below minTokensForCluster
 *     are recorded but marked non-loop-eligible (too ambiguous to auto-fix).
 *   - suspect flag: an exact-text pair whose role buckets differ is reported as
 *     suspect and never loop-eligible.
 */

import {
  buildTargetIndex, classifyMatch,
} from './text-match.js';
import { fingerprintDelta, deltaClusterKey, DEFAULT_FINGERPRINT_FIELDS } from './style-fingerprint.js';

function matchesAny(hint, patterns) {
  if (!patterns || !patterns.length) return false;
  return patterns.some((p) => (hint || '').includes(p));
}

/**
 * Pair each migrated run to a source run.
 * @param {Array} sourceRuns
 * @param {Array} migratedRuns
 * @param {object} opts { fields, excludeContexts:[], minTokensForCluster }
 */
export function pairRuns(sourceRuns, migratedRuns, opts = {}) {
  const fields = opts.fields || DEFAULT_FINGERPRINT_FIELDS;
  const excludeContexts = opts.excludeContexts || [];

  const keep = (r) => !matchesAny(r.contextHint, excludeContexts);
  const src = sourceRuns.filter(keep);
  const mig = migratedRuns.filter(keep);
  const excludedCount = (sourceRuns.length - src.length) + (migratedRuns.length - mig.length);

  // Index source runs by (normalizedText, roleBucket, dupRank) for order-stable,
  // role-aware exact pairing. Also a role-agnostic index for suspect detection.
  const srcByRoleKey = new Map();
  const srcByTextRanks = new Map(); // normalizedText -> [runs] in doc order
  for (const r of src) {
    srcByRoleKey.set(`${r.normalizedText}#${r.roleBucket}#${r.dupRank}`, r);
    if (!srcByTextRanks.has(r.normalizedText)) srcByTextRanks.set(r.normalizedText, []);
    srcByTextRanks.get(r.normalizedText).push(r);
  }
  const srcTarget = buildTargetIndex(src.map((r) => r.normalizedText));

  const pairs = [];
  const stats = {
    exact: 0, substring: 0, partial: 0, missing: 0, countMismatch: 0, suspect: 0,
    excluded: excludedCount,
  };
  // Track per-(text,role) migrated dup rank so we align to source ranks in order.
  const migRoleRank = new Map();

  for (const m of mig) {
    const rkey = `${m.normalizedText}#${m.roleBucket}`;
    const rank = migRoleRank.get(rkey) || 0;
    migRoleRank.set(rkey, rank + 1);

    const source = srcByRoleKey.get(`${m.normalizedText}#${m.roleBucket}#${rank}`);
    if (source) {
      const delta = fingerprintDelta(source.fingerprint, m.fingerprint, fields);
      stats.exact += 1;
      pairs.push({
        matchType: 'exact',
        text: m.rawText,
        normalizedText: m.normalizedText,
        roleBucket: m.roleBucket,
        tokenCount: m.tokenCount,
        selector: m.selector,
        migratedContext: m.contextHint,
        sourceContext: source.contextHint,
        sourceFingerprint: source.fingerprint,
        migratedFingerprint: m.fingerprint,
        delta,
      });
      continue;
    }
    // Same text exists in source but not in the same role → suspect (do not diff).
    if (srcByTextRanks.has(m.normalizedText)) {
      stats.suspect += 1;
      const other = srcByTextRanks.get(m.normalizedText)[0];
      pairs.push({
        matchType: 'suspect',
        text: m.rawText,
        normalizedText: m.normalizedText,
        roleBucket: m.roleBucket,
        migratedContext: m.contextHint,
        sourceContext: other ? other.contextHint : null,
        note: 'text present in source but in a different role bucket',
        delta: [],
      });
      continue;
    }
    // No exact text — classify (substring/partial/missing). Not style-diffed.
    const cls = classifyMatch(m.normalizedText, srcTarget, opts);
    stats[cls.type] = (stats[cls.type] || 0) + 1;
    pairs.push({
      matchType: cls.type,
      coverage: cls.coverage,
      text: m.rawText,
      normalizedText: m.normalizedText,
      roleBucket: m.roleBucket,
      migratedContext: m.contextHint,
      delta: [],
    });
  }
  return { pairs, stats };
}

/**
 * Cluster style mismatches (from exact pairs with a non-empty delta) by their
 * normalized delta key, aggregating across pages. Each cluster is marked
 * loopEligible unless every one of its runs is below minTokensForCluster
 * (too short/ambiguous to auto-fix safely).
 * @param {Array<{page:string, pairs:Array}>} perPage
 */
export function clusterMismatches(perPage, opts = {}) {
  const minTokens = opts.minTokensForCluster ?? 1;
  const clusters = new Map();
  for (const { page, pairs } of perPage) {
    for (const pair of pairs) {
      if (pair.matchType !== 'exact' || !pair.delta.length) continue;
      const key = deltaClusterKey(pair.delta);
      if (!clusters.has(key)) {
        clusters.set(key, {
          key,
          delta: pair.delta,
          count: 0,
          pages: new Set(),
          maxTokenCount: 0,
          roleBuckets: new Set(),
          selectors: new Set(),
          pageSlugs: new Set(),
          samples: [],
        });
      }
      const c = clusters.get(key);
      c.count += 1;
      c.pages.add(page);
      c.pageSlugs.add(page);
      c.maxTokenCount = Math.max(c.maxTokenCount, pair.tokenCount || 0);
      if (pair.roleBucket) c.roleBuckets.add(pair.roleBucket);
      if (pair.selector) c.selectors.add(pair.selector);
      if (c.samples.length < 5) {
        c.samples.push({
          page,
          text: pair.text,
          migratedContext: pair.migratedContext,
          sourceContext: pair.sourceContext,
          sourceFingerprint: pair.sourceFingerprint,
          migratedFingerprint: pair.migratedFingerprint,
        });
      }
    }
  }
  // A selector is UNAMBIGUOUS when it targets an element by id/href fragment
  // (e.g. a citation `a[href="#fn-11"]` / `#disclaimer`) — the short-token guard
  // does not apply to these, because the href is a rock-solid signal regardless
  // of how few characters the visible text has. Without such a selector, a
  // single-token run ("11", "Google") is too ambiguous to auto-fix.
  const hasUnambiguousSelector = (sels) => [...sels].some((s) => /\[href[*^$|]?="#/.test(s) || /#[\w-]/.test(s));
  return [...clusters.values()]
    .map((c) => {
      const unambiguous = hasUnambiguousSelector(c.selectors);
      return {
        ...c,
        pages: [...c.pages],
        roleBuckets: [...c.roleBuckets],
        selectors: [...c.selectors],
        pageSlugs: [...c.pageSlugs],
        // Eligible if it clears the token gate OR is unambiguously selectable
        // (href/id). Auto-fixable additionally requires a stable selector to exist.
        loopEligible: c.maxTokenCount >= minTokens || unambiguous,
        autoFixable: (c.maxTokenCount >= minTokens || unambiguous) && c.selectors.size > 0,
      };
    })
    .sort((a, b) => (b.pages.length - a.pages.length) || (b.count - a.count));
}
