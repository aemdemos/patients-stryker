/**
 * find-a-doctor — "Find a doctor near you" locator banner (front-end only): a
 * full-width band with the Zip product image on the left and a light-gray form
 * panel on the right (floating-label location field, radius selector, teal
 * submit button).
 *
 * This is a presentational block. The live Stryker site runs its search on a
 * proprietary backend (surgeon database + Google Maps) whose API has no CORS
 * headers, so a browser on the EDS domain cannot call it. This block therefore
 * renders the banner and form UI only — it performs client-side validation of
 * the location field but does not execute a search or render results.
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
  let picture = block.querySelector('picture');
  const headingEl = block.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = (headingEl?.textContent || 'Find a doctor near you').trim();

  // Fallback: if the banner image is still an authored link (dm-support.js hasn't
  // converted it to a <picture> yet, or it wasn't matched in this render context),
  // build the <img> ourselves from the link href so the banner never renders
  // without its image.
  if (!picture) {
    const link = block.querySelector('a[href]');
    const href = link?.getAttribute('href');
    if (href) {
      picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = href;
      img.loading = 'lazy';
      picture.append(img);
    }
  }

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

  // Radius selector — a custom accessible listbox (the source uses a custom
  // dropdown, not a native <select>, so the open menu can be styled: square
  // corners, white panel, light-gray hover, drop shadow. A native <select>'s
  // option list is OS-drawn and cannot be styled to match).
  const radiusGroup = document.createElement('div');
  radiusGroup.className = 'find-a-doctor-field find-a-doctor-radius';

  const radiusOptions = [['15', '15 miles'], ['25', '25 miles'], ['50', '50 miles']];
  const [[defaultRadiusValue, defaultRadiusText]] = radiusOptions;
  let radiusValue = defaultRadiusValue;

  // hidden field so the selected radius participates in the form.
  const radiusInput = document.createElement('input');
  radiusInput.type = 'hidden';
  radiusInput.name = 'radius';
  radiusInput.value = radiusValue;

  // the button shows the current value and toggles the menu (role=combobox).
  const radiusButton = document.createElement('button');
  radiusButton.type = 'button';
  radiusButton.id = 'find-a-doctor-radius';
  radiusButton.className = 'find-a-doctor-radius-toggle';
  radiusButton.setAttribute('aria-haspopup', 'listbox');
  radiusButton.setAttribute('aria-expanded', 'false');
  radiusButton.setAttribute('aria-label', 'Radius');
  const radiusValueText = document.createElement('span');
  radiusValueText.className = 'find-a-doctor-radius-value';
  radiusValueText.textContent = defaultRadiusText;
  radiusButton.append(radiusValueText);

  // the styleable options menu (role=listbox).
  const radiusMenu = document.createElement('ul');
  radiusMenu.className = 'find-a-doctor-radius-menu';
  radiusMenu.setAttribute('role', 'listbox');
  radiusMenu.setAttribute('aria-label', 'Radius');
  radiusMenu.hidden = true;

  const radiusItems = radiusOptions.map(([value, text], i) => {
    const li = document.createElement('li');
    li.className = 'find-a-doctor-radius-option';
    li.setAttribute('role', 'option');
    li.id = `find-a-doctor-radius-option-${i}`;
    li.dataset.value = value;
    li.textContent = text;
    li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    radiusMenu.append(li);
    return li;
  });

  const radiusLabel = document.createElement('label');
  radiusLabel.className = 'find-a-doctor-label find-a-doctor-label-filled';
  radiusLabel.setAttribute('for', 'find-a-doctor-radius');
  radiusLabel.textContent = 'Radius';

  const closeRadius = () => {
    radiusMenu.hidden = true;
    radiusButton.setAttribute('aria-expanded', 'false');
    radiusButton.removeAttribute('aria-activedescendant');
  };

  const openRadius = () => {
    radiusMenu.hidden = false;
    radiusButton.setAttribute('aria-expanded', 'true');
    const active = radiusItems.find((li) => li.dataset.value === radiusValue) || radiusItems[0];
    radiusButton.setAttribute('aria-activedescendant', active.id);
  };

  const selectRadius = (li) => {
    radiusValue = li.dataset.value;
    radiusInput.value = radiusValue;
    radiusValueText.textContent = li.textContent;
    radiusItems.forEach((item) => item.setAttribute('aria-selected', item === li ? 'true' : 'false'));
  };

  radiusButton.addEventListener('click', () => {
    if (radiusMenu.hidden) openRadius(); else closeRadius();
  });

  radiusItems.forEach((li) => {
    li.addEventListener('click', () => {
      selectRadius(li);
      closeRadius();
      radiusButton.focus();
    });
  });

  // keyboard support: arrows move/select, Enter/Space open, Escape closes.
  radiusButton.addEventListener('keydown', (e) => {
    const currentIndex = radiusItems.findIndex((li) => li.dataset.value === radiusValue);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (radiusMenu.hidden) openRadius();
      const next = e.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, radiusItems.length - 1)
        : Math.max(currentIndex - 1, 0);
      selectRadius(radiusItems[next]);
      radiusButton.setAttribute('aria-activedescendant', radiusItems[next].id);
    } else if ((e.key === 'Enter' || e.key === ' ') && radiusMenu.hidden) {
      e.preventDefault();
      openRadius();
    } else if (e.key === 'Escape') {
      closeRadius();
    }
  });

  // close when focus/click leaves the control.
  document.addEventListener('click', (e) => {
    if (!radiusGroup.contains(e.target)) closeRadius();
  });

  radiusGroup.append(radiusInput, radiusButton, radiusMenu, radiusLabel);

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

  // On submit: validate the location field (front-end only — no search backend).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const location = locationInput.value.trim();
    if (!location) {
      error.hidden = false;
      locationInput.setAttribute('aria-invalid', 'true');
      locationInput.focus();
    }
  });

  // Clear the error as soon as the author starts typing a location.
  locationInput.addEventListener('input', () => {
    if (!error.hidden && locationInput.value.trim()) {
      error.hidden = true;
      locationInput.removeAttribute('aria-invalid');
    }
  });

  block.replaceChildren(media, panel);
}
