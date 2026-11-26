# Authoring model: variants, Block options, section styles, Text style

What an author picks where, for every standardised stryker.com block — generated from the panels'
own configuration (tools/block-options/options.js, scripts/span-markers.js), so it matches what the
Experience Workspace panels offer. The Block Library itself is not changed yet.

## How the layers fit together

| Step | Where | What the author does | Example |
|---|---|---|---|
| 1. Pick the **variant** | Block Library (insert a block) | choose the block in the structure it needs: one library entry per variant | Columns *Two equal* |
| 2. Add **properties** | Block options panel | click in the block; pick colours, boxes, spacing, borders, switches | Cell box *Gold* in the *First cell* |
| 3. Style the **section** | Block options → Section | side by side, background, tab / accordion / carousel, line above … (copied into Section Metadata) | *Side by side, wide + narrow* |
| 4. Style a **few words** | Text style panel | select the words; pick colour, font, size or a look | *Gold* name, *Serif* sentence |

Rules of thumb for authors: **the structure comes from the variant**; **the whole block → Block options**;
**the whole section → Section**; **a few words → Text style**. Choices that don't fit the selected block
or words are greyed out (Block options, Text style looks) or not shown (Section), with the reason on hover.

## Blocks with variants and Block options

### Hero (corp)

**Variants (5, one Block Library entry each):** Image slide (`image-slide`) · Page intro (text + image) (`page-hero`) · Tagline band (`tagline-band`) · Large header (`large-header`) · Long text (`long-text`)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Headline box | one choice | None (text on the image) · White · Gold · Blue · Light grey · Dark grey · Gold gradient · Purple gradient · Blue gradient · Purple · Teal · Black · Pale grey · Mid grey · Dark gold · Grey gradient · Dark teal gradient · Dark orange gradient | layout image-slide |
| Headline column | one choice | Not set · Left (about 45% wide) · Right (about 40% wide) · Wide (almost full width) | layout image-slide |
| Headline height | one choice | Not set · Top (5%) · Upper (18%) · Middle (30%) · Lower (45%) | layout image-slide |
| Title colour (bold words) | one choice | As set in the text · Gold · White · Light grey · Blue | layout image-slide |
| Subline colour (plain words) | one choice | As set in the text · Gold · White · Light grey · Blue | layout image-slide |
| Stripe under the slide | one choice | None · Gold · Gold gradient | layout image-slide |
| Banner | switches | Framed, with shadow · Video background | layout image-slide; needs a video |
| On phones | one choice | Text over the image · Text below the image · Text above the image | layout image-slide |
| Phone text | switches | Black text | layout image-slide; needs text |
| Band colour | one choice | Gold · Purple gradient · Gold gradient | layout tagline-band |
| Page intro | switches | No image · No grey rule · Black title | layout page-hero; needs text |

### Video

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Options | switches | Black border · Autoplay (muted) · Loop | needs a Dynamic Media video |

### Statistics

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Number colour | one choice | Gold · Navy · Purple · Teal · White | always |
| Number size | one choice | Medium · Small · Large | always |
| Numbers per row | one choice | Three · One · Two · Four · Six | needs 2 or more rows / 4 or more rows / 6 or more rows |
| Options | switches | Centred · Number and text on one line | needs text |

### Accordion

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Options | switches | Panels start open · Line under each label · Lists in a light grey box | needs a list |

### Chart

**Variants (3, one Block Library entry each):** Columns (`column`) · Bars (`bar`) · Pie (`pie`)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Options | switches | Values on the bars | needs a column or bar chart |

### Media gallery

**Variants (2, one Block Library entry each):** Gallery · 360° spin (`spin-set`)

**Block options:** none

### Social share (corp)

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Options | switches | Grey icons · Right aligned | always |

### News list

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Options | switches | Show dates | always |

### Local navigation

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Options | switches | No top line | always |

### Table

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Header row | one choice | Header · No header | always |
| Options | switches | Rows as lines on phones · Data from a sheet | needs 2 or more cells / a sheet link |

