// summary of an import report (.report.xlsx from run-bulk-import): the components no handler
// mapped and the most frequent notes, with how many pages each affects
//   node report-summary.mjs <report.xlsx> [top N]
import { createRequire } from 'module';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const ExcelJS = require('exceljs');

const [file, top = '25'] = process.argv.slice(2);
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);
const ws = wb.worksheets[0];
const header = Array.from(ws.getRow(1).values, (v) => String(v || '').toLowerCase());
const col = (name) => header.findIndex((h) => h.includes(name));
const unhandledCol = col('unhandled');
const notesCol = col('notes');
const statusCol = col('status');
const counts = { unhandled: new Map(), notes: new Map() };
let rows = 0;
const statuses = new Map();
ws.eachRow((row, i) => {
  if (i === 1) return;
  rows += 1;
  const st = statusCol > 0 ? String(row.getCell(statusCol).value || '') : '';
  statuses.set(st, (statuses.get(st) || 0) + 1);
  [['unhandled', unhandledCol], ['notes', notesCol]].forEach(([kind, c]) => {
    if (c <= 0) return;
    const value = String(row.getCell(c).value || '');
    // one entry per page per distinct item; numbers and paths generalised
    new Set(value.split(' | ').filter(Boolean).map((v) => v.replace(/\/[\w./%-]+/g, '<path>').replace(/\d+/g, 'N').slice(0, 110)))
      .forEach((v) => counts[kind].set(v, (counts[kind].get(v) || 0) + 1));
  });
});
console.log(`${rows} rows; columns: ${header.filter(Boolean).join(', ')}; status: ${JSON.stringify(Object.fromEntries(statuses))}`);
['unhandled', 'notes'].forEach((kind) => {
  console.log(`== ${kind} (pages)`);
  [...counts[kind].entries()].sort((a, b) => b[1] - a[1]).slice(0, Number(top))
    .forEach(([v, n]) => console.log(`${String(n).padStart(4)}  ${v}`));
});
