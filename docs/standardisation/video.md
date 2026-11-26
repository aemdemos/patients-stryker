# Video: two players, three switches

*A walkthrough of the Video block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages, with tabs and accordions opened)
and in the AEM content export. Only the 1,255 videos shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | On www.stryker.com, a video is a Dynamic Media (Stryker's own media server) or a YouTube player. Authors could hide or show a frame round it in any colour, start it on its own, repeat it, give it a poster image and a title or a text under it. |
| **The risk** | Copying every setting means frame colours written five different ways and playback settings combined freely, for what is the same player. |
| **What we did** | We counted every video on the live site. The player comes from the link the author pastes (Dynamic Media or YouTube), so there is nothing to choose. The settings become three switches in the **Block options panel**: a black border, autoplay (muted) and loop. The poster goes with the video link, and a title or text under the video is normal text after the block. |
| **The result** | Videos look and play as today: every frame keeps its look (the four grey frames become black), and every autoplay or looping video keeps its playback. On the review page all 10 videos match stryker.com in frame, playback and caption text. |

---

## 2. The problem, in numbers: values today vs named choices

Every free setting of a video, how many different values stryker.com uses today, and the named choices
on the new site. *Kept* is the share of instances whose look stays the same or almost the same.

| Setting | Values today | Instances | Choices | Kept | Most used today |
|---|---|---|---|---|---|
| Video border colour | **5** | 867 | 1 | **100%** | (default) (596), rgba(0,0,0,1) (265), rgb(0,0,0) (2), rgb(178,180,174) (2) |

The other settings have no values to group:

| Setting | On stryker.com | On the new site |
|---|---|---|
| Player | Dynamic Media 1,048, YouTube 206, an old mp4 file 1 | from the link: nothing to choose |
| Playback | autoplay + loop 102, loop only 20, autoplay only 11 | two switches, *Autoplay (muted)* and *Loop* |
| Poster image | 244 Dynamic Media videos have their own poster | goes with the video link |
| Caption | a title under 134 videos, a text under 108 | text after the block (a Heading 3 or a paragraph) |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Black border, autoplay (muted), loop | **Block options panel** (section 4) |
| Which video, its poster | the **video link** in the block |
| Title or text under the video | **text after the block**; its font, size and colour are the site-wide Text style |

---

## 3. The players (one per video, from the link)

The player is not a choice: the block reads the link the author pastes.

### 3.1 Dynamic Media (`dynamic-media`)

Stryker's own video server, with a play button over the poster and Stryker's control bar.

| | |
|---|---|
| Videos on the live site | **1,048** on 648 pages (138 of them in shared fragments) |
| With their own poster | 244 |
| Example pages | [iBed Wireless](https://www.stryker.com/us/en/acute-care/products/ibed-wireless.html), [Connected OR](https://www.stryker.com/us/en/communications/systems/-isuite-experience/connected-or-operating-system.html), [Annual review 2024](https://www.stryker.com/us/en/about/annual-review/2024.html) |

### 3.2 YouTube (`youtube`)

The YouTube player in a 16:9 frame.

| | |
|---|---|
| Videos on the live site | **206** on 91 pages (5 in shared fragments) |
| Example pages | [Latera implant](https://www.stryker.com/us/en/ent/products/latera-absorbable-nasal-implant-system.html), [Corporate responsibility](https://www.stryker.com/us/en/about/corporate-responsibility.html), [ENT medical education](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/ent/medical-education.html) |

### 3.3 An old mp4 file (`file-mp4`)

| | |
|---|---|
| Videos on the live site | **1** on 1 page ([OrthoLoc 2 ankle fracture](https://www.stryker.com/us/en/foot-and-ankle/products/ortholoc-2-ankle-fracture-lp-system.html)) |
| What it shows | only a Flash notice: nothing a visitor can play |
| Proposal | drop it (section 10). The Dynamic Media video on the same page is migrated as usual. |

---

## 4. The options (Block options panel)

Three switches; any combination is allowed.

### 4.1 Black border

A 1px black frame round the player, as stryker.com draws it. Without it the player has no frame, as on
most stryker.com videos.

| Choice | Option | Videos on stryker.com | Example page |
|---|---|---|---|
| Black border | `border` | 271 black (Dynamic Media 203, YouTube 68) + 4 grey (become black) | [Sternal plate](https://www.stryker.com/us/en/craniomaxillofacial/products/sternalplate.html), [ASC care setting](https://www.stryker.com/us/en/care-settings/asc.html) |
| No border (default) | none | the others | [Precision Falcon](https://www.stryker.com/us/en/orthopaedic-instruments/products/precision-falcon.html) |

### 4.2 Autoplay (muted)

The video starts on its own, without sound, when it comes into view (stryker.com starts it muted too).
The control bar stays, so a visitor can pause it or turn the sound on.

| Choice | Option | Videos on stryker.com | Example page |
|---|---|---|---|
| Autoplay (muted) | `autoplay` | 113 (102 with loop, 11 without) | [INBONE](https://www.stryker.com/us/en/foot-and-ankle/products/inbone.html), [Bone Mill](https://www.stryker.com/us/en/nse/products/bone-mill.html) |

### 4.3 Loop

The video starts again when it ends.

| Choice | Option | Videos on stryker.com | Example page |
|---|---|---|---|
| Loop | `loop` | 122 (102 with autoplay, 20 without) | [DART direct anterior](https://www.stryker.com/us/en/joint-replacement/procedures/dart-direct-anterior-reconstructive-technology.html), [Bone Mill](https://www.stryker.com/us/en/nse/products/bone-mill.html) |

Autoplay and loop are Dynamic Media settings on stryker.com; a YouTube video plays as YouTube sets it,
so the panel greys both out for a YouTube link.

**Imported names that are existing choices:** `no-border` (on pages imported before the standardisation)
is the default, no border; the panel removes it when the author uses the switches.

---

## 5. Text under the video (Text style, not Block options)

A title or a text under the video is written as normal text after the block: a **Heading 3** for a
title (134 videos), a paragraph for a text (108 videos). It takes the site's heading and body styles,
which match stryker.com (*Jill's Journey* on MOLLI: Egyptienne 21px on desktop, 17.5px on phones, black).
Coloured, sized or serif words in it use the site-wide **Text style**, with the same small set of sizes
and brand colours as every block.

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | With named choices | How close |
|---|---|---|---|
| Border | 5 written values | a black border, or none | **100%** keep their frame (the 4 grey frames become black, a 1px line) |
| Playback | 3 combinations | 2 switches | **100%** |
| Player | Dynamic Media, YouTube | from the link | **100%** (the mp4 with a Flash notice is dropped) |
| Poster, caption | per video | the link, the text after the block | **100%** |

**Checked on the review page** (desktop 1440 and phone 390), with a real stryker.com video for every
player and choice (10 videos):

| What | Matches stryker.com |
|---|---|
| Frame (1px black, or none) | **10 of 10**, at both widths |
| Playback (autoplay starts muted; loop repeats; the others wait for the play button) | **10 of 10** |
| Caption title (font, size, weight, colour) | **1 of 1**, at both widths |

**What differs, by design:** the width. A full-width video on stryker.com is 1,410px wide on a 1,440px
screen and runs edge to edge on a phone; on the new site it follows the page's standard content width
(1,380px, and 15px from each edge on a phone), like every other block.

---

## 7. To review (outliers)

| What | Videos | Example pages | Proposal |
|---|---|---|---|
| Grey frame (#b2b4ae) | 4 (Dynamic Media 3, YouTube 1) | [Hydro irrigation](https://www.stryker.com/us/en/ent/products/hydro-irrigation-system.html), [Pulse](https://www.stryker.com/us/en/foot-and-ankle/products/pulse.html), [TARGET Tetra](https://www.stryker.com/us/en/neurovascular/products/target-tetra.html), [West Point](https://www.stryker.com/us/en/trauma-and-extremities/c/west-point.html) | black border |
| The mp4 that shows only a Flash notice | 1 | [OrthoLoc 2 ankle fracture](https://www.stryker.com/us/en/foot-and-ankle/products/ortholoc-2-ankle-fracture-lp-system.html) | drop it |

---

## 8. What we did not carry over, and why

| Not carried over as a Video option | Where it goes instead |
|---|---|
| The frame colour | one black border (the grey frames become black) |
| The poster image | the video link carries it (`?poster=`), as the migration writes it today |
| The title and text under the video | text after the block (Heading 3 or paragraph); Text style for its words |
| Videos in a row of cells | the Columns or Cards block (a video tile), not a Video option |
| A video behind a banner's text | the Hero block (*Video background*) |
| The mp4 with a Flash notice | dropped (section 7) |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Nothing to choose for the player: paste the link | The poster is part of the link, which authors must keep when they change the video |
| Three switches cover every frame and playback stryker.com uses | The 4 grey frames become black |
| Autoplay always starts muted and keeps the control bar (a visitor can pause it) | Autoplay and loop work for Dynamic Media only (YouTube sets its own) |

---

## 10. Decisions we need from the business

**To approve:**

1. Two switches, *Autoplay (muted)* and *Loop* (the package's decision), instead of one "ambient"
   option. The analysis also counted 49 autoplay and 60 loop settings in the AEM export (19 loop without
   autoplay); both fit the two switches.
2. Drop the mp4 that shows only a Flash notice on OrthoLoc 2 ankle fracture.
3. The grey frames become black.
4. Removing the review-only gate (section *Review status*).

**Proposed, still open:** an autoplay video keeps the control bar so a visitor can pause it (an
accessibility rule for moving content), where stryker.com hides it on some background-like videos.

---

## Glossary

| Term | Meaning |
|---|---|
| Video block | one video player on the page |
| Dynamic Media | Stryker's own media server for images and videos |
| Poster | the image shown before the video plays |
| Caption | the title or text under the video |
| Autoplay (muted) | the video starts on its own, without sound |
| Loop | the video starts again when it ends |
| Block options panel | the editor panel where authors pick a block's choices from named options |
| Text style | colour, font or size of a few words, set with the Text style panel |

## Which choices fit which video

The Block options panel reads the selected video and shows only the choices that fit it; a
choice that would do nothing is not shown.
Hovering a choice shows what it does.

| Needs | Choices |
|---|---|
| A Dynamic Media video link | Autoplay (muted), Loop |
| Any video | Black border |

## Review status (draft pages only)

While the standardisation is reviewed, the new Video rendering applies **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews: no frame by default, the black border, autoplay
(muted) and loop. stryker.com pages imported today render exactly as before (checked on three pages:
INBONE, OrthoLoc 2 Lapifuse and a Kevin Lobo video news page, at both widths); patients pages are not
touched.

The migration works the same way: the border and playback switches are written only by a review build
used for the draft pages (from the stryker.com frame and the Dynamic Media viewer settings). A normal
re-import of a real page gives exactly the same output as before (compared file by file on Sternal plate,
ASC care setting, Hydro irrigation and two video news pages).