### Columns

**Variants (6, one Block Library entry each):** Two equal (`columns-50-50`) · Narrow + wide (`columns-33-67`) · Wide + narrow (`columns-67-33`) · Three equal (`columns-3-cols`) · Four equal (`columns-4-cols`) · Wide + narrow (3/4 + 1/4) (`columns-75-25`)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Cell box | one choice | None · White with soft shadow · Light grey · Gold · Blue · Purple · Teal · Dark blue gradient · Dark grey · Dark purple gradient · Gold gradient · Black · Pale grey · Mid grey · Dark gold · Grey gradient · Dark teal gradient · Dark orange gradient | always |
| Which cell | one choice | Last cell · First cell · Every cell | layout box |
| Text spacing in a box | one choice | Medium (5%) · None · Small (3%) · Large (10%) | needs a box chosen first |
| Image border | one choice | None · Grey · Teal · Black | needs images in the block |
| Text | switches | Centred | needs text |
| First line of the text | one choice | As written · In a light grey box · In a gold bar · In a dark grey bar · In a blue bar | needs text |
| Text look | switches | Large headline · Serif lead paragraph · Serif captions · Pull quote in the last cell · Large pull quote beside a photo · Numbered quotes | needs text / a photo with a caption / 2 or more cells / an image in the first cell / 3 cells |
| Row looks | switches | Linked images · One per row on phones · Related links · Link groups · Icon beside text · Text centred beside the image · Page title beside a photo · Caption right under the photo · Images centred at their size · Photo two thirds wide on phones · Rule under the first cell · Line below the row · First cell right-aligned (labels) | needs images in the block / 3 or more cells / links / lists of links / an image in the first cell / exactly 2 cells / text / a photo with a caption |

### Panel

**Variants:** 1 (the block itself)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Box colour | one choice | White · Gold · Light grey · Gold gradient · Blue · Blue gradient · Teal · Purple · Dark grey · Purple gradient · Black · Pale grey · Mid grey · Dark gold · Grey gradient · Dark teal gradient · Dark orange gradient | always |
| Gradient direction | one choice | Left to right · Right to left · Bottom to top | needs a gradient box |
| Inner spacing | one choice | Medium (5%) · None · Small (3%) · Large (10%) | always |
| Options | switches | Soft shadow · Centred text | needs text |

### Cards (corp)

**Variants (8, one Block Library entry each):** Image · Video (`video`) · Teaser (`teaser`) · Resources (`resources`) · Product grid (`product-item`) · Category tiles (`category`) · Text only (`text`) · One wide card (`one-up`)

| Block options group | Kind | Choices | Shown when |
|---|---|---|---|
| Cards per row | one choice | Four · Two · Three · Five · Six | always |
| Image border | one choice | None · Grey · Teal · Black | needs images in the block |
| Card box | one choice | None · White · Gold · Light grey · Blue · Teal · Purple · Dark grey · Gold gradient · Blue gradient · Purple gradient · Black · Pale grey · Mid grey · Dark gold · Grey gradient · Dark teal gradient · Dark orange gradient | needs text |
| Text spacing in a box | one choice | Medium (5%) · None · Small (3%) · Large (10%) | needs a box chosen first |
| Options | switches | Soft shadow · Centred text · Title above the image · Image only · Images centred at their size · Card text in a box | needs a box chosen first / text / images in the block |
| Teaser | switches | No description | layout teaser |

### Section (Block options → Section)

