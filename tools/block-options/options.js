/*
 * The block options the Block options panel offers, per block: each group is one choice
 * (radio) or a set of switches (flags), with the authored option names the block's CSS / JS
 * reads. `when` limits a group to one layout (the first option group); `replaces` lists the
 * older free-value options a group supersedes, which are removed when the author picks in it.
 * `clears` lists another group's options that can't go with this group's choice (all its
 * choices, or only those in `clearsWhen`): picking one removes them.
 * `needs` (on a group, or a choice's third item `{ needs, hint }`) is what the selected block
 * must hold for the choice to do something: 'cells-2' (exactly 2 cells), 'cells-2+', 'cells-3',
 * 'cells-3+', 'cells-4', 'images', 'caption' (a photo with text under it), 'image-first' (an
 * image in the first cell, text beside it), 'links', 'link-lists', 'text', 'box' (a cell box
 * chosen) or 'gradient-box' (a gradient box colour chosen). The panel greys out a choice that
 * doesn't fit, with the reason; `hint` says what the choice does.
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
  // text, and the other corp looks imported pages use (first-line bars, row looks). Rows of tiles
  // (challenge, icon, colour profile cards, product / CTA tiles, icon grid) are Cards (package);
  // pages that carry those names render as before.
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
      // imported looks that are existing choices: the page intro is the two equal layout with the
      // line below (its title and subtitle are the text layer), the coloured heads the blue first
      // line; image side, media + text and thumbnails are the authoring; striped rows are the
      // Table block's
      'page-intro': [],
      'color-heads': ['blue-lead'],
      'media-text': [],
      'image-left': [],
      thumbnails: [],
      striped: [],
    },
    groups: [
      {
        id: 'layout',
        label: 'Layout',
        required: true,
        options: [
          ['columns-50-50', 'Two equal', { needs: ['cells-2'] }],
          ['columns-33-67', 'Narrow + wide', { needs: ['cells-2'] }],
          ['columns-67-33', 'Wide + narrow', { needs: ['cells-2'] }],
          ['columns-3-cols', 'Three equal', { needs: ['cells-3'] }],
          ['columns-4-cols', 'Four equal', { needs: ['cells-4'] }],
          ['columns-75-25', 'Three quarters + quarter', { needs: ['cells-2'] }],
          ['columns-25-75', 'Quarter + three quarters', { needs: ['cells-2'] }],
          ['columns-70-30', 'Wide + narrow (70 / 30)', { needs: ['cells-2'] }],
          ['columns-20-80', 'Icon + text (1/5, 4/5)', { needs: ['cells-2'] }],
          ['columns-25-25-50', 'Quarter + quarter + half', { needs: ['cells-3'] }],
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
        // a cell has one box: a box colour and a bar on the first line can't go together
        clears: /^(gray|gold|dark|blue)-lead$/,
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
        needs: ['box'],
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
        needs: ['images'],
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
          ['text-center', 'Centred', { needs: ['text'], hint: 'All text in the row centred' }],
        ],
      },
      {
        id: 'lead',
        label: 'First line of the text',
        options: [
          ['', 'As written'],
          ['gray-lead', 'In a light grey box', { needs: ['text'], hint: 'The first line of the text cell in a light grey box' }],
          ['gold-lead', 'In a gold bar', { needs: ['text'], hint: 'The first line of the text cell in a gold bar, centred' }],
          ['dark-lead', 'In a dark grey bar', { needs: ['text'], hint: 'The first line of the text cell in a dark grey bar, centred' }],
          ['blue-lead', 'In a blue bar', { needs: ['text'], hint: 'The first line of each cell in a blue bar, centred' }],
        ],
        // the bars are the cell's box, so they clear a cell box
        clears: /^(box-.+|shadow)$/,
      },
      {
        // the whole row's text, as one stryker.com component style (Text style words are for
        // a few words); switches, as rows combine them (large headline + numbered quotes)
        id: 'text-look',
        label: 'Text look',
        flags: [
          ['large-headline', 'Large headline', { needs: ['text'], hint: 'The row’s headings and text in the large headline sizes' }],
          ['serif-lead', 'Serif lead paragraph', { needs: ['text'], hint: 'The text cell opens with a 21px serif lead paragraph' }],
          ['caption-serif', 'Serif captions', { needs: ['caption'], hint: 'Captions under the photos in the serif' }],
          ['quote-last', 'Pull quote in the last cell', { needs: ['cells-2+'], hint: 'The last cell is a pull quote in a white shadow box' }],
          ['quote-3vw', 'Large pull quote beside a photo', { needs: ['image-first'], hint: 'A large pull quote beside a photo' }],
          ['number-quote', 'Numbered quotes', { needs: ['cells-3'], hint: 'A number, a photo and a quote side by side' }],
        ],
      },
      {
        id: 'looks',
        label: 'Row looks',
        flags: [
          ['media-pair', 'Linked images', { needs: ['images'], hint: 'Each image links to the link on the line below it' }],
          ['stack', 'One per row on phones', { needs: ['cells-3+'], hint: 'On phones each cell takes the full width' }],
          ['related-links', 'Related links', { needs: ['links'], hint: 'Titles with a short text and a More link' }],
          ['link-groups', 'Link groups', { needs: ['link-lists'], hint: 'Lists of links in groups' }],
          ['icon-text', 'Icon beside text', { needs: ['image-first'], hint: 'A small icon beside its text' }],
          ['title-row', 'Page title beside a photo', { needs: ['image-first'], hint: 'The page title in a white box beside a photo' }],
          ['caption-tight', 'Caption right under the photo', { needs: ['caption'], hint: 'No gap between a photo and its caption' }],
          ['image-centre', 'Images centred at their size', { needs: ['images'], hint: 'Images at their own size, centred in the cell' }],
          ['phone-image-2-3', 'Photo two thirds wide on phones', { needs: ['images'], hint: 'On phones the photo is two thirds of the width' }],
          ['left-border-bottom', 'Rule under the first cell', { needs: ['cells-2'], hint: 'A grey rule under the first cell’s text' }],
          ['border-bottom', 'Line below the row', { hint: 'A grey line under the whole row' }],
          ['label-right', 'First cell right-aligned (labels)', { needs: ['cells-2'], hint: 'The first cell’s text right-aligned beside the second (labels)' }],
        ],
      },
    ],
  },
  // stryker.com text boxes (stryker-aemcoder-package, docs/standardisation/panel.md): a box in
  // one of the ten colours (the same names as hero-corp), the soft shadow of the dimensional
  // box, the direction of a gradient box, the inner spacing step and centred text. Text colour,
  // fonts and sizes inside are the Text style panel; the box sets a default text colour (white
  // on the dark colours). Imported pages' older names show as their new choice.
  panel: {
    label: 'Panel',
    aliases: {
      left: ['box-white', 'shadow'],
      gold: ['box-gold'],
      gray: ['box-gray'],
      'gold-gradient': ['box-gold-gradient'],
    },
    groups: [
      {
        id: 'box',
        label: 'Box colour',
        required: true,
        options: [
          ['box-white', 'White', { hint: 'A white box (add the soft shadow to set it off the page)' }],
          ['box-gold', 'Gold'],
          ['box-gray', 'Light grey'],
          ['box-gold-gradient', 'Gold gradient', { hint: 'Gold, darkening to dark gold over the first fifth' }],
          ['box-blue', 'Blue', { hint: 'White text by default' }],
          ['box-blue-gradient', 'Blue gradient', { hint: 'Dark grey into slate blue; white text by default' }],
          ['box-teal', 'Teal', { hint: 'White text by default' }],
          ['box-purple', 'Purple', { hint: 'White text by default' }],
          ['box-dark', 'Dark grey', { hint: 'White text by default' }],
          ['box-purple-gradient', 'Purple gradient', { hint: 'Dark grey into plum; white text by default' }],
        ],
        replaces: /^(gold|gray|blue|dark|light|left|gold-gradient|colored-border)$/,
      },
      {
        id: 'gradient',
        label: 'Gradient direction',
        needs: ['gradient-box'],
        options: [
          ['', 'Left to right'],
          ['gradient-reverse', 'Right to left', { hint: 'The darker end on the right' }],
          ['gradient-up', 'Bottom to top', { hint: 'The darker end at the bottom' }],
        ],
      },
      {
        id: 'space',
        label: 'Inner spacing',
        options: [
          ['', 'Medium (5%)'],
          ['space-none', 'None'],
          ['space-s', 'Small (3%)'],
          ['space-l', 'Large (10%)'],
        ],
      },
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['shadow', 'Soft shadow', { hint: 'The stryker.com dimensional box: a soft shadow, 10px around' }],
          ['text-center', 'Centred text', { needs: ['text'], hint: 'All text in the box centred' }],
        ],
      },
    ],
  },
  // stryker.com card rows (stryker-aemcoder-package, docs/standardisation/cards-corp.md): the card
  // types (one row per card: an image or video cell and a text cell), cards per row, the same image
  // borders as Columns and the same box colours as Panel for the card text, title above the image,
  // image only, and the teaser's no-description. Text in the cards is Text style. The cards-corp
  // branch's gray-box / white-box show as the box choices.
  'cards-corp': {
    label: 'Cards (corp)',
    aliases: {
      'gray-box': ['box-gray'],
      'white-box': ['box-white', 'shadow'],
    },
    groups: [
      {
        id: 'layout',
        label: 'Cards',
        required: true,
        options: [
          ['', 'Image', { hint: 'An image (or a page link) with a title, text and a link' }],
          ['video', 'Video', { needs: ['links'], hint: 'A video link with a title and text' }],
          ['teaser', 'Teaser', { hint: 'Related products or news: image, serif title, description, Learn more' }],
          ['resources', 'Resources', { needs: ['images'], hint: 'Downloads: a cover image with its file title' }],
          ['product-item', 'Product grid', { needs: ['images'], hint: 'A product image above a grey rule and the product name' }],
          ['category', 'Category tiles', { needs: ['images'], hint: 'A large image with a teal label bar and arrow' }],
          ['text', 'Text only', { needs: ['text'], hint: 'Text cards: a title and text, no image' }],
          ['one-up', 'One wide card', { needs: ['images'], hint: 'One product per row: image beside its title and text' }],
        ],
      },
      {
        id: 'per-row',
        label: 'Cards per row',
        options: [
          ['', 'Four'],
          ['two-up', 'Two'],
          ['three-up', 'Three'],
          ['five-up', 'Five'],
          ['six-up', 'Six'],
        ],
      },
      {
        id: 'image-border',
        label: 'Image border',
        needs: ['images'],
        options: [
          ['', 'None'],
          ['image-border', 'Grey'],
          ['image-border-teal', 'Teal'],
          ['image-border-black', 'Black'],
        ],
      },
      {
        id: 'box',
        label: 'Card box',
        needs: ['text'],
        options: [
          ['', 'None'],
          ['box-white', 'White', { hint: 'The card text in a white box (add the soft shadow to set it off the page)' }],
          ['box-gold', 'Gold'],
          ['box-gray', 'Light grey'],
          ['box-blue', 'Blue', { hint: 'White text by default' }],
          ['box-teal', 'Teal', { hint: 'White text by default' }],
          ['box-purple', 'Purple', { hint: 'White text by default' }],
          ['box-dark', 'Dark grey', { hint: 'White text by default' }],
        ],
        replaces: /^(gray-box|white-box)$/,
      },
      {
        id: 'space',
        label: 'Text spacing in a box',
        needs: ['box'],
        options: [
          ['', 'Medium (5%)'],
          ['space-none', 'None'],
          ['space-s', 'Small (3%)'],
          ['space-l', 'Large (10%)'],
        ],
      },
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['shadow', 'Soft shadow', { needs: ['box'], hint: 'The stryker.com dimensional box: a soft shadow around the card text' }],
          ['text-center', 'Centred text', { needs: ['text'], hint: 'All text in the cards centred' }],
          ['title-above', 'Title above the image', { needs: ['images', 'text'], hint: 'Each card’s title sits above its image' }],
          ['no-text', 'Image only', { needs: ['images'], hint: 'Images at their own size, centred, linked to the link of the card; no text shown' }],
          ['border', 'Card text in a box', { needs: ['images', 'text'], hint: 'A white soft-shadow box with the text, overlapping the image' }],
        ],
      },
      {
        id: 'teaser',
        label: 'Teaser',
        when: 'teaser',
        flags: [
          ['no-description', 'No description', { hint: 'Image, title and Learn more only' }],
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
      // a sheet row names and orders the choices; what a built-in choice needs and its hint stay
      const named = (list) => choices.map(([v, l]) => {
        const base = list.find(([x]) => x === v);
        return [v, l || base?.[1] || labelOf(v), ...(base?.[2] ? [base[2]] : [])];
      });
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
