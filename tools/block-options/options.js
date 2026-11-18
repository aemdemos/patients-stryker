/*
 * The block options the Block options panel offers, per block: each group is one choice
 * (radio) or a set of switches (flags), with the authored option names the block's CSS / JS
 * reads. `when` limits a group to one layout (the first option group); `replaces` lists the
 * older free-value options a group supersedes, which are removed when the author picks in it.
 *
 * Keep in step with the block (its header comment lists the options) and its Block Library
 * entry. The Block Library sheet `panel-options` can replace a group's choices, add groups, or
 * add blocks (tools/library-options.js); `withLibrary` merges those rows in.
 */
import { labelOf } from '../library-options.js';

export const BLOCK_OPTIONS = {
  'hero-corp': {
    label: 'Hero (corp)',
    groups: [
      {
        id: 'layout',
        label: 'Layout',
        required: true,
        options: [
          ['image-slide', 'Image slide'],
          ['tagline-band', 'Tagline band'],
          ['large-header', 'Large header'],
          ['long-text', 'Long text'],
        ],
      },
      {
        id: 'box',
        label: 'Headline box',
        when: 'image-slide',
        options: [
          ['', 'None (text on the image)'],
          ['box-white', 'White'],
          ['box-gold', 'Gold'],
          ['box-blue', 'Blue'],
          ['box-gray', 'Light grey'],
          ['box-dark', 'Dark grey'],
          ['box-gold-gradient', 'Gold gradient'],
        ],
        replaces: /^box-(mt|mr|mb|ml|pt|pr|pb|pl)-n?\d+$/,
      },
      {
        id: 'column',
        label: 'Headline column',
        when: 'image-slide',
        options: [
          ['', 'Not set'],
          ['text-left', 'Left (about 45% wide)'],
          ['text-right', 'Right (about 40% wide)'],
          ['text-wide', 'Wide (almost full width)'],
        ],
        replaces: /^(left|right)-\d+(-\d+)?$/,
      },
      {
        id: 'height',
        label: 'Headline height',
        when: 'image-slide',
        options: [
          ['', 'Not set'],
          ['text-top', 'Top (5%)'],
          ['text-upper', 'Upper (18%)'],
          ['text-middle', 'Middle (30%)'],
          ['text-lower', 'Lower (45%)'],
        ],
        replaces: /^top-\d+(-\d+)?$/,
      },
      {
        id: 'title-colour',
        label: 'Title colour (bold lines)',
        when: 'image-slide',
        options: [
          ['', 'As set in the text'],
          ['title-gold', 'Gold'],
          ['title-white', 'White'],
          ['title-light-gray', 'Light grey'],
          ['title-blue', 'Blue'],
        ],
      },
      {
        id: 'subline-colour',
        label: 'Subline colour (plain lines)',
        when: 'image-slide',
        options: [
          ['', 'As set in the text'],
          ['subline-gold', 'Gold'],
          ['subline-white', 'White'],
          ['subline-light-gray', 'Light grey'],
          ['subline-blue', 'Blue'],
        ],
      },
      {
        id: 'stripe',
        label: 'Stripe under the slide',
        when: 'image-slide',
        options: [
          ['', 'None'],
          ['stripe-gold', 'Gold'],
          ['stripe-gradient', 'Gold gradient'],
        ],
      },
      {
        id: 'band',
        label: 'Band colour',
        when: 'tagline-band',
        options: [
          ['', 'Gold'],
          ['purple-gradient', 'Purple gradient'],
        ],
      },
      {
        id: 'phone',
        label: 'On phones',
        when: 'image-slide',
        flags: [
          ['mobile-below', 'Text below the image'],
          ['mobile-text-black', 'Black text'],
        ],
      },
    ],
  },
};

/** every option name a block's groups know, so the rest can be kept as "other options" */
export function knownOptions(def) {
  return new Set(def.groups.flatMap((g) => (g.options || g.flags).map(([v]) => v)).filter(Boolean));
}

/**
 * The built-in block options with the library sheet's rows merged in: rows for an existing
 * group replace that group's choices (its "none" choice and its rules stay); rows for any other
 * group add a group (shown for every layout): one choice, or on / off switches when the row's
 * type is "switches"; a block name the panel doesn't know adds that block.
 * @param {object} defs The built-in options (BLOCK_OPTIONS)
 * @param {Map<string, Map<string, Array<[string, string]>>>} sheet The sheet rows per panel
 * @returns {object} The merged options
 */
export function withLibrary(defs, sheet) {
  const merged = {};
  Object.entries(defs).forEach(([name, block]) => {
    merged[name] = { ...block, groups: block.groups.map((g) => ({ ...g })) };
  });
  sheet.forEach((groups, name) => {
    if (name === 'text-style') return;
    // a block the panel doesn't know: "cards-corp" → "Cards (corp)"
    const title = name.endsWith('-corp') ? `${labelOf(name.slice(0, -5))} (corp)` : labelOf(name);
    if (!merged[name]) merged[name] = { label: title, groups: [] };
    groups.forEach((values, key) => {
      const group = merged[name].groups.find((g) => g.id === key);
      const choices = values.filter(([v]) => v);
      const named = (list) => choices
        .map(([v, l]) => [v, l || list.find(([x]) => x === v)?.[1] || labelOf(v)]);
      if (group && values.label) group.label = values.label;
      if (group?.flags) {
        group.flags = named(group.flags);
      } else if (group) {
        const none = group.options.find(([v]) => v === '');
        group.options = [...(none ? [none] : []), ...named(group.options)];
      } else if (values.switches) {
        const label = values.label || labelOf(key);
        merged[name].groups.push({ id: key, label, flags: named([]) });
      } else {
        merged[name].groups.push({
          id: key, label: values.label || labelOf(key), options: [['', 'None'], ...named([])],
        });
      }
    });
  });
  return merged;
}
