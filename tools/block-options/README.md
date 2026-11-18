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

## Adding a block

Add an entry to `BLOCK_OPTIONS` in `options.js` with the block's option groups, using the
option names its CSS / JS reads. Keep it in step with the block and its Block Library entry.
