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
 * Config file shape (see configs/procedure-detail.json):
 *   {
 *     "previewBase": "http://localhost:3000",
 *     "fingerprintFields": [ ...optional override... ],
 *     "pairs": [ { "name": "vertebroplasty",
 *                  "source": "https://.../vertebroplasty.html",
 *                  "migrated": "/content/us/en/ivs/treatments/vertebroplasty" } ]
 *   }
 *
 * Requires Playwright (reused from the excat content-import skill). Set
 * PLAYWRIGHT_NODE_MODULES to override where playwright is resolved from.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import { captureRuns } from './lib/capture.js';
import { pairRuns, clusterMismatches } from './lib/diff.js';
import { DEFAULT_FINGERPRINT_FIELDS } from './lib/style-fingerprint.js';

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

async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig(args);
  const fields = cfg.fingerprintFields || DEFAULT_FINGERPRINT_FIELDS;
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

  const perPage = [];
  const totals = {
    exact: 0, substring: 0, partial: 0, missing: 0, countMismatch: 0, suspect: 0, excluded: 0,
  };
  try {
    for (const pair of cfg.pairs) {
      const migratedUrl = resolveMigratedUrl(pair.migrated, previewBase);
      process.stderr.write(`[validate] ${pair.name}\n  source:   ${pair.source}\n  migrated: ${migratedUrl}\n`);
      const [sourceRuns, migratedRuns] = await Promise.all([
        captureRuns(browser, pair.source, cfg),
        captureRuns(browser, migratedUrl, cfg),
      ]);
      const { pairs, stats } = pairRuns(sourceRuns, migratedRuns, pairOpts);
      perPage.push({ page: pair.name, source: pair.source, migrated: migratedUrl, pairs, stats });
      for (const k of Object.keys(totals)) totals[k] += stats[k] || 0;
      const styleMismatch = pairs.filter((p) => p.matchType === 'exact' && p.delta.length).length;
      process.stderr.write(`  runs: src=${sourceRuns.length} mig=${migratedRuns.length} | exact=${stats.exact} suspect=${stats.suspect} substring=${stats.substring} partial=${stats.partial} missing=${stats.missing} excluded=${stats.excluded} | styleMismatches=${styleMismatch}\n`);
    }
  } finally {
    await browser.close();
  }

  const clusters = clusterMismatches(perPage, pairOpts);
  const loopEligible = clusters.filter((c) => c.loopEligible);
  const ineligible = clusters.filter((c) => !c.loopEligible);

  // Progress metric for the fix loop: total FIELD-level mismatches across all
  // loop-eligible clusters (each run × each differing field). Unlike raw cluster
  // count, this strictly decreases when any field is fixed — so a multi-field fix
  // that leaves a size residual still registers as progress instead of a false
  // regression when one cluster splits into smaller ones.
  const eligibleFieldMismatches = loopEligible
    .reduce((sum, c) => sum + (c.count * c.delta.length), 0);
  // Field mismatches excluding font-size (the field we deliberately don't auto-pin):
  const eligibleNonSizeFieldMismatches = loopEligible
    .reduce((sum, c) => sum + (c.count * c.delta.filter((d) => d.field !== 'fontSize').length), 0);

  const report = {
    generatedFor: cfg.pairs.map((p) => p.name),
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
  process.stdout.write(`\nFull report: ${outFile}\n`);

  // Exit non-zero when there are loop-eligible style clusters (so a fix loop
  // gates on the actionable set, not on noise).
  process.exit(loopEligible.length ? 2 : 0);
}

main().catch((e) => { process.stderr.write(`ERROR: ${e.stack || e.message}\n`); process.exit(1); });
