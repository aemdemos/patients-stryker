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
 * chosen), 'gradient-box' (a gradient box colour chosen), 'video' / 'dm-video' (a video link / a
 * Dynamic Media one), 'rows-2+' / 'rows-4+' / 'rows-6+' (that many rows) or 'bars' (a column or
 * bar chart, not a pie). The panel greys out
 * a choice that doesn't fit, with the reason; `hint` says what the choice does.
 *
 * Keep in step with the block (its header comment lists the options) and its Block Library
 * entry. The Block Library sheet `panel-options` can replace a group's choices, add groups, or
 * add blocks (tools/library-options.js); `withLibrary` merges those rows in.
 */
import { labelOf } from '../library-options.js';

export const BLOCK_OPTIONS = {
  // stryker.com heroes (stryker-aemcoder-package, docs/standardisation/hero-corp.md): five layouts
  // (image slide, page intro, large header, long text, tagline band); the image slide's headline
  // box colour (the one box colour list), its column and height, the title / subline colours, the
  // stripe under it, the framed banner, the video background and the phone layout; the page
  // intro's no-image, no-rule and black-title switches. Text sizes, fonts and coloured words are
  // Text style. The earlier names (gold-box, white-box, blue-box, gray-box, dark-box, text-below)
  // show as their choices; the numeric top-N / left-N / right-N / size-N stay as other options.
  'hero-corp': {
    label: 'Hero (corp)',
    aliases: {
      'gold-box': ['box-gold'],
      'white-box': ['box-white'],
      'blue-box': ['box-blue'],
      'gray-box': ['box-gray'],
      'dark-box': ['box-dark'],
      'text-below': ['mobile-below'],
    },
    groups: [
      {
        id: 'layout',
        label: 'Layout',
        required: true,
        options: [
          ['image-slide', 'Image slide', { hint: 'A full-width image (or video) with the headline over it' }],
          ['page-hero', 'Page intro (text + image)', { hint: 'Title, subhead and copy on the left, the image on the right, a grey rule below' }],
          ['tagline-band', 'Tagline band', { needs: ['text'], hint: 'A coloured band with the page title and a message' }],
          ['large-header', 'Large header', { needs: ['text'], hint: 'The page title in Futura bold, flush under the header' }],
          ['long-text', 'Long text', { needs: ['text'], hint: 'Copy beside an image, half and half' }],
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
          ['box-blue', 'Blue', { hint: 'White text by default' }],
          ['box-gray', 'Light grey'],
          ['box-dark', 'Dark grey', { hint: 'White text by default' }],
          ['box-gold-gradient', 'Gold gradient'],
          ['box-purple-gradient', 'Purple gradient', { hint: 'White text by default' }],
          ['box-blue-gradient', 'Blue gradient', { hint: 'White text by default' }],
        ],
        replaces: /^(box-(mt|mr|mb|ml|pt|pr|pb|pl)-n?\d+|(gold|white|blue|gray|dark)-box)$/,
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
        label: 'Title colour (bold words)',
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
        label: 'Subline colour (plain words)',
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
        id: 'banner',
        label: 'Banner',
        when: 'image-slide',
        flags: [
          ['framed', 'Framed, with shadow', { hint: 'In the page width with a soft shadow, instead of full width' }],
          ['video-background', 'Video background', { needs: ['video'], hint: 'The video in the first row plays muted and looping behind the headline' }],
        ],
      },
      {
        id: 'phone',
        label: 'On phones',
        when: 'image-slide',
        options: [
          ['', 'Text over the image'],
          ['mobile-below', 'Text below the image'],
          ['mobile-above', 'Text above the image'],
        ],
        replaces: /^text-below$/,
      },
      {
        id: 'phone-text',
        label: 'Phone text',
        when: 'image-slide',
        flags: [
          ['mobile-text-black', 'Black text', { needs: ['text'], hint: 'On phones every headline word is black' }],
        ],
      },
      {
        id: 'band',
        label: 'Band colour',
        when: 'tagline-band',
        options: [
          ['', 'Gold'],
          ['purple-gradient', 'Purple gradient'],
          ['gold-gradient', 'Gold gradient'],
        ],
      },
      {
        id: 'page-hero-extras',
        label: 'Page intro',
        when: 'page-hero',
        flags: [
          ['no-image', 'No image', { hint: 'The title, subhead and copy alone, full width' }],
          ['no-rule', 'No grey rule', { hint: 'No line under the intro' }],
          ['title-black', 'Black title', { needs: ['text'], hint: 'The title in black instead of gold' }],
        ],
      },
    ],
  },
  // stryker.com standalone videos (stryker-aemcoder-package, docs/standardisation/video.md):
  // the player comes from the link (Dynamic Media or YouTube); the 1px black frame round it
  // (stryker.com's grey frame joins black) and the Dynamic Media playback switches. A poster
  // goes with the link (`?poster=`), a caption is the text after the block. Older imported
  // names: `no-border` is the default (no frame).
  video: {
    label: 'Video',
    groups: [
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['border', 'Black border', { hint: 'A thin black frame round the player' }],
          ['autoplay', 'Autoplay (muted)', { needs: ['dm-video'], hint: 'Starts on its own, without sound, when it comes into view' }],
          ['loop', 'Loop', { needs: ['dm-video'], hint: 'Starts again when it ends' }],
        ],
        replaces: /^no-border$/,
      },
    ],
  },
  // stryker.com number counters and fast facts (stryker-aemcoder-package,
  // docs/standardisation/statistics.md): the number colour, the number size (10 stryker.com vw
  // sizes in three steps), numbers per row, centred text and the fast facts' number beside its
  // text. The count-up runs always (not for numbers beside their text). Older imported names:
  // `left` is the default, `count-up` / `count-once` are always on, `fast-facts` is inline.
  statistics: {
    label: 'Statistics',
    aliases: {
      left: [],
      'count-up': [],
      'count-once': [],
      'fast-facts': ['inline'],
    },
    groups: [
      {
        id: 'colour',
        label: 'Number colour',
        options: [
          ['', 'Gold'],
          ['stat-navy', 'Navy', { hint: 'The stryker.com blue (#1c5687)' }],
          ['stat-purple', 'Purple'],
          ['stat-teal', 'Teal'],
          ['stat-white', 'White', { hint: 'For a dark section' }],
        ],
      },
      {
        id: 'size',
        label: 'Number size',
        options: [
          ['', 'Medium'],
          ['stat-s', 'Small'],
          ['stat-l', 'Large'],
        ],
      },
      {
        id: 'columns',
        label: 'Numbers per row',
        options: [
          ['', 'Three'],
          ['cols-1', 'One'],
          ['cols-2', 'Two', { needs: ['rows-2+'] }],
          ['cols-4', 'Four', { needs: ['rows-4+'] }],
          ['cols-6', 'Six', { needs: ['rows-6+'] }],
        ],
      },
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['text-center', 'Centred', { hint: 'Numbers and texts centred (left by default)' }],
          ['inline', 'Number and text on one line', { needs: ['text'], hint: 'Each number beside its text, in the serif (stryker.com fast facts)' }],
        ],
      },
    ],
  },
  // stryker.com accordions (stryker-aemcoder-package, docs/standardisation/accordion.md): panels
  // that start open, and the two looks imported pages use (a line under each label, lists in a
  // light grey box). Panels that hold blocks are `accordion-panel` sections (scripts/corp.js),
  // open with the `accordion-open` section style.
  accordion: {
    label: 'Accordion',
    groups: [
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['open', 'Panels start open', { hint: 'Every panel starts open; a click still closes it' }],
          ['divided', 'Line under each label', { hint: 'A grey line under each closed label' }],
          ['gray-list', 'Lists in a light grey box', { needs: ['lists'], hint: 'The list in each panel sits in a light grey box' }],
        ],
      },
    ],
  },
  // stryker.com charts (docs/standardisation/chart.md): the chart type, and the values written
  // on the columns or bars. The colours are the rows' own (exact stryker.com colours).
  chart: {
    label: 'Chart',
    groups: [
      {
        id: 'type',
        label: 'Chart type',
        required: true,
        options: [
          ['column', 'Columns', { hint: 'Vertical bars, the axis on the left' }],
          ['bar', 'Bars', { hint: 'Horizontal bars, the labels on the left' }],
          ['pie', 'Pie', { hint: 'Slices with their values, the legend on the right' }],
        ],
      },
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['data-labels', 'Values on the bars', { needs: ['bars'], hint: 'Each value above its column or at the end of its bar' }],
        ],
      },
    ],
  },
  // stryker.com Dynamic Media galleries (docs/standardisation/media-gallery.md): the gallery
  // (stryker.com mixed media sets and image sets look the same) or the 360° spin. Older imported
  // names: `mixed-media` and `image-set` are the gallery.
  'media-gallery': {
    label: 'Media gallery',
    aliases: {
      'mixed-media': [],
      'image-set': [],
    },
    groups: [
      {
        id: 'type',
        label: 'Type',
        options: [
          ['', 'Gallery', { hint: 'The selected image with a strip of thumbnails under it' }],
          ['spin-set', '360° spin', { needs: ['images'], hint: 'One product photographed all round: drag or use the arrows to turn it' }],
        ],
      },
    ],
  },
  // the stryker.com share row (docs/standardisation/social-share-corp.md): brand-coloured icons,
  // left-aligned, by default; the two switches the source component has
  'social-share-corp': {
    label: 'Social share (corp)',
    groups: [
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['gray', 'Grey icons', { hint: 'All four icons in mid grey instead of their brand colours' }],
          ['right', 'Right aligned', { hint: 'The icons at the right edge of the column' }],
        ],
      },
    ],
  },
  // stryker.com newsroom lists (docs/standardisation/news-list.md): built from the query index;
  // the tabs, "Showing n of N", 20 articles and Load More are always on. stryker.com's list
  // sizes (5, 8, 10, 20, 40) are one standard size (20).
  'news-list': {
    label: 'News list',
    groups: [
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['show-dates', 'Show dates', { hint: 'Each article’s date above its title' }],
        ],
      },
    ],
  },
  // stryker.com local page navigation (docs/standardisation/local-nav.md):
  // the grey rule above it is the default; stryker.com's "hide bottom line" has no visible effect
  // there, so it is not a choice.
  'local-nav': {
    label: 'Local navigation',
    groups: [
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['no-top-line', 'No top line', { hint: 'No grey rule above the navigation' }],
        ],
      },
    ],
  },
  // stryker.com data tables (stryker-aemcoder-package, docs/standardisation/table.md): the
  // header row (default, the first row in bold) or none, rows as lines on phones, and the patent
  // lists' rows from a linked sheet. Older imported names: `striped` is always on, `stacked` is
  // mobile-stacked.
  table: {
    label: 'Table',
    aliases: {
      striped: [],
      stacked: ['mobile-stacked'],
    },
    groups: [
      {
        id: 'header',
        label: 'Header row',
        options: [
          ['', 'Header', { hint: 'The first row is the header, in bold' }],
          ['no-header', 'No header', { hint: 'Every row is a data row' }],
        ],
      },
      {
        id: 'extras',
        label: 'Options',
        flags: [
          ['mobile-stacked', 'Rows as lines on phones', { needs: ['cells-2+'], hint: 'On phones each cell is a line of its own, the rows keep their stripes' }],
          ['sheet', 'Data from a sheet', { needs: ['sheet-link'], hint: 'The rows come from the linked sheet (a long list such as the patents), stacked on phones' }],
        ],
      },
    ],
  },
  // stryker.com column rows (stryker-aemcoder-package, docs/standardisation/columns.md): the five
  // source layouts and the news 3/4 + 1/4 (other widths read as the nearest), a cell box (one
  // colour list for every block) in the first / last / every cell, the spacing inside it, image
  // borders, centred
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
      // widths stryker.com doesn't use (10 rows from older imports, docs/standardisation/
      // columns.md): read as the nearest layout; the rows render as before until re-saved
      'columns-70-30': ['columns-67-33'],
      'columns-25-75': ['columns-33-67'],
      'columns-20-80': ['columns-33-67'],
      'columns-25-25-50': ['columns-3-cols'],
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
          // stryker.com news articles: 9 + 3 of the 12-column grid
          ['columns-75-25', 'Wide + narrow (3/4 + 1/4)', { needs: ['cells-2'], hint: 'Three quarters + quarter, as stryker.com news articles (9 + 3 of its grid)' }],
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
          ['image-centre', 'Images centred at their size', { needs: ['images'], hint: 'Each image at its own size, centred in the card (e.g. icons), as Columns' }],
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

