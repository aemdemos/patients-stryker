# Step 7b: tier2-landing-page styling differences (measured 2026-10-28, 1440px, leaf computed style)

Pilot: 11 pages (.migration/plans/pilot-tools/t2-pilots.txt). Content complete (coverage 11/11; one
news-archive DAM-image link renders as the image, by the image-link convention). 95 measured text-style
differences at 1440px, of which 17 are a measurement artifact (card titles match: Egyptienne Light 21px on
both), so 78 real.

| # | Difference | Pages | Live → preview | Cause | Proposed layer | Kind |
|---|---|---|---|---|---|---|
| 1 | Copy in full-bleed panels and tabs loses its size | emergency-medical-services (~12), Nailing-Portfolio (~4) | 17.5–21px → 14px | the section styles of a block nested in a panel / tab are dropped (one section holds the panel) | importer: the panel's section takes the nested block's copy styles when they do not conflict | follows source |
| 2 | Plain h2 / h3 sizes | emergency-medical-services, learn | h2 36.75 → 31.5; h3 21 → 26.25 / 28 → 21 | only product-detail sets the plain heading sizes (--corp-h2-size / --corp-h3-size); h-1-x scale from the 21px corp default here | template CSS templates/tier2-landing-page (same plain sizes as product-detail, measured) | consistent |
| 3 | Fast facts (statistics) unstyled | learn (8) | 56px number / 21px label → 14px | fastfacts has no handler yet (approved: Statistics) | importer handler → Statistics block | approved rule |
| 4 | Large Headline vw copy in default content | learn, Nailing-Portfolio, aaa-2023 (~8) | 28–76px → 14–35px | standalone Large Headline lines: the large-headline section style has one scale | normalise (approved rule), or a size option (new name) | per instance |
| 5 | Page titles | emergency-medical-services h1 42 → 28, Nailing-Portfolio h1 70 → 28, cardiovascular-health h1 28 → 84, learn h1 Futura → Egyptienne | per page | hero / Large Headline h1 sizes; a fully bold Columns h1 renders as the 84px stat number | importer + hero options; cardiovascular: the stat-number rule (known, also jr45/july) | mixed |
| 6 | Remaining one-offs (quotes, labels in orthopaedic, Nailing Futura labels 21 → 14) | orthopaedic, Nailing-Portfolio (~15) | various | per-page authored formatting | check after 1–3 | inconsistent |

Not started: rare components without a handler yet (contactus, divisioncontactus: Marketo IDs needed from
the client, latestnews, featuredcontentgrid, mixedmediagallery, curatedlinklist, testimonial, sitemap, grouplist)
— their content is kept as default content and reported.

## Approved (2026-10-28)
Apply as proposed (1, 3, 5 importer; 2 template heading sizes; 4 normalised; 6 re-check), then the
news-detail template (710 pages, 79 already migrated: re-import under the new shared rules, diffed),
then PAUSE for review before the next template.

## Applied (2026-10-28)
Re-measured (1440 / 375, same 11 pilots): 376 → ~346 differences (news-archive's 188 at 375 are the
table cells: TD 14px → P 12px, the Table block's mobile size).
1. Tabs: the tabbed section takes the copy styles every pane shares (emergency-medical-services:
   tabbed, p-1-25, label-2). EMS 27 → 10 at 1440.
2. templates/tier2-landing-page: plain h2 / h3 sizes as product-detail. h-1-25 / h-1-5 no longer
   scale card titles (Cards wrappers excluded).
3. fastfacts → Statistics (cols-2, no count-up: static on live); in the dark gradients the stats
   take the section's white text. Still different: live is left-aligned Egyptienne Light 56px /
   21px, the Statistics block is centred Futura bold — needs a variant (name to approve).
4. Large Headline vw copy in default content: normalised (approved).
5. Page titles: fullWidthImageHero h1 is Bold (Futura, as live on learn). The 6vw stat-number rule
   now applies only in Large Headline columns (jr45/july h1 56px as live; focusrn
   cardiovascular-health rich-text h1 56px vs 28px live — a fully bold rich-text h1 and a fully
   bold Large Headline h1 have the same markup). Not fixed: EMS hero (rich-text overlay, h1 1.5x:
   the image-slide hero sizes every line by vw; needs a hero option for rich-text overlays, name
   to approve); Nailing-Portfolio second h1 line (5vw inside 6.5vw: copy-size applies; inspace
   uses h1 lines as copy, so h1 can't be excluded).
6. One-offs left: serif 1.75em titles in shared XF columns (services-and-support, ProCare:
   24.5px Egyptienne → copy), Nailing bold-italic 1.5em link labels (21px → 14px), orthopaedic
   quotes. Regression: product-detail and long-page-detail pilot outputs byte-identical.
