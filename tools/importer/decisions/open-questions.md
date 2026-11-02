# Component decisions: open questions (2026-10-27) — ALL RECOMMENDATIONS APPROVED 2026-10-27

The user approved every recommendation and every new name below. Still open: the client inputs in the first group (Marketo form IDs, microapp framing, optional Maps key).

Every one of the 93 AEM component types now has a proposal in `component-map.json`, backed by evidence (AEM exports, rendered source pages, Block Library, existing corp blocks).
Reply with **"approve all recommendations"**, or list exceptions by component name.
"Recommendation" is the proposal in the table. "Uses" counts instances across the 2,553 pages and 1,180 XF variations.

## Client input needed (not a design choice)

| Component | Uses | Recommendation | Question / alternative |
|---|---|---|---|
| `divisioncontactus` | 47 | Marketo Form (medium) | Which Marketo form ID(s) replace the AEM email form per business unit (10 formMailTo routes, 47 pages)? The client must create or supply them. Until then the importer can emit the heading + description and leave the form out, listing the pages. |
| `corporatecontactus` | 2 | Marketo Form (medium) | Marketo form ID for recall questions (client). |
| `remotecomponent` | 30 | widget remote-component (medium) | The microapps only allow framing from *.stryker.com, so they will not render on *.aem.page / *.aem.live previews (only once served from www.stryker.com) unless the client adds the EDS hosts to frame-ancestors. Also confirm whether to keep the gamma4 stage URL. |
| `map` | 1 | embed (medium) | Keyless embed (works on aem.page/live), or keep Stryker's Maps Embed API key (the client must add the EDS hosts to the key's referrer list)? Code change in columns.js (and a small default-content decorator): approve the link convention, or prefer a 'View on Google Maps' link with no embed? |
| `contactus` | 23 | columns columns-50-50 (medium) | Map: a block (or widget) inside a Columns cell is not decorated by decorateBlocks, so columns.js would need to render the map itself (as it does for YouTube links). Alternative: a 'View on Google Maps' link instead of the iframe. |

## Content fragments (correction of an earlier decision)

| Component | Uses | Recommendation | Question / alternative |
|---|---|---|---|
| `contentFragment` | 72 | cards contact (medium) | The approved decision assumed only 2 fragments show a subset. In fact a subset is the norm: 43 of 55 fragments have values that the live page never shows. Choose: (A, recommended) card = the shown fields, the rest + labels as Metadata rows; for the 2 multi-set fragments the card shows the union (the HQ box beside the map then also shows the 'Global Headquarters' heading and Learn More; the 2nd Latin America box also shows the phones). (B) all fields visible in the card (the live page then gains 39 phone and 22 email blocks). (C) a key/value corp block (e.g. contact-info-corp, proposed) that lists CF path + field list per box, mirroring AEM elementNames exactly. C is a new block and does not use the fragment block. Note also the request cost: about 62 fragment fetches on /us/en/about/contact (lazy, inside accordions). |

## Heroes and page intros

| Component | Uses | Recommendation | Question / alternative |
|---|---|---|---|
| `pagehero` | 651 | Columns columns-50-50, page-intro (+ border-bottom unless hideBottomLine) (medium) | Approve Columns (columns-50-50, page-intro[, border-bottom]) for the corp page hero, or use a Hero Corp variant (e.g. 'page-hero') instead? A third option is to style the existing library variant through the 'compact' section style, with no new name. That would make the block's look depend on the section, so it is not recommended. |
| `hero` | 13 | Columns columns-50-50, page-intro (+ border-bottom) (medium) | Follows the pagehero decision (Columns page-intro vs a Hero Corp variant). |
| `longtexthero` | 11 | Columns columns-50-50, page-intro (medium) | Follows the pagehero decision. A plain black H1 (not gold) is how the convention tells it apart from the pagehero title. |
| `fullWidthImageHero` | 41 | Hero Corp image-slide (+ top-/left-/right-/size- options, text-below; new options text-above, bottom-<n>) (medium) | Add the text-above and bottom-<n> options to Hero Corp image-slide, or accept the overlay / text-below on phones for these 41 heroes? |
| `hero-large-carousel` | 6 | Columns columns-50-50 (one per slide) (low) | Stack the slides as banded Columns rows, build a new carousel block (it would also serve multi-slide carouselslidegroups), or leave the 2018/2019 event pages out of scope? |
| `hero-large-carousel/slide` | 13 | Columns columns-50-50 (low) | Depends on the hero-large-carousel decision: stack the slides as columns bands (rotation lost) or build a carousel block. Corp columns render a plain h2 in Futura bold, but the source title is Egyptienne Light. |

