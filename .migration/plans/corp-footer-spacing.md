# Corp footer spacing: more space between the last text and the footer

## Goal
On www.stryker.com pages migrated to EDS, add space between the last content line and the footer. For example, on the improved-surgical-outcomes learn page the document code **"D0000008667 Rev. AA"** sits too close to the footer. The gap should match the reference page as if the "Last Updated" line were still there; that line is hidden for now and will be added later.

- **Reference page:** https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/surgical/learn/ImprovedSurgicalOutcomesThroughAdvancedAccessandVisualization.html
- **EDS page:** https://main--stryker-com--strykerenterprise.aem.page/us/en/training-and-education/medical-and-surgical-equipment/surgical/learn/improvedsurgicaloutcomesthroughadvancedaccessandvisualization

**Decided scope: all corp pages** (your answer). The change is one rule in `styles/styles-corp.css`, so every corp page whose last section is text gets the same gap. Patients pages are not affected.

## What I found in the code (read-only)
- **The likely cause:** `styles/styles-corp.css:212` sets **`margin-bottom: 0`** on the last section of a corp page when it ends in text:
  ```css
  :where(body.corp) main > .section:last-child:has(> .default-content-wrapper:nth-last-child(1 of :not(:empty))) {
    margin-bottom: 0;
  }
  ```
- **Normal section gaps:** `styles-corp.css:202` and `:718` give every other section 20px below it, or 30px from 600px.
- **Last Updated line:** `scripts/corp.js` `decorateLastModified` only adds it when the `last-updated` metadata is `show`. Its section has its own margin (`styles-corp.css:297` and `:730`).
- **Patients rule, not used here:** the patients site has a similar rule in `styles/styles.css:1128`, a 45px gap before the footer. Corp pages override it with the rule above.
- **Possible complication:** migrated pages often end with an empty section (left over from the page metadata), which is hidden. If that empty section counts as the "last child", the disclaimer section may get the normal 20/30px margin instead of 0. I'll confirm in the browser which rule actually applies.
- **Local copy may be out of date:** my local `main` is at `5e4ea88`, and the `long-page-detail-corp` template folder isn't in it, so the remote likely has newer work. The branch must start from the latest `origin/main`.

## Measurements still needed
I couldn't run browser measurements in planning mode, so these are the first steps of the work.

| Measurement (at 1440px and 390px) | Reference | EDS (today) |
|---|---|---|
| Bottom of "D0000008667 Rev. AA" → top of "Last Updated" | ? | (no Last Updated line) |
| "Last Updated" line height and margins | ? | n/a |
| Bottom of "Last Updated" → top of footer | ? | n/a |
| **Bottom of "D0000008667 Rev. AA" → top of footer** | ? (target) | ? |
| Breakpoints where the reference gap changes (source 480 / 840 / 1024 / 1440, mapped to 600 / 900 / 1200) | ? | ? |

Your 30px estimate is my starting assumption to check. The proposal will be one of these, based on the numbers:
- **Option A (likely): the gap without the Last Updated line.** The space the reference has between the last text and the Last Updated line. That's probably 20px on phones and 30px from 600px (the corp section gap). Adding the Last Updated line later would then restore the full reference distance on its own.
- **Option B: the full reference distance.** Everything from the last text to the footer, as if the Last Updated line and its spacing were there. Only worth it if you want that distance now. It would need adjusting when the Last Updated line is added, so the space isn't doubled.

I'll put both numbers in front of you before changing anything.

## Planned change (after measuring)
1. **Branch** from the latest `origin/main`, named `corp-footer-spacing`. I won't commit or push; you do that.
2. **Change the rule at `styles/styles-corp.css:212`** instead of adding a new one, so there are no duplicate selectors. Replace `margin-bottom: 0` with the measured gap:
   - use the existing tokens (`--space-block-l` 20px, `--space-section` 30px), or add a new `:root` token only if the measured value is more than 2px away from both
   - mobile value in the base rule, plus a `min-width: 600px` override only if the reference gap changes there (only 600 / 900 / 1200 breakpoints, per the project rules)
   - keep the gap as a margin, so it merges with the "Last Updated" section's margin when that line is shown, instead of adding up
3. **Check the empty last section.** If a hidden empty section is what's actually last, change the rule so it targets the last *visible* section. Otherwise the gap could fall on a hidden element, or be counted twice.
4. **No changes** to block CSS, templates, `scripts/aem.js` or content.

## Checks after the change
- Example page at 1440px and 390px: the measured gap from the document code to the footer matches the target, with no Last Updated line.
- Sample other corp page types that end in text: a thank-you page, an emergency-care video page, an endoscopy resources page, and a news page (from the recent news template). Confirm the gap is consistent and nothing is counted twice.
- A page with `last-updated: show` (if one exists): the Last Updated line plus the gap matches the reference distance, not that distance plus extra.
- A patients page: no change.
- `npm run lint` with no errors (and no `eslint-disable`).
- A short before/after table (reference vs EDS, both widths), with the reference URL I measured.

## Checklist
- [ ] Measure on the reference page, at 1440px and 390px: document code → Last Updated → footer
- [ ] Measure the same gaps on the EDS page, and find which CSS rule actually applies (including the hidden empty last section)
- [ ] Propose the exact value (Option A or B) with the numbers, and wait for your confirmation
- [ ] Fetch `origin` and create the `corp-footer-spacing` branch from the latest `origin/main`
- [ ] Change the existing last-section rule in `styles/styles-corp.css`, using tokens and the 600px breakpoint only if needed
- [ ] Handle the empty-section case so the gap lands on the last visible section
- [ ] Re-measure the example page at both widths and compare with the reference
- [ ] Spot-check other corp pages and a patients page
- [ ] Run `npm run lint:fix` and `npm run lint` (zero errors)
- [ ] Report the diff and before/after values; leave the changes uncommitted for you to commit and push

Measuring and making the change need Execute mode.
