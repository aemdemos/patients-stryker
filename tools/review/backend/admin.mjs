#!/usr/bin/env node
/*
 * Calls the review backend's private admin action (the project's credential is added by the
 * environment). Prints the JSON answer.
 * usage: node tools/review/backend/admin.mjs <op> [--name "…"] [--paths /us/en/a,/us/en/b]
 *   [--days 30] [--no-groups] [--page /us/en/…] [--id <invite id>] [--json '<params>']
 *   [--ns 892544-strykerstdreview-stage]
 * ops: setup | invite | revoke | invites | export | status | import | purge-invite | purge-test
 */
const args = process.argv.slice(2);
const op = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const ns = opt('--ns', '892544-strykerstdreview-stage');
if (!op) {
  console.error('usage: admin.mjs <setup|invite|revoke|invites|export|status|import|purge-invite|purge-test> [options]');
  process.exit(2);
}
const params = { op, ...(opt('--json') ? JSON.parse(opt('--json')) : {}) };
if (opt('--name')) params.name = opt('--name');
if (opt('--paths')) params.paths = opt('--paths').split(',').map((p) => p.trim());
if (opt('--days')) params.days = Number(opt('--days'));
if (args.includes('--no-groups')) params.groups = false;
if (opt('--page')) params.page = opt('--page');
if (opt('--id')) params.id = opt('--id');

/** the admin action's answer (blocking call; long ones are fetched by activation id) */
export async function admin(p, namespace = ns) {
  const resp = await fetch(`https://adobeioruntime.net/api/v1/namespaces/${namespace}/actions/std-review/admin?blocking=true&result=true`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`admin ${p.op}: ${resp.status} ${text.slice(0, 300)}`);
  return JSON.parse(text).body;
}

const out = await admin(params);
console.log(JSON.stringify(out, null, 1));
if (out?.error) process.exit(1);
