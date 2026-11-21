# QA prompt — original site vs EDS (content, links, fonts, layout, visual)

Copy everything below the line into the chat. Fill in the two placeholders first.

---

Run a full QA of migrated pages: each original page compared with its EDS page.

**Pages to check** (one pair per line: original URL, then EDS URL — or attach a CSV with these two columns):
```
<original URL> <EDS URL>
<original URL> <EDS URL>
```
**Batch name** (used in the report file name): `<batch name>`

## Ground rules
- This is a read-only check. Do not change code or content. Do not upload anything to DA, and do not preview or publish. Report what you find.
- Do not add screenshots to the report unless I ask for them.
- Report only differences you have verified. Check each one on **both** sites (computed styles in a browser) before listing it. Leave out false positives, for example:
  - hidden or duplicate elements;
  - text the original hides on that view;
  - a link or button that isn't visible;
  - a font that only looks different because of a span inside it.
- Every page must match **its own** original page. Do not standardise across pages of the same template. If one page differs from its siblings on the original, EDS must differ the same way.
- Work quickly. Process pages one at a time in the browser and close each page when done, to keep memory low.
- If a QA toolkit already exists in this workspace (`migration-work/content-validation/`, with `run-set.sh`, `pairs.mjs`, `font-style-sweep.mjs`, `layout-sweep.mjs`, `visual-sweep.mjs`, `customer-report.mjs`), reuse it. Add my pages as a new set. Otherwise, build equivalent Playwright scripts that do the checks below.

## Screen widths and breakpoints
Compare both sites at the **same** screen widths:

| View | Width |
|---|---|
| Phone | 390px |
| Tablet | 768px |
| Desktop | 1024px |
| Large desktop | 1440px |

Agreed breakpoint mapping:

| Original | EDS |
|---|---|
| 480px | — (dropped) |
| 840px | 600px |
| 1024px | 900px |
| 1440px | 1200px |

At widths between 600 and 839px, EDS already shows its tablet layout while the original still shows its phone layout. Mark a stacked/side-by-side difference there as "expected (agreed breakpoints)". Still report size, spacing and box differences at those widths.

## Checks

1. **Content.** Compare the text of the header, page content and footer word by word, plus the page title and meta description.
   - List missing, extra or changed text with a few words of context.
   - Also cover image alt text.
   - If a source image has no alt text, list it (page + image URL). Do not invent alt text.

2. **Links.** Pair every link in the header, page content and footer.
   - Each link must lead to the same destination as on the original, after following redirects.
   - On EDS, links to the customer's own pages drop `.html`, and `/something/index.html` becomes `/something/`.
   - Report:
     - different destinations;
     - links missing on EDS;
     - links only on EDS;
     - broken links;
     - footnote / reference links that behave differently.
   - Links to pages that are not on EDS yet return 404 there. List them in their own section as "404 on EDS — page not migrated yet".

3. **Font style** (desktop and phone). For every visible text, check that the font family is the same (Futura, Humanist 712, Egyptienne), and that bold, italic and capitals match.
   - Check the EDS font really loads: no fallback font, no browser-faked bold or italic.
   - Font *sizes* are covered by the layout check below, not here.

4. **Layout, at all four widths.** Pair each text block by its wording and compare:
   - **font size** (report differences above 1px or 6%);
   - **line wrapping** (number of lines);
   - **line spacing** (more than 2px);
   - **position from the left** (more than 10px) and **text width**;
   - **background boxes**: whether the text sits in a box, the box colour, and the **padding** inside it (left / top / bottom, more than 4px);
   - **alignment** (left / centre / right);
   - **colours**: text colour, and button / link style (fill, border, corners, underline). Colours count as different when any red/green/blue channel differs by more than 40;
   - **box corners and shadow**;
   - **spacing above**: the margin to the text above it in the same column (more than 10px or 25%);
   - **stacked vs side by side** compared with the text before it.

   For **images and videos**, compare their width and shape (aspect ratio, more than 8%).

   Measure superscript footnote numbers as part of the line, not as extra lines.

5. **Visual, at phone 390, tablet 768 and desktop 1440.** This checks how the page content looks, apart from its text.
   - Hide all text on both pages. Text, fonts and sizes are covered by the checks above.
   - Cover each video with the same plain placeholder on both sides. Players and posters render unreliably in a test browser.
   - Hide fixed and sticky bars, again after every scroll, because some only become fixed once you scroll.
   - Cut each page into matching areas: the stretch between two texts found once on both sites.
   - Capture each area by scrolling it into a normal 900px-tall window. Don't use full-page screenshots, which re-lay the page out.
   - Compare each area pair pixel by pixel, scaled to the same size.
   - For each flagged area, describe in plain words what differs, from the elements in it on each side:
     - dividers and borders (count, colour, length, thickness);
     - icons;
     - images;
     - boxes and buttons (colour, corners, shadow);
     - background images;
     - the same elements in different places.
   - If nothing explains a flagged area, look at the side-by-side crop yourself and describe the difference. Mark it "ok" if it isn't real.
   - Areas under 5% different with no explanation count as small differences only.
   - Crops are working files only. They never go in the report.

## Accepted decisions (edit for your batch)
- "Last Updated" lines are removed on EDS by customer request. List them once as an *intentional* gap, not as an error.
- Extra space before the footnotes is acceptable. Don't report it.

## Output
1. **First, the gap list in chat.**
   - Put the most common differences first: the same difference in the same block on many pages is one fix, so give its page count.
   - Then list each page's differences, written as original → EDS at each width where they appear.
   - Use plain language, no code.
2. **Only when I say the gaps are final, build the HTML report and zip it.**
   - Put the files under `tools/`. Do not use the word "content" in the file names.
   - The report includes:
     - summary KPIs;
     - a summary by section;
     - link differences;
     - 404-on-EDS links;
     - content mismatches;
     - font style differences;
     - layout differences (most-common table first, then per page);
     - visual differences (per page and area, what looks different at each width);
     - a page-by-page part with both URLs and each page's link table.

## If I later ask you to fix layout gaps
- Measure the original first and name the source URL you measured. Never guess values.
- Use only the 600 / 900 / 1200px breakpoints, mobile-first.
- Put each fix in the lowest layer that carries it: authoring conventions → section style → block variant → template theme. No page-specific selectors.
- If a fix is needed only on some pages, add a block variant for those pages. Propose the variant names, and list the DA edits authors must make (which block on which page gets which variant).
- Re-run the layout check on the affected pages to confirm they now match at all four widths.
