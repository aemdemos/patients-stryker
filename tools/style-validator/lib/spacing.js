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

// Global page chrome (header/footer) is excluded from spacing ANCHORS because its
// content differs structurally between source and migrated and can change on
// publish — but its EDGES become boundary anchors instead (see boundaryGaps), so
// header/footer-adjacent spacing (e.g. a hero flush to the header) is still
// measured. Chrome is identified by each run's `chrome` flag (set from
// `el.closest('header, footer')` in extract.js), NOT a contextHint substring: the
// former `'nav'` substring wrongly dropped the in-page sticky-nav block (real
// page content that happens to render as <nav>). A project may still drop
// specific widgets/embeds via config `excludeContexts` (substring on contextHint).
function matchesAny(hint, patterns) {
  if (!patterns || !patterns.length) return false;
  return patterns.some((p) => (hint || '').includes(p));
}

/** Pair source↔migrated runs into positional anchors, in migrated order.
 * Pairs by CONTENT with role as a disambiguating tiebreaker (mirrors diff.js):
 * an unconsumed source run with identical text pairs even when its role differs
 * (an author/parser re-tag, e.g. source <h2> → migrated <p>), so re-tagged runs
 * still serve as spacing anchors instead of vanishing from coverage. Each source
 * run is consumed at most once (front-to-back) to keep repeats order-stable.
 * Runs whose context matches `excludeContexts` are dropped (chrome/widget noise),
 * as are `sup` runs — inline citation markers are not page-layout landmarks and
 * their gaps reflect superscript positioning, not spacing. */
function pairAnchors(sourceRuns, migratedRuns, excludeContexts) {
  const keep = (r) => r.roleBucket !== 'sup' && !r.chrome
    && !matchesAny(r.contextHint, excludeContexts) && r.geometry;
  const src = sourceRuns.filter(keep);
  const mig = migratedRuns.filter(keep);
  const srcByText = new Map();
  for (const r of src) {
    if (!srcByText.has(r.normalizedText)) srcByText.set(r.normalizedText, []);
    srcByText.get(r.normalizedText).push(r);
  }
  const consumed = new Set();
  const anchors = [];
  for (const m of mig) {
    const sameText = (srcByText.get(m.normalizedText) || []).filter((r) => !consumed.has(r));
    if (!sameText.length) continue;
    // Prefer a same-role source run; else take the first unconsumed (re-tag).
    const s = sameText.find((r) => r.roleBucket === m.roleBucket) || sameText[0];
    consumed.add(s);
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

/**
 * Boundary gaps: header-bottom → first page content, and last page content →
 * footer-top, on source vs migrated. The chrome CONTENT is excluded as an anchor
 * (it differs between source/migrated), but its EDGE is a comparable landmark, so
 * this is what catches "the hero sits flush to the header" — previously
 * unmeasurable because no anchor existed at that boundary.
 *
 * "First/last page content" = the topmost/bottommost NON-CHROME content edge:
 * the nearest text run OR content box (image/video), whichever is closer to the
 * chrome edge. Using content boxes (not just text) is essential — the hero leads
 * with an IMAGE, so a text-only anchor would miss it and quarantine the gap.
 * @returns {Array<gapFinding>}
 */
function boundaryGaps({ sourceRuns, sourceBoxes, migratedRuns, migratedBoxes, boundaries }, srcBoundaries, breakpoint) {
  const gaps = [];
  const EDGE_EPS = 2;

  // Topmost / bottommost non-chrome content edge on a side. BOTH text runs and
  // content boxes must exclude chrome (a header logo <img> would otherwise be the
  // "first content" and drive the gap negative).
  const contentEdges = (runs, boxes) => {
    const runTops = runs.filter((r) => r.geometry && !r.chrome).map((r) => r.geometry);
    const boxTops = (boxes || []).filter((g) => !g.chrome);
    const items = runTops.concat(boxTops);
    if (!items.length) return null;
    return {
      firstTop: Math.min(...items.map((g) => g.top)),
      lastBottom: Math.max(...items.map((g) => g.bottom)),
    };
  };
  const migEdges = contentEdges(migratedRuns, migratedBoxes);
  const srcEdges = contentEdges(sourceRuns, sourceBoxes);
  if (!migEdges || !srcEdges) return gaps;

  // header-bottom → first content top
  const mHeader = boundaries && boundaries.headerBottom;
  const sHeader = srcBoundaries && srcBoundaries.headerBottom;
  if (mHeader != null && sHeader != null) {
    const migratedGap = migEdges.firstTop - mHeader;
    const sourceGap = srcEdges.firstTop - sHeader;
    // Only emit when both sides are sane (content below the header edge).
    if (migratedGap >= -EDGE_EPS && sourceGap >= -EDGE_EPS) {
      gaps.push({
        breakpoint,
        fromText: '[header]', toText: '[first content]',
        fromCtx: 'chrome:header-edge', toCtx: 'content:first',
        fromRole: 'boundary', toRole: 'boundary',
        sourceGap: Math.round(sourceGap),
        migratedGap: Math.round(migratedGap),
        delta: Math.round(migratedGap - sourceGap),
        contentSpanning: false, // an edge→content gap is a true spacing signal
        anchorTop: -1, // sort FIRST (topmost boundary)
        boundary: true,
      });
    }
  }

  // last content bottom → footer-top
  const mFooter = boundaries && boundaries.footerTop;
  const sFooter = srcBoundaries && srcBoundaries.footerTop;
  if (mFooter != null && sFooter != null) {
    const migratedGap = mFooter - migEdges.lastBottom;
    const sourceGap = sFooter - srcEdges.lastBottom;
    if (migratedGap >= -EDGE_EPS && sourceGap >= -EDGE_EPS) {
      gaps.push({
        breakpoint,
        fromText: '[last content]', toText: '[footer]',
        fromCtx: 'content:last', toCtx: 'chrome:footer-edge',
        fromRole: 'boundary', toRole: 'boundary',
        sourceGap: Math.round(sourceGap),
        migratedGap: Math.round(migratedGap),
        delta: Math.round(migratedGap - sourceGap),
        contentSpanning: false,
        anchorTop: Number.MAX_SAFE_INTEGER, // sort LAST (bottommost boundary)
        boundary: true,
      });
    }
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
  const excludeContexts = opts.excludeContexts || [];

  // 1) Gather every gap for every page/breakpoint — inter-anchor gaps PLUS the
  // header/footer boundary gaps (chrome-edge → first/last content).
  const allGaps = [];
  for (const { page, byBreakpoint } of perPage) {
    for (const bp of Object.keys(byBreakpoint)) {
      const data = byBreakpoint[bp];
      const gaps = pageBreakpointGaps(data, Number(bp), excludeContexts);
      gaps.forEach((g) => allGaps.push({ ...g, page }));
      boundaryGaps(data, data.sourceBoundaries, Number(bp))
        .forEach((g) => allGaps.push({ ...g, page }));
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
