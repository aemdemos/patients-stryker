/*
 * Import script of the `base` template (www.stryker.com): legal, patents, webinar, people and
 * Interventional Spine footnotes pages. Each group has its own page builder in base/; the group
 * is picked from the source URL (see base/shared.js).
 */
import { groupOf } from './base/shared.js';
import legal from './base/legal.js';
import patents from './base/patents.js';
import webinar from './base/webinar.js';
import people from './base/people.js';
import footnotes from './base/footnotes.js';

const BUILDERS = {
  legal, patents, webinar, people, footnotes,
};

export default {
  preprocess: (payload) => BUILDERS[groupOf(payload.url)].preprocess?.(payload),
  transform: (payload) => BUILDERS[groupOf(payload.url)].transform(payload),
};
