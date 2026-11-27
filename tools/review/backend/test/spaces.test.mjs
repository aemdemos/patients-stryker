#!/usr/bin/env node
/*
 * Review backend: spaces keep the reviews apart. The std review's keys are exactly the keys of
 * before (no prefix); another space's keys carry the space; neither space's patterns match the
 * other's keys; parseKey reads both. No backend calls: the key rules only (lib/core.mjs).
 * core.mjs imports the App Builder libraries: deploy.mjs installs them (default
 * /tmp/run-outputs/review-backend-deps); link them next to the backend (git-ignored):
 *   ln -sfn /tmp/run-outputs/review-backend-deps/node_modules tools/review/backend/node_modules
 * usage: node tools/review/backend/test/spaces.test.mjs
 */
const core = await import('../lib/core.mjs');
const {
  entryKey, pagePattern, groupPattern, parseKey, spaceOf, SPACES,
} = core;

let failed = 0;
const check = (what, ok) => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
};
const glob = (pattern, key) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(key);

const page = '/us/en/about';
const b64 = (s) => Buffer.from(s).toString('base64url');
const stdKey = entryKey(page, 'page', 'state');
check('std key as before (no prefix)', stdKey === `p.${b64(page)}.${b64('page')}.${b64('state')}`);
check('std key, space named', entryKey(page, 'page', 'state', 'std') === stdKey);
const mainKey = entryKey(page, 'page', 'state', 'main');
check('main key carries its space', mainKey === `main.${stdKey}`);
check('std group key as before', entryKey('*', 'group:x', 'variant') === `g.${b64('group:x')}.${b64('variant')}`);
check('std page pattern misses main keys', !glob(pagePattern(page), mainKey) && glob(pagePattern(page), stdKey));
check('main page pattern misses std keys', !glob(pagePattern(page, 'main'), stdKey) && glob(pagePattern(page, 'main'), mainKey));
check('std every-entry pattern misses main keys', !glob('p.*', mainKey));
check('group patterns apart', !glob(groupPattern('main'), entryKey('*', 'group:x', 'variant')) && !glob(groupPattern(), entryKey('*', 'group:x', 'variant', 'main')));
check('parseKey reads both', JSON.stringify(parseKey(stdKey)) === JSON.stringify(parseKey(mainKey)) && parseKey(mainKey).page === page);
check('spaceOf: none, unknown → std; main → main', spaceOf({}) === 'std' && spaceOf({ space: 'nope' }) === 'std' && spaceOf({ space: 'main' }) === 'main' && spaceOf(undefined) === 'std');
check('main tool link on main', /^https:\/\/main--stryker-com--strykerenterprise\.aem\.page\/tools\/review\//.test(SPACES.main.tool));

console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
