# Form: Marketo forms as they are, three forms to decide

*A walkthrough of the forms for business, content and design teams. No technical knowledge needed. It
follows the same approach as the Columns walkthrough ([columns](columns.md)): measure what stryker.com
actually uses, keep it, and name the choices.*

*Measured on the live site (a desktop and a phone pass of all 2,350 pages) and in the AEM content export.
Only the 832 forms shown on the live site are counted: Marketo 779, division contact 45, Adobe Sign 6,
corporate contact 2.*

---

## 1. The story in one minute

| | |
|---|---|
| **The situation** | stryker.com shows four kinds of form: Marketo forms (contact and lead forms, the large majority), an AEM division contact form, a corporate contact form with topics, and Adobe Sign web forms. |
| **The risk** | The differences between forms are configuration (which Marketo instance and form, what happens after sending), not looks; and two of the forms send their messages through an AEM service that goes away with AEM. |
| **What we did** | Marketo forms keep the existing **Marketo Form** block, as it is: its rows hold the Marketo instance, the form id and the captcha, and the form's fields come from Marketo. Forms beside other content sit in a side-by-side section. The division contact, corporate contact and Adobe Sign forms wait for Stryker's decision and are not built. |
| **The result** | On the review page the Marketo forms match stryker.com: the same fields, labels (14px bold Humanist), grey input boxes 40px high, and the teal Submit button, on desktop and phone. |

---

## 2. The problem, in numbers

The forms have no style settings on stryker.com. What differs is configuration:

| Setting | Values today | Instances | On the new site |
|---|---|---|---|
| Form type | 4 | 832 | Marketo Form block (779); 3 types waiting for a decision (53) |
| Marketo instance | 3: main (424-GXO-933) 638, lp.stryker.com (338-WAP-571) 143, global 2 | 779 (98 different form ids) | the Base URL and Munchkin ID rows of the block |
| After sending (Marketo) | show a message 762, go to a page 21 | 779 | set in Marketo (see section 7) |
| Division contact settings | disclaimer checkbox 2, hidden fields 1, required name/email 3 | 45 | waiting for a decision |
| Adobe Sign frame height | 500px 3, 700px 2, 900px 1 | 6 | waiting for a decision |

**Where each choice lives:**

| Setting | Where authors set it |
|---|---|
| Which Marketo form | the Marketo Form block: Base URL, Munchkin ID, Form ID (and the captcha rows) |
| The fields, labels and thank-you message | in Marketo, for the form id |
| A form beside a text or a fragment | a side-by-side section (`flex`, `flex-67-33`, see the section layout chapter) |
| Text around the form | default content and Text style |

---

## 3. The variants on stryker.com

### 3.1 Marketo (`marketo-form`)

A Marketo Forms 2.0 form: its fields come from Marketo by form id; after sending it shows a message or
goes to a page.