| Group | Kind | Choices |
|---|---|---|
| Side by side | one choice | No (one under the other) · Equal parts · Wide + narrow (2/3 + 1/3) · Narrow + wide (1/3 + 2/3) |
| On phones | switches | Side by side on phones too |
| Background | one choice | None · White · Light grey · Gold · Blue · Purple · Teal · Dark grey · Gold gradient · Blue gradient · Purple gradient · Black · Pale grey · Mid grey · Dark gold · Grey gradient · Dark teal gradient · Dark orange gradient |
| The background | switches | Full width (a band) · Soft shadow |
| Gradient direction | one choice | Left to right · Right to left · Bottom to top |
| Text and width | switches | Centred text · Narrow column · Line above |
| Buttons | one choice | As authored (gold, teal) · Purple · Blue |
| Show on | one choice | Desktop and phones · Desktop only · Phones only |
| Section is | one choice | A normal section · A tab · An accordion panel · A carousel slide |
| Accordion panel | switches | Starts open |
| Carousel | switches | Autoplay (5 seconds) · Cross-fade · Split slide |
| Split slide band | one choice | Purple gradient (default) · Blue gradient · Dark grey |


### Blocks without Block options

| Block | Variants | How it is set up |
|---|---|---|
| Tabs | 1 | each tab is a section with the section style *A tab* (Block options → Section) |
| Carousel | 2 (image slides, split slides) | each slide is a section with *A carousel slide*; image slides are Hero image slides with their own options; autoplay, fade, split band in Section |
| Section layout | 4 | section styles (side by side equal / 67-33 / 33-67, side by side on phones) in Section |
| Widget | 5 (product explorer, calculator, map, medical information request, Cvent calendar) | the app's address; no options |
| Form | 1 (Marketo) | the Marketo instance and form id rows; no options |
| Sticky navigation, Interactive image, Event calendar, Fragment | 1 each | content rows only (labels, hotspots, folder, fragment link) |

## Text style (a few words)

| Group | Choices |
|---|---|
| Colour | blue, gold, purple, teal, grey, white, light grey, black, mid grey, dark gold, pale grey |
| Font | serif (Egyptienne), sans (Futura), body (Humanist) |
| Size | small 0.8×, large 1.25×, X-large 1.5×, XX-large 1.75×, 2×, 2.5×; headline S, M, L, XL |
| Special look | gold rule under a heading; a box around one whole line in gold, blue, purple, teal, dark grey, dark purple gradient, dark gold, gold gradient, grey gradient, dark teal gradient, dark orange gradient, mid grey, pale grey, black |

Selecting words that already have a style shows that style as the current choice; *Remove style*
takes it off.

## Making the panels more intuitive (proposals)

| # | Today | Proposal | Why |
|---|---|---|---|
| 1 | Block options greys out choices that don't fit; the Section area hides them | one behaviour in both: show what fits, fold the rest under "Not available here (n)" with the reason | one rule to learn |
| 2 | Colour lists are long plain buttons (Cell box: 18 choices) | colour swatches (as in Text style), grouped *Light · Brand · Dark · Gradients* | faster to scan, colours visible |
| 3 | Defaults read like ordinary choices ("Medium (5%)", "Last cell") | mark the default ("Medium (5%) — default") | authors know what "nothing chosen" does |
| 4 | Section styles are copied and pasted into Section Metadata | ask the DA / EW team for a way for extensions to write Section Metadata, then apply directly like block options | removes the most error-prone step |
| 5 | A colour per card is a typed cell in the card ("Purple") | a *Card colours* list in Block options (one dropdown per card) that writes that cell | no hidden keywords to remember |
| 6 | Statistics' number colour offers 5 colours | the shared 11 text colours, exact (as Text style) | one colour list everywhere |
| 7 | Long *Row looks* list (13 switches) in Columns | split into *Images* (linked images, centred, ⅔ on phones, icon beside text), *Text* (centred beside the image, labels right), *Lines* (rule under the first cell, line below the row), *Links* (related links, link groups); only fitting groups shown | shorter lists, clearer purpose |
| 8 | Block options *Apply* vs Text style *Style selected text* | the same wording and position in both ("Apply"), and a visible "not applied yet" state | fewer missed changes |
| 9 | Style codes show as text in the plain DA editor | guide authors to style text in Experience Workspace, where codes are hidden and the preview is live | less confusion |
| 10 | Help is in hints only | a "?" link in each panel to the authoring guide (conventions, this model) | one click to the rules |

Approve the proposals you want and they are built one by one, review pages first.
