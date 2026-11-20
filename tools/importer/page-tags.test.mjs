// Quick check of the page tags lookup: node tools/importer/page-tags.test.mjs
import assert from 'node:assert';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildTagMap, findExportFile, normalise, tagsFor,
} from './page-tags.mjs';

const root = mkdtempSync(join(tmpdir(), 'page-tags-'));
const page = (rel, content) => {
  mkdirSync(join(root, rel, '..'), { recursive: true });
  writeFileSync(join(root, rel), JSON.stringify(content));
};
page('us/en/sage/webinars/hap.json', { 'cq:tags': ['stryker:business-unit/SAGE'] });
page('us/en/about/_2022/-lead-page.json', { 'cq:tags': ['news'] });
page('us/en/emergency-care/webinars/ems1_with-or/webinar.json', { 'cq:tags': ['a', 'b'] });
page('us/en/legal/privacy.json', {});

assert.equal(normalise('-Lead_Page.json'), 'lead-page');
assert.equal(normalise('_2022'), '2022');

// a leading `-` / `_` and `_` for `-` in the AEM names do not hide the page
assert.deepEqual(tagsFor(root, '/us/en/about/2022/lead-page'), ['news']);
assert.deepEqual(tagsFor(root, '/us/en/about/_2022/-Lead_Page'), ['news']);
assert.deepEqual(tagsFor(root, '/us/en/emergency-care/webinars/ems1-with-or/webinar'), ['a', 'b']);
assert.deepEqual(tagsFor(root, '/us/en/sage/webinars/hap'), ['stryker:business-unit/SAGE']);

// no tags, or not in the export
assert.deepEqual(tagsFor(root, '/us/en/legal/privacy'), []);
assert.equal(findExportFile(root, '/us/en/legal/missing'), null);
assert.equal(findExportFile(root, '/us/en/sage'), null);

// every tagged sheet page is kept, also one that no base import list names
assert.deepEqual(
  buildTagMap(root, ['/us/en/legal/privacy', '/us/en/about/2022/lead-page', '/us/en/sage/webinars/hap']),
  { '/us/en/about/2022/lead-page': ['news'], '/us/en/sage/webinars/hap': ['stryker:business-unit/SAGE'] },
);

console.log('page-tags: all cases passed');
