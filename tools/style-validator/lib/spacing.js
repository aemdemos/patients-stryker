/* eslint-disable no-restricted-syntax, no-continue */
/* eslint-disable object-curly-newline, object-property-newline */
/* eslint-disable max-len, import/prefer-default-export */
/* eslint-disable function-paren-newline, function-call-argument-newline */
/*
 * Anchor-based spacing validator (Phase 1 — detection & reporting).
 *
 * Uses the SAME text pairing as the style validator: a source text run and its
 * migrated counterpart (identical normalized text + role) are trustworthy
 * positional ANCHORS — the same words on both pages. We never compare absolute
 * positions (page heights differ); we compare the GAP between two consecutive
 * anchors on source vs migrated:
 *     sourceGap   = B.top(src) - A.bottom(src)
 *     migratedGap = B.top(mig) - A.bottom(mig)
 *     delta       = migratedGap - sourceGap
 *
 * Critical noise filter: a gap only counts as a SPACING signal when the two
 * anchors are STRUCTURALLY ADJACENT — nothing but whitespace/margins between
 * them (no images/embeds and no other text between them on EITHER side). When
 * real content sits in the interval the gap reflects content height, not
 * spacing, so it is flagged `contentSpanning` and kept out of the clusters
 * (reported separately, low confidence). This is the make-or-break distinction
 * from the manual audit (it must quarantine howItWorks→resources content-height
 * noise while keeping the real resources→risks spacing gap).
 *
 * Template-agnostic: anchors come from text matching, the metric is relative,
 * and adjacency is judged from geometry — no selectors or block names.
 */

const EPS = 2; // px tolerance when testing whether an element sits in an interval
// A legitimate "stacked" adjacency gap is >= 0 (or only a few px negative from
// line-box vs glyph rounding). A meaningfully NEGATIVE gap means the two anchors
// overlap VERTICALLY — they are side-by-side columns (a flex/grid two-column
// zone, e.g. intro copy beside a benefits panel) or nested, not stacked, so the
// vertical "gap" is meaningless. Beyond this floor the pair is treated as
// non-adjacent (content-spanning). Verified on this template: all real stacked
// gaps were positive (33/47/57/90px); negatives were only column/heading overlaps.
const MAX_NEGATIVE_GAP = -8;

// Context substrings that are page CHROME, not "major elements of the page" —
// excluded from spacing anchors because they differ structurally between source
// and migrated (global nav/header/footer) and are not a page-layout signal. This
// is a generic default; a project adds its own chrome/widget context substrings
// (e.g. a specific form or embed) via config `excludeContexts`, matched against
// each run's contextHint. Match is substring-based, so 'nav' catches nav-*.
const DEFAULT_SPACING_EXCLUDE = ['nav', 'header', 'footer'];

function matchesAny(hint, patterns) {
  if (!patterns || !patterns.length) return false;
  return patterns.some((p) => (hint || '').includes(p));
}

/** Exact-pair source↔migrated runs (same text+role+dup-rank), in migrated order.
 * Mirrors the exact-match keying used by diff.js so anchors are consistent.
 * Runs whose context matches `excludeContexts` are dropped (chrome/widget noise),
 * as are `sup` runs — inline citation markers are not page-layout landmarks and
 * their gaps reflect superscript positioning, not spacing. */
function pairAnchors(sourceRuns, migratedRuns, excludeContexts) {
  const keep = (r) => r.roleBucket !== 'sup' && !matchesAny(r.contextHint, excludeContexts);
  const src = sourceRuns.filter(keep);
  const mig = migratedRuns.filter(keep);
  const srcByKey = new Map();
  for (const r of src) {
    srcByKey.set(`${r.normalizedText}#${r.roleBucket}#${r.dupRank}`, r);
  }
  const migRank = new Map();
  const anchors = [];
  for (const m of mig) {
    const rkey = `${m.normalizedText}#${m.roleBucket}`;
    const rank = migRank.get(rkey) || 0;
    migRank.set(rkey, rank + 1);
    const s = srcByKey.get(`${m.normalizedText}#${m.roleBucket}#${rank}`);
    if (s && s.geometry && m.geometry) {
      anchors.push({
        normalizedText: m.normalizedText,
        text: m.rawText,
        roleBucket: m.roleBucket,
        srcCtx: s.contextHint,
        migCtx: m.contextHint,
        src: s.geometry,
        mig: m.geometry,
      });
    }
  }
  return anchors;
}

