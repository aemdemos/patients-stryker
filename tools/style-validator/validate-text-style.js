#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-continue, no-await-in-loop */
/* eslint-disable no-underscore-dangle, object-curly-newline, object-property-newline */
/*
 * Text-style fidelity validator.
 *
 * Compares the COMPUTED STYLE of every visible text run on a migrated page
 * against the same text on its source page, ignoring DOM structure. Pairs runs
 * by content (three-tier match adapted from github.com/iustinp/qa-tool), diffs
 * the style fingerprints, and clusters identical mismatches across all pages so
 * a fix can be reasoned about once per issue-type instead of once per page.
 *
 * Template-agnostic: it only needs a list of {source, migrated} page pairs.
 *
 * Usage:
 *   node tools/style-validator/validate-text-style.js --config <pairs.json>
 *   node tools/style-validator/validate-text-style.js \
 *      --source <url> --migrated <url-or-preview-path> [--out <dir>]
 *
 * Config file shape (see configs/example.json and the README for all keys):
 *   {
 *     "previewBase": "http://localhost:3000",
 *     "pairs": [ { "name": "<page-name>",
 *                  "source":   "https://<source-site>/<path>.html",
 *                  "migrated": "/<preview-path>" } ]
 *     // optional: fingerprintFields, fontFamilyAliases, excludeContexts,
 *     //           minTokensForCluster, spacing, spacingThresholdPx,
 *     //           spacingBreakpoints, importScript
 *   }
 *
 * Requires Playwright. Set PLAYWRIGHT_NODE_MODULES to a node_modules dir that
 * has it (defaults probe common local installs).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import { captureGeometry, captureMeta } from './lib/capture.js';
import { pairRuns, clusterMismatches, isDiffedPair } from './lib/diff.js';
import { computeSpacingFindings } from './lib/spacing.js';
import { DEFAULT_FINGERPRINT_FIELDS, SIZE_FIELDS, setFamilyAliases } from './lib/style-fingerprint.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- resolve Playwright from the excat skill's node_modules (or override) ---
function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_NODE_MODULES,
    '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules',
    join(__dirname, 'node_modules'),
  ].filter(Boolean);
  for (const base of candidates) {
    try {
      const req = createRequire(join(base, 'noop.js'));
      // eslint-disable-next-line import/no-dynamic-require, global-require
      return req('playwright');
    } catch { /* try next */ }
  }
  throw new Error('Could not resolve Playwright. Set PLAYWRIGHT_NODE_MODULES to a node_modules dir that has it.');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : true;
      args[key] = val;
    }
  }
  return args;
}

function loadConfig(args) {
  if (args.config) {
    const cfg = JSON.parse(readFileSync(resolve(args.config), 'utf8'));
    cfg.__dir = dirname(resolve(args.config));
    return cfg;
  }
  if (args.source && args.migrated) {
    return { previewBase: 'http://localhost:3000', pairs: [{ name: 'adhoc', source: args.source, migrated: args.migrated }] };
  }
  throw new Error('Provide --config <file> OR --source <url> --migrated <url|path>.');
}

