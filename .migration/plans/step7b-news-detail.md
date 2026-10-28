# Step 7b: news-detail re-import pilot (2026-10-28)

Branch `import-news-detail` (on top of `import-tier2-landing-page`), with `main` merged in.

## What was done
- **`main` merged in.** It had #457 (news template: image-1-2 / image-1-3, h2-0-8, headline-2vw,
  spacer after the title, purple / blue buttons, video + text columns, quotes, DM share image),
  #459 and #437, none of them on this stack. Re-importing without them would have undone #457.
  Conflicts were resolved like this:
  - The rich-text helpers stay in the shared `corp-richtext.js`.
  - Main's share-image rule sits next to the page facts.
  - `styles-corp.css` keeps both sides.
- **Two shared rich-text fixes:**
  - #457's line-break fix was ported to `corp-richtext.js`: a break typed inside the formatting moves
    out (innermost first) before the plain-bold labels are found, and a trailing space is kept.
  - A bold label at its own size no longer decides the copy size. Example: a "References" line in
    0.8em small print now gives p-0-8, where it used to give the default.
- **Re-import:** all 95 local news-detail pages and their 4 XFs, into a scratch folder (nothing in
  local content, DA or preview changed).
  - Coverage: 99/99 documents ok.
  - No `.html` or `/index` links.
- **Regression check** on the product-detail, long-page-detail and tier2 pilots, after the shared
  fixes. Only 3 pages changed, all for the better:
  - inspace: the space after "The solution" is kept.
  - orthopaedic: the EZout copy gets p-1-5 (21px, as live).
  - 1788-platform: a Columns block gets p-1-25.

## Baselines
- **Local content** (an earlier import from this repo): the re-import body is identical on 31/95
  pages.
- **DA / corp preview** (strykerenterprise/stryker-com): the pages differ systematically from every
  import of this repo:
  - no H5 date under the title;
  - a `first-published` metadata row;
  - [[text-1-25]] tags.

  The corp site also runs other code than `main` (its news-detail.js, corp.js and styles-corp.css
  differ). DA reads (GET) worked for 8 pages, then returned 401, so the corp preview was used as the
  DA state (the one page compared matched DA).

## Differences from DA, by cause

| # | Difference | Pages | Cause | Proposal |
|---|---|---|---|---|
| 1 | H5 publish date under the title added | 92 | importer rule (#451 / #457); DA has none | decide: keep the H5 (source shows it) or drop it in the importer |
| 2 | `spacer` section after the title | +23 / −2 | #457 rule (spacer when the title holds the H1, not before a lead image) | keep (#457) |
| 3 | 0.8em article small print → `p-0-8` instead of `disclaimer` | 7 | approved typography map (2026-10-27) supersedes #457's fontsize-8em → disclaimer; both 11.2px | keep p-0-8 |
| 4 | `image-1-2` / `image-1-3` on images in a narrow column | 6 | #457 | keep |
| 5 | `h-serif` on Egyptienne h2 (incl. h2-0-8) | 6 | shared serif-heading rule; live h2 is Egyptienne Light (measured) | keep |
| 6 | Content in XF fragments, hero as Hero Corp (fragment slides) | 2 | XF rule (every XF a fragment) | keep |
| 7 | "About Stryker" / "About AVS" label as Bold + Italic (Futura) instead of Bold | ~10 (2026) | #451 rule (span.futura-bold → Bold + Italic); renders the same | keep |
| 8 | Teal Futura link with ► ("READ MORE ON OUR INVESTOR RELATIONS SITE HERE") → Bold + Italic link + [[color-teal]] | vocera | **importer gap**: a link alone in Bold + Italic is the gold button convention; DA has the link-strong form (Bold + Underline) | fix: futura-bold teal link → link-strong (Bold + Underline) |
| 9 | [[color-teal]] around links | 2 | mapColours tags the source's inline teal; links are teal anyway | fix: drop a colour tag that only repeats the link colour |
| 10 | Paragraph split into another section | 2 | the section a dateline paragraph lands in | harmless |

## Probably author edits in DA (a re-import would undo them)
- endoscopys-rosales-shares-…: different video poster (StrykerTalks23_8.30.23_1200x675_Vs1)
- stryker-s-heath-shares-…: different video poster (AnnieHeathStrykerTalks_thumbnail)
- kevin-on-insideout-podcast-…: Columns has `gray-lead`
- a-message-to-our-customers-03-2026: the article inline in DA, where the re-import has the XF as a
  fragment (130 texts, all covered)
- [[text-1-25]] label tags (over-2400-surgical-cases…, national-direct-to-patient…)

Per the re-import rule, these need patching in DA by hand (surgical, not a re-upload), or the
importer needs to bake them in.

## Not done (needs a decision)
- Uploading anything to DA.
- Fixes 8 and 9 (small, importer only).
- Decision 1 (H5 date).
