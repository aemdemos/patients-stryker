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
styles). One row per choice, in the order the panel shows them:

| panel | group | value | label |
| --- | --- | --- | --- |
| hero-corp | box | box-gold | Gold |
| hero-corp | box | box-orange | Orange |
| cards | corner | square | Square corners |

- **panel** is the block name. A block the panel doesn't know yet gets the panel too.
- **group** is an existing group id from `options.js` (e.g. `box`, `column`, `title-colour`,
  `phone`): its rows replace that group's choices (add, reorder or hide them; the group's
  "none" choice and its rules stay). Any other group name adds a single-choice group, shown for
  every layout.
- **value** is the option name; **label** is what the button says (optional: without it the
  panel's own label, or the name, "box-orange" → "Box orange").
- Without rows for a group, or when the sheet can't be read, the panel uses `options.js`.
- **A new value only adds the choice.** What it does comes from the block: add the matching
  rule to the block's CSS (or JS), e.g. `.hero-corp.image-slide .hero-corp-headline.box-orange`,
  with a colour token. Until then the option is saved on the block but changes nothing.
- Preview the sheet after editing it; the panel reads it when it opens.

## Adding a block in code

Add an entry to `BLOCK_OPTIONS` in `options.js` with the block's option groups, using the
option names its CSS / JS reads. Keep it in step with the block and its Block Library entry.
Groups that only show for one layout (`when`), a required layout group, and the older values a
group replaces (`replaces`) can only be set here.
