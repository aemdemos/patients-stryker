# Step 7: product-detail styling differences (measured 2026-10-27, 1440px, leaf computed style)

Sources: https://www.stryker.com/us/en/{acute-care/products/isolibrium, ent/products/clarifix-cryotherapy-device,
emergency-care/products/lifepak-15, endoscopy/products/1788-platform, sports-medicine/products/inspace,
sage/products/sage-barrier-cream-cloths}.html vs the pilot copies under /content/drafts/reimport/…
Raw data: /tmp/playwright/style-a2.json, style-b2.json (cache only).

| # | Difference | Pages | Source → preview | Cause | Proposed layer | Kind |
|---|---|---|---|---|---|---|
| 1 | Futura bold labels gold | all 6 | Futura 700 black (17.5–28px) → gold | styles.css `main strong em` = accent; only news-detail.css resets it | styles-corp.css: move the news-detail reset corp-wide (gold stays via [color-gold]) | consistent |
| 2 | Text in Columns cells loses size / serif | 5 (not clarifix) | Humanist 17.5 / Egyptienne 21 / labels 17.5–28 → 14 Humanist | section builder sets copy styles on default-content sections only | importer: apply typography rules to the columns section (p-1-25, serif.p-1-5, label-*) | follows source |
| 3 | h2 size | 5 (clarifix 24.5 = outlier) | 36.75px → 24.5 (35 in columns) | no product-detail template | templates/product-detail css default h2 36.75 | consistent |
| 4 | h3 size | isolibrium, sage | 26.25 → 21 | same | template default h3 26.25 | consistent |
| 5 | Serif h2 rendered Futura | isolibrium, sage, inspace, lifepak (hero) | Egyptienne Light 500 → Futura 700 | h-serif not applied in bg-gold / block / hero sections | importer (h-serif) + Hero Corp serif heading (option needed) | follows source |
| 6 | Hero image full width | isolibrium, sage (+ others) | 732px right half → 1440 | no Hero Corp option | DECISION: hero option | consistent |
| 7 | Hero copy sizes | isolibrium, inspace, lifepak, sage | h1 42→28; inspace h1 49→77 (size-5-5 wrong); p 21 serif→28 | hero-image-slide parser size mapping | importer (copy-size-<n>, approved) | follows source |
| 8 | Small images upscaled | lifepak icons 101→440, sage 256→440 | intrinsic → cell width | columns img width 100% | columns-corp.css: never upscale | consistent |
| 9 | Linked DM images render as text links | inspace (8 buttons), 1788 (3 cards), isolibrium/lifepak social icons | image → link text | decorateDMAssets skips images inside links | DECISION: dm-support.js | consistent |
| 10 | Large-headline h2 sizes | lifepak | 21 gold eyebrow / 42 → 35 | single large-headline size | normalise (default) | inconsistent |
| 11 | Columns large-headline h4 | inspace (8) | Futura 56 white → Egyptienne 35 | columns-corp large-headline h4 rule | check with item 2 | inconsistent |
| 12 | Tag crumb "Related categories" not shown | 63 visible on live | list → tags metadata | approved component map | confirm | — |
| 13 | Video heroes empty | 1788, inspace | video → empty | Hero Corp has no video | DECISION | — |

## Approved by the user (2026-10-28)
- Table applied as proposed: importer fixes 2 / 5 / 7 first, re-run the 6 pilots, then template defaults
  (h2 36.75, h3 26.25), corp-wide bold-label colour reset (styles-corp.css), no image upscaling
  (columns-corp.css), lifepak large-headline sizes normalised.
- Video heroes: Hero Corp video support (DM / YouTube video as the hero background).
- Right-half hero image: new Hero Corp option `image-right` (image in the right half from 900px).
- Linked DM images: rendered by scripts/dm-support.js for every corp page.
- Order: one branch per block change (hero-corp video + image-right; dm-support linked images), importer
  fixes on import-product-detail; commit + push after each step.

## Progress
- 4662cbc importer: Columns copy styles (labels excluded), h-serif in Columns, serif h2/h3 = any text
  outside futura-bold (stryker.com `h1, h2, h3 { Egyptienne Light }`, site-wide)
- 2e03df8 CSS: product-detail h2/h3 sizes, corp black bold+italic labels, Columns images not enlarged
  (1px min box: lazy DM images have no width/height)
- Text differences at 1440 across the six pages: 232 → 116.
- edde894 (branch dm-linked-images, merged into import-product-detail as 3977bfb): dm-support renders
  <a href title=DM> images inside the link; columns.js keeps the link when lifting media. Verified:
  inspace 8 buttons 322x163, 1788 cards 440x364. Social icons render 100px (live 48px): open.
- f172def + 792779a (branch hero-corp-video-image-right, merged): video slides (background video),
  image-right, copy-size in every text box; 72 block-draft hero samples unchanged.
- a8c8825 importer: image-right detection (slide XF image offset 6 / width 6), hero section copy
  styles (cellStyles), copy-size fallback (inspace 3.5vw).
- Height ratio 1440 / 375: isolibrium 0.96/1.11, clarifix 1.02/1.26, lifepak 0.96/1.07,
  1788 0.84/0.92, inspace 1.02/0.94, sage 0.96/1.10. Coverage all OK.
- 4a21b35 label-1-75 / label-2 (approved 2026-10-28): all pilot labels at live size.
- 6b31643 resource covers 184x238, social icons 32/48px, nested-fragment section styles,
  bold-body for plain <b> in blocks, mixed-copy Columns keep the majority style.
- fa2c30a heading sizes (approved 2026-10-28): plain default (h2 21/24.5, h3 17.5/21) + h-1-25 /
  h-1-5; h-serif in Columns; bold h2 unwrapped outside h-serif. 677 pages: h2 plain 436 /
  1.5x 217 / 1.25x 92.
- Final (2026-10-28): text-style differences 232 -> 40 at 1440 (clarifix, sage 0); height ratio
  incl. the live disclaimer (outside [role=main]) 0.82-1.07. Coverage 6/6.
- Accepted / reported limitations: hero per-line sizes (isolibrium h1 42 / h2 30.6, inspace hero
  lines), lifepak large-headline sizes (normalised), inspace large-headline h4 (Columns variant
  styles h4 serif; one page), lifepak support-row serif titles (mixed copy), table cells 12px and
  stat labels 12px at 375, sage icons only render once published (DA turns :icon: into spans).
- Still open: isolibrium hero h1 42 / h2 30.6 (authored 1.5x / 1.25x);
  inspace hero line 3 (fixed 28px, gets 3.5vw); clarifix 375 1.26 (check h2 normalisation);
  social icons 48px; mixed-copy Columns rows; inspace large-headline h4.
- Open: label-1-75 / label-2 (new names, ask); Columns blocks with mixed copy (lifepak support row,
  inspace eligibility box, isolibrium PE row); inspace columns large-headline h4 (56px Futura white);
  lifepak large-headline sizes (normalise = nothing to do); hero work → hero-corp branch (video,
  image-right, per-line overlay copy size + serif: Hero Corp only has size-n + copy-size-n);
  dm-support linked images (inspace buttons, 1788 cards, social icons).
