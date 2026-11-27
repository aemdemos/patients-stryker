/**
 * Page pairs for a keyboard run: from the command line, a CSV file, or
 * keyboard.config.mjs. Used by run-keyboard.js; the resolved pairs are stored in
 * the run's run.json, which the tests read.
 */
import fs from 'fs';
import path from 'path';

/** Lower-case, dashes only: safe for file and folder names. */
export const safeName = (s) => String(s || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  .slice(0, 60)
  .replace(/-$/, '');

export const isFullUrl = (u) => /^https?:\/\/[^/\s]+/i.test(u || '');

/** Full EDS URL: full URLs as they are, paths joined with the base URL. */
export const absoluteEds = (u, baseUrl) => (isFullUrl(u)
  ? u
  : `${baseUrl.replace(/\/$/, '')}${u.startsWith('/') ? '' : '/'}${u}`);

/** Default pair name: the last part of the EDS path ("/us/en/ivs/" → "ivs"). */
export function shortName(edsUrl) {
  const parts = new URL(edsUrl).pathname.replace(/\.html$/, '').split('/').filter(Boolean);
  if (parts[parts.length - 1] === 'index') parts.pop();
  return safeName(parts[parts.length - 1]) || 'home';
}

/** Splits CSV text into rows of cells (quotes, commas and new lines inside quotes). */
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') {
        quoted = false;
      } else {
        if (c === '\n') line += 1;
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push({ line: rowLine, cells: row });
      row = [];
      cell = '';
      line += 1;
      rowLine = line;
    } else {
      cell += c;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push({ line: rowLine, cells: row });
  }
  return rows;
}

/**
 * Reads a CSV of pairs: header row with "source", "eds" and optionally "name".
 * Returns { pairs } or { errors: ["line 3: ..."] }.
 */
export function readCsv(file, baseUrl) {
  if (!fs.existsSync(file)) return { errors: [`file not found: ${file}`] };
  const rows = parseCsvRows(fs.readFileSync(file, 'utf8'))
    .map((r) => ({ ...r, cells: r.cells.map((c) => c.trim()) }))
    .filter((r) => r.cells.some(Boolean) && !r.cells[0].startsWith('#'));
  if (!rows.length) return { errors: ['the file has no header row'] };
  const [header, ...data] = rows;
  const columns = header.cells.map((c) => c.toLowerCase());
  const errors = [];
  const unknown = columns.filter((c) => !['source', 'eds', 'name'].includes(c));
  if (unknown.length) errors.push(`line ${header.line}: unknown column(s) "${unknown.join('", "')}" (allowed: source, eds, name)`);
  if (!columns.includes('eds')) errors.push(`line ${header.line}: missing column "eds"`);
  if (!columns.includes('source')) errors.push(`line ${header.line}: missing column "source"`);
  if (errors.length) return { errors };
  if (!data.length) return { errors: ['the file has a header row but no pages'] };

  const col = (r, name) => r.cells[columns.indexOf(name)] || '';
  const pairs = [];
  const explicit = new Map();
  data.forEach((r) => {
    const source = col(r, 'source');
    const eds = col(r, 'eds');
    const name = col(r, 'name');
    if (!eds) {
      errors.push(`line ${r.line}: "eds" is empty`);
      return;
    }
    if (!isFullUrl(eds) && !eds.startsWith('/')) {
      errors.push(`line ${r.line}: "eds" must be a full URL or a path starting with / ("${eds}")`);
      return;
    }
    if (source && !isFullUrl(source)) {
      errors.push(`line ${r.line}: "source" must be a full URL starting with http:// or https:// ("${source}")`);
      return;
    }
    if (name) {
      const key = safeName(name);
      if (!key) {
        errors.push(`line ${r.line}: "name" has no letters or digits ("${name}")`);
        return;
      }
      if (explicit.has(key)) {
        errors.push(`line ${r.line}: name "${name}" is already used on line ${explicit.get(key)}`);
        return;
      }
      explicit.set(key, r.line);
    }
    pairs.push({
      name: name ? safeName(name) : null, source: source || null, eds: absoluteEds(eds, baseUrl), line: r.line,
    });
  });
  if (errors.length) return { errors };
  return { pairs: uniqueNames(pairs) };
}

/** Fills in missing names and makes derived names unique (-2, -3, ...). */
export function uniqueNames(pairs) {
  const used = new Set(pairs.filter((p) => p.name).map((p) => p.name));
  return pairs.map((p) => {
    if (p.name) return p;
    const base = shortName(p.eds);
    let name = base;
    for (let n = 2; used.has(name); n += 1) name = `${base}-${n}`;
    used.add(name);
    return { ...p, name };
  });
}

/** Label of a run: --label, else CSV file name, else the pair name, else "pairs". */
export function runLabel({ label, csv, pairs, fromConfig }) {
  if (label) return safeName(label) || 'run';
  if (csv) return safeName(path.basename(csv, path.extname(csv))) || 'csv';
  if (!fromConfig && pairs.length === 1) return pairs[0].name;
  return 'pairs';
}
