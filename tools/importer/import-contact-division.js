/* global WebImporter */

// TRANSFORMER IMPORTS
import contactDivisionSectionsTransformer from './transformers/contact-division-sections.js';
import cleanupTransformer from './transformers/patients-stryker-cleanup.js';
import dmImagesTransformer from './transformers/patients-stryker-dm-images.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'contact-division',
  description: 'www.stryker.com division "Contact us" pages (#509): H1; contact details as an underlined H2 + Columns (columns-50-50) block (addresses, H4 labels, tel:/mailto:/plain links | Google Maps link); Customizable Area in source order: section titles (underlined H2, title id as section id), rich text, Marketo Form blocks (a form beside text in a 1/3 + 2/3 row as a `flex, flex-33-67` / `flex, flex-67-33` section), AEM division contact forms as heading + description only, a shared Experience Fragment as a Fragment block; document numbers as a `disclaimer` section; `published` with `last-updated: show`.',
  urls: [
    'https://www.stryker.com/us/en/emergency-care/contact.html',
    'https://www.stryker.com/us/en/acute-care/contact.html',
    'https://www.stryker.com/us/en/endoscopy/contact.html',
    'https://www.stryker.com/us/en/joint-replacement/contact.html',
    'https://www.stryker.com/us/en/sage/sage.html',
    'https://www.stryker.com/us/en/surgical-technologies/surgical-technologies.html',
    'https://www.stryker.com/us/en/communications/contact.html',
    'https://www.stryker.com/us/en/interventional-spine/contact.html',
    'https://www.stryker.com/us/en/neurovascular/contact.html',
    'https://www.stryker.com/us/en/craniomaxillofacial/contact.html',
    'https://www.stryker.com/us/en/sustainability/contact.html',
    'https://www.stryker.com/us/en/sports-medicine/contact.html',
    'https://www.stryker.com/us/en/ent/ent.html',
    'https://www.stryker.com/us/en/orthopaedic-instruments/orthopaedic-instruments.html',
    'https://www.stryker.com/us/en/spine/contact.html',
    'https://www.stryker.com/us/en/foot-and-ankle/contact.html',
    'https://www.stryker.com/us/en/trauma-and-extremities/contact.html',
    'https://www.stryker.com/us/en/nse/contact.html',
    'https://www.stryker.com/us/en/ems/contact.html',
    'https://www.stryker.com/us/en/smart-care/contact.html',
    'https://www.stryker.com/us/en/services-and-solutions/flex-financial/flex-financial.html',
  ],
};

// TRANSFORMER REGISTRY — the sections transformer rebuilds the body and builds its blocks
// (Columns, Marketo Form, Fragment); the shared cleanup and DM image rewrite run after it.
const transformers = [
  contactDivisionSectionsTransformer,
  cleanupTransformer,
  dmImagesTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      // a failure goes into the page report
      payload.contactReport.notes.push(`transformer failed at ${hookName}: ${e.message}`);
    }
  });
}

/**
 * The page date as `published` (YYYY-MM-DD): the source's hidden published date
 * (#hiddenPublishedDate, MM/DD/YYYY), which drives its "Last Updated" line.
 */
function publishedDate(document) {
  const value = document.querySelector('#hiddenPublishedDate')?.getAttribute('value') || '';
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  const updated = document.body.textContent.match(/Last Updated\s+([A-Za-z]+)\/(\d{4})/);
  if (!updated) return '';
  const month = new Date(`${updated[1]} 1, 2000`).getMonth() + 1;
  return `${updated[2]}-${String(month).padStart(2, '0')}`;
}

/** The source's Marketo forms (values, after-submit behaviour), for the import report. */
function marketoForms(document) {
  const forms = [...document.querySelectorAll('form.c-mkto-form[data-marketo-form-id]')];
  return forms.filter((form, i) => forms.findIndex((f) => (
    f.getAttribute('data-marketo-form-id') === form.getAttribute('data-marketo-form-id'))) === i)
    .map((form) => {
      const id = form.getAttribute('data-marketo-form-id');
      const alert = document.getElementById(`alert_${id}`);
      return {
        id,
        munchkinId: form.getAttribute('data-marketo-munchkin-id'),
        baseUrl: form.getAttribute('data-marketo-base-url'),
        afterSubmit: form.getAttribute('data-after-submit-action'),
        redirect: form.getAttribute('data-redirect-page'),
        message: alert ? alert.textContent.replace(/\s+/g, ' ').trim() : '',
      };
    });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const published = publishedDate(document);
    const forms = marketoForms(document);
    const contactReport = { phones: [], notes: [], fragments: [] };
    const hookPayload = { ...payload, contactReport };

    // 1. beforeTransform: rebuild the page content (blocks included), strip chrome
    executeTransformers('beforeTransform', main, hookPayload);
    // 2. afterTransform: links, DM images, final cleanup
    executeTransformers('afterTransform', main, hookPayload);

    // 3. metadata. site + template are set on the page so it renders the same anywhere.
    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    // the corp bulk metadata adds `title:suffix` "| Stryker": drop the source's own suffix
    if (meta.Title) meta.Title = meta.Title.replace(/\s*\|\s*Stryker\s*$/i, '');
    const keywords = document.querySelector('meta[name="keywords" i]')?.getAttribute('content')?.trim();
    if (keywords) meta.Keywords = keywords;
    meta.site = 'corp';
    meta.template = PAGE_TEMPLATE.name;
    if (published) {
      meta.published = published;
      // the source shows "Last Updated <Month>/<Year>" at the end of every contact page
      meta['last-updated'] = 'show';
    }
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);
    const blocks = [...main.querySelectorAll('table th, table tr:first-child td')]
      .map((cell) => cell.textContent.trim()).filter((name) => /^(Columns|Marketo Form|Fragment)/.test(name));

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks,
        forms: JSON.stringify(forms),
        fragments: contactReport.fragments.join(', '),
        phones: JSON.stringify(contactReport.phones),
        notes: contactReport.notes.join(' | '),
      },
    }];
  },
};
