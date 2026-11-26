# Block options extension

Pick a block's options from named choices in a sidebar panel instead of typing option
names into the block's name row. A preview renders the block with the new options using
the site's own code (desktop and phone width).

The choices per block live in `options.js` (today: `hero-corp`). Each group is one choice
(e.g. headline box colour, column, height) or a set of switches (e.g. phone layout).
Options the panel has no choice for are kept and listed under "Other options". Picking in a
group removes the older free values that group replaces, e.g. a column replaces `left-N` and
`right-N`.

## Installation

Add the panel URL as a sidebar extension in the `library` sheet of the site configuration:

| title | path |
| --- | --- |
| Block options | `https://<branch>--stryker-com--strykerenterprise.aem.live/tools/block-options/block-options.html` |

## Using the panel

| Editor | How |
| --- | --- |
| Experience Workspace | Click anywhere in the block. The panel shows its options; pick, check the preview, click **Apply options**. The block is replaced with its new options in the live document (undo works as usual). |
| DA editor | Select the block's name row text, e.g. `hero-corp (image-slide, box-gold, text-left, text-upper)`. Pick, then **Apply options**: the name row is rewritten. |

## Adding choices in the Block Library sheet

The choices can be extended without a code change to the panel, in the Block Library workbook
(`/.da/library/blocks`), sheet **panel-options** (the `options` sheet stays for the section
styles). One row per group; **values** lists its choices in the order the panel shows them,
separated by `|`, each optionally followed by `=` and its button label (without one the panel
shows the name with a capital, "orange" → "Orange"):

| panel | group | values | type |
| --- | --- | --- | --- |
| hero-corp | box | box-white = White \| box-gold = Gold \| box-orange = Orange | |
| columns | lower-last = Last column lower | lower-last-s = S \| lower-last-m = M \| lower-last-l = L | |
| accordion | extras = Options | divided = Divider lines \| open = All items start open | switches |

- **panel** is the block name; several blocks with commas when they share the group. A block the
  panel doesn't know yet gets the panel too.
- **group** may be followed by `=` and the title the panel shows for it (without one: the
  built-in title, or the id with a capital).
- **type** `switches` makes the group on / off checkboxes that can be combined; empty means one
  choice of the group (with "None").
- **group** is an existing group id from `options.js` (e.g. `box`, `column`, `title-colour`,
  `phone`): its row replaces that group's choices (add, reorder or hide them; the group's
  "none" choice and its rules stay). Any other group name adds a single-choice group, shown for
  every layout.
- Without a row for a group, or when the sheet can't be read, the panel uses `options.js`.
- **A new value only adds the choice.** What it does comes from the block: add the matching
  rule to the block's CSS (or JS), e.g. `.hero-corp.image-slide .hero-corp-headline.box-orange`,
  with a colour token. Until then the option is saved on the block but changes nothing.
- Preview the sheet after editing it; the panel reads it when it opens.

## The section (Section Metadata style)

Below the block's options, the **Section** area edits the style of the section that holds the
block (`SECTION_OPTIONS` in `options.js`): side by side (`flex`, `flex, flex-67-33`,
`flex, flex-33-67`, `flex-row-mobile`) and the section's role (`tab-panel`, `accordion-panel` with
`accordion-open`, `carousel` with `autoplay`, `fade`, `split` and the split band colour). Other
styles on the section (e.g. `full-bleed`) are kept.

The area follows the selected block's section, so it shows only what can apply there (as the block
options do):

| Shown when | Choices |
|---|---|
| the section holds 2 or more parts (blocks, or the text between them) | Side by side |
| Side by side is picked | On phones (side by side too) |
| the section opens with a heading | A tab, An accordion panel |
| the section holds a Hero (corp) block, or a Columns row next to a carousel slide | A carousel slide |
| any section | Background (the 10 box colours), Text and width (centred text, narrow column, line above), Show on (desktop only, phones only) |
| a background is picked | Full width (a band), Soft shadow; Gradient direction for a gradient background |
| the section holds a button (a link alone on its line) | Buttons: purple, blue |
| its main choice is picked | Starts open; Autoplay, Cross-fade, Split slide; the split band colour |

