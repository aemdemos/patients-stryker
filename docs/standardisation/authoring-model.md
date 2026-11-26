---
title: "stryker.com authoring model"
subtitle: "Variants, Block options, section styles and Text style: what an author picks where in Experience Workspace"
date: "November 26, 2026"
---

# Authoring model: variants, Block options, section styles, Text style

What an author picks where, for every standardised stryker.com block. The tables are generated from the
panels' own configuration (tools/block-options/options.js, scripts/span-markers.js), so they match what
the two Experience Workspace extensions, **Block options** and **Text style**, offer today. The Block
Library itself is not changed yet.

## How the layers fit together

| Step | Where | What the author does | Example |
|---|---|---|---|
| 1. Pick the **variant** | Block Library (insert a block) | choose the block in the structure it needs: one library entry per variant | Columns *Two equal* |
| 2. Add **properties** | Block options panel | click in the block; pick colours, boxes, spacing, borders, switches | Cell box *Gold* in the *First cell* |
| 3. Style the **section** | Block options → Section | side by side, background, tab / accordion / carousel, line above … (copied into Section Metadata) | *Side by side, wide + narrow* |
| 4. Style a **few words** | Text style panel | select the words; pick colour, font, size or a look | *Gold* name, *Serif* sentence |

Rules of thumb for authors: **the structure comes from the variant**; **the whole block → Block options**;
**the whole section → Section**; **a few words → Text style**.

## The Block options panel, step by step

The panel opens beside the document in Experience Workspace. Click anywhere in a block and the
panel shows that block's options. The screenshots are from the review pages.

### 1. Click in a block: what it is, what it has, how it looks

The top of the panel stays pinned while the author scrolls. It shows the block's name, the options
it has now (**On the block**), a live **preview** at *Desktop* or *Phone* width, and the button.

![A Columns block with a gold first cell: its options and its preview](img/authoring/bo-top.png){width=48%}

### 2. Pick choices: the current values are already selected

