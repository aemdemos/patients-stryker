/**
 * Procedure Detail template — the shape shared by the IVS treatment pages
 * (verified against vertebroplasty.html and balloon-kyphoplasty.html).
 *
 * This template is authored ENTIRELY from the project's EXISTING blocks — it
 * introduces no bespoke zone markup of its own. A page becomes a procedure page
 * simply by setting page metadata `template: procedure-detail`; the zones are
 * ordinary blocks the author drops in, each of which self-decorates:
 *
 *   1. Hero / title            →  `hero` block, `banner` variant
 *   2. Intro hook + benefits   →  a `flex` section: default-content intro on the
 *                                 left + a `panel` block, `cta` variant (benefits
 *                                 + CTA button) on the right
 *   3. Clinical-evidence band  →  a `panel` block, `dark wide` variant, alone in a
 *                                 full-bleed dark-gray section
 *   4. "How it works"          →  an `h3` heading + a `cards` block (image + h4
 *                                 + text per step)
 *   5. Mid-page CTA            →  a `panel` block, `gold` variant
 *   6. "Resources"             →  an `h2` heading + a `cards` block, `resources`
 *                                 variant (image + "Learn more" link); add/remove
 *                                 a resource by adding/removing a card
 *   7. Disclaimer / references →  a section tagged `Style: compact` (existing)
 *
 * Because every zone is a real block, this decorator only applies page-level
 * scaffolding (the body class is added by loadTemplate in scripts.js). There is
 * no DOM restructuring here — the blocks own their own decoration — so authored
 * content, block variants and UE instrumentation are all preserved as-is. The
 * Marketo form is out of scope and simply not authored onto these pages.
 *
 * @param {Document} doc The document
 */
export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  // Give a full-bleed benefit panel's section a hook the template CSS can use to
  // tighten the vertical rhythm around the callout. Everything else is handled
  // by the individual blocks and the global section styles.
  main.querySelectorAll(':scope > .section.full-bleed:has(.panel)').forEach((section) => {
    section.classList.add('procedure-panel-section');
  });
}
