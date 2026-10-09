/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ivs-contact content formatting, section breaks + Section Metadata.
 *
 * Template-scoped: acts ONLY on the ivs-contact template (guarded by
 * payload.template.name). Inert for every other template.
 *
 * Source: https://patients.stryker.com/us/en/ivs/contact.html (migration-work/cleaned.html)
 * Sections (tools/importer/page-templates.json → ivs-contact.sections):
 *
 *   1 intro         .text.parbase (h1, h2, intro p) + .buttonset FIND A DOCTOR   style: none
 *   2 contact-form  .sectionseparator hr + .marketoform                          style: divider
 *   3 disclaimer    .c-disclaimer.page-section (+ doc-code .c-disclaimer)        style: compact
 *
 * Formatting follows the Authoring conventions page
 * (/.da/docs/authoring-guide/authoring-conventions) — plain <strong>/<em>/<u> only:
 *  - The H1 "Contact us" renders black Futura bold on the source (<span class="futura-bold">,
 *    no gold). Encoded as a BOLD heading (<h1><strong>…</strong></h1>), matching the
 *    migrated IVS sibling /us/en/ivs/resources ("Patient resources"). Bold + Italic is
 *    deliberately NOT used: that convention renders the heading gold.
 *  - The gold FIND A DOCTOR button (a.btn-gold) is converted by the shared cleanup
 *    transformer (ivs branch) to a Bold + Italic link on its own line → gold button.
 *
 * The source's own ".sectionseparator" divider is replaced by the library
 * `divider` section style (thin line above the section), so it is stripped here.
 */

const MARKER_ATTR = 'data-excat-ivs-contact-section';

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { style },
  });
}

export default function transform(hookName, element, payload) {
  if (!payload || !payload.template || payload.template.name !== 'ivs-contact') return;
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    // 1. Black Futura-bold heading spans → <strong> (bold heading convention).
    element.querySelectorAll('h1 .futura-bold, h2 .futura-bold, h3 .futura-bold').forEach((span) => {
      if (span.closest('strong, b')) return;
      const strong = document.createElement('strong');
      strong.textContent = span.textContent.replace(/ /g, ' ').trim();
      span.replaceWith(strong);
    });

    // 2. The source FIND A DOCTOR link (/us/en/ivs/find-a-doctor.html) is a 301 to the
    //    external physician locator, which is where every migrated IVS page points
    //    its FIND A DOCTOR button. Link there directly (no EDS page exists at that path).
    element.querySelectorAll('a[href*="/ivs/find-a-doctor"]').forEach((a) => {
      a.setAttribute('href', 'https://physicianlocator.strykerivs.com/');
    });

    // 3. Source divider → library `divider` section style (added in afterTransform).
    //    ".c-contactus" is an empty component the live page fills at runtime with a
    //    referrer-based "back" link (e.g. to a surgeon profile) — not authorable.
    WebImporter.DOMUtils.remove(element, ['.sectionseparator', '.c-contactus']);

    // 4. Section-break markers. Block parsers run between the hooks and replace
    //    .marketoform, so the marker is inserted BEFORE it and survives the swap.
    const form = element.querySelector('.marketoform');
    const disclaimer = element.querySelector('.c-disclaimer.page-section');
    [[form, 'contact-form'], [disclaimer, 'disclaimer']].forEach(([el, id]) => {
      if (!el) return;
      const hr = document.createElement('hr');
      hr.setAttribute(MARKER_ATTR, id);
      el.before(hr);
    });
    return;
  }

  if (hookName === 'afterTransform') {
    const formMarker = element.querySelector(`hr[${MARKER_ATTR}="contact-form"]`);
    const disclaimerMarker = element.querySelector(`hr[${MARKER_ATTR}="disclaimer"]`);

    // Section 2 (contact form) ends where section 3 starts.
    if (formMarker && disclaimerMarker) {
      disclaimerMarker.before(sectionMetadata(document, 'divider'));
    }
    // Section 3 (disclaimer) is the last section — metadata goes at the end
    // (the page Metadata block is appended after this by the import script).
    if (disclaimerMarker) {
      element.append(sectionMetadata(document, 'compact'));
    }

    element.querySelectorAll(`hr[${MARKER_ATTR}]`).forEach((hr) => hr.removeAttribute(MARKER_ATTR));
  }
}