The block's current layout and options show as the selected choices. Colours are swatches in four
rows: **Light**, **Accent** (Stryker's strong colours), **Dark** and **Gradients**, each the exact
stryker.com colour. The value used when nothing is set reads **— default**. Follow-up choices
appear after their main choice (*Which cell* and *Text spacing in a box* after a box colour).

![Layout: the block's layout is selected (Wide + narrow)](img/authoring/bo-layout.png){width=48%}

![Cell box: gold is selected; Which cell and Text spacing follow it; defaults marked](img/authoring/bo-colours.png){width=48%}

### 3. Only what fits the block is shown

Choices that would do nothing for this block are not shown. This two-column text block gets
*Text*, *First line of the text*, *Text look* and *Lines*. It has no images or links, so *Images*,
*Image border* and *Links* don't appear.

![Only the groups that fit a two-column text block](img/authoring/bo-groups.png){width=48%}

### 4. See it before applying

Every pick updates the preview straight away. Under the block name the panel says
**Not applied yet** with the new options; *Apply options* writes them into the block
(*No changes* when there is nothing to apply).

![Blue chosen instead of gold: shown in the preview, not applied yet](img/authoring/bo-not-applied.png){width=48%}

### 5. Check the phone view

*Phone* shows the block at phone width. A tall block (here three statistics stacked on a phone)
scrolls inside the preview, so the whole block can be checked.

![Statistics on a phone, scrolled to the second and third numbers](img/authoring/bo-phone.png){width=48%}

### 6. A colour per card

Cards blocks also list **Card colours**: one list per card, named by the card's first words.
*Row colour* keeps the block's Card box; any of the 17 box colours gives that card its own colour.

![Card colours: one list per card](img/authoring/bo-card-colours.png){width=48%}

### 7. The section

Below the block's options, **Section** styles the part of the page the block sits in (between two
section breaks): side by side, background, centred text, narrow column, line above, and showing on
desktop or phones only. *Tab*, *accordion panel* and *carousel slide* are folded away unless the
section or a neighbour already is one. The panel copies a Section Metadata table to paste at the
end of the section.

![Section: side by side](img/authoring/bo-section-top.png){width=48%}

![Section: text and width, show on, tab / accordion / carousel, copy](img/authoring/bo-section-bottom.png){width=48%}

## The Text style panel, step by step

Text style is for a few words, not a whole block: select the words in the document, pick a style,
then *Style selected text*. The code it adds (shown at the top, e.g. `:start-gold:`) is hidden in
Experience Workspace and on the page.

### 1. Select words: an existing style is selected

Selecting words that already have a style shows that style as the chosen values (here *Serif* and
*2×*) and previews the words in their block. *Remove style* takes the style off.

![Styled words in a Columns block, previewed in the block](img/authoring/ts-styled-top.png){width=48%}

![Their font and size are selected (Serif, 2×)](img/authoring/ts-styled-groups.png){width=48%}

### 2. Colours

The 11 text colours, exact, in the same **Light · Accent · Dark** rows as Block options.

![Text colours](img/authoring/ts-colours.png){width=48%}

### 3. Looks for a whole line

When the selection is a whole line or heading, **Special look** offers the gold rule under a
heading and a box around the line in the box colours. The preview shows the line on white and on a
dark background.

![A whole heading in gold with the gold rule](img/authoring/ts-heading-top.png){width=48%}

![Special looks for a whole line or heading](img/authoring/ts-looks.png){width=48%}

### 4. A few words inside a sentence

For a few words inside a sentence only colour, font and size apply; the line looks are not shown.

![Words inside a sentence: sizes, then no special looks](img/authoring/ts-words-looks.png){width=48%}


## How the panels behave (summary)

| Behaviour | Block options | Text style |
|---|---|---|
| Only what fits is shown | choices that would do nothing for the selected block or section are not shown (e.g. *Image border* without images, *Which cell* without a box); a choice the block already has always shows, so it can be removed | looks that don't fit the selected words are not shown (e.g. a line box only for a whole line, the gold rule only in a heading) |
| Follow-up choices | appear once their main choice is made (*Text spacing in a box* after a box; *Gradient direction* after a gradient; *Starts open* after *An accordion panel*) | — |
| Current values pre-selected | the block's applied options are the selected choices when the panel opens | selecting styled words selects their colour, font, size and look |
| Defaults marked | the choice used when nothing is set reads "… — default" (e.g. *Medium (5%) — default*) | — |
| Colours | swatches in four rows: **Light** (white, greys) · **Accent** (gold, blue, purple, teal, dark gold) · **Dark** (dark grey, black) · **Gradients**; every colour exact from stryker.com | the same four rows for text colours and line boxes |
| Preview | pinned at the top while scrolling; *Desktop* (1200px) or *Phone* (375px) width; a tall preview (e.g. a block stacked on phones) scrolls inside its frame to the end | the same; words inside a block are previewed in that block |
| What is applied | "On the block: …" or "Not applied yet: …" under the preview; the button reads *Apply options* or *No changes* | *Style selected text*; *Remove style* takes a style off |
| Section | only the section choices that fit the selected block's section; tab / accordion / carousel roles folded away unless the section or a neighbour uses one | — |

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
| Number colour | one choice | Gold · Blue · Purple · Teal · Dark gold · White · Light grey · Pale grey · Mid grey · Grey · Black | always |
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
| Text | switches | Centred · Text centred beside the image · First cell right-aligned (labels) · Page title beside a photo | needs text / exactly 2 cells / images in the block / an image in the first cell |
| First line of the text | one choice | As written · In a light grey box · In a gold bar · In a dark grey bar · In a blue bar | needs text |
| Text look | switches | Large headline · Serif lead paragraph · Serif captions · Pull quote in the last cell · Large pull quote beside a photo · Numbered quotes | needs text / a photo with a caption / 2 or more cells / an image in the first cell / 3 cells |
| Images | switches | Linked images · Images centred at their size · Photo two thirds wide on phones · Icon beside text · Caption right under the photo | needs images in the block / an image in the first cell / a photo with a caption |
| On phones | switches | One per row on phones | needs 3 or more cells |
| Lines | switches | Rule under the first cell · Line below the row | needs exactly 2 cells |
| Links | switches | Related links · Link groups | needs links / lists of links |

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
| Card colours | one list per card | Row colour (the Card box) or any of the 17 box colours, per card | needs text; written as the card's first cell |

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
