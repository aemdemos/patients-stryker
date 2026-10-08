import { readBlockConfig } from '../../scripts/aem.js';

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
 * `anatomy` variant — the search bar of the search-results page: no banner image,
 * and an extra required "Area of Body" dropdown after the radius. The heading is
 * shown only when authored (the source search bar has none). Optional key/value
 * rows set the dropdown:
 *   <div><div>Area of body</div><div>Skin</div></div>                 // preselected
 *   <div><div>Area of body options</div><div>Hip and knee, Skin, …</div></div>
 *
 * @param {Element} block The block element
 */

// the source's area-of-body list, used when the block doesn't author its own
const DEFAULT_ANATOMY_OPTIONS = ['Hip and knee', 'Shoulder and neck', 'Skin', 'Spine (Back)'];

/**
 * Builds the anatomy variant's "Area of Body" dropdown — the same custom listbox
 * as the radius selector (and the same classes, so it shares its styling).
 * Option values follow the source: lowercase, commas dropped, spaces → hyphens.
 * @param {Element} block the block element (reads the optional config rows)
 * @param {Function} [onSelect] called after the user picks an option
 * @returns {{group: Element, button: Element, getValue: Function}}
 */
function buildAnatomySelect(block, onSelect = () => {}) {
  const config = readBlockConfig(block);
  const asText = (v) => (Array.isArray(v) ? v.join(', ') : (v || '')).trim();
  const toValue = (label) => label.toLowerCase().replace(/,/g, '').replace(/ /g, '-');
  const authored = asText(config['area-of-body-options']).split(',').map((s) => s.trim()).filter(Boolean);
  const options = (authored.length ? authored : DEFAULT_ANATOMY_OPTIONS)
    .map((text) => [toValue(text), text]);
  const preselected = toValue(asText(config['area-of-body']));
  let value = options.some(([v]) => v === preselected) ? preselected : '';

  const group = document.createElement('div');
  group.className = 'find-a-doctor-field find-a-doctor-anatomy';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'anatomy';

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'find-a-doctor-anatomy';
  button.className = 'find-a-doctor-radius-toggle';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Area of Body');
  const valueText = document.createElement('span');
  valueText.className = 'find-a-doctor-radius-value';
  button.append(valueText);

  const menu = document.createElement('ul');
  menu.className = 'find-a-doctor-radius-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Area of Body');
  menu.hidden = true;

  const items = options.map(([optionValue, text], i) => {
    const li = document.createElement('li');
    li.className = 'find-a-doctor-radius-option';
    li.setAttribute('role', 'option');
    li.id = `find-a-doctor-anatomy-option-${i}`;
    li.dataset.value = optionValue;
    li.textContent = text;
    menu.append(li);
    return li;
  });

  const label = document.createElement('label');
  label.className = 'find-a-doctor-label';
  label.setAttribute('for', 'find-a-doctor-anatomy');
  const req = document.createElement('span');
  req.setAttribute('aria-hidden', 'true');
  req.textContent = '* ';
  label.append(req, document.createTextNode('Area of Body'));

  // reflect the value: shown text, hidden input, selected option, raised label
  const select = (next) => {
    value = next;
    input.value = value;
    const item = items.find((li) => li.dataset.value === value);
    valueText.textContent = item ? item.textContent : '';
    items.forEach((li) => li.setAttribute('aria-selected', li === item ? 'true' : 'false'));
    label.classList.toggle('find-a-doctor-label-filled', !!item);
  };

  const close = () => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.removeAttribute('aria-activedescendant');
  };

  const open = () => {
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const active = items.find((li) => li.dataset.value === value) || items[0];
    button.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  };

  button.addEventListener('click', () => {
    if (menu.hidden) open(); else close();
  });

  items.forEach((li) => {
    li.addEventListener('click', () => {
      select(li.dataset.value);
      button.removeAttribute('aria-invalid');
      onSelect();
      close();
      button.focus();
    });
  });

  // keyboard support: arrows move/select, Enter/Space open, Escape closes.
  button.addEventListener('keydown', (e) => {
    const index = items.findIndex((li) => li.dataset.value === value);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (menu.hidden) open();
      const next = e.key === 'ArrowDown'
        ? Math.min(index + 1, items.length - 1)
        : Math.max(index - 1, 0);
      select(items[next].dataset.value);
      button.removeAttribute('aria-invalid');
      onSelect();
      button.setAttribute('aria-activedescendant', items[next].id);
      items[next].scrollIntoView({ block: 'nearest' });
    } else if ((e.key === 'Enter' || e.key === ' ') && menu.hidden) {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape') {
      close();
    }
  });

  // close when focus/click leaves the control.
  document.addEventListener('click', (e) => {
    if (!group.contains(e.target)) close();
  });

  select(value);
  group.append(input, button, menu, label);
  return { group, button, getValue: () => value };
}

export default function decorate(block) {
  const isAnatomy = block.classList.contains('anatomy');

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

  // same options as the source; the first one (5 miles) is the default
  const radiusOptions = [
    ['5', '5 miles'], ['10', '10 miles'], ['15', '15 miles'], ['25', '25 miles'],
    ['50', '50 miles'], ['75', '75 miles'], ['100', '100 miles'], ['250', '250 miles'],
  ];
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
    // the menu has a max-height and scrolls; keep the current option in view
    active.scrollIntoView({ block: 'nearest' });
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
      radiusItems[next].scrollIntoView({ block: 'nearest' });
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
  // anatomy variant: the extra "Area of Body" dropdown sits after the radius
  // picking an area hides the "select an area of body" message
  const hideAnatomyError = () => {
    const errorEl = form.querySelector('.find-a-doctor-error');
    if (errorEl && !locationInput.hasAttribute('aria-invalid')) errorEl.hidden = true;
  };
  const anatomy = isAnatomy ? buildAnatomySelect(block, hideAnatomyError) : null;
  if (anatomy) fields.append(locationGroup, radiusGroup, anatomy.group, button);
  else fields.append(locationGroup, radiusGroup, button);

  // Inline validation message (shown when submitting with an empty location).
  const error = document.createElement('p');
  error.className = 'find-a-doctor-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  error.textContent = 'Please enter a zip code, city or state.';

  form.append(fields, error);
  // anatomy variant: the heading only when authored (the source search bar has none)
  if (isAnatomy && !headingEl) panel.append(form);
  else panel.append(heading, form);

  // On submit: validate the location field (front-end only — no search backend).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const location = locationInput.value.trim();
    if (!location) {
      error.textContent = 'Please enter a zip code, city or state.';
      error.hidden = false;
      locationInput.setAttribute('aria-invalid', 'true');
      locationInput.focus();
    } else if (anatomy && !anatomy.getValue()) {
      // anatomy variant: the area of body is required too
      error.textContent = 'Please select an area of body.';
      error.hidden = false;
      anatomy.button.setAttribute('aria-invalid', 'true');
      anatomy.button.focus();
    } else {
      error.hidden = true;
      anatomy?.button.removeAttribute('aria-invalid');
    }
  });

  // Clear the error as soon as the author starts typing a location.
  locationInput.addEventListener('input', () => {
    if (!error.hidden && locationInput.value.trim()) {
      error.hidden = true;
      locationInput.removeAttribute('aria-invalid');
    }
  });

  // anatomy variant: no banner image
  if (isAnatomy) block.replaceChildren(panel);
  else block.replaceChildren(media, panel);
}
