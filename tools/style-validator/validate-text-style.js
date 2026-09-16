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

import { captureRuns, captureGeometry, captureMeta } from './lib/capture.js';
import { pairRuns, clusterMismatches } from './lib/diff.js';
import { computeSpacingFindings } from './lib/spacing.js';
import { DEFAULT_FINGERPRINT_FIELDS, setFamilyAliases } from './lib/style-fingerprint.js';

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
function eligibleNonSizeFieldMismatchesOf(loopEligible) {
  return loopEligible
    .reduce((sum, c) => sum + (c.count * c.delta.filter((d) => d.field !== 'fontSize').length), 0);
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

  // Spacing pass config (opt-out via "spacing": false). Reuses the same pairs.
  const spacingEnabled = cfg.spacing !== false;
  const spacingBreakpoints = cfg.spacingBreakpoints || [390, 1200];
  const spacingThresholdPx = cfg.spacingThresholdPx ?? 15;

  const perPage = [];
  const spacingPerPage = [];
  const pageMeta = []; // { page, template, theme } — for auto-detecting fix target
  const totals = {
    exact: 0, substring: 0, partial: 0, missing: 0, countMismatch: 0, suspect: 0, excluded: 0,
  };
  try {
    for (const pair of cfg.pairs) {
      const migratedUrl = resolveMigratedUrl(pair.migrated, previewBase);
      process.stderr.write(`[validate] ${pair.name}\n  source:   ${pair.source}\n  migrated: ${migratedUrl}\n`);
      const [sourceRuns, migratedRuns, meta] = await Promise.all([
        captureRuns(browser, pair.source, cfg),
        captureRuns(browser, migratedUrl, cfg),
        captureMeta(browser, migratedUrl, cfg),
      ]);
      pageMeta.push({ page: pair.name, template: meta.template, theme: meta.theme });
      const { pairs, stats } = pairRuns(sourceRuns, migratedRuns, pairOpts);
      perPage.push({ page: pair.name, source: pair.source, migrated: migratedUrl, pairs, stats });
      for (const k of Object.keys(totals)) totals[k] += stats[k] || 0;
      const styleMismatch = pairs.filter((p) => p.matchType === 'exact' && p.delta.length).length;
      process.stderr.write(`  runs: src=${sourceRuns.length} mig=${migratedRuns.length} | exact=${stats.exact} suspect=${stats.suspect} substring=${stats.substring} partial=${stats.partial} missing=${stats.missing} excluded=${stats.excluded} | styleMismatches=${styleMismatch}\n`);

      // Spacing: capture geometry + content boxes at each breakpoint, both sides.
      if (spacingEnabled) {
        const geomOpts = { ...cfg, breakpoints: spacingBreakpoints };
        const [srcGeom, migGeom] = await Promise.all([
          captureGeometry(browser, pair.source, geomOpts),
          captureGeometry(browser, migratedUrl, geomOpts),
        ]);
        const byBreakpoint = {};
        for (const bp of spacingBreakpoints) {
          const s = srcGeom[bp] || { runs: [], contentBoxes: [] };
          const m = migGeom[bp] || { runs: [], contentBoxes: [] };
          byBreakpoint[bp] = {
            sourceRuns: s.runs, sourceBoxes: s.contentBoxes,
            migratedRuns: m.runs, migratedBoxes: m.contentBoxes,
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

  const clusters = clusterMismatches(perPage, pairOpts);
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
    perPage: perPage.map(({ page, source, migrated, stats, pairs }) => ({
      page, source, migrated, stats,
      styleMismatches: pairs.filter((p) => p.matchType === 'exact' && p.delta.length).length,
      suspects: pairs.filter((p) => p.matchType === 'suspect').map((p) => ({ text: p.text, migratedContext: p.migratedContext, sourceContext: p.sourceContext })),
    })),
  };
  const outFile = join(outDir, 'text-style-diff.json');
  writeFileSync(outFile, JSON.stringify(report, null, 2));

  // Human-readable summary to stdout.
  process.stdout.write(`\n=== Text-style validation: ${cfg.pairs.length} page(s) ===\n`);
  process.stdout.write(`Pairing: exact=${totals.exact} suspect=${totals.suspect} substring=${totals.substring} partial=${totals.partial} missing=${totals.missing} excluded=${totals.excluded}\n`);
  process.stdout.write(`Style-mismatch clusters: ${clusters.length} (loop-eligible: ${loopEligible.length}, ineligible: ${ineligible.length})\n`);
  process.stdout.write(`Field mismatches (loop-eligible): ${eligibleFieldMismatches} total, ${eligibleNonSizeFieldMismatches} excluding font-size\n\n`);
  const printCluster = (c, i) => {
    process.stdout.write(`#${i + 1}  [${c.pages.length} page(s), ${c.count} run(s), roles: ${c.roleBuckets.join('/')}]  ${c.key}\n`);
    const s = c.samples[0];
    if (s) process.stdout.write(`     e.g. "${s.text.slice(0, 60)}"  ctx: ${s.migratedContext}\n`);
  };
  process.stdout.write('LOOP-ELIGIBLE:\n');
  loopEligible.forEach(printCluster);
  if (ineligible.length) {
    process.stdout.write('\nINELIGIBLE (too short / ambiguous — reported only):\n');
    ineligible.forEach(printCluster);
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
  }

  process.stdout.write(`\nFull report: ${outFile}\n`);

  // Exit non-zero when actionable work remains: any loop-eligible text-style
  // cluster, OR — once the series gate is open (text-style clean) — a
  // high-confidence spacing cluster. Held spacing does not affect the exit code.
  const actionableSpacing = spacingActive ? spacingHigh.length : 0;
  process.exit((loopEligible.length || actionableSpacing) ? 2 : 0);
}

main().catch((e) => { process.stderr.write(`ERROR: ${e.stack || e.message}\n`); process.exit(1); });
