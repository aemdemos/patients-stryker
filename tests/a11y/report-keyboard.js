/**
 * Rebuilds report.html for a keyboard run from its JSON files:
 *   npm run test:a11y:keyboard:report -- [run-folder]
 * Without a folder, the latest run (a11y-results/keyboard/latest.json) is used.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const importLib = (file) => import(pathToFileURL(path.resolve(__dirname, file)).href);

const HELP = `
Rebuild the HTML report of a keyboard test run from its JSON files.

Usage
  npm run test:a11y:keyboard:report -- [run-folder]

Arguments
  [run-folder]   a run folder, e.g. a11y-results/keyboard/2026-11-24_140512_ivs
                 (default: the latest run, from a11y-results/keyboard/latest.json)

Options
  -h, --help     show this help

The report is written to <run-folder>/report.html. All runs are listed in
a11y-results/keyboard/index.json. Result format: tests/a11y/RESULTS.md
`;

(async () => {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    console.log(HELP);
    return;
  }
  const config = (await importLib('keyboard.config.mjs')).default;
  const store = await importLib('lib/run-store.mjs');
  const buildReport = (await importLib('lib/report.mjs')).default;
  const root = path.resolve(config.resultsRoot);

  let dir = args[0];
  if (!dir) {
    const latest = store.readJson(path.join(root, 'latest.json'));
    if (!latest) {
      console.error(`Error: no runs found in ${config.resultsRoot}. Run "npm run test:a11y:keyboard" first.`);
      process.exit(1);
    }
    dir = path.join(root, latest.folder);
  }
  dir = path.resolve(dir);
  if (!fs.existsSync(path.join(dir, 'run.json'))) {
    console.error(`Error: ${dir} is not a run folder (no run.json).\nRun "npm run test:a11y:keyboard:report -- --help" for usage.`);
    process.exit(1);
  }
  const file = buildReport(dir);
  console.log(`Report: ${path.relative(process.cwd(), file)}`);
})();