| | |
|---|---|
| Forms on the live site | **779** on 720 pages |
| Example pages | [Arise 1000 EX](https://www.stryker.com/us/en/acute-care/products/arise-1000-ex.html), [Asnis JFX](https://www.stryker.com/us/en/foot-and-ankle/products/asnis-jfx.html), [Caregiver stories](https://www.stryker.com/us/en/acute-care/c/caregiver-stories.html), [Acute Care contact](https://www.stryker.com/us/en/acute-care/contact.html) |

### 3.2 Division contact (waiting for Stryker)

An AEM form: title, description, name, organisation, email, phone, country, state, message, an optional
disclaimer checkbox, captcha and a thank-you box; it emails the division (10 different recipients).

| | |
|---|---|
| Forms on the live site | **45** on 45 pages |
| Example pages | [Asnis III](https://www.stryker.com/us/en/trauma-and-extremities/products/asnis-iii.html), [EMS contact](https://www.stryker.com/us/en/ems/contact.html), [Joint replacement contact](https://www.stryker.com/us/en/joint-replacement/contact.html) |

### 3.3 Corporate contact (waiting for Stryker)

The same kind of AEM form with topic buttons that switch the description and the recipient.

| | |
|---|---|
| Forms on the live site | **2** on 2 pages |
| Example pages | [Recall](https://www.stryker.com/us/en/about/contact/recall.html), [Media inquiries](https://www.stryker.com/us/en/about/contact/media-inquiries.html) |

### 3.4 Adobe Sign web form (waiting for Stryker)

An Adobe Sign form shown in a frame of fixed height.

| | |
|---|---|
| Forms on the live site | **6** on 6 pages |
| Example pages | [Product security](https://www.stryker.com/us/en/about/governance/product-security.html), [LIFEPAK device registration](https://www.stryker.com/us/en/emergency-care/device-registration/lifepak-form.html), [Sage clinical research support](https://www.stryker.com/us/en/sage/clinical-research-support.html) |

---

## 4. The options (Block options panel)

None: the forms have no style choices. The Marketo Form block's rows are its configuration.

---

## 5. The text around the forms (Text style)

Titles and introductions beside or above a form are default content, with the site-wide Text style (on
the review page: the Asnis JFX contact text, with its sizes and gold words as Text style markers). The
form's own labels and fields come from Marketo and keep the site's form look.

---

## 6. How close is it to stryker.com?

Checked on the review page against the live pages at 1440 and 390 wide.

| What | stryker.com | Review page |
|---|---|---|
| Labels | 14px bold Humanist, black | the same |
| Input boxes | grey #edeeec, 40px high, 420px wide on desktop, full width on phones; 18px text on phones | the same |
| Submit button | teal #4c7d7a, white Futura 14px, 74 × 40 | the same (phones 74 × 40 against 70 × 42; Futura regular against light) |
| Form beside a fragment (Arise) | 910px wide from 30px | 900px from 35px |
| Form beside a text (Asnis JFX) | 675px from 735px | the same |
| Form height | Arise 698px, Asnis JFX 1,040px | 678px, 1,006px (within 35px; the fields come from Marketo on both) |

---

## 7. To review

| What | Forms | Proposal |
|---|---|---|
| "After sending: go to a page" | 21 Marketo forms | set the follow-up page in Marketo for those form ids (the block shows what Marketo returns) |
| The global Marketo instance | 2 forms | keep, through the Base URL and Munchkin ID rows |
| Division and corporate contact forms | 47 | waiting for Stryker: a Marketo form, a new form with a submit service, or a link (business confirmations) |
| Adobe Sign web forms | 6 | proposal: embed them as they are through the Widget block; waiting for Stryker |

---

## 8. What we did not carry over, and why

| Not carried over | Where it goes instead |
|---|---|
| The AEM form service that emails the division and corporate contact forms | waiting for Stryker's decision (not built) |
| A thank-you message typed in AEM | Marketo's own message or follow-up page for the form |
| Style settings | none existed |

---

## 9. Pros and cons

| Pros | Cons |
|---|---|
| 779 forms keep working with the block that already exists | 47 contact forms and 6 Adobe Sign forms wait for a decision |
| The form's fields stay managed in Marketo | 21 forms need their follow-up page set in Marketo |
| One form look across the site | |

---

## 10. Decisions we need from the business

**Still open (from Stryker, see the business confirmations):**

1. Division contact (45) and corporate contact (2) forms: a Marketo form, a new form with a submit
   service, or a link to a contact page? Should corporate contact be one form with a topics choice?
2. Adobe Sign web forms (6): embed them as they are through the Widget block (proposal)?
3. The 21 Marketo forms that go to a page after sending: set that follow-up page in Marketo.

---

## Glossary

| Term | Meaning |
|---|---|
| Marketo form | a form managed in Marketo (Adobe's marketing platform); the page only says which one |
| Form id | the number of a form in Marketo |
| Marketo instance | one of Stryker's Marketo accounts (Base URL and Munchkin ID) |
| Captcha | the check that the sender is a person |
| Adobe Sign | Adobe's e-signature service; its web forms are filled in and signed online |

## Which choices fit which form

No choices: the Marketo Form block is configured by its rows.

## Review status (draft pages only)

Nothing changes for forms: the review page uses the Marketo Form block exactly as every imported
stryker.com page does today. No code or migration change was made for forms.
