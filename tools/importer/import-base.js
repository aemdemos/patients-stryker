/*
 * Import script of the `base` template (www.stryker.com): legal, patents, webinar, people,
 * Interventional Spine footnotes and event pages. Each group has its own page builder in base/;
 * the group is picked from the source URL (see base/shared.js).
 */
import { groupOf } from './base/shared.js';
import legal from './base/legal.js';
import patents from './base/patents.js';
import webinar from './base/webinar.js';
import people from './base/people.js';
import footnotes from './base/footnotes.js';
import events from './base/events.js';
import forms from './base/forms.js';

const BUILDERS = {
  legal, patents, webinar, people, footnotes, events, forms,
};

export default {
  preprocess: (payload) => BUILDERS[groupOf(payload.url)].preprocess?.(payload),
  transform: (payload) => BUILDERS[groupOf(payload.url)].transform(payload),
};
