// compare two comparison runs (compare.mjs results): pages that got worse (height ratio
// further from live by more than 1%, more style differences or more missing texts), with the
// new differences   node regress.mjs <before.json> <after.json> [<before2> <after2> …]
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
let worse = 0;
for (let i = 0; i < args.length; i += 2) {
  const before = JSON.parse(readFileSync(args[i], 'utf8'));
  const after = JSON.parse(readFileSync(args[i + 1], 'utf8'));
  Object.entries(after).forEach(([page, y]) => {
    const x = before[page] || { ratio: y.ratio, diffs: [], missing: [] };
    const dr = Math.abs(1 - y.ratio) - Math.abs(1 - x.ratio);
    if (dr > 0.01 || y.diffs.length > x.diffs.length || y.missing.length > x.missing.length) {
      worse += 1;
      console.log(`WORSE ${page.slice(0, 70)} ratio ${x.ratio} -> ${y.ratio}, diffs ${x.diffs.length} -> ${y.diffs.length}, missing ${x.missing.length} -> ${y.missing.length}`);
      y.diffs.filter((d) => !x.diffs.includes(d)).forEach((d) => console.log(`    new: ${d.slice(0, 140)}`));
      y.missing.filter((d) => !x.missing.includes(d)).forEach((d) => console.log(`    missing: ${d.slice(0, 100)}`));
    }
  });
}
console.log(`${worse} pages worse`);