/** Does any item's box occupy the interior of (lo, hi)? Anchors A/B excluded by
 * the caller. `items` are {top, bottom} rects. */
function hasContentBetween(lo, hi, items) {
  if (hi - lo <= EPS) return false;
  for (const it of items) {
    if (it.top < hi - EPS && it.bottom > lo + EPS) return true;
  }
  return false;
}

/**
 * Compute structural + content-spanning gaps between consecutive anchors for one
 * page at one breakpoint.
 * @returns {Array<gapFinding>}
 */
function pageBreakpointGaps({ sourceRuns, sourceBoxes, migratedRuns, migratedBoxes }, breakpoint, excludeContexts) {
  const anchors = pairAnchors(sourceRuns, migratedRuns, excludeContexts);
  // Order by migrated top (visual/DOM order). Skip anchors without geometry.
  anchors.sort((a, b) => a.mig.top - b.mig.top);

  // Every text run's geometry (for the between-content test), and content boxes.
  const migRunBoxes = migratedRuns.filter((r) => r.geometry).map((r) => r.geometry);
  const srcRunBoxes = sourceRuns.filter((r) => r.geometry).map((r) => r.geometry);
  const migItems = migRunBoxes.concat(migratedBoxes || []);
  const srcItems = srcRunBoxes.concat(sourceBoxes || []);

  const gaps = [];
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const A = anchors[i];
    const B = anchors[i + 1];
    // Both sides must have B strictly after A (same order); else the pairing is
    // ambiguous (reordered content) — skip rather than emit a bogus gap.
    const migratedGap = B.mig.top - A.mig.bottom;
    const sourceGap = B.src.top - A.src.bottom;
    if (B.src.top < A.src.top || B.mig.top < A.mig.top) continue;

    // Adjacency: nothing but the two anchors themselves between them, on BOTH
    // sides. Exclude A and B's own boxes from the interior test.
    const migBetween = hasContentBetween(
      A.mig.bottom, B.mig.top,
      migItems.filter((g) => !(g.top === A.mig.top && g.bottom === A.mig.bottom)
        && !(g.top === B.mig.top && g.bottom === B.mig.bottom)),
    );
    const srcBetween = hasContentBetween(
      A.src.bottom, B.src.top,
      srcItems.filter((g) => !(g.top === A.src.top && g.bottom === A.src.bottom)
        && !(g.top === B.src.top && g.bottom === B.src.bottom)),
    );
    // Negative gap on either side → the two anchors overlap vertically, so they
    // are NOT stacked: side-by-side columns (flex/grid two-column zone), two
    // wrapped lines of one heading, or otherwise nested. In every such case the
    // vertical "gap" is meaningless (and any real cause — e.g. a heading's
    // font-size — belongs to the text-style pass), so quarantine as
    // content-spanning. This single rule subsumes the earlier per-case guards.
    const overlapping = sourceGap < MAX_NEGATIVE_GAP || migratedGap < MAX_NEGATIVE_GAP;
    const contentSpanning = migBetween || srcBetween || overlapping;

    gaps.push({
      breakpoint,
      fromText: A.text, toText: B.text,
      fromCtx: A.migCtx, toCtx: B.migCtx,
      fromRole: A.roleBucket, toRole: B.roleBucket,
      sourceGap: Math.round(sourceGap),
      migratedGap: Math.round(migratedGap),
      delta: Math.round(migratedGap - sourceGap),
      contentSpanning,
      anchorTop: A.mig.top, // for top-to-bottom ordering
    });
  }
  return gaps;
}

/** Stable transition signature so the same landmark-to-landmark gap clusters
 * across pages. Context hints are template-stable (block/section classes). */
function transitionKey(gap) {
  return `${gap.breakpoint}|${gap.fromRole}:${gap.fromCtx} → ${gap.toRole}:${gap.toCtx}`;
}

