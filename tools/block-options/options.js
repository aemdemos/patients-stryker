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
          ['box-purple-gradient', 'Purple gradient'],
          ['box-blue-gradient', 'Blue gradient'],
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
  // stryker.com column rows (stryker-aemcoder-package, docs/standardisation/columns.md): the five
  // source layouts (and the other widths the corp styles have), a cell box (one colour list for
  // every block) in the first / last / every cell, the spacing inside it, image borders, centred
  // text, and the other corp looks imported pages use (first-line bars, row looks, tile looks).
  // Old combined names (boxed-last, gold-first …) show as the new pair in the panel and are
  // replaced when the author picks a box; pages that keep them render as before.
  columns: {
    label: 'Columns',
    // the older combined box names imported pages carry, read as the new pair (the panel shows
    // the pair and writes it when the author changes the block); the -lead names colour a first
    // line, not a cell, and stay as they are
    aliases: {
      'boxed-last': ['box-white', 'shadow'],
      'boxed-all': ['box-white', 'shadow', 'box-all'],
      'gray-last': ['box-gray'],
      'gray-2': ['box-gray'],
      'gray-all': ['box-gray', 'box-all'],
      'gold-first': ['box-gold', 'box-first'],
      'gold-last': ['box-gold'],
      'dark-first': ['box-dark', 'box-first'],
      'dark-last': ['box-dark'],
      'dark-all': ['box-dark', 'box-all'],
      'blue-last': ['box-blue'],
      'blue-all': ['box-blue', 'box-all'],
      'purple-last': ['box-purple'],
    },
    groups: [
      {
        id: 'layout',
        label: 'Layout',
        required: true,
        options: [
          ['columns-50-50', 'Two equal'],
          ['columns-33-67', 'Narrow + wide'],
          ['columns-67-33', 'Wide + narrow'],
          ['columns-3-cols', 'Three equal'],
          ['columns-4-cols', 'Four equal'],
          ['columns-75-25', 'Three quarters + quarter'],
          ['columns-25-75', 'Quarter + three quarters'],
          ['columns-70-30', 'Wide + narrow (70 / 30)'],
          ['columns-20-80', 'Icon + text (1/5, 4/5)'],
          ['columns-25-25-50', 'Quarter + quarter + half'],
        ],
      },
      {
        id: 'box',
        label: 'Cell box',
        options: [
          ['', 'None'],
          ['box-white shadow', 'White with soft shadow'],
          ['box-gray', 'Light grey'],
          ['box-gold', 'Gold'],
          ['box-blue', 'Blue'],
          ['box-purple', 'Purple'],
          ['box-teal', 'Teal'],
          ['box-dark-blue-gradient', 'Dark blue gradient'],
          ['box-dark', 'Dark grey'],
          ['box-dark-purple-gradient', 'Dark purple gradient'],
        ],
        replaces: /^(boxed|gold|gray|dark|blue|purple)-(first|last|all|\d+)$/,
      },
      {
        id: 'box-cell',
        label: 'Which cell',
        when: 'box',
        options: [
          ['', 'Last cell'],
          ['box-first', 'First cell'],
          ['box-all', 'Every cell'],
        ],
      },
      {
        id: 'space',
        label: 'Text spacing in a box',
        options: [
          ['', 'Medium (5%)'],
          ['space-none', 'None'],
          ['space-s', 'Small (3%)'],
          ['space-l', 'Large (10%)'],
        ],
      },
      {
        id: 'image-border',
        label: 'Image border',
        options: [
          ['', 'None'],
          ['image-border', 'Grey'],
          ['image-border-teal', 'Teal'],
          ['image-border-black', 'Black'],
        ],
      },
      {
        id: 'align',
        label: 'Text',
        flags: [
          ['text-center', 'Centred'],
        ],
      },
      {
        id: 'lead',
        label: 'First line of the text',
        options: [
          ['', 'As written'],
          ['gray-lead', 'In a light grey box'],
          ['gold-lead', 'In a gold bar'],
          ['dark-lead', 'In a dark grey bar'],
          ['serif-lead', 'Serif lead paragraph'],
        ],
      },
      {
        id: 'looks',
        label: 'Row looks',
        flags: [
          ['large-headline', 'Large headline type'],
          ['media-pair', 'Linked images'],
          ['stack', 'One per row on phones'],
          ['related-links', 'Related links'],
          ['link-groups', 'Link groups'],
          ['icon-text', 'Icon beside text'],
          ['number-quote', 'Numbered quotes'],
          ['title-row', 'Page title beside a photo'],
          ['quote-last', 'Pull quote in the last cell'],
          ['quote-3vw', 'Large pull quote beside a photo'],
          ['caption-serif', 'Serif captions'],
          ['caption-tight', 'Caption right under the photo'],
          ['image-centre', 'Images centred at their size'],
          ['phone-image-2-3', 'Photo two thirds wide on phones'],
          ['left-border-bottom', 'Rule under the first cell'],
        ],
      },
      {
        id: 'tiles',
        label: 'Tile look',
        options: [
          ['', 'None'],
          ['challenge-cards', 'Challenge cards'],
          ['icon-cards', 'Icon cards'],
          ['color-cards', 'Colour profile cards'],
          ['product-tiles', 'Product tiles'],
          ['cta-tiles', 'CTA tiles'],
          ['columns-icon-grid', 'Icon grid'],
        ],
      },
    ],
  },
};

/** every option name a block's groups know, so the rest can be kept as "other options" */
export function knownOptions(def) {
  return new Set(def.groups.flatMap((g) => (g.options || g.flags)
    .flatMap(([v]) => v.split(/\s+/))).filter(Boolean));
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
