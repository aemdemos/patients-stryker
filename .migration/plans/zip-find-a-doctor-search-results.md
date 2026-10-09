# Plan — Zip skin closure: Find a doctor → search results page

Source pages:
- Form: https://patients.stryker.com/us/en/zip-skin-closure/index.html ("Find a doctor near you")
- Results: https://patients.stryker.com/us/en/zip-skin-closure/index/search-results.html

## How the source works

1. **Form (index page).** The "FIND A DOCTOR" button redirects to the results page, using the
   button's `data-url` attribute. It carries the user's input plus fixed, page-specific search
   scope from the button's `data-*` attributes:
   `?location=12345&radius=5&anatomy=skin&businessunits=mrm:business-units/instruments/orthopaedic-instruments&procedures=stryker:surgeon-locator/anatomy/skin/procedures/zip-skin-closure|Zip skin closure`
2. **Results page.** The HTML is the same with or without parameters; everything is client-side.
   - Without parameters: only the search form shows, in a compact "results page" style.
   - With parameters, the page:
     1. pre-fills the form;
     2. geocodes `location` with the **Google Maps JS API**, using the key in `data-google-maps-key` on `#map`;
     3. calls `GET https://patients.stryker.com/bin/stryker/surgeonlocator` with `location, radius,
        anatomy, businessunits, procedures, lat, long, address, zipCode, state, city`;
     4. renders a map with a radius circle and a result list ("Doctors search results"): sort by
        distance or name, a Procedures filter, "Load more", and "No results found".
3. **Servlet response (JSON).** `{ surgeonProfiles: [...], filters: {...} }`.
   - Each profile has: `firstName, lastName, degree[], phoneNumber, email, distance, areaOfProcedures[], facilitiesAll[]`.
   - Each facility has: `facilityName, facilityAddress, facilityCity, facilityState, facilityZipCode,
     facilityPhoneNumber, facilityUrl, facilityLatitude, facilityLongitude`.
   - The radius is applied by the servlet (5/25/50 mi gave 2 profiles at 42.8 mi; 250 mi gave 27).
     Show what it returns, as the source does.

## Blockers (outside our code)

| # | Blocker | Evidence | Needed from Stryker |
|---|---------|----------|---------------------|
| 1 | **CORS** on `/bin/stryker/surgeonlocator` | Returns 200 JSON but **no `Access-Control-Allow-Origin`** for `*.aem.page`, `*.aem.live` or localhost, so the browser blocks reading the response from our domains | Allow our origins (preview, live, future prod domain), **or** at go-live route `/bin/stryker/*` on the production CDN to the existing AEM origin (same-origin; preview domains would still need CORS) |
| 2 | **Google Maps API key** | The existing browser key is almost certainly referrer-restricted to Stryker domains | Add our domains to the key's allowed referrers, or issue a key for EDS. Needed for geocoding (the servlet requires lat/long) and for the map |

Until both are resolved, the results block can be built and reviewed against a **fake data
fixture** that has the same JSON shape (no real doctor data committed). It then switches to the
live servlet with no code change.

## Target structure

### 1. Index page (`/us/en/zip-skin-closure/index`), existing `find-a-doctor` block
- **Change:** on a valid submit, redirect to the results page with the same query contract as the
  source, so existing links and bookmarks to the source URL keep working.
- **New optional authored rows** (key/value), mirroring the source button's `data-*` attributes:
  `Results page`, `Anatomy`, `Business units`, `Procedures`. Without `Results page` the block behaves as today.

### 2. New page `/us/en/zip-skin-closure/index/search-results`

| Section | Block | Content / behaviour |
|---|---|---|
| 1 | **Find a doctor (results)**, a new variant of the existing block | Compact search bar (results-page style). Pre-fills location and radius from the URL; submitting reloads the same page with the new parameters |
| 2 | **Doctor results** (new block, e.g. `doctor-results`) | Empty when there are no parameters. With parameters: geocode → servlet call → "Doctors search results" list, sort (distance / name), Load more, "No results found", loading and error states |
| — | Metadata | Title/description, `nav`/`footer` = zip skin closure, theme as on the index page |

**Doctor results block, authoring.** Key/value rows, all optional:
- `API`: defaults to the Stryker servlet; lets us point at the fixture.
- `Page size`
- `Google Maps key`: or a project-level setting, kept out of content if possible.

**Result card:** name + degree, facility name, address, phone (a `tel:` link), distance (mi),
procedures. DOM APIs only (no `innerHTML`); accessible list markup; the result count is
announced in a live region.

### Phasing
- **Phase 1:** redirect, the results page, the search-bar variant, the results list (sort, Load more,
  empty and error states), running on the fixture.
- **Phase 2:** live servlet and geocoding (once blockers 1 and 2 are resolved), then the Google map
  with markers and the radius toggle, and the Procedures filter.
- **Out of scope unless requested:** the source's "Update your profile" doctor form (file upload + captcha).

## Checklist
- [ ] (Decision) Data access: CORS request to Stryker / CDN routing at go-live / fixture first
- [ ] (Decision) Scope of first version: list only, or list + map + filters
- [ ] Extend `find-a-doctor`: optional config rows + redirect with the source's query contract
- [ ] Add `find-a-doctor (results)` variant: compact layout, pre-fill from URL, re-search in place
- [ ] Create `blocks/doctor-results/` (JS + CSS): parse params → geocode → fetch → render list, sort, Load more, empty/error/loading states
- [ ] Fake JSON fixture with the servlet's response shape (no real profiles)
- [ ] Create `/us/en/zip-skin-closure/index/search-results` in DA and add the config rows to the index page block
- [ ] Verify: index → redirect → results; results page without parameters shows only the search bar; keyboard and screen reader; mobile / 841px / 1024px
- [ ] `npm run lint`
- [ ] Phase 2: switch to the live servlet + Maps key, add the map and Procedures filter
