/**
 * find-a-doctor — "Find a doctor near you" locator: a full-width banner (Zip
 * product image + light-gray form panel) plus an inline results list.
 *
 * The live Stryker site runs its search on a proprietary backend (surgeon
 * database + Google Maps) whose API has no CORS headers, so a browser on the EDS
 * domain cannot call it. Instead this block reads doctor records from a JSON
 * dataset published alongside the block (Option A — self-contained in EDS):
 *
 *   - blocks/find-a-doctor/doctors.json       — the doctor records (EDS sheet shape)
 *   - blocks/find-a-doctor/zip-centroids.json — zip -> lat/long lookup for distance
 *
 * Like the source site, submitting the banner form opens the results in a NEW
 * TAB: the new tab loads this same page with ?location=…&radius=… in the URL, and
 * the block detects those params on load, auto-runs the search, and renders the
 * matching doctor cards. The search resolves the entered location to a lat/long,
 * then filters doctors within the selected radius (Haversine great-circle
 * distance) — no external calls, no CORS.
 *
 * NOTE: the shipped JSON is SAMPLE/placeholder data (the live Stryker locator API
 * currently returns zero surgeons for this product). Replace doctors.json with a
 * real dataset — e.g. point DATA_URL at a Document Authoring spreadsheet, which
 * publishes as JSON in the same shape — and swap in a full US zip centroid table.
 *
 * Authoring contract (initial DOM before decoration):
 *   <div class="find-a-doctor">
 *     <div><div>[image link / picture]</div></div>       // banner image (optional)
 *     <div><div><h2>Find a doctor near you</h2></div></div> // heading (optional)
 *   </div>
 *
 * Dynamic Media image links are already converted to <picture> by dm-support.js
 * (decorateDMAssets runs before decorateBlocks).
 *
 * @param {Element} block The block element
 */

// Data sources (same-origin JSON — no CORS). Swap DATA_URL for a DA sheet URL.
const DATA_URL = '/blocks/find-a-doctor/doctors.json';
const ZIP_URL = '/blocks/find-a-doctor/zip-centroids.json';

