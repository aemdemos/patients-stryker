/* eslint-disable no-restricted-syntax, no-continue */
/* eslint-disable object-curly-newline, object-property-newline */
/*
 * Pair migrated text runs to source text runs (by content, role-disambiguated,
 * order-stable for duplicates), compute per-run style deltas, and cluster
 * identical deltas across pages.
 *
 * Role handling (revised): role bucket (heading/sup/link/listitem/body) is a
 * DISAMBIGUATING TIEBREAKER, not a hard gate on comparison. The earlier design
 * refused to diff any pair whose role buckets differed ("suspect"), which
 * silently skipped every run an author/parser LEGITIMATELY re-tagged — e.g. a
 * source <h2> rendered as a styled <p>, or a source body label promoted to an
 * <h3> card heading. Those are exactly the runs whose style you most want to
 * compare ("does my <p> read like the source <h2>?"). So:
 *   - same text, SAME role  → exact pair, diffed (unchanged).
 *   - same text, ONE other role in source (unambiguous re-tag) → `crossrole`
 *     pair, DIFFED and clustered, carrying a `roleMismatch {source,migrated}`
 *     note so the retag is visible.
 *   - same text present in source under MULTIPLE roles, none matching → `suspect`
 *     (genuinely ambiguous, e.g. a nav "Resources" vs a heading "Resources");
 *     reported (and now printed), never auto-diffed.
 * Pairing consumes each source run at most once (front-to-back in doc order), so
 * repeated identical text stays order-stable without a separate dup-rank index.
 *
 * Other guards (unchanged): context exclusion (drop 3rd-party/chrome contexts
 * via excludeContexts before diffing); short-run gate (mismatches below
 * minTokensForCluster are recorded but not loop-eligible unless the selector is
 * an unambiguous href/id).
 */

import {
  buildTargetIndex, classifyMatch, tokenForm,
} from './text-match.js';
import { fingerprintDelta, deltaClusterKey, DEFAULT_FINGERPRINT_FIELDS } from './style-fingerprint.js';

function matchesAny(hint, patterns) {
  if (!patterns || !patterns.length) return false;
  return patterns.some((p) => (hint || '').includes(p));
}

// A pair whose computed style WAS compared (so it can carry a real delta and
// feed clustering). Beyond same-role exact + cross-role retag, this now includes
// `subset` and `segmentation` — a migrated run whose text has no exact twin
// because the SOURCE split (or sub-divided) the same phrase into differently-
// styled runs the migrated collapsed into one (e.g. "Making every moment
// <gold>matter.</gold>" flattened to one plain run). `suspect`/`substring`/
// `partial`/`missing` are NOT diffed.
export function isDiffedPair(pair) {
  return pair.matchType === 'exact' || pair.matchType === 'crossrole'
    || pair.matchType === 'subset' || pair.matchType === 'segmentation';
}

