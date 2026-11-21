# Visual review: five product pages, live vs ours (2026-11-05)

Pages: LIFEPAK 15, SpineJack system, Pivot Guardian, FlowTriever, Insignia (live `https://www.stryker.com/us/en/…/products/<page>.html`, ours: the readable-settings drafts, which render identically to the migrated pages, so every finding applies to the current migration).

Method: side-by-side captures at 1440 and 375 aligned on shared headings (`.cbr/local-scripts/visual-pairs.mjs`, images in `/tmp/run-outputs/visual/<page>/`), reviewed by eye; the main findings measured on both sides (`.cbr/local-scripts/probe.mjs`). Not the QA tool.

## Findings by cause (most pages / most visible first)

| # | Finding | Pages | Width | Live | Ours |
|---|---|---|---|---|---|
| A | **Box backgrounds missing** | Insignia, FlowTriever, SpineJack | both | coloured tiles / grey cards / gold banner | none: Insignia "Key benefits" tiles are white text on white (invisible); FlowTriever cards have no grey (only one title gets it); SpineJack "Contact us" banner plain text |
| B | **Spaces lost next to styled words in headings** | Pivot Guardian (6+ headings) | both | "Explore the **innovative** design" | "Explore the**innovative**design", "safety**you** deserve", "arthroscopy**now.**" |
| C | **Columns don't stack on phones** | Pivot Guardian, FlowTriever | 375 | one item per row | 2 columns kept (Pivot gold bands −1,085px; FlowTriever clinical cards) |
| D | **Images stretched to the column width** | Insignia | 1440 | natural size (collar 205×217) | full column (675×716); instrument trays and levers larger |
| E | **Image collapses on phones** | Insignia hero | 375 | product image beside the title | image 1×3px, empty column |
| F | **Hero text box** | LIFEPAK 15, SpineJack | both | LIFEPAK heading 149px into the slide; SpineJack text below the image on phones | LIFEPAK 21px in; **SpineJack phone text drawn over the image** |
| G | **Hero subtitle size** | SpineJack | 1440 | 24.5px | 14px |
| H | **Hero card frame** | SpineJack | both | white card, border + shadow | no frame |
| I | **Numbered titles' gold boxes** | Pivot Guardian (2 lists) | both | each title in a gold bar | plain titles |
| J | **Product highlight rows** | LIFEPAK 15 | both | rows 30px apart, text top-aligned | 90px + 30px above each image, text centred (+500px) |
| K | **Button colour** (Service and support fragment) | LIFEPAK 15 | both | `rgb(28, 86, 135)` blue | `rgb(76, 125, 122)` teal |
| L | **vw text line pitch on phones** | LIFEPAK 15 (hero, intro, video band) | 375 | 30px (inside a 21/30px wrapper) | ~15px |
| M | **Form textarea collapsed** | LIFEPAK 15, SpineJack (all form pages) | 375 | 72px | 21px |
| N | **Contact section: intro inside the form column** | LIFEPAK 15, FlowTriever, SpineJack | 1440 | "Have feedback…"/heading in the form column, side column (icons, "Follow us", "Be in the know") at the top | full width above, side column pushed down; SpineJack social icons 9×9 (live 48×48) |
| O | **Footnote superscript as a teal square** | SpineJack | both | "2" | filled square |
| P | **Feature title alignment** | LIFEPAK 15 (phone: live centred), Pivot Guardian (desktop: live left) | — | as noted | the opposite |
| Q | **Video** | LIFEPAK 15 band, SpineJack, Pivot Guardian | both | inset in the dark band; no frame; Pivot autoplays | flush; framed; poster + play button |
| R | Smaller | various | — | — | extra divider under "Connect with an expert"; FAQ question width (+ reserved 31px); quote box not inset on phones; jump bar inside the dark band (Pivot); "If you are a patient" link position; bold subtitle (Pivot); grey active-tab underline; teal header search icon; select font size; Submit not indented; "Last Updated" (local artefact) |

Not compared: Pivot Guardian hero carousel (captures showed different slides).

## Root cause of A (box backgrounds), verified 2026-11-05

Not the fragment CSS (sections inside fragments don't get section backgrounds, `main > .section.<bg>` only: true, but none of these three boxes is in a fragment). Two import causes:

1. **Coloured boxes inside column controls lose their colour** (Insignia tiles, FlowTriever cards). The Columns path of the import (`tools/importer/product-detail/corp-component-handlers.js`, "G: Columns") carries each column box's spacing as `cell-<N>-…` options but not its colour; colours only become section styles for a box on its own (`boxStyles`). Insignia: AEM `text.backgroundColor` rgb(133,69,138) / rgb(28,86,135) / rgb(76,125,122) = the live purple / blue / teal. FlowTriever: four rgb(237,238,236) boxes in `cols4`. Scope (exports): **360 visibly coloured boxes in column controls on 178 pages** (product-detail 47, news-detail 42, long-page-detail 37, tier2-landing-page 30, base 16, …); mostly light gray (138) and gold (84). Needs a per-cell colour option on Columns (e.g. `cell-<N>-bg-purple`, or a `Cell colours` setting) — a new name, to approve.
2. **Gradient boxes are dropped** (SpineJack "Interested in learning more? Contact us."). Live draws it with the classes `bg-golden-gradient top-to-bottom inverse`; the import's box palette (`BOXES`) has only the solid `bg-*` classes, and the decision table drops the export colour rgb(182,114,25) as "renders nothing". The site already has a `bg-golden-gradient` section style (panels). Fix: add the gradient classes to `BOXES`; correct the property-map note.

Count script: `.cbr/local-scripts/column-box-colours.py`.
