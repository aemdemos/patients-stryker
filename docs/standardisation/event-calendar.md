# Event Calendar: the events calendars, built from the event pages

*A walkthrough of the Event Calendar block for business, content and design teams. No technical
knowledge needed. It follows the same approach as the Columns walkthrough ([columns](columns.md)):
measure what stryker.com actually uses, keep its look, and offer a small set of named choices in the
editor.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 3 calendars shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Three stryker.com pages show an **events calendar**: Sports Medicine, the Global education calendar and the Endoscopy events calendar. Each lists the event pages of one part of the site (44 event pages in all): a Filters box (region, event type, audience, business unit, speciality), a month calendar with DAY and WEEK lists, and a list view. AEM builds it in the browser from the event pages' own details (dates, place, tags). |
| **The risk** | The migration so far left the calendars out (the events load in the browser, so there was nothing to copy). Copying a frozen list would stop new events from appearing. |
| **What we did** | The **Event Calendar** block builds the calendar itself from the site's page index, so every event page in the folder appears on its own, on its dates. The migration writes each event page's details (start, end, place, country, and, in review, city, state, event type, audience, business unit and speciality) as page metadata, which the filters read. There are no style choices. |
| **The result** | The calendars look as today: on the review page the Filters box, the dark bar, the day grid, the event bars and the list view sit at the same places, in the same fonts, sizes and colours as on stryker.com, at 1,440px and 390px. |

---

## 2. The problem, in numbers: values today vs named choices

| Setting | Values today | Instances | Choices | Kept | Note |
|---|---|---|---|---|---|
| Calendar | 1 look (filters, month, day, week, list) | 3 | the block, no choices | **100%** | the package: "No style choices" |
| Which events | the event pages under a folder | 3 | a `Folder` row | **100%** | |
| Filters | region, event type, audience, business unit, speciality | 3 | always shown | **100%** | from the event pages' details |
| Event colour | teal (association meetings), grey (the others) | 44 events | by event type | **100%** | 9 teal, 35 grey |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Which events | the block: a `Folder` row (the folder of the event pages, e.g. /us/en/global-events/sports-medicine) |
| The title above the calendar | a normal **Heading 2** before the block |
| The events | nothing to author in the calendar: they come from the event pages' own details (their page metadata) |

---

## 3. The variant on stryker.com

### 3.1 Events calendar (`Event Calendar`)

