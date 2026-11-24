# Widget: stryker.com micro-apps, embedded as they are

*A walkthrough of the Widget block for business, content and design teams. No technical knowledge needed.
It follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep it, and name the choices.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 30 apps shown on the live site are counted.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | Some stryker.com pages show a small application inside the page: product and procedure explorers, savings calculators, maps, medical information request forms and the training events calendar. They are not AEM content: the apps live on their own server (microapp.stryker.com) or at Cvent, and AEM only places them in the page. |
| **The risk** | Rebuilding them would be a project of its own, and the apps must keep working when AEM goes away. |
| **What we did** | Following the business decision, every app is **embedded as it is** through the **Widget** block. The author places the block with the app's address; the block shows the app in the page and lets it set its own height, as AEM did. The variant names what the app is. |
| **The result** | Checked on a local test machine, the product explorers and calculators run exactly as on stryker.com, at the same heights on desktop and phone (900px explorers; 750px and 488px calculators on desktop, 853px fall calculator on phones). Stryker's app server only lets its apps show inside pages on stryker.com addresses (and local test machines): it refuses the review (preview) site, so there **every app shows as a grey box with a link to the app**. They show in the page once the site runs on www.stryker.com, or on the preview site once Stryker allows its addresses (section 7). |

---

## 2. The problem, in numbers

The apps have no style settings on stryker.com: nothing to standardise in colours, sizes or spacing. What
differs is only **which app** a page shows.

| What | Values today | Instances | Choices | Kept |
|---|---|---|---|---|
| App type | 5 kinds (explorers, calculators, maps, medical information requests, events calendar) | 30 | 5 variants | **100%** |
| App address | one per app (one page points to the stage server) | 30 | the app's address | **100%** (the stage address goes to the live app) |
| Style settings | none | | none | |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Which app | the app's address, the only cell of the Widget block |
| What kind of app | the block's variant: `product-explorer`, `calculator`, `map`, `medical-information-request`, `cvent` |
| Text around the app (titles, introductions) | default content and Text style, above or below the block |

---

## 3. The variants on stryker.com

### 3.1 Product explorer (`product-explorer`)

Interactive product and procedure explorers: a 3D skeleton (trauma), a bunion procedure, implant
explorers. 900px high on desktop and phones.