/*
 * The section holding the selected block: the standardised section styles (Section Metadata
 * "Style"), docs/standardisation/section-layout.md, tabs.md, accordion.md, carousel-corp.md.
 * Same shape as a block's groups; `needs` are read from the section: 'parts-2+' (two or more
 * parts: blocks, or the text between them), 'heading-first' (the section opens with a heading,
 * the tab or panel label), 'slide-block' (a Hero (corp) or Columns block), 'columns-block', and
 * the section's own choices 'flex', 'accordion-panel', 'carousel', 'split'. Other styles on the
 * section (full-bleed, dark …) are kept as they are.
 */
export const SECTION_OPTIONS = {
  label: 'Section',
  // older section style names read as the standard choices (replaced when the author copies the
  // section's style): today's bg-* bands are a background + full width, a dimensional box is a
  // white background with a soft shadow, the old dividers are the line above
  aliases: {
    'bg-white': ['box-white', 'full-bleed'],
    'bg-light-gray': ['box-gray', 'full-bleed'],
    'light-gray': ['box-gray', 'full-bleed'],
    'bg-gold': ['box-gold', 'full-bleed'],
    gold: ['box-gold', 'full-bleed'],
    'bg-blue': ['box-blue', 'full-bleed'],
    blue: ['box-blue', 'full-bleed'],
    'bg-purple': ['box-purple', 'full-bleed'],
    purple: ['box-purple', 'full-bleed'],
    'bg-teal': ['box-teal', 'full-bleed'],
    'bg-dark-gray': ['box-dark', 'full-bleed'],
    dark: ['box-dark', 'full-bleed'],
    'bg-golden-gradient': ['box-gold-gradient', 'full-bleed'],
    'gold-gradient': ['box-gold-gradient', 'full-bleed'],
    'bg-dark-orange-gradient': ['box-gold-gradient', 'full-bleed'],
    'bg-dark-blue-gradient': ['box-blue-gradient', 'full-bleed'],
    'bg-dark-purple-gradient': ['box-purple-gradient', 'full-bleed'],
    'purple-gradient': ['box-purple-gradient', 'full-bleed'],
    // no standard colour: the nearest (listed for review)
    'bg-silver': ['box-gray', 'full-bleed'],
    'bg-gray': ['box-gray', 'full-bleed'],
    'gray-gradient': ['box-gray', 'full-bleed'],
    'bg-dark-gold': ['box-gold-gradient', 'full-bleed'],
    boxed: ['box-white', 'shadow'],
    'shadow-box': ['box-white', 'shadow'],
    'gradient-inverse': ['gradient-reverse'],
    'gradient-top-to-bottom': ['gradient-up'],
    center: ['text-center'],
    'col-8': ['narrow'],
    'col-8-centre': ['narrow'],
    'col-10': ['narrow'],
    'column-10-12': ['narrow'],
    divider: ['line-above'],
    separator: ['line-above'],
    'separator-row': ['line-above'],
  },
  groups: [
    {
      id: 'side',
      label: 'Side by side',
      options: [
        ['', 'No (one under the other)'],
        ['flex', 'Equal parts', { needs: ['parts-2+'], hint: 'The parts of the section side by side in equal widths from 600px' }],
        ['flex flex-67-33', 'Wide + narrow (2/3 + 1/3)', { needs: ['parts-2+'], hint: 'The first parts two thirds wide, the last part one third' }],
        ['flex flex-33-67', 'Narrow + wide (1/3 + 2/3)', { needs: ['parts-2+'], hint: 'The first part one third wide, the others two thirds' }],
      ],
    },
    {
      id: 'side-phones',
      label: 'On phones',
      flags: [
        ['flex-row-mobile', 'Side by side on phones too', { needs: ['flex'], hint: 'The row never stacks (e.g. social icons)' }],
      ],
    },
    {
      id: 'background',
      label: 'Background',
      options: [
        ['', 'None'],
        ['box-white', 'White', { hint: 'A white box around the section’s content' }],
        ['box-gray', 'Light grey', { hint: 'A light grey box around the section’s content' }],
        ['box-gold', 'Gold', { hint: 'A gold box around the section’s content' }],
        ['box-blue', 'Blue', { hint: 'A blue box, white text' }],
        ['box-purple', 'Purple', { hint: 'A purple box, white text' }],
        ['box-teal', 'Teal', { hint: 'A teal box, white text' }],
        ['box-dark', 'Dark grey', { hint: 'A dark grey box, white text' }],
        ['box-gold-gradient', 'Gold gradient', { hint: 'Dark gold into gold' }],
        ['box-blue-gradient', 'Blue gradient', { hint: 'Dark grey into slate blue, white text' }],
        ['box-purple-gradient', 'Purple gradient', { hint: 'Dark grey into plum, white text' }],
      ],
    },
    {
      id: 'background-look',
      label: 'The background',
      flags: [
        ['full-bleed', 'Full width (a band)', { needs: ['background'], hint: 'The background runs to the page edges, the content stays in the page width' }],
        ['shadow', 'Soft shadow', { needs: ['background'], hint: 'A soft shadow around the box (stryker.com dimensional box)' }],
      ],
    },
    {
      id: 'gradient',
      label: 'Gradient direction',
      options: [
        ['', 'Left to right'],
        ['gradient-reverse', 'Right to left', { needs: ['gradient'] }],
        ['gradient-up', 'Bottom to top', { needs: ['gradient'] }],
      ],
    },
    {
      id: 'text',
      label: 'Text and width',
      flags: [
        ['text-center', 'Centred text', { hint: 'The section’s text centred' }],
        ['narrow', 'Narrow column', { hint: 'The content in the centred 8/12 column from 600px (full width on phones)' }],
        ['line-above', 'Line above', { hint: 'A grey line across the page above the section' }],
      ],
    },
    {
      id: 'buttons',
      label: 'Buttons',
      options: [
        ['', 'As authored (gold, teal)'],
        ['btn-purple', 'Purple', { needs: ['buttons'], hint: 'The section’s buttons in purple' }],
        ['btn-blue', 'Blue', { needs: ['buttons'], hint: 'The section’s buttons in blue' }],
      ],
    },
    {
      id: 'show',
      label: 'Show on',
      options: [
        ['', 'Desktop and phones'],
        ['desktop-only', 'Desktop only', { hint: 'Hidden on phones (under 600px)' }],
        ['mobile-only', 'Phones only', { hint: 'Hidden from 600px' }],
      ],
    },
    {
      id: 'role',
      label: 'Section is',
      options: [
        ['', 'A normal section'],
        ['tab-panel', 'A tab', { needs: ['heading-first'], hint: 'Its first heading is the tab label; tab sections in a row make one tab set' }],
        ['accordion-panel', 'An accordion panel', { needs: ['heading-first'], hint: 'Its heading is the label; panel sections in a row make one accordion' }],
        ['carousel', 'A carousel slide', { needs: ['slide-block'], hint: 'Slide sections in a row make one carousel' }],
      ],
    },
    {
      id: 'accordion',
      label: 'Accordion panel',
      flags: [
        ['accordion-open', 'Starts open', { needs: ['accordion-panel'], hint: 'The panel is open when the page loads' }],
      ],
    },
    {
      id: 'carousel',
      label: 'Carousel',
      flags: [
        ['autoplay', 'Autoplay (5 seconds)', { needs: ['carousel'], hint: 'The slides move on by themselves; set on the slides of one carousel' }],
        ['fade', 'Cross-fade', { needs: ['carousel'], hint: 'The slides fade instead of sliding' }],
        ['split', 'Split slide', { needs: ['carousel', 'columns-block'], hint: 'An image beside a title on a coloured band (a Columns row)' }],
      ],
    },
    {
      id: 'band',
      label: 'Split slide band',
      options: [
        ['', 'Purple gradient (default)'],
        ['box-blue-gradient', 'Blue gradient', { needs: ['split'] }],
        ['box-dark', 'Dark grey', { needs: ['split'] }],
      ],
    },
  ],
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
      // an older name the block reads as another choice (its `aliases`) is not offered
      const old = merged[name].aliases || {};
      const choices = values.filter(([v]) => v && !old[v]);
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
