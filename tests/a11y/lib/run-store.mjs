/**
 * Persistent result folders for keyboard runs.
 *
 *   <root>/                                   e.g. a11y-results/keyboard/
 *     index.json                              every run, newest first
 *     latest.json                             the newest run
 *     <YYYY-MM-DD_HHMMSS>_<label>/            one folder per run, never overwritten
 *       run.json                              when, options, git, pairs, totals, status
 *       pages/<name>__<viewport>__<site>.json one per page
 *       compare/<name>__<viewport>.json       one per pair and viewport
 *       report.html
 *
 * The format is described in tests/a11y/RESULTS.md (schemaVersion 1).
 */
import fs from 'fs';
import path from 'path';

export const SCHEMA_VERSION = 1;

const pad = (n) => String(n).padStart(2, '0');

/** Local time as an ISO string with its offset, e.g. 2026-11-24T14:05:12+01:00. */
export function isoLocal(date = new Date()) {
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
}

const stamp = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

export const readJson = (file, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
};

export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

/** Creates a new, unique run folder. Returns { runId, dir }. */
export function createRunDir(root, label, date = new Date()) {
  const base = `${stamp(date)}_${label}`;
  fs.mkdirSync(root, { recursive: true });
  for (let n = 1; ; n += 1) {
    const runId = n === 1 ? base : `${base}-${n}`;
    const dir = path.join(root, runId);
    try {
      fs.mkdirSync(dir);
      fs.mkdirSync(path.join(dir, 'pages'));
      fs.mkdirSync(path.join(dir, 'compare'));
      return { runId, dir };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
  }
}

/** Adds or replaces the run's entry in index.json (newest first) and updates latest.json. */
export function updateIndex(root, run) {
  const indexFile = path.join(root, 'index.json');
  const index = readJson(indexFile, { schemaVersion: SCHEMA_VERSION, runs: [] });
  const entry = {
    runId: run.runId,
    folder: run.runId,
    label: run.label,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt || null,
    status: run.status,
    pairs: run.pairs.map(({ name, source, eds }) => ({ name, source, eds })),
    totals: run.totals || null,
    report: run.report ? `${run.runId}/${run.report}` : null,
  };
  // drop this run's old entry and runs whose folder was deleted
  const runs = (index.runs || [])
    .filter((r) => r.runId !== run.runId && fs.existsSync(path.join(root, r.folder)));
  runs.push(entry);
  runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  writeJson(indexFile, { schemaVersion: SCHEMA_VERSION, runs });
  writeJson(path.join(root, 'latest.json'), {
    schemaVersion: SCHEMA_VERSION, runId: run.runId, folder: run.runId, report: entry.report,
  });
}