/**
 * Compute spacing findings across all pages.
 * @param {Array} perPage  [{ page, byBreakpoint: { [bp]: {sourceRuns, sourceBoxes, migratedRuns, migratedBoxes} } }]
 * @param {object} opts { thresholdPx=15 }
 * @returns {{ clusters, contentSpanning, stats }}
 */
export function computeSpacingFindings(perPage, opts = {}) {
  const threshold = opts.thresholdPx ?? 15;
  const excludeContexts = (opts.excludeContexts || []).concat(DEFAULT_SPACING_EXCLUDE);

  // 1) Gather every gap for every page/breakpoint.
  const allGaps = [];
  for (const { page, byBreakpoint } of perPage) {
    for (const bp of Object.keys(byBreakpoint)) {
      const gaps = pageBreakpointGaps(byBreakpoint[bp], Number(bp), excludeContexts);
      gaps.forEach((g) => allGaps.push({ ...g, page }));
    }
  }

  // 2) Cluster STRUCTURAL gaps that exceed the threshold by transition signature.
  const clusters = new Map();
  for (const g of allGaps) {
    if (g.contentSpanning) continue;
    if (Math.abs(g.delta) < threshold) continue;
    const key = transitionKey(g);
    if (!clusters.has(key)) {
      clusters.set(key, {
        key, breakpoint: g.breakpoint,
        transition: `${g.fromRole}:${g.fromCtx} → ${g.toRole}:${g.toCtx}`,
        instances: [], pages: new Set(), deltas: [], minAnchorTop: Infinity,
      });
    }
    const c = clusters.get(key);
    c.pages.add(g.page);
    c.deltas.push(g.delta);
    c.minAnchorTop = Math.min(c.minAnchorTop, g.anchorTop);
    if (c.instances.length < 5) {
      c.instances.push({ page: g.page, fromText: g.fromText, toText: g.toText, sourceGap: g.sourceGap, migratedGap: g.migratedGap, delta: g.delta });
    }
  }

  // 3) Direction-consistency across breakpoints: for the same transition (ignoring
  //    breakpoint), if the median delta sign disagrees between breakpoints it is
  //    likely content reflow, not a margin bug → down-rank.
  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const byTransition = new Map();
  for (const c of clusters.values()) {
    if (!byTransition.has(c.transition)) byTransition.set(c.transition, []);
    byTransition.get(c.transition).push(c);
  }
  for (const group of byTransition.values()) {
    if (group.length < 2) continue;
    const signs = new Set(group.map((c) => Math.sign(median(c.deltas))));
    if (signs.size > 1) group.forEach((c) => { c.directionInconsistent = true; });
  }

  // 4) Finalize: sort clusters top-to-bottom (by highest/earliest anchor), so a
  //    future fix-loop addresses the topmost issue first (top fixes cascade).
  const finalized = [...clusters.values()]
    .map((c) => ({
      key: c.key,
      breakpoint: c.breakpoint,
      transition: c.transition,
      pages: [...c.pages],
      pageCount: c.pages.size,
      medianDelta: median(c.deltas),
      deltas: c.deltas,
      directionInconsistent: !!c.directionInconsistent,
      minAnchorTop: c.minAnchorTop,
      instances: c.instances,
    }))
    .sort((a, b) => a.minAnchorTop - b.minAnchorTop);

  // 5) Content-spanning gaps over threshold — reported separately (low confidence).
  const contentSpanning = allGaps
    .filter((g) => g.contentSpanning && Math.abs(g.delta) >= threshold)
    .map((g) => ({ page: g.page, breakpoint: g.breakpoint, transition: `${g.fromRole}:${g.fromCtx} → ${g.toRole}:${g.toCtx}`, delta: g.delta, fromText: g.fromText, toText: g.toText }));

  const stats = {
    thresholdPx: threshold,
    totalGaps: allGaps.length,
    structuralClusters: finalized.length,
    highConfidenceClusters: finalized.filter((c) => !c.directionInconsistent).length,
    contentSpanningFlagged: contentSpanning.length,
  };

  return { clusters: finalized, contentSpanning, stats };
}
