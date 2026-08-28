/**
 * Patient Education template — the shape shared by the Neurovascular patient
 * information / education pages (verified against
 * /us/en/stroke-awareness/patient-information). Other pages in this family will
 * follow and share this template.
 *
 * Like treatment-detail, this template is authored ENTIRELY from the project's
 * EXISTING blocks — it introduces no bespoke zone markup of its own. A page
 * becomes a patient-education page simply by setting page metadata
 * `template: patient-education`; the zones are ordinary blocks the author drops
 * in, each of which self-decorates:
 *
 *   1. Title bar               →  `hero` block, `band` variant (gold headline
 *                                 over the gradient bar)
 *   2. Intro line              →  default content (`h2`)
 *   3. Patient-guide cards     →  `cards` block, `resources` variant (portrait
 *                                 cover + PDF-linked title + product-page button);
 *                                 add/remove a card by adding/removing a card row
 *   4. "For more info" CTA band →  default content in a `gold, full-bleed` section
 *   5. Resources footer        →  `columns` block in a `light-gray, full-bleed`
 *                                 section (3 columns of links)
 *   6. Disclaimer / doc id     →  default content
 *
 * Because every zone is a real block, this decorator applies NO DOM
 * restructuring — the blocks own their own decoration, so authored content,
 * block variants and UE instrumentation are all preserved as-is. All
 * page-specific visual corrections live in patient-education.css, scoped under
 * `body.patient-education` (the class is added by decorateTemplateAndTheme in
 * aem.js from the page's `template` metadata). Nothing in any SHARED block or
 * global stylesheet is modified — the body-class prefix gives these rules the
 * specificity to win the cascade for this page only.
 *
 * @param {Document} doc The document
 */
export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  // Belt-and-braces: also stamp the template class on <main> directly. The body
  // class is normally applied by decorateTemplateAndTheme before this runs, but
  // stamping here keeps the hook reliable and gives future template-scoped rules
  // an anchor even in contexts where the body class is applied late.
  main.classList.add('patient-education');
}