// Anchor id for the results region, so the new results tab can scroll to it.
const RESULTS_ANCHOR = 'find-a-doctor-results';

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in miles between two lat/long points. */
function distanceMiles(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetch JSON, returning null on any failure (network, parse, non-200). */
async function fetchJson(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Resolve a user-entered location to a { lat, long } origin.
 * Supports a 5-digit zip (centroid lookup) or a "city, ST" / "city"/"ST" match
 * against the centroid table. Returns null if it can't be resolved locally.
 */
function resolveOrigin(input, zipData) {
  const value = input.trim().toLowerCase();
  const zipMatch = value.match(/\b(\d{5})\b/);
  if (zipMatch && zipData[zipMatch[1]]) {
    const z = zipData[zipMatch[1]];
    return { lat: Number(z.lat), long: Number(z.long) };
  }
  // City or state text match against known centroids.
  const entries = Object.values(zipData).filter((z) => z && z.city);
  const hit = entries.find((z) => {
    const city = String(z.city).toLowerCase();
    const state = String(z.state || '').toLowerCase();
    return value === city || value === state
      || value === `${city}, ${state}` || value.startsWith(`${city},`);
  });
  return hit ? { lat: Number(hit.lat), long: Number(hit.long) } : null;
}

/** Normalize a doctor record (from sheet JSON) into the fields the card needs. */
function normalizeDoctor(row) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
  return {
    name: row.degree ? `${name}, ${row.degree}` : name,
    specialties: row.specialties || '',
    facilityName: row.facilityName || '',
    address: [row.address, [row.city, row.state].filter(Boolean).join(', '), row.zip]
      .filter(Boolean).join(', '),
    phone: row.phone || '',
    profileUrl: row.profileUrl && row.profileUrl !== '#' ? row.profileUrl : '',
    image: row.image || '',
    lat: Number(row.lat),
    long: Number(row.long),
  };
}

/** Build one doctor result card as a DOM node. */
function buildCard(doctor) {
  const card = document.createElement('li');
  card.className = 'find-a-doctor-card';

  const body = document.createElement('div');
  body.className = 'find-a-doctor-card-body';

  const name = document.createElement('h3');
  name.className = 'find-a-doctor-card-name';
  name.textContent = doctor.name;
  body.append(name);

  if (doctor.specialties) {
    const spec = document.createElement('p');
    spec.className = 'find-a-doctor-card-spec';
    spec.textContent = doctor.specialties;
    body.append(spec);
  }

  if (doctor.facilityName || doctor.address) {
    const facility = document.createElement('p');
    facility.className = 'find-a-doctor-card-facility';
    if (doctor.facilityName) {
      const fname = document.createElement('strong');
      fname.textContent = doctor.facilityName;
      facility.append(fname);
    }
    if (doctor.address) {
      if (doctor.facilityName) facility.append(document.createElement('br'));
      facility.append(document.createTextNode(doctor.address));
    }
    body.append(facility);
  }

  const dist = document.createElement('p');
  dist.className = 'find-a-doctor-card-distance';
  dist.textContent = `${doctor.distance.toFixed(1)} miles away`;
  body.append(dist);

  const actions = document.createElement('div');
  actions.className = 'find-a-doctor-card-actions';
  if (doctor.phone) {
    const call = document.createElement('a');
    call.className = 'find-a-doctor-card-call';
    call.href = `tel:${doctor.phone.replace(/[^\d+]/g, '')}`;
    call.textContent = 'Call now';
    actions.append(call);
  }
  if (doctor.profileUrl) {
    const profile = document.createElement('a');
    profile.className = 'find-a-doctor-card-profile';
    profile.href = doctor.profileUrl;
    profile.textContent = 'View profile';
    actions.append(profile);
  }
  if (actions.children.length) body.append(actions);

  card.append(body);
  return card;
}

export default function decorate(block) {
  // Pull the authored picture (banner image) and heading text.
  const picture = block.querySelector('picture');
  const headingEl = block.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = (headingEl?.textContent || 'Find a doctor near you').trim();

  // --- Banner image ---
  const media = document.createElement('div');
  media.className = 'find-a-doctor-media';
  if (picture) {
    media.append(picture);
    const img = picture.querySelector('img');
    if (img && !img.getAttribute('alt')) img.setAttribute('alt', 'Zip skin closure applied');
  }

  // --- Form panel ---
  const panel = document.createElement('div');
  panel.className = 'find-a-doctor-panel';

  const heading = document.createElement('h2');
  heading.className = 'find-a-doctor-title';
  heading.textContent = headingText;

  const form = document.createElement('form');
  form.className = 'find-a-doctor-form';
  form.setAttribute('novalidate', '');

  // Location field with a floating label (source: "* Zip code, city or state").
  const locationGroup = document.createElement('div');
  locationGroup.className = 'find-a-doctor-field find-a-doctor-location';

  const locationInput = document.createElement('input');
  locationInput.type = 'text';
  locationInput.id = 'find-a-doctor-location';
  locationInput.name = 'location';
  locationInput.autocomplete = 'off';
  locationInput.placeholder = ' ';
  locationInput.setAttribute('aria-label', 'Zip code, city or state');

  const locationLabel = document.createElement('label');
  locationLabel.className = 'find-a-doctor-label';
  locationLabel.setAttribute('for', 'find-a-doctor-location');
  const req = document.createElement('span');
  req.setAttribute('aria-hidden', 'true');
  req.textContent = '* ';
  locationLabel.append(req, document.createTextNode('Zip code, city or state'));

  locationGroup.append(locationInput, locationLabel);

  // Radius selector — native <select> for accessibility (source uses a custom dropdown).
  const radiusGroup = document.createElement('div');
  radiusGroup.className = 'find-a-doctor-field find-a-doctor-radius';

  const radiusSelect = document.createElement('select');
  radiusSelect.id = 'find-a-doctor-radius';
  radiusSelect.name = 'radius';
  radiusSelect.setAttribute('aria-label', 'Radius');
  [['15', '15 miles'], ['25', '25 miles'], ['50', '50 miles']].forEach(([value, text]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    radiusSelect.append(opt);
  });

  const radiusLabel = document.createElement('label');
  radiusLabel.className = 'find-a-doctor-label find-a-doctor-label-filled';
  radiusLabel.setAttribute('for', 'find-a-doctor-radius');
  radiusLabel.textContent = 'Radius';

  radiusGroup.append(radiusSelect, radiusLabel);

  // Submit button.
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'find-a-doctor-submit';
  button.textContent = 'Find a doctor';

  const fields = document.createElement('div');
  fields.className = 'find-a-doctor-fields';
  fields.append(locationGroup, radiusGroup, button);

  // Inline validation message (shown when submitting with an empty location).
  const error = document.createElement('p');
  error.className = 'find-a-doctor-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  error.textContent = 'Please enter a zip code, city or state.';

  form.append(fields, error);
  panel.append(heading, form);

  // --- Results region (populated on submit) ---
  const results = document.createElement('div');
  results.className = 'find-a-doctor-results';
  results.id = RESULTS_ANCHOR;
  results.setAttribute('aria-live', 'polite');
  results.hidden = true;

  const renderStatus = (message) => {
    results.hidden = false;
    results.replaceChildren();
    const p = document.createElement('p');
    p.className = 'find-a-doctor-status';
    p.textContent = message;
    results.append(p);
  };

  const renderResults = (matches, radius) => {
    results.hidden = false;
    results.replaceChildren();

    const title = document.createElement('h3');
    title.className = 'find-a-doctor-results-title';
    title.textContent = matches.length
      ? `${matches.length} doctor${matches.length === 1 ? '' : 's'} within ${radius} miles`
      : `No doctors found within ${radius} miles`;
    results.append(title);

    if (!matches.length) {
      const hint = document.createElement('p');
      hint.className = 'find-a-doctor-status';
      hint.textContent = 'Try a larger radius or a different location.';
      results.append(hint);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'find-a-doctor-card-list';
    matches.forEach((doctor) => list.append(buildCard(doctor)));
    results.append(list);
  };

  // Resolve location -> filter dataset by radius -> render cards inline.
  // Returns true if results were rendered, false if it fell back to Stryker.
  let searching = false;
  const runSearch = async (location, radiusValue) => {
    if (searching) return false;
    searching = true;
    button.disabled = true;
    renderStatus('Searching…');

    const [doctorData, zipData] = await Promise.all([
      fetchJson(DATA_URL),
      fetchJson(ZIP_URL),
    ]);

    searching = false;
    button.disabled = false;

    const rows = doctorData?.data;
    const zips = zipData?.data;
    if (!Array.isArray(rows) || !zips) {
      // Dataset couldn't be loaded — show an inline message (stay on this page).
      renderStatus('Sorry, the doctor directory is temporarily unavailable. Please try again later.');
      return false;
    }

    const origin = resolveOrigin(location, zips);
    if (!origin) {
      // Location not in our data — show an inline message (no redirect).
      renderStatus(`We couldn't find "${location}". Try a nearby zip code, city or state.`);
      return false;
    }

    const radius = Number(radiusValue);
    const matches = rows
      .map((row) => normalizeDoctor(row))
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.long))
      .map((d) => ({ ...d, distance: distanceMiles(origin.lat, origin.long, d.lat, d.long) }))
      .filter((d) => d.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    renderResults(matches, radius);
    return true;
  };

  // On submit from the banner: open the results in a NEW TAB (mirrors the source
  // site, which opens a dedicated results page). The new tab loads this same page
  // with the location/radius in the query string; the block detects those params
  // on load (below) and auto-runs the search there.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const location = locationInput.value.trim();
    if (!location) {
      error.hidden = false;
      locationInput.setAttribute('aria-invalid', 'true');
      locationInput.focus();
      return;
    }
    error.hidden = true;
    locationInput.removeAttribute('aria-invalid');

    const params = new URLSearchParams({ location, radius: radiusSelect.value });
    const url = `${window.location.pathname}?${params.toString()}#${RESULTS_ANCHOR}`;
    window.open(url, '_blank', 'noopener');
  });

  // Clear the error as soon as the author starts typing a location.
  locationInput.addEventListener('input', () => {
    if (!error.hidden && locationInput.value.trim()) {
      error.hidden = true;
      locationInput.removeAttribute('aria-invalid');
    }
  });

  block.replaceChildren(media, panel, results);

  // Results mode: if the page was opened with ?location=…&radius=…, prefill the
  // form and run the search inline in this (new) tab, then scroll to the results.
  const urlParams = new URLSearchParams(window.location.search);
  const presetLocation = urlParams.get('location');
  if (presetLocation) {
    locationInput.value = presetLocation;
    const presetRadius = urlParams.get('radius');
    if (presetRadius
      && [...radiusSelect.options].some((o) => o.value === presetRadius)) {
      radiusSelect.value = presetRadius;
    }
    runSearch(presetLocation.trim(), radiusSelect.value).then((rendered) => {
      if (rendered) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
