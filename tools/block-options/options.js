/*
 * The block options the Block options panel offers, per block: each group is one choice
 * (radio) or a set of switches (flags), with the authored option names the block's CSS / JS
 * reads. `when` limits a group to one layout (the first option group); `replaces` lists the
 * older free-value options a group supersedes, which are removed when the author picks in it.
 *
 * Keep in step with the block (its header comment lists the options) and its Block Library
 * entry.
 */
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