## Layout and section styles

| Component | Uses | Recommendation | Question / alternative |
|---|---|---|---|
| `columncontrol/cols2` | 2378 | Columns columns-50-50 (high) | Branch B (424): content authored in one half with the other half empty is normalised to full-width default content (the template CSS owns any narrow measure, as news-detail already does). Confirm, or keep the half width with an empty second cell. |
| `columncontrol/cols2_2-3_1-3` | 1326 | Columns columns-67-33 (high) | Approve section style 'flex-67-33' (and its mirror for cols2_1-3_2-3), or prefer to restyle the existing 'flex' on corp when its second wrapper is a contact-aside fragment? |
| `columncontrol/cols3` | 857 | Columns (none: 3 cells) (medium) | Branch F uses Cards Corp because the corp cards-corp two-up/three-up were built from these column-control card rows; Columns would render the same content too. Confirm Cards Corp for card-like rows (87 instances over cols2/3/4). |
| `fullbleedpanel` | 587 | default-content (high) | Approve the three gradient section styles, or normalise them to bg-dark-gray / bg-gold? For the teal gradient, reuse the patients 'dark' style or add a corp alias 'bg-dark-teal-gradient'? |
| `largeheadline` | 2114 | default-content (medium) | Standalone headlines at 2vw or larger: approve one 'large-headline' section style that reuses the Columns large-headline scale, or normalise them to the existing p-1-75 / heading sizes? This is tied to typography-map rule size-2-and-2-5, which is still open. |
| `engagementcta` | 11 | default-content (low) | Keep the social icons in the buttons? That needs x/twitter and message icons plus a small corp rule, since 'Follow us' alone is ambiguous. Or use text-only buttons? Should the side-by-side row be kept (no existing style does it for default content)? |

## Dynamic lists and navigation

| Component | Uses | Recommendation | Question / alternative |
|---|---|---|---|
| `latestnews` | 18 | Cards Corp teaser (medium) | The source picks the newest articles by tag; the import freezes today's 4. Accept a static list, or add a 'latest by tag' mode later (query index would need published date + tags)? CTA reads 'Learn more' instead of the source 'Read More'. |
| `newsandannouncements` | 14 | news-list-corp (medium) | Approve a new news-list-corp block (and adding published/tags to the corp query index), or link the landing pages to a simpler Cards Corp teaser list of selected articles? |
| `filteredcontenttypegrid` | 137 | Cards Corp product-item (five-up only where the measured grid needs it) (medium) | Grids with a 'Product type' filter (e.g. trauma 113, foot-and-ankle 88 items) lose the filter. Accept, or plan a filter option for Cards Corp (needs product-type tags per page)? |
| `localpagenavigation` | 654 | Sticky Nav local (medium) | Sticky Nav (local) variant vs a new 'local-nav-corp' block; and author the nav on each of the ~55 pages (importer) vs once per parent as a shared fragment document (no path rule exists yet for non-XF shared content). |
| `eventcalendar` | 3 | event-calendar-corp (low) | Build event-calendar-corp, use a simple Cards Corp list of events, or skip the 3 calendar pages (many events may be past)? |
| `sitemap` | 1 | sitemap-corp (low) | Generated sitemap-corp block vs a static default-content snapshot taken at go-live? |
| `featuredcontentgrid` | 8 | Columns related-links (low) | Only 8 instances and no exact match: Columns (related-links) reproduces title + text + chevron link; the alternative is Cards Corp link-only rows (adds an image and 'Learn more', which the source does not show). Confirm. |

## Rare components (≤ 16 uses each): new block or no-code fallback