// Index of the first occurrence of token-sequence `needle` within `hay` (both
// arrays of tokens), or -1. Used to locate where a source run's tokens sit
// inside a migrated run's tokens when detecting a source-split phrase.
function tokenSubStart(hay, needle) {
  if (!needle.length || needle.length > hay.length) return -1;
  for (let i = 0; i + needle.length <= hay.length; i += 1) {
    let ok = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (hay[i + j] !== needle[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

/**
 * Find the ordered source runs that TILE a migrated run's tokens — i.e. the
 * source split a phrase (into ≥1 differently-styled runs) that the migrated
 * collapsed into this single run. Greedy left-to-right, non-overlapping, each
 * source run used once; requires ≥80% token coverage to count as a genuine tiling.
 *
 * Skips source runs whose exact text also exists as its OWN migrated run
 * (`migTextSet`) — those pair exactly on their own turn and must not be stolen
 * here. Skips already-`consumed` source runs.
 * @returns {Array} covering source runs in reading order (empty if none tile).
 */
function coveringSourceSegments(migTokenForm, srcRuns, consumed, migTextSet) {
  if (!migTokenForm) return [];
  const migTokens = migTokenForm.split(' ');
  const candidates = [];
  for (const r of srcRuns) {
    if (consumed.has(r)) continue;
    if (migTextSet.has(r.normalizedText)) continue; // reserve for its own exact pairing
    const segTokens = tokenForm(r.normalizedText).split(' ').filter(Boolean);
    if (!segTokens.length) continue;
    const start = tokenSubStart(migTokens, segTokens);
    if (start >= 0) candidates.push({ run: r, start, len: segTokens.length });
  }
  if (!candidates.length) return [];
  // Greedy tiling: earliest start first, longer run wins ties.
  candidates.sort((a, b) => a.start - b.start || b.len - a.len);
  const chosen = [];
  let cursor = 0;
  for (const c of candidates) {
    if (c.start >= cursor) { chosen.push(c); cursor = c.start + c.len; }
  }
  const covered = chosen.reduce((s, c) => s + c.len, 0);
  if (covered / migTokens.length < 0.8) return [];
  return chosen.map((c) => c.run);
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

  // Global chrome (<header>/<footer>, flagged by the extractor) is out of scope:
  // it is rendered by shared site-wide blocks, differs structurally from the
  // source, and can change on publish — same exclusion the spacing pass applies.
  const keep = (r) => !r.chrome && !matchesAny(r.contextHint, excludeContexts);
  const src = sourceRuns.filter(keep);
  const mig = migratedRuns.filter(keep);
  const excludedCount = (sourceRuns.length - src.length) + (migratedRuns.length - mig.length);

  // Index source runs by normalizedText (runs kept in doc order). A `consumed`
  // set makes each source run pair at most once, so repeated identical text is
  // aligned front-to-back without a dup-rank key.
  const srcByText = new Map(); // normalizedText -> [runs] in doc order
  for (const r of src) {
    if (!srcByText.has(r.normalizedText)) srcByText.set(r.normalizedText, []);
    srcByText.get(r.normalizedText).push(r);
  }
  const consumed = new Set();
  const srcTarget = buildTargetIndex(src.map((r) => r.normalizedText));
  // Every migrated normalized text — so segment detection never steals a source
  // run that has its own exact migrated twin waiting to pair.
  const migTextSet = new Set(mig.map((r) => r.normalizedText));

  const pairs = [];
  const stats = {
    exact: 0, crossrole: 0, subset: 0, segmentation: 0,
    substring: 0, partial: 0, missing: 0, countMismatch: 0, suspect: 0,
    excluded: excludedCount,
  };

  const emitDiffed = (m, source, matchType) => {
    const delta = fingerprintDelta(source.fingerprint, m.fingerprint, fields);
    stats[matchType] += 1;
    const pair = {
      matchType,
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
    };
    if (matchType === 'crossrole') {
      pair.roleMismatch = { source: source.roleBucket, migrated: m.roleBucket };
    }
    pairs.push(pair);
  };

  for (const m of mig) {
    // Unconsumed source runs with identical text.
    const sameText = (srcByText.get(m.normalizedText) || []).filter((r) => !consumed.has(r));

    if (sameText.length) {
      // Prefer a SAME-role source run (order-stable, first unconsumed).
      const sameRole = sameText.find((r) => r.roleBucket === m.roleBucket);
      if (sameRole) {
        consumed.add(sameRole);
        emitDiffed(m, sameRole, 'exact');
        continue;
      }
      // No same-role candidate. If every remaining same-text source run shares a
      // SINGLE (different) role, this is an unambiguous re-tag → diff it.
      const roles = new Set(sameText.map((r) => r.roleBucket));
      if (roles.size === 1) {
        const source = sameText[0];
        consumed.add(source);
        emitDiffed(m, source, 'crossrole');
        continue;
      }
      // Same text under multiple source roles, none matching → genuinely
      // ambiguous. Report as suspect (printed by the summary), never diffed.
      stats.suspect += 1;
      pairs.push({
        matchType: 'suspect',
        text: m.rawText,
        normalizedText: m.normalizedText,
        roleBucket: m.roleBucket,
        migratedContext: m.contextHint,
        sourceContext: sameText[0] ? sameText[0].contextHint : null,
        note: 'text present in source under multiple roles; none matches the migrated role',
        delta: [],
      });
      continue;
    }
    // No exact/cross-role text twin. Before giving up (substring/partial/missing,
    // which are never diffed), check whether the SOURCE split this migrated run's
    // phrase into one or more differently-styled runs that the migrated collapsed
    // — the "Making every moment <gold>matter.</gold>" → flat "<h3>Making every
    // moment matter.</h3>" case. If covering source segments tile the migrated
    // tokens, DIFF the migrated run against each segment so the style delta (and
    // any lost multi-tone treatment) surfaces instead of being silently skipped.
    const segments = coveringSourceSegments(tokenForm(m.normalizedText), src, consumed, migTextSet);
    if (segments.length) {
      segments.forEach((s) => consumed.add(s));
      // Distinct source fingerprints among the segments → the source rendered the
      // phrase in MORE THAN ONE style (multi-tone). Collapsing it to one migrated
      // run necessarily loses that; flag as `segmentation`. A single covering
      // segment (source is one styled sub-run of a larger migrated run) is a
      // `subset` style comparison.
      const distinctFps = new Set(segments.map((s) => JSON.stringify(s.fingerprint)));
      const multiTone = distinctFps.size > 1;
      const matchType = (segments.length > 1 && multiTone) ? 'segmentation' : 'subset';
      // Diff the migrated run against the FIRST segment's style (reading order);
      // for a multi-tone split this is the leading segment — the remaining tones
      // are reported via segmentParts so a human/AI sees every lost treatment.
      const primary = segments[0];
      const delta = fingerprintDelta(primary.fingerprint, m.fingerprint, fields);
      stats[matchType] += 1;
      pairs.push({
        matchType,
        text: m.rawText,
        normalizedText: m.normalizedText,
        roleBucket: m.roleBucket,
        tokenCount: m.tokenCount,
        selector: m.selector,
        migratedContext: m.contextHint,
        sourceContext: primary.contextHint,
        sourceFingerprint: primary.fingerprint,
        migratedFingerprint: m.fingerprint,
        delta,
        // Per-segment source styles the migrated collapsed (text + fingerprint),
        // so a multi-tone source phrase is fully visible even though we diff the
        // migrated run once against the leading tone.
        segmentParts: segments.map((s) => ({ text: s.rawText, fingerprint: s.fingerprint })),
      });
      continue;
    }

    // Truly no coverage — classify (substring/partial/missing). Not style-diffed.
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
 *
 * Breakpoints: pairs carry the viewport `breakpoint` they were measured at (the
 * text-style pass runs at every configured breakpoint, so a mobile-only or
 * desktop-only style difference is caught). Each cluster records the breakpoints
 * it occurs at. A cluster present at only SOME of the measured breakpoints
 * (`breakpointSpecific`) needs a media-query-scoped fix whose boundary the tool
 * can't know (it only samples a few widths), so it is reported but not
 * auto-fixable — an unconditional rule would regress the breakpoints where the
 * text is already correct.
 * @param {Array<{page:string, pairs:Array}>} perPage
 * @param {object} opts { minTokensForCluster, breakpoints:[px,...] (all measured widths) }
 */
export function clusterMismatches(perPage, opts = {}) {
  const minTokens = opts.minTokensForCluster ?? 1;
  const measuredBreakpoints = opts.breakpoints || [];
  const clusters = new Map();
  for (const { page, pairs } of perPage) {
    for (const pair of pairs) {
      if (!isDiffedPair(pair)) continue;
      // Cluster any DIFFED pair that carries a non-empty style delta. A
      // `segmentation` pair is special: the source rendered the phrase in MORE
      // THAN ONE tone that the migrated collapsed, which is a defect EVEN IF the
      // leading tone matches (delta empty) — so surface it under a synthetic key
      // when it has no field delta of its own.
      let { delta } = pair;
      let key;
      if (delta.length) {
        key = deltaClusterKey(delta);
      } else if (pair.matchType === 'segmentation') {
        key = 'segmentation:multi-tone source collapsed to one run';
        delta = []; // no field delta; the defect is the lost segmentation itself
      } else {
        continue; // exact/crossrole/subset with no delta → genuinely clean
      }
      if (!clusters.has(key)) {
        clusters.set(key, {
          key,
          delta,
          count: 0,
          crossRoleCount: 0,
          segmentationCount: 0,
          pages: new Set(),
          maxTokenCount: 0,
          roleBuckets: new Set(),
          roleMismatches: new Set(),
          selectors: new Set(),
          pageSlugs: new Set(),
          breakpoints: new Set(),
          texts: new Map(), // `${page}|${text}` -> { page, text, breakpoints:Set }
          samples: [],
        });
      }
      const c = clusters.get(key);
      c.count += 1;
      c.pages.add(page);
      c.pageSlugs.add(page);
      if (pair.breakpoint != null) c.breakpoints.add(pair.breakpoint);
      // Every distinct text in the cluster (samples are capped at 5, so a summary
      // built from samples alone can hide members — e.g. 2 panels read as 1).
      const tkey = `${page}|${pair.text}`;
      if (!c.texts.has(tkey)) c.texts.set(tkey, { page, text: pair.text, breakpoints: new Set() });
      if (pair.breakpoint != null) c.texts.get(tkey).breakpoints.add(pair.breakpoint);
      c.maxTokenCount = Math.max(c.maxTokenCount, pair.tokenCount || 0);
      if (pair.roleBucket) c.roleBuckets.add(pair.roleBucket);
      if (pair.matchType === 'crossrole') {
        c.crossRoleCount += 1;
        if (pair.roleMismatch) c.roleMismatches.add(`${pair.roleMismatch.source}→${pair.roleMismatch.migrated}`);
      }
      if (pair.matchType === 'segmentation') c.segmentationCount += 1;
      if (pair.selector) c.selectors.add(pair.selector);
      if (c.samples.length < 5) {
        c.samples.push({
          page,
          text: pair.text,
          breakpoint: pair.breakpoint ?? null,
          matchType: pair.matchType,
          roleMismatch: pair.roleMismatch || null,
          segmentParts: pair.segmentParts || null,
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
      const breakpoints = [...c.breakpoints].sort((a, b) => a - b);
      const breakpointSpecific = measuredBreakpoints.length > 1
        && !measuredBreakpoints.every((bp) => c.breakpoints.has(bp));
      return {
        ...c,
        pages: [...c.pages],
        roleBuckets: [...c.roleBuckets],
        roleMismatches: [...c.roleMismatches],
        selectors: [...c.selectors],
        pageSlugs: [...c.pageSlugs],
        breakpoints,
        breakpointSpecific,
        texts: [...c.texts.values()].map((t) => ({
          page: t.page, text: t.text, breakpoints: [...t.breakpoints].sort((a, b) => a - b),
        })),
        // Eligible if it clears the token gate OR is unambiguously selectable
        // (href/id). Auto-fixable additionally requires a stable selector to exist
        // and the cluster to occur at EVERY measured breakpoint (see above).
        loopEligible: c.maxTokenCount >= minTokens || unambiguous,
        autoFixable: (c.maxTokenCount >= minTokens || unambiguous) && c.selectors.size > 0
          && !breakpointSpecific,
      };
    })
    .sort((a, b) => (b.pages.length - a.pages.length) || (b.count - a.count));
}