function resolveMigratedUrl(migrated, previewBase) {
  if (/^https?:\/\//.test(migrated)) return migrated;
  return `${previewBase.replace(/\/$/, '')}${migrated.startsWith('/') ? '' : '/'}${migrated}`;
}

// Non-size field mismatches across loop-eligible clusters — the text-style
// progress metric AND the series gate (spacing is held while this is > 0).
// Sizing fields (font-size, line-height) are excluded: see SIZE_FIELDS.
function eligibleNonSizeFieldMismatchesOf(loopEligible) {
  return loopEligible
    .reduce((sum, c) => sum
      + (c.count * c.delta.filter((d) => !SIZE_FIELDS.has(d.field)).length), 0);
}

// Auto-detect where fixes for these pages should land, from their rendered
// template/theme metadata. A templated page → its template CSS scoped
// `body.<template>`; a singleton with only a theme → styles/themes.css scoped
// `body.<theme>`; neither → report-only (no safe auto-scope). When pages disagree
// (mixed templates/themes) the target is per-page, so the loop treats each page's
// scope individually — reported here as `mixed` for the human/AI to handle.
function deriveFixTarget(pageMeta) {
  const templates = [...new Set(pageMeta.map((m) => m.template).filter(Boolean))];
  const themes = [...new Set(pageMeta.map((m) => m.theme).filter(Boolean))];
  if (templates.length === 1) {
    const t = templates[0];
    return { kind: 'template', name: t, cssPath: `templates/${t}/${t}.css`, scope: `body.${t}`, themes };
  }
  if (templates.length === 0 && themes.length) {
    // Singleton(s): fixes land in themes.css, scoped per page's own theme class.
    return { kind: 'theme', name: themes.length === 1 ? themes[0] : 'mixed', cssPath: 'styles/themes.css', scope: themes.length === 1 ? `body.${themes[0]}` : 'per-page', themes };
  }
  if (templates.length > 1) return { kind: 'mixed-template', templates, themes };
  return { kind: 'none' };
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig(args);
  const fields = cfg.fingerprintFields || DEFAULT_FINGERPRINT_FIELDS;
  // Treat source/migrated font-family aliases (same typeface, different license
  // names) as equal. Built-in aliases cover this project's fonts; config may add.
  setFamilyAliases(cfg.fontFamilyAliases);
  const previewBase = cfg.previewBase || 'http://localhost:3000';
  const outDir = resolve(args.out || 'migration-work/importer');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const playwright = loadPlaywright();
  const browser = await playwright.chromium.launch({ args: ['--disable-gpu'] });

  // Pairing guards (config-driven): drop 3rd-party/irrelevant contexts, and
  // require a minimum token count before a cluster is auto-fixable.
  const pairOpts = {
    fields,
    excludeContexts: cfg.excludeContexts || [],
    minTokensForCluster: cfg.minTokensForCluster ?? 1,
  };

  // Spacing pass config (opt-out via "spacing": false). Reuses the same captures.
  const spacingEnabled = cfg.spacing !== false;
  const spacingBreakpoints = cfg.spacingBreakpoints || [390, 1200];
  const spacingThresholdPx = cfg.spacingThresholdPx ?? 15;
  // Text-style breakpoints: text is measured at EVERY one of these widths, so a
  // mobile-only or desktop-only difference (e.g. a heading that is right on
  // desktop but too large on mobile) is caught. Defaults to the spacing
  // breakpoints; override with `textStyleBreakpoints`.
  const textStyleBreakpoints = cfg.textStyleBreakpoints || spacingBreakpoints;
  // One capture per width serves both passes (same extractor, same settle).
  const captureBreakpoints = [
    ...new Set(textStyleBreakpoints.concat(spacingEnabled ? spacingBreakpoints : [])),
  ].sort((a, b) => a - b);

  const perPage = [];
  const spacingPerPage = [];
  const pageMeta = []; // { page, template, theme } — for auto-detecting fix target
  const statKeys = ['exact', 'crossrole', 'subset', 'segmentation', 'substring', 'partial', 'missing',
    'countMismatch', 'suspect', 'excluded'];
  const totals = Object.fromEntries(statKeys.map((k) => [k, 0]));
  try {
    for (const pair of cfg.pairs) {
      const migratedUrl = resolveMigratedUrl(pair.migrated, previewBase);
      process.stderr.write(`[validate] ${pair.name}\n  source:   ${pair.source}\n  migrated: ${migratedUrl}\n`);
      const geomOpts = { ...cfg, breakpoints: captureBreakpoints };
      const [srcGeom, migGeom, meta] = await Promise.all([
        captureGeometry(browser, pair.source, geomOpts),
        captureGeometry(browser, migratedUrl, geomOpts),
        captureMeta(browser, migratedUrl, cfg),
      ]);
      pageMeta.push({ page: pair.name, template: meta.template, theme: meta.theme });

      // Text-style: pair + diff at each breakpoint, tagging every pair with the
      // width it was measured at (clusters then record their breakpoints).
      const pagePairs = [];
      const pageStats = Object.fromEntries(statKeys.map((k) => [k, 0]));
      const statsByBreakpoint = {};
      for (const bp of textStyleBreakpoints) {
        const s = srcGeom[bp] || { runs: [] };
        const m = migGeom[bp] || { runs: [] };
        const { pairs, stats } = pairRuns(s.runs, m.runs, pairOpts);
        pairs.forEach((p) => { p.breakpoint = bp; pagePairs.push(p); });
        statsByBreakpoint[bp] = stats;
        for (const k of statKeys) pageStats[k] += stats[k] || 0;
        const styleMismatch = pairs.filter((p) => isDiffedPair(p) && p.delta.length).length;
        process.stderr.write(`  @${bp}px runs: src=${s.runs.length} mig=${m.runs.length} | exact=${stats.exact} crossrole=${stats.crossrole} subset=${stats.subset} segmentation=${stats.segmentation} suspect=${stats.suspect} substring=${stats.substring} partial=${stats.partial} missing=${stats.missing} excluded=${stats.excluded} | styleMismatches=${styleMismatch}\n`);
      }
      perPage.push({
        page: pair.name,
        source: pair.source,
        migrated: migratedUrl,
        pairs: pagePairs,
        stats: pageStats,
        statsByBreakpoint,
      });
      for (const k of statKeys) totals[k] += pageStats[k];

      // Spacing: geometry + content boxes at each spacing breakpoint, both sides.
      if (spacingEnabled) {
        const byBreakpoint = {};
        for (const bp of spacingBreakpoints) {
          const s = srcGeom[bp] || { runs: [], contentBoxes: [], boundaries: {} };
          const m = migGeom[bp] || { runs: [], contentBoxes: [], boundaries: {} };
          byBreakpoint[bp] = {
            sourceRuns: s.runs, sourceBoxes: s.contentBoxes, sourceBoundaries: s.boundaries || {},
            migratedRuns: m.runs, migratedBoxes: m.contentBoxes, boundaries: m.boundaries || {},
          };
        }
        spacingPerPage.push({ page: pair.name, byBreakpoint });
      }
    }
  } finally {
    await browser.close();
  }

  // Spacing findings (structural clusters + quarantined content-spanning gaps).
  const emptySpacing = {
    clusters: [], contentSpanning: [],
    stats: { structuralClusters: 0, highConfidenceClusters: 0, contentSpanningFlagged: 0 },
  };
  const spacing = spacingEnabled
    ? computeSpacingFindings(spacingPerPage, {
      thresholdPx: spacingThresholdPx,
      excludeContexts: cfg.excludeContexts || [],
    })
    : emptySpacing;

  const clusters = clusterMismatches(perPage, { ...pairOpts, breakpoints: textStyleBreakpoints });
  const loopEligible = clusters.filter((c) => c.loopEligible);
  const ineligible = clusters.filter((c) => !c.loopEligible);

  // SERIES GATE (hard): the spacing pass runs AFTER text-style is clean. A spacing
  // symptom can have a text-style (font-size) root cause, so while any actionable
  // text-style mismatch remains, spacing findings are HELD — computed and reported
  // for context, but excluded from the actionable set and the stop-metric so the
  // loop always resolves text first. Gate opens when non-size text mismatches == 0.
  const textStyleClean = eligibleNonSizeFieldMismatchesOf(loopEligible) === 0;
  const spacingActive = spacingEnabled && textStyleClean;

  // Progress metric for the fix loop: total FIELD-level mismatches across all
  // loop-eligible clusters (each run × each differing field). Unlike raw cluster
  // count, this strictly decreases when any field is fixed — so a multi-field fix
  // that leaves a size residual still registers as progress instead of a false
  // regression when one cluster splits into smaller ones.
  const eligibleFieldMismatches = loopEligible
    .reduce((sum, c) => sum + (c.count * c.delta.length), 0);
  // Field mismatches excluding font-size (the field we deliberately don't auto-pin):
  const eligibleNonSizeFieldMismatches = eligibleNonSizeFieldMismatchesOf(loopEligible);

  const fixTarget = deriveFixTarget(pageMeta);
  const report = {
    generatedFor: cfg.pairs.map((p) => p.name),
    pageMeta,
    fixTarget,
    fingerprintFields: fields,
    textStyleBreakpoints,
    guards: {
      excludeContexts: pairOpts.excludeContexts,
      minTokensForCluster: pairOpts.minTokensForCluster,
    },
    pairingStats: totals,
    clusterCount: clusters.length,
    loopEligibleCount: loopEligible.length,
    eligibleFieldMismatches,
    eligibleNonSizeFieldMismatches,
    spacing: {
      enabled: spacingEnabled,
      // Series gate: `active` only once text-style is clean. When held, the
      // orchestrator must not action or count spacing clusters yet.
      active: spacingActive,
      heldForTextStyle: spacingEnabled && !textStyleClean,
      breakpoints: spacingBreakpoints,
      thresholdPx: spacingThresholdPx,
      stats: spacing.stats,
      clusters: spacing.clusters,
      contentSpanning: spacing.contentSpanning,
    },
    clusters,
    perPage: perPage.map(({
      page, source, migrated, stats, statsByBreakpoint, pairs,
    }) => ({
      page, source, migrated, stats, statsByBreakpoint,
      styleMismatches: pairs.filter((p) => isDiffedPair(p) && p.delta.length).length,
      suspects: pairs.filter((p) => p.matchType === 'suspect').map((p) => ({
        text: p.text,
        breakpoint: p.breakpoint,
        migratedContext: p.migratedContext,
        sourceContext: p.sourceContext,
      })),
    })),
  };
  const outFile = join(outDir, 'text-style-diff.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2));

  // Human-readable summary to stdout.
  process.stdout.write(`\n=== Text-style validation: ${cfg.pairs.length} page(s) @ ${textStyleBreakpoints.join('/')}px ===\n`);
  process.stdout.write(`Pairing (summed over breakpoints): exact=${totals.exact} crossrole=${totals.crossrole} subset=${totals.subset} segmentation=${totals.segmentation} suspect=${totals.suspect} substring=${totals.substring} partial=${totals.partial} missing=${totals.missing} excluded=${totals.excluded}\n`);
  process.stdout.write(`Style-mismatch clusters: ${clusters.length} (loop-eligible: ${loopEligible.length}, ineligible: ${ineligible.length})\n`);
  process.stdout.write(`Field mismatches (loop-eligible): ${eligibleFieldMismatches} total, ${eligibleNonSizeFieldMismatches} excluding sizing (font-size, line-height)\n`);
  process.stdout.write('(lineHeight is compared and shown as a ratio of font-size, e.g. 1.15)\n\n');
  const MAX_TEXTS = 10;
  const printCluster = (c, i) => {
    // Cross-role clusters (source→migrated tag change, e.g. h2→p) are flagged so
    // the fix can be a re-tag/authoring change, not only CSS.
    const retag = c.crossRoleCount ? `  [re-tagged: ${c.roleMismatches.join(', ')}]` : '';
    // Segmentation clusters: the source split the phrase into ≥2 tones the migrated
    // collapsed to one run (a markup/parser fix, not CSS).
    const seg = c.segmentationCount ? '  [segmentation: source multi-tone collapsed]' : '';
    // Breakpoint-specific: occurs at only some widths → needs a media-query-scoped
    // fix (not auto-fixable; the boundary between sampled widths is unknown).
    const bps = c.breakpoints.length ? ` @${c.breakpoints.join('/')}px` : '';
    const bpOnly = c.breakpointSpecific ? '  [breakpoint-specific]' : '';
    process.stdout.write(`#${i + 1}  [${c.pages.length} page(s), ${c.count} run(s)${bps}, roles: ${c.roleBuckets.join('/')}]  ${c.key}${retag}${seg}${bpOnly}\n`);
    // Every distinct text in the cluster (not just the first sample), so a
    // multi-member cluster can't read as a single issue.
    (c.texts || []).slice(0, MAX_TEXTS).forEach((t) => {
      const tb = t.breakpoints.length && t.breakpoints.length !== c.breakpoints.length ? `  @${t.breakpoints.join('/')}px` : '';
      process.stdout.write(`     - "${t.text.slice(0, 60)}"${tb}\n`);
    });
    if ((c.texts || []).length > MAX_TEXTS) process.stdout.write(`     …and ${c.texts.length - MAX_TEXTS} more (see report JSON)\n`);
    const s = c.samples[0];
    if (s) process.stdout.write(`     ctx: ${s.migratedContext}\n`);
    // Show the per-segment source tones the migrated lost, so the defect is legible.
    if (s && s.segmentParts && s.segmentParts.length > 1) {
      s.segmentParts.forEach((p) => {
        const fp = p.fingerprint || {};
        process.stdout.write(`       source tone: "${(p.text || '').slice(0, 30)}"  ${fp.fontFamily || ''} ${fp.color || ''}\n`);
      });
    }
  };
  process.stdout.write('LOOP-ELIGIBLE:\n');
  loopEligible.forEach(printCluster);
  if (ineligible.length) {
    process.stdout.write('\nINELIGIBLE (too short / ambiguous — reported only):\n');
    ineligible.forEach(printCluster);
  }

  // SUSPECTS — same text present in source under a role that doesn't match, with
  // MORE THAN ONE candidate role (genuinely ambiguous). These are NOT auto-diffed,
  // but they are printed here (previously buried in the JSON only) so a clean
  // headline count can't hide them: each may be a real defect a human should judge.
  // De-duplicated across breakpoints (the same ambiguous text recurs per width).
  const suspectMap = new Map();
  perPage.forEach(({ page, pairs }) => pairs
    .filter((p) => p.matchType === 'suspect')
    .forEach((p) => {
      const k = `${page}|${p.text}`;
      if (!suspectMap.has(k)) suspectMap.set(k, { page, ...p });
    }));
  const allSuspects = [...suspectMap.values()];
  if (allSuspects.length) {
    process.stdout.write(`\nSUSPECTS (${allSuspects.length}) — ambiguous text/role, not auto-diffed; review manually:\n`);
    allSuspects.slice(0, 20).forEach((p) => {
      process.stdout.write(`   "${(p.text || '').slice(0, 50)}"  src:${p.sourceContext} → mig:${p.migratedContext}\n`);
    });
    if (allSuspects.length > 20) process.stdout.write(`   …and ${allSuspects.length - 20} more (see report JSON)\n`);
  }

  // Spacing summary.
  const spacingHigh = spacing.clusters.filter((c) => !c.directionInconsistent);
  if (spacingEnabled) {
    const gateNote = spacingActive
      ? ''
      : '  — HELD (series gate: resolve text-style first)';
    process.stdout.write(`\n=== Spacing (anchor-based, threshold ${spacingThresholdPx}px, breakpoints ${spacingBreakpoints.join('/')})${gateNote} ===\n`);
    process.stdout.write(`Structural clusters: ${spacing.clusters.length} (high-confidence: ${spacingHigh.length}, direction-inconsistent: ${spacing.clusters.length - spacingHigh.length}); content-spanning quarantined: ${spacing.stats.contentSpanningFlagged}\n`);
    const printSpacing = (c, i) => {
      const flag = c.directionInconsistent ? '  [direction-inconsistent → likely reflow]' : '';
      process.stdout.write(`#${i + 1}  [${c.pageCount} page(s) @${c.breakpoint}px, Δ~${c.medianDelta > 0 ? '+' : ''}${c.medianDelta}px]  ${c.transition}${flag}\n`);
      const s = c.instances[0];
      if (s) process.stdout.write(`     e.g. "${(s.fromText || '').slice(0, 24)}" → "${(s.toText || '').slice(0, 24)}"  src ${s.sourceGap}px vs mig ${s.migratedGap}px\n`);
    };
    if (spacingHigh.length) { process.stdout.write('HIGH-CONFIDENCE (top-to-bottom):\n'); spacingHigh.forEach(printSpacing); }
    const inconsistent = spacing.clusters.filter((c) => c.directionInconsistent);
    if (inconsistent.length) { process.stdout.write('\nDOWN-RANKED (direction-inconsistent across breakpoints):\n'); inconsistent.forEach(printSpacing); }
    // CONTENT-SPANNING — gaps over threshold that were quarantined (media/other
    // content in the interval, or overlapping/side-by-side anchors). Low
    // confidence and NOT gated on, but printed (previously JSON-only) so a
    // real margin bug hiding behind an image or a two-column zone is at least
    // visible for human review rather than silently dropped.
    if (spacing.contentSpanning && spacing.contentSpanning.length) {
      process.stdout.write(`\nCONTENT-SPANNING (${spacing.contentSpanning.length}, quarantined — review, not auto-fixed):\n`);
      spacing.contentSpanning.slice(0, 15).forEach((g) => {
        process.stdout.write(`   @${g.breakpoint}px Δ${g.delta > 0 ? '+' : ''}${g.delta}px  ${g.transition}\n     "${(g.fromText || '').slice(0, 24)}" → "${(g.toText || '').slice(0, 24)}"\n`);
      });
      if (spacing.contentSpanning.length > 15) process.stdout.write(`   …and ${spacing.contentSpanning.length - 15} more (see report JSON)\n`);
    }
  }

  process.stdout.write(`\nFull report: ${outFile}\n`);

  // Exit non-zero when actionable work remains: any loop-eligible text-style
  // cluster, OR — once the series gate is open (text-style clean) — a
  // high-confidence spacing cluster. Held spacing does not affect the exit code.
  const actionableSpacing = spacingActive ? spacingHigh.length : 0;
  process.exit((loopEligible.length || actionableSpacing) ? 2 : 0);
}

main().catch((e) => { process.stderr.write(`ERROR: ${e.stack || e.message}\n`); process.exit(1); });
