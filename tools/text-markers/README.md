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
| Style words | Select the words in the document, pick the style, click **Style selected text**. The selection is wrapped as `:start-…:selection:end:`. |
| Start fresh | Put the caret where the text goes, pick the style, click **Insert at caret**, then replace “Your text”. |
| Use the code elsewhere | **Copy code** copies `:start-…:Your text:end:`. |

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
