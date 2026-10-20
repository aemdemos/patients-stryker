#!/usr/bin/env node
// tools/check-breakpoints.mjs — guardrail for AGENTS.md hard rule 5 (mobile-first, EDS breakpoints).
// Every viewport-width media condition in blocks/**/*.css, templates/**/*.css and styles/*.css
// must be `width >= N` with N ∈ {600, 900, 1200}: no max-width / `width < N` / ranges, no other
// pixel value, no legacy min-width syntax. matchMedia() queries in blocks/**/*.js and
// scripts/*.js must use those values.
// Non-width media features (prefers-reduced-motion, print, …) are ignored. Comments are stripped
// first, so prose that mentions a source breakpoint is fine. In JS only the values are enforced
// (the frozen patients `header` block spells its 900px query as min-width).
// Usage: node tools/check-breakpoints.mjs   (exit 0 clean · 1 violations)
// Wired into `npm run lint` as `lint:breakpoints`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED = new Set([600, 900, 1200]);
const SKIP_FILES = new Set([
  'scripts/aem.js', // vendored, never edited
  // patients-stryker blocks whose breakpoints predate hard rule 5 (owned upstream)
  'blocks/cards/cards.css',
  'blocks/find-a-doctor/find-a-doctor.css',
  'blocks/footer/footer.css',
  'blocks/hero/hero.css',
]);

function walk(dir, ext, deep) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (deep) out = out.concat(walk(p, ext, deep)); } else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

const css = [...walk('blocks', '.css', true), ...walk('templates', '.css', true), ...walk('styles', '.css', false)]
  .filter((f) => !SKIP_FILES.has(f));
const js = [...walk('blocks', '.js', true), ...walk('scripts', '.js', false)].filter((f) => !SKIP_FILES.has(f));

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const lineOf = (s, i) => s.slice(0, i).split('\n').length;

// one media query (the text between `@media` and `{`, or a matchMedia string) → problems
function check(query, { strictSyntax = true } = {}) {
  const problems = [];
  if (strictSyntax && /(min|max)-width/.test(query)) problems.push('legacy min-width/max-width syntax (use `width >= N` / `width < N`)');
  const re = /width\s*(>=|<=|<|>|=)\s*(\d+(?:\.\d+)?)(px|em|rem)?/g;
  let m;
  while ((m = re.exec(query))) {
    const [, op, n, unit] = m;
    if (unit !== 'px') problems.push(`width in ${unit || 'no unit'} (${m[0]})`);
    else if (!ALLOWED.has(Number(n))) problems.push(`${n}px is not an EDS breakpoint (600 / 900 / 1200)`);
    if (strictSyntax && op !== '>=') problems.push(`operator \`${op}\` (mobile-first: only \`width >= N\`)`);
    else if (!strictSyntax && op !== '>=' && op !== '<') problems.push(`operator \`${op}\` (use \`>=\` or \`<\`)`);
  }
  for (const n of query.match(/(?:min|max)-width\s*:\s*\d+(?:\.\d+)?px/g) || []) {
    if (!ALLOWED.has(parseFloat(n.replace(/^[^:]*:\s*/, '')))) problems.push(`${n} is not an EDS breakpoint`);
  }
  return problems;
}

const findings = [];
for (const f of css) {
  const s = stripComments(readFileSync(f, 'utf8'));
  for (const m of s.matchAll(/@media([^{;]*)[{;]/g)) {
    if (!/width/.test(m[1])) continue;
    check(m[1]).forEach((p) => findings.push(`${f}:${lineOf(s, m.index)}: @media${m[1].trimEnd()} — ${p}`));
  }
}
for (const f of js) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/matchMedia\(\s*(['"`])([^'"`]*)\1/g)) {
    if (!/width/.test(m[2])) continue;
    // JS: values are checked; the frozen patients header keeps its `(min-width: 900px)` spelling
    check(m[2], { strictSyntax: false }).forEach((p) => findings.push(`${f}:${lineOf(s, m.index)}: matchMedia('${m[2]}') — ${p}`));
  }
  for (const m of s.matchAll(/inner(?:Width)\s*(>=|<=|<|>)\s*(\d+)/g)) {
    if (!ALLOWED.has(Number(m[2]))) findings.push(`${f}:${lineOf(s, m.index)}: ${m[0]} — ${m[2]} is not an EDS breakpoint`);
  }
}

if (findings.length) {
  console.error(findings.join('\n'));
  console.error(`\ncheck-breakpoints: ${findings.length} violation(s) — mobile-first, EDS breakpoints only (\`width >= 600 | 900 | 1200\`)`);
  process.exit(1);
}
console.log(`check-breakpoints: ok (${css.length} css + ${js.length} js files, mobile-first EDS breakpoints only)`);