From 600px, the **Filters** box takes the left quarter (a white box with a soft shadow, *Filters* in
Egyptienne 21px, each filter a Futura bold 14px heading with a caret that opens its choices, APPLY in teal
and RESET in grey). Beside it, two small switches (calendar, list) and the calendar: a dark grey bar
(#545857) with gold previous / next arrows, TODAY, the month in Egyptienne 24.5px white and DAY WEEK
MONTH; the Sun … Sat row on mid grey (#b2b4ae, white bold 14px); day cells 140px high on #fafafa with the
date at the top right, today on pale yellow (#fcf8e3). Each event is a white 14px bar across its days, its
start time in bold, **teal** for association meetings and **grey** for the others. DAY and WEEK list the
events of the day or week (a grey heading per day, the time, a coloured dot and the title).

The **list view** shows the month's events one under the other: a gold date block (Futura bold 15px,
*7 - 11 JAN*) over a dark year block (Egyptienne 17px white), the title with its place in Egyptienne 22px,
*Event type* and *Location*, and MORE INFORMATION in teal. **On phones** the list view is the only view,
under a FILTER button that opens the Filters box, as on stryker.com.

| | |
|---|---|
| Calendars on the live site | **3** on 3 pages |
| Example pages | [Sports Medicine calendar](https://www.stryker.com/us/en/sports-medicine/calendar.html), [Global education calendar](https://www.stryker.com/us/en/training-and-education/training-and-education-calendar.html), [Endoscopy events calendar](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/events--calendar-.html) |

**Every event is in the past.** The 44 events date from January 2018 to October 2021, so today stryker.com
opens all three calendars on an empty month; the previous arrow (or the list view) reaches them. The new
calendar behaves the same way.

## 4. The options (Block options panel)

None: stryker.com offers no style choice for the calendar, so the Block options panel has no Event
Calendar entry.

## 5. The text (Text style, not Block options)

The calendar has no authored text: titles, dates and places come from the event pages. The title above it
is a normal Heading 2 (Futura bold 24.5px with the grey rule, as stryker.com's calendar title).

---

## 6. How close is it to stryker.com?

| Setting | On stryker.com | On the new site | How close |
|---|---|---|---|
| Filters box (1,440px) | 345px wide from 30px, 30px / 15px inside, soft shadow; *Filters* Egyptienne 21px; headings Futura bold 14px; APPLY 63 × 40px teal #4c7d7a, RESET grey #b2b4ae, Futura light 14px capitals | the same | **100%** |
| Switches | two 28 × 29px boxes with a #545857 line, 20px above the calendar | the same | **100%** |
| Bar | #545857, 15px / 10px inside; month Egyptienne 24.5px white centred (21px on phones); TODAY, DAY, WEEK, MONTH Humanist 14px capitals | the same (59px high against 61px) | **99%** |
| Day grid | Sun … Sat 40px on #b2b4ae, white bold 14px; cells 143 × 140px on #fafafa, #ddd lines; today #fcf8e3 | the same | **100%** |
| Event bars | Humanist 14px white, 21px high, 2px in from the cell; time in bold; teal rgb(0, 128, 128) / grey rgb(128, 128, 128) | the same (Orthopedics Today at the same place in January 2018) | **100%** |
| DAY / WEEK | a #eee heading per day (bold, the date on the right), rows on #fafafa | the same | **100%** |
| List view | gold date 100 × 77px (Futura bold 15px), year 100 × 34px on #545857 (Egyptienne 17px), title Egyptienne 22px, MORE INFORMATION Futura bold 14px teal | the same | **100%** |
| Phones (390px) | FILTER button 63 × 40px, then the list view's bar and the month's events | the same | **100%** |

**Checked on the review page.** The check copy of the review page uses stryker.com's own event data (the
44 events, with their tags as the calendars show them), so the calendar can be compared month by month:
January 2018 shows *Orthopedics Today* (teal, 1 pm), *St. Louis Hip Skills Course* and *International
Fellows Course ISMF* (grey) at the same places as on stryker.com; the *Lab* filter keeps the two labs.

**What differs, by design:**

- **The time shown**: stryker.com's calendar shows the time of its calendar feed (Orthopedics Today
  *1 pm*); the event page itself shows the meeting time in its time zone (*8:00 AM*), which is what the
  migration writes. The new calendar shows the event page's time, so calendar and event page agree.
- **The bar height**: 59px against 61px.
- **More than four events on a day**: stryker.com shows *+ more*; the new calendar shows four bars a day
  (the 44 events never have more than two on a day).

---

## 7. To review (outliers)

| What | Calendars | Example pages | Proposal |
|---|---|---|---|
| Events all in the past (2018–2021) | 3 | all three | keep the calendars, or link the pages to a list of past events, or retire them (section 10) |
| A calendar without a title | 1 | [Endoscopy events calendar](https://www.stryker.com/us/en/training-and-education/medical-and-surgical-equipment--/endoscopy/medical-education/events--calendar-.html) | as today: no heading |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The calendar built from AEM tags in the browser | the block builds it from the page index; the event pages carry their details as page metadata |
| *+ more* on a busy day | four bars a day; no stryker.com day has more than two |
| The map, PRINT and ADD TO CALENDAR of the event pages | left out of the event pages already (event-detail migration) |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| New event pages appear on their own, on their dates | The page index must hold the event pages' details (section 10) |
| One look, nothing to choose | Every event today is in the past |
| Calendar and event page show the same time | The calendar's time is the event page's, not stryker.com's feed time |

---

## 10. Decisions we need from the business

**To approve:**

1. An Event Calendar block built from the page index (the package's open point: *build a new block from
   the query index, link to a list page, or drop it*). The proposal is the block.
2. Removing the review-only gate (section *Review status*).

**To do with the site administrator (no code):**

- **Add the event pages and their details to the page index** (`event-start`, `event-end`,
  `event-location`, `event-city`, `event-state`, `event-country`, `event-type`, `audience`,
  `business-unit`, `specialty`). The event pages already carry start, end, location and country; the
  migration's review build adds the others. Until then the calendars on the preview site show no events.

**Proposed, still open:**

- **The calendars only hold past events (2018–2021).** Keep them as an archive, or retire the three pages
  until new events are published?

---

## Glossary

| Term | Meaning |
|---|---|
| Event page | a page about one event (a course, a congress), with its dates and place |
| Page index | the site's list of its pages with their details, which the block reads |
| Folder | the part of the site where a calendar's event pages live, e.g. /us/en/global-events/sports-medicine |
| Filters | the choices on the left that narrow the calendar to a region, event type, audience, business unit or speciality |
| List view | the month's events one under the other (the only view on phones) |

## Which choices fit

The block has no choices, so the Block options panel shows nothing for it.

## Review status (draft pages only)

While the standardisation is reviewed, the Event Calendar block renders **only on draft pages**
(`/drafts/…`) and in the authoring panels' previews. No stryker.com page imported today uses it, so
nothing else changes; patients pages are not touched.

The migration works the same way: today's migration leaves the calendars out and writes the event pages'
start, end, location and country. Only a review build used for the draft pages writes each calendar as an
Event Calendar block (its folder, its title as a Heading 2 before it) and adds the event pages' city,
state, event type, audience, business unit and speciality, read from stryker.com's own calendar data. A
normal re-import gives exactly the same output as before (compared file by file on the three calendar
pages, Arise 1000 EX and two event pages).