| Component | Uses | Recommendation | Question / alternative |
|---|---|---|---|
| `mixedmediagallery` | 16 | gallery-corp (low) | Build gallery-corp (new block), or accept a no-code fallback: Columns (media-pair) image grid of the set members, or only the first image? How should the single spin set (/us/en/portfolios/…/rise) be handled: frames as a gallery, or the DM SpinViewer embed? |
| `animatedbarchart` | 10 | chart-corp column / bar (medium) | Approve a new chart block (10 + 1 uses), or use a fallback with no new code: Table (label / value) or Statistics (cols-N) with the same colours? |
| `pieChart` | 1 | chart-corp pie (low) | For a single use: a Table (label / value) or an author-supplied image may be enough if chart-corp is not approved. |
| `interactivemedia` | 8 | default-content (low) | On the 3 ASC care-setting pages the hotspots are the main navigation of the page. Is image + link list acceptable, or should hotspots-corp be built? |
| `eventdetail` | 44 | columns columns-67-33 (medium) | Should the 'Meeting time / Location / Country' lines be authored text (as proposed) or rendered by an event-detail template from the metadata (one source of truth, new template)? Also: corp CSS sizes every underlined heading at 21 / 24.5px, so underlined H5 'Details' / 'Registration' would render larger than the source's 14px Futura. This needs a template rule or a plain H5 + divider. |

## New names to approve

| Name | Kind | For |
|---|---|---|
| large-headline | section-style | `largeheadline` |
| flex-67-33 | section-style (modifier of the existing 'flex' style, rules in styles/styles-corp.css) | `columncontrol/cols2_2-3_1-3` |
| flex-33-67 | section-style (mirror of flex-67-33) | `columncontrol/cols2_1-3_2-3` |
| local | variant of blocks/sticky-nav | `localpagenavigation`, `localpagenavigationchild` |
| page-intro | variant | `pagehero`, `hero`, `longtexthero` |
| bg-dark-purple-gradient | section-style | `fullbleedpanel` |
| bg-dark-blue-gradient | section-style | `fullbleedpanel` |
| bg-golden-gradient | section-style | `fullbleedpanel` |
| cards (contact) | block-variant | `contentFragment` |
| Metadata rows keyed by AEM field name (PhoneNumbers, Emails, addressBlock1, RelatedLinks, BusinessHomePage, locationName, ShortDesc, AddressLabel, PhoneNumberLabel, EmailLabel, BusinessHomePageLabel, RelatedLinksLabel) | fragment-metadata | `contentFragment` |
| event-start / event-end (ISO date-time) + event-timezone | page-metadata | `eventdetail` |
| event-location / event-city / event-state / event-country | page-metadata | `eventdetail` |
| event-type / event-business-unit / event-audience / event-specialty | page-metadata | `eventdetail` |
| event-registration (URL) / event-contact-name / event-contact-email | page-metadata | `eventdetail` |
| map embed (see 'map' row) | embed | `eventdetail`, `contactus` |
| text-above | variant | `fullWidthImageHero` |
| bottom-<n> | variant | `fullWidthImageHero` |
| /widgets/remote-component (widget) | widget | `remotecomponent` |
| gallery-corp | block | `mixedmediagallery` |
| news-list-corp | new corp block (blocks/news-list-corp) | `newsandannouncements` |
| chart-corp | block | `animatedbarchart` |
| chart-corp variants column, bar (chartType) | block-variant | `animatedbarchart` |
| hotspots-corp (only if the fallback is rejected) | block | `interactivemedia` |
| /widgets/adobe-sign (widget) | widget | `adobesignwebform` |
| event-calendar-corp | new corp block | `eventcalendar` |
| chart-corp (pie) | block-variant | `pieChart` |
| sitemap-corp | new corp block | `sitemap` |
| /widgets/cvent (widget) | widget | `cventcomponent` |
| Google Maps link alone in its paragraph → embedded map | link-convention (columns.js + default content) | `map` |
| /widgets/map (alternative) | widget | `map` |

Already approved elsewhere: section styles p-0-8, p-2, p-2-5 (typography-map.json).
