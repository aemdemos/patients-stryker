# News List: newsrooms that keep themselves up to date

*A walkthrough of the News List block for business, content and design teams. No technical knowledge
needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what
stryker.com actually uses, keep its look, and offer a small set of named choices in the editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 13 news lists shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Each stryker.com division has a **newsroom** page (Acute Care, Sage, Emergency Care, the corporate News and features…). It lists the division's articles, newest first: tabs to filter them by topic, "Showing 20 of 32", one row per article (image, title, short text, READ MORE) and a LOAD MORE button. AEM builds the list from the articles' tags. Authors could choose how many articles show at first (5, 8, 10, 20 or 40) and whether dates show. |
| **The risk** | Copying today's list into each page would freeze it: a new article would not appear until someone edits the newsroom. |
| **What we did** | The **News List** block builds the list itself from the site's page index, so every new article in the folder appears on its own. The tabs filter by the articles' keywords (which carry the same topic names as stryker.com's tags). One standard length (20) replaces the five sizes; the dates are one switch in the **Block options panel**. |
| **The result** | The newsrooms look as today: on the review page the tabs, the count, the rows, the image, the title and READ MORE sit at the same places, in the same fonts and sizes as on stryker.com, at 1,440px and 390px. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| News list length | **5** page sizes (20 on 10 lists; 5, 8, 10, 40 once each) | 13 lists | 1 standard size (20) | (by design) | the package |
| Dates | on 2, off 11 | 13 | 1 switch (`show-dates`) | **100%** | |
| Filter tabs, "Showing n of N", Load More | always | 13 | always on | **100%** | |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Dates | **Block options panel** |
| Which articles | the block: a `Folder` row (the folder of the articles) |
| The tabs | the block: an `All` row (the first tab's label) and a `Tab` row per topic (its label, and the keyword of its articles) |
| The articles | nothing to author: they come from the articles' own pages (title, description, image, keywords) |

---

## 3. The variant on stryker.com

### 3.1 Newsroom list (`News List`)

The tabs (Futura 14px capitals, the selected one underlined in gold), "Showing n of N", then one row per
article with a light grey line under it: from 900px the image in the first third and the text beside it;
on phones the image above the text. The title in Egyptienne (24.5px, 21px on phones), the short text, and
READ MORE in teal with a chevron. 20 articles show; LOAD MORE adds the next 20.

| | |
|---|---|
| Lists on the live site | **13** on 13 pages |
| Example pages | [Acute Care newsroom](https://www.stryker.com/us/en/acute-care/news.html), [News and features](https://www.stryker.com/us/en/about/news/index.html), [Sage newsroom](https://www.stryker.com/us/en/sage/news.html) |

On stryker.com the list sits in the left two thirds of the page with a short text beside it (social links,
a contact): on the new site that is a side-by-side section (`flex, flex-67-33`).

## 4. The options (Block options panel)

### 4.1 Dates

| Choice | Option | Lists |
|---|---|---|
| Show dates | `show-dates` | 2 |

The date sits above the title (Futura bold 14px, *27-Oct-2026*), as on stryker.com.

## 5. The text (Text style, not Block options)

The list has no authored text: titles and short texts come from the articles. The text beside the list
(social links) is normal text with **Text style** (Futura bold 1.25× for its questions, as on stryker.com).

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Tabs | Futura 14px capitals, 12px / 7px around, gold line under the selected one, labels at 35 and 163px | the same | **100%** |
| Count | Humanist 14px, 75px under the tabs | the same | **100%** |
| Row (1,440px) | image 283 × 167px, text from 343px (597px wide), a row every 30px with a 1px #edeeec line | the same | **100%** |
| Row (390px) | image 360 × 212px, title right under it, a row every 20px | the same | **100%** |
| Title, text, READ MORE | Egyptienne 24.5px (21px), Humanist 14px, Futura bold 14px teal | the same | **100%** |
| LOAD MORE | teal button, Futura light 14px capitals, 106 × 40px | the same | **100%** |
| Articles | from the tags, newest first | from the page index, by folder and keyword | see below |

**Checked on the review page.** The News List review page holds three stryker.com newsrooms (Acute Care with
its social links beside it, News and features with dates and five tabs, Sage with four tabs), measured on
both sites at 1,440px and 390px. The tabs filter as on stryker.com (Acute Care: *caregiver stories* shows
its 5 stories).

**What differs, by design:**

- **The articles listed**: the block lists the articles of the newsroom's folder that are on the new site
  (Acute Care: 21 of stryker.com's 32 today; the others are elsewhere on stryker.com or not migrated yet).
- **Order and dates**: the page index of the new site does not hold the articles' publish dates yet, so the
  list keeps the index order and *Show dates* shows nothing until it does (section 10).
- **Subtitles**: stryker.com shows an article's subtitle under its title on some rows; the page index
  doesn't hold it, so the row shows the title and the short text.
- **One length**: 20 articles, then LOAD MORE (stryker.com: 5 on News and features, 8, 10 or 40 on three
  others).

---

## 7. To review (outliers)

| What | Lists | Example pages | Proposal |
|---|---|---|---|
| A length other than 20 | 4 (5, 8, 10, 40) | [News and features](https://www.stryker.com/us/en/about/news/index.html) (5) | 20, as the others |
| A list on a page that is not a newsroom | 2 | [Product security](https://www.stryker.com/us/en/about/governance/cyber-security/product-security.html), [SPS blog](https://www.stryker.com/us/en/joint-replacement/sps-blog.html) | the same block, with the folder of their articles |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| A list written into the page | the block builds it from the page index, so it stays up to date |
| Five list lengths | one standard length (20) and LOAD MORE |
| Filtering by AEM tag | filtering by the articles' keywords, which carry the same topic names |
| The subtitle under some titles | the title and the short text |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| New articles appear on their own | The list depends on the articles' keywords being right |
| One switch, the rest always on | Dates and newest-first need the publish date in the page index (section 10) |
| The same look on every newsroom | No subtitles |

---

## 10. Decisions we need from the business

**To approve:**

1. A News List block built from the page index (not a list frozen at import).
2. One length (20) and the *Show dates* switch.
3. Removing the review-only gate (section *Review status*).

**To do with the site administrator (no code):**

- **Add the publish date (and the tags) of each page to the page index**, so the list is newest first and
  shows dates. The articles already carry their publish date (`published` in their metadata); the index
  just has to read it. The block uses it as soon as it is there.

**Proposed, still open (from the package):**

- **A dynamic `news-list` block, or freeze the current list at import?** The proposal is the dynamic block.

---

## Glossary

| Term | Meaning |
|---|---|
| Newsroom | a division's page that lists its articles |
| Page index | the site's list of its pages with their title, description, image and keywords, which the block reads |
| Folder | the part of the site where a newsroom's articles live, e.g. /us/en/acute-care/news |
| Tab | a filter at the top of the list, one per topic |
| Keyword | a topic written on an article (from its stryker.com tags), used by the tabs |
| Block options panel | the editor panel where authors pick a block's choices from named options |

## Which choices fit

The only choice, *Show dates*, fits every list, so the Block options panel greys nothing out.

## Review status (draft pages only)

While the standardisation is reviewed, the News List block renders **only on draft pages** (`/drafts/…`) and
in the authoring panels' previews. No stryker.com page imported today uses it, so nothing else changes;
patients pages are not touched.

The migration works the same way: today's migration leaves the newsroom lists out of the page. Only a review
build used for the draft pages writes each list as a News List block (its folder, the first tab's label, a
row per tab, `show-dates` when its articles show a date). A normal re-import of a real page gives exactly
the same output as before (compared file by file on the Acute Care, Sage and News and features newsrooms).
The text beside the list is put beside it by hand on the review page: the migration writes it after the
list (open point for the importer).
