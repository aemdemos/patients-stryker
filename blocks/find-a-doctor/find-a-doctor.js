/**
 * find-a-doctor — presentational recreation of the source "Find a doctor near you"
 * locator banner: a full-width band with the Zip product image on the left and a
 * light-gray form panel on the right (location field, radius selector, submit
 * button). The live site's search is powered by a proprietary backend (doctor
 * database + Google Maps) that cannot be migrated to EDS, so this block reproduces
 * only the banner UI — the form does not perform a search.
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
  // Presentational only — there is no locator backend to submit to.
  form.setAttribute('novalidate', '');
  form.addEventListener('submit', (e) => e.preventDefault());

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

  form.append(fields);
  panel.append(heading, form);

  block.replaceChildren(media, panel);
}