The tab / accordion / carousel choices sit in a folded part ("Turn this section into a tab,
accordion panel or carousel slide"), because most sections are none of these; it opens by itself
when the section or the one next to it already has one of these roles ("The section next to it is a
tab: make this one the same to add it"). A style the section already has always shows, so it can be
removed. The styles that can't apply are listed with why under "Other section styles".

Older section style names are read as the standard choices (`SECTION_OPTIONS.aliases`): a bg-* band is
a background + Full width, `bg-gold, boxed` is Gold + Soft shadow (a box at the content width), the
old dividers are Line above, `center` is Centred text, col-8 / col-8-centre / col-10 / column-10-12
are the Narrow column; **Copy section style** writes the standard names. Their look is
styles/sections-std.css, loaded on draft pages only (scripts/corp.js) and by the panels' preview;
the old names keep their own rules and render as before.

**Copy section style** copies the result: the Style text when the section has a Section Metadata
table (paste it over the Style row), or a whole Section Metadata table (paste it at the end of the
section). The panel doesn't write the section itself, in either editor: the editor's guarded replace
changes only the block at the cursor, and the section's metadata table is not a block it can
address. The preview shows the block with the new section styles.

Outside the review pages (`/drafts/…`) both panels say that the new looks show only on review pages
until the standardisation is approved (`tools/review-pages.js`).

## Choices with several classes, dependent groups, older names

- **Several classes:** a choice may set more than one class, separated by a space (e.g.
  `['box-white shadow', 'White with soft shadow']`). The panel adds and removes them together and
  shows the choice as selected when all of them are on the block.
- **Dependent group:** `when` may name another group instead of a layout (e.g. `when: 'box'`): the
  group shows only once that group has a choice, and its option goes when that choice is cleared.
- **What a choice needs:** `needs` on a group, or a choice's third item `{ needs, hint }` (e.g.
  `['caption-tight', 'Caption right under the photo', { needs: ['caption'], hint: '…' }]`). The
  panel reads the selected block (cells per row, images, captions, an image in the first cell,
  links, lists of links, text) and doesn't show a choice that would do nothing; a group with no
  fitting choice is not shown. Hovering a choice shows its `hint`. A choice the block already has
  always shows, so it can be removed.
  Needs: `cells-2`, `cells-2+`, `cells-3`, `cells-3+`, `cells-4`, `images`, `caption`, `image-first`,
  `links`, `link-lists`, `text`, `box` (a cell box chosen). Library sheet rows keep them.
- **Defaults:** a radio group's `''` choice is the default and shows "— default" after its label
  (e.g. "Medium (5%) — default"), unless it is a none ("None", "Not set", "As written").
- **Colours:** a radio group whose choices are all colours (`box-…`, `stat-…`) shows swatch dots
  in the Light · Brand · Dark · Gradients rows of `tools/colour-groups.js` (the one grouping for
  both panels); the dot's colour is read from the site's styles. A `''` colour names its dot with
  `swatch` (e.g. Statistics' gold default: `{ swatch: 'stat-gold' }`).
- **Card colours (Cards (corp)):** one dropdown per card (Row colour + the Card box colours). It
  writes, changes or removes the card row's first colour cell (`blocks/cards-corp`) with the
  Experience Workspace guarded replace; the DA editor only rewrites the name row, so there the
  panel says to type the colour name in a new first cell.
- **Preview pinned:** the block name, the applied options, the preview and Apply stay at the top
  while the choices scroll.
- **Older groups in the library sheet:** a sheet row for a group the block no longer has (Columns'
  `looks` and `align`, now Images, Text, On phones, Lines and Links; Statistics' `colour`, now
  `number-colour`) adds nothing: its choices stay in the groups that hold them.
- **Older names:** a block's `aliases` map an old class to its new choices (e.g.
  `'gray-last': ['box-gray']`). The panel shows the new choices; the block is rewritten with them
  when the author changes something.

## Adding a block in code

Add an entry to `BLOCK_OPTIONS` in `options.js` with the block's option groups, using the
option names its CSS / JS reads. Keep it in step with the block and its Block Library entry.
Groups that only show for one layout (`when`), a required layout group, and the older values a
group replaces (`replaces`) can only be set here.
