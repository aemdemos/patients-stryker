// images imported without alt text, from the import reports (.report.xlsx), page by page:
//   node missing-alt.mjs <out.md> <report.xlsx> [report.xlsx …]
// later reports win for a page (re-import runs after the full run)
import { createRequire } from 'module';
import { writeFileSync } from 'fs';

const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
const ExcelJS = require('exceljs');

const [out, ...reports] = process.argv.slice(2);
const byPage = new Map();
for (const file of reports) {
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line no-await-in-loop
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0];
  const header = Array.from(ws.getRow(1).values, (v) => String(v || '').toLowerCase());
  const col = (n) => header.indexOf(n);
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const path = String(row.getCell(col('path')).value || '');
    const notes = String(row.getCell(col('notes')).value || '').split(' | ');
    const images = notes.filter((n) => /without alt|no alt text/i.test(n))
      .map((n) => n.replace(/^.*?(https?:\/\/\S+|stryker\S+).*$/, '$1'));
    byPage.set(path, [...new Set(images)]);
  });
}
const rows = [...byPage.entries()].filter(([, imgs]) => imgs.length).sort();
const total = rows.reduce((n, [, imgs]) => n + imgs.length, 0);
const md = [`# Images imported without alt text (${total} on ${rows.length} pages)`, '',
  'The source has no alt text for these images; none was invented. Authors add it in Document Authoring.', '',
  ...rows.flatMap(([page, imgs]) => [`- ${page}`, ...imgs.map((img) => `  - ${img}`)])];
writeFileSync(out, `${md.join('\n')}\n`);
console.log(`${total} images on ${rows.length} pages -> ${out}`);
