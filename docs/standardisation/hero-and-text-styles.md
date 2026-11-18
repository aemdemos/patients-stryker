# Hero banners and text styles: how we standardised them

*For business, content and design teams. No technical knowledge needed.*

## In short

On www.stryker.com, authors could type any value for the position of a banner headline, its
box colour, its padding, its font sizes, and more. Over the years this produced hundreds of
slightly different values for what is really the same design. On the new site we keep the
**look** of stryker.com but offer a **small set of named choices** instead of free values.
Authors pick them from two panels in the editor, so nobody has to remember codes.

- **What visitors see:** almost the same as today. Most banners and text land within a few
  percent of their current position and size; the few that move more are listed below for
  review.
- **What authors get:** a short list of plain-language choices (for example *Headline box:
  Gold*, *Headline column: Left*, *Headline height: Upper*) and a live preview.
- **What the business gets:** a consistent site, faster migration and cheaper maintenance.

## How we decided

We did not guess. We took every banner and every styled text from the stryker.com content
export and counted the values authors actually used:

- **426 banners** (409 single-image banners, 17 rotating carousels) and **13 taglines**.
- **3,732 pages and shared fragments** for text sizes and spacing.

For each setting we grouped the values that look the same, picked the most common value in
each group as the named choice, and measured how far every real use is from its choice.

## Hero banner (image with a headline box)

### Choices authors have

| Choice | Options | What it means |
|---|---|---|
| Layout | Image slide · Tagline band · Large header · Long text | The four banner designs used on stryker.com |
| Headline box | None · White · Gold · Blue · Light grey · Dark grey · Gold gradient | The box behind the headline (none = text straight on the image) |
| Headline column | Left · Right · Wide | Where the headline sits: left column (about 45% wide), right column (about 40%), or almost full width |
| Headline height | Top · Upper · Middle · Lower | How far down the banner the headline starts (5%, 18%, 30%, 45%) |
| Stripe under the banner | None · Gold · Gold gradient | The coloured band under the image |
| On phones | Text below the image · Black text | How the banner behaves on a phone |
| Tagline band colour | Gold · Purple gradient | The colour of the title band at the top of a page |

### How close it is to stryker.com

| Setting | On stryker.com | With the named choices |
|---|---|---|
| Headline position | 189 different combinations | 3 columns × 4 heights; **93% of banners within 10% of today**, 72% within 5% |
| Headline box colour | 9 colours | 7 choices cover **98%** of boxes; the 2 rare ones (purple and blue gradient, one banner each) use dark grey |
| Box padding / margins | 9–12 free values each, on about 50 boxes | Replaced by one standard inner spacing |
| Tagline colour | 4 colours set | Only 2 taglines are actually visible on stryker.com (gold, purple gradient); both are covered |

**To review with the business:** the banners that move by more than 10% of the banner
size. In our samples these were 3 of 14 (for example a box that was unusually wide now wraps
onto one more line). We can show them side by side.

### Not carried over, and why

| stryker.com setting | Used on | Decision |
|---|---|---|
| "Information for healthcare professionals" notice placed **inside** the banner corner | 12 pages | The new site shows this notice as a **band at the top of the page** (one consistent place, switched on per page). We recommend using the band everywhere instead of a second, in-banner version. |
| Local page navigation placed **over** the banner | 17 pages | On today's pages this navigation is switched off or not visible, so there is nothing to carry over. Page navigation remains available as its own block. |
| Extra space under a banner | 6 banners | Uses the standard spacing instead. |
| Banner text colour white / gold / dark grey | 4 banners | Authors colour words with the Text style panel instead. |
| Background behind the image | most banners, never visible | Not needed. |
| Rotating carousels (several slides, autoplay, speed) | 17 carousels | A different component; handled separately. |

## Text styles inside a line

Authors can colour, change the font of, resize or space a few words inside a heading or
paragraph (for example a gold word in a white headline).

| Choice | Options |
|---|---|
| Colour | Blue, gold, purple, teal, navy, grey, white, light grey (the brand colours) |
| Font | Serif (Egyptienne), Sans (Futura), Body (Humanist), Capitals |
| Size | Small 0.8× · Large 1.25× · X-large 1.5× · XX-large 1.75× (relative to the text around it) |
| Spacing | Padding or margin of 5, 10, 15, 20 or 30 pixels, on any side |

Behind the scenes the editor stores the style as a short code around the words, for example
`:start-gold-serif:` … `:end:`. Authors never need to type it: the **Text style** panel writes
it for them. Unlike the earlier approach, the code never shows up as text for search engines.

## Proposed next: one scale for font sizes and spacing (awaiting sign-off)

stryker.com pages use about 20 different size settings and free spacing values. We propose:

| Area | Today | Proposed | Effect |
|---|---|---|---|
| Font sizes (body text, headings, words in a line) | about 20 options | **5 sizes**: 0.8×, 1.25×, 1.5×, 1.75×, 2× | The most used sizes stay exactly the same; text at 2.5× becomes 2× (753 uses) |
| Spacing (padding and margin) | 16–49 values per setting | **4 steps**: none, 3%, 5%, 10% | 97% of spacing stays within 2% of today |
| Background colours | about 27 written values | **8 brand colours** + none | 95%+ of uses unchanged |

Existing pages keep rendering as they are; new and re-imported pages use the scale.

## Pros and cons

**Pros**
- Consistent look: the same kind of element looks the same on every page.
- Easier authoring: a few named choices in a panel, with a live preview.
- Faster, safer migration: source values are mapped to the nearest choice automatically.
- Cheaper to maintain: a design change is made once and applies everywhere.

**Cons**
- Not pixel-identical: a small share of elements move or resize slightly, and visual
  comparison tools will show these as differences.
- Needs sign-off on the outliers listed above.
- Less freedom: an in-between value has to be requested and added on purpose.

## Where authors find the choices

- **Block options** panel (editor sidebar): click in a banner, pick its options, see the
  preview, click *Apply options*.
- **Text style** panel (editor sidebar): select words, pick a style, see the preview, click
  *Style selected text*.