| | |
|---|---|
| Apps on the live site | **20** on 20 pages |
| Example pages | [Trauma & Extremities](https://www.stryker.com/us/en/trauma-and-extremities.html), [Hallux valgus correction](https://www.stryker.com/us/en/foot-and-ankle/procedures/hallux-valgus-correction.html), [Gamma4](https://www.stryker.com/us/en/trauma-and-extremities/products/gamma4.html) |

### 3.2 Calculator (`calculator`)

Savings calculators: the fall reduction calculator (1) and the surfaces-rental pressure-injury savings
calculator (3: inputs such as annual rental spend, admissions per year and HAPI rate; a Calculate button
shows the potential savings; nothing is submitted).

| | |
|---|---|
| Apps on the live site | **4** on 4 pages |
| Example pages | [Pressure injury calculator](https://www.stryker.com/us/en/acute-care/tools/pressure-injury-tool-calculator.html), [Falls reduction calculator](https://www.stryker.com/us/en/acute-care/tools/falls-reduction-tool-calculator.html), [Isolibrium](https://www.stryker.com/us/en/acute-care/products/isolibrium.html), [IsoTour](https://www.stryker.com/us/en/acute-care/products/isotour.html) |

### 3.3 Map (`map`)

Map apps: the Acute Care mobile lab and the ProCare coverage map.

| | |
|---|---|
| Apps on the live site | **2** on 2 pages |
| Example pages | [Mobile lab](https://www.stryker.com/us/en/acute-care/mobile-lab.html), [ProCare medical](https://www.stryker.com/us/en/services-and-solutions/procare/medical.html) |

### 3.4 Medical information request (`medical-information-request`)

The medical information request apps of Acute Care, Emergency Care and Sage. Only the Sage app uses a
Marketo form inside; the other two are their own forms, so embedding them avoids rebuilding them.

| | |
|---|---|
| Apps on the live site | **3** on 3 pages |
| Example pages | [Acute Care](https://www.stryker.com/us/en/acute-care/medical-information-request.html), [Emergency Care](https://www.stryker.com/us/en/emergency-care/medical-information-request.html), [Sage](https://www.stryker.com/us/en/sage/medical-information-request.html) |

### 3.5 Events calendar (`cvent`)

The Cvent training events calendar, a script from Cvent.

| | |
|---|---|
| Apps on the live site | **1** on 1 page |
| Example page | [Training and education calendar](https://www.stryker.com/us/en/training-and-education/calendar.html) |

---

## 4. The options (Block options panel)

None: the apps have no style choices on stryker.com. The variant only names the kind of app.

---

## 5. The text around the apps (Text style)

Titles and introductions above or below an app are default content, with the site-wide Text style. The
text inside an app belongs to the app.

---

## 6. How close is it to stryker.com?

Checked on the review page against the live pages at 1440 and 390 wide.

| App | stryker.com | Local test machine | Review page on the preview site |
|---|---|---|---|
| Trauma skeleton, bunion and Gamma4 explorers | 900px high, the app running | 900px, the app running (desktop and phones) | a link to the app |
| Pressure injury calculator | 750px (desktop), 1,416px (phones) | 750px, 1,431px | a link to the app |
| Falls reduction calculator | 488px (desktop), 853px (phones) | 488px, 853px | a link to the app |
| Mobile lab map, medical information requests | the app in the page | a link (these allow only stryker.com addresses) | a link to the app |
| Cvent calendar | the calendar in the page | a link to the calendar (section 7) | a link to the calendar |

The apps keep the content width of the page (1,380px at 1440, 15px from each edge on phones), as on
stryker.com.

---

## 7. To review (outliers and checks)

| What | Apps | Example pages | Proposal |
|---|---|---|---|
| A page pointing to the stage app server (microapp-stage) | 1 | [Gamma4](https://www.stryker.com/us/en/trauma-and-extremities/products/gamma4.html) | the live app, at migration (done in the review build) |
| The app server shows its apps only in pages on stryker.com addresses (and local test machines); it refuses the preview addresses (aem.page, aem.live) | all 29 apps; the maps and medical information requests (5) also refuse local test machines | [Mobile lab](https://www.stryker.com/us/en/acute-care/mobile-lab.html), [Sage](https://www.stryker.com/us/en/sage/medical-information-request.html) | they work once the site runs on www.stryker.com; for review on the preview site, Stryker can add the preview addresses (aem.page, aem.live) to the apps' allowed list |
| The Cvent calendar | 1 | [Calendar](https://www.stryker.com/us/en/training-and-education/calendar.html) | the calendar script uses inline handlers that the new site's security policy refuses; to decide: allow it for that page, or link to the Cvent calendar |
| The micro-app server itself | all 29 apps | | must stay in place after the move off AEM (the apps are not AEM content) |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The AEM remote-component script | the Widget block, which loads the same app loader (zoid, the version stryker.com uses) and shows the app |
| Rebuilding the apps | not needed: they are embedded as they are |
| Style settings | none existed |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| Every app keeps working, unchanged, without AEM | The apps depend on the micro-app server and on Cvent staying in place |
| One block, five names that say what the app is | No app or calendar can be shown on the preview addresses until Stryker allows them; there they are links |
| The apps size themselves as today | |

---

## 10. Decisions we need from the business

**To approve:**

1. Every micro-app embedded as it is through the Widget block (business decision, confirmed).
2. Removing the review-only gate (section *Review status*).

**Still open:**

- Ask Stryker's micro-app team to allow the preview addresses (aem.page / aem.live) for all apps,
  so they can be reviewed in the page before the move to www.stryker.com.
- The Cvent calendar: allow its script on that page, or link to the Cvent calendar.
- Confirm the micro-app server stays after the migration.

---

## Glossary

| Term | Meaning |
|---|---|
| Micro-app | a small application on Stryker's own server (microapp.stryker.com), shown inside a page |
| Widget | the block that shows a micro-app or the Cvent calendar in a page |
| Embedded as it is | the app is shown from its own server, not rebuilt |
| Framing | showing one site's page inside another; a site can allow it only for some addresses |

## Which choices fit which app

No choices: the variant follows the app.

## Review status (draft pages only)

While the standardisation is reviewed, a Widget block holding a micro-app or Cvent address shows the app
**only on draft pages** (`/drafts/…`). Other pages and every existing widget render as before; patients
pages are not touched.

The migration works the same way: only a review build used for the draft pages writes stryker.com
micro-apps and the Cvent calendar as Widget blocks (with the stage address of Gamma4 moved to the live app).
A normal re-import of a real page gives exactly the same output as before.
