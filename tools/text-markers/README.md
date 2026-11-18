# Text style extension

Style part of a line from a sidebar panel instead of typing the text markers by heart.
Pick a colour, font, size and spacing; the panel writes the markers
(`:start-<words>:` … `:end:`) around the selected text, or inserts them at the caret.
A live preview shows the result with the site's own styles.

The markers are decorated by `scripts/span-markers.js`. The panel reads its word lists
from that file, so it always offers exactly the words the site understands.

## Installation

Add the panel URL as a sidebar extension in the `library` sheet of the site
configuration (DA → site config → `library`):

| title | path | format | experience | icon | ref |
| --- | --- | --- | --- | --- | --- |
| Text style | `https://<branch>--stryker-com--strykerenterprise.aem.live/tools/text-markers/text-markers.html` | | | | |

Use `main` as `<branch>` once the code is merged; before that, the feature branch
(e.g. `span-markers`) serves the panel.

## Using the panel

| Task | How |
| --- | --- |
| Style words | Select the words in the document, pick the style, click **Style selected text**. The selection becomes `:start-…:words:end:` in the same line. Bold or italic covering all the selected words is kept. |
| Style words with a link or mixed formatting | Click before the words (nothing selected) and use **Insert start**, then after them and use **Insert end**. The words and their formatting are not touched. |
| Change a style | Select the words **together with their markers** (from `:start-…:` to `:end:`), pick the new style, click **Style selected text**: the old markers are replaced. Selecting only the words of a styled run is refused when the panel can see the page (Experience Workspace's live document, or the DA editor's saved source); otherwise the page still shows only the newer style, as stacked markers keep the inner one. |
| Start fresh | Put the caret where the text goes, pick the style, click **Insert at caret**, then replace “Your text”. |
| Use the code elsewhere | **Copy code** copies `:start-…:Your text:end:`. |

**Preview.** While the panel is open it reads the selection about once a second.
- Words **inside a block** are shown in that block, rebuilt from the page's markup and
  decorated by the block's own script and styles (`preview.html` / `block-preview.js`): a
  hero's image and gold box, its fonts and sizes. **Desktop** renders at 1200px and
  **Phone** at 375px, scaled to the panel. The page markup comes from Experience
  Workspace's live document, or from the DA editor's saved source.
- Other words are shown in their line (paragraph or heading level), on white and on a dark
  background. With nothing selected the preview shows a sample.

**Style selected text** rewrites the selection as text: the editor inserts HTML from an
extension as a new paragraph, which would split the line. A selection with a link, a line
break or mixed formatting would lose it, so the panel refuses it and points to Insert start /
Insert end. The insert buttons refuse to run while words are selected (they would be replaced).

| Choice | Marker word | Result |
| --- | --- | --- |
| Colour | `blue`, `gold`, `purple`, `teal`, `navy`, `grey`, `white`, `light-gray` | the site's colour classes |
| Font | `serif`, `sans`, `body`; `upper` for capitals | Egyptienne, Futura, Humanist |
| Size | `s`, `l`, `xl`, `xxl` | 0.8×, 1.25×, 1.5×, 1.75× the text around it |
| Padding / margin | `p`, `pt` … `py` / `m`, `mt` … `my`, then `xs`, `s`, `m`, `l`, `xl` | 5, 10, 15, 20, 30px (spacing tokens) |

## Limitations

- Select text within **one** paragraph or heading: markers style part of a single line.
- Top and bottom spacing applies when the whole line is styled; inside a line only left
  and right spacing show.
- Bold and italic stay normal editor formatting, not marker words.
- In hero-corp image-slides the text size comes from the section styles
  (`title-N` / `subline-N`); colour and font words still apply there.
- Opened outside the editor, the panel can still build and copy the code.
