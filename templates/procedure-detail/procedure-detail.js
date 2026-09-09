/**
 * Procedure Detail template (IVS treatment pages). Authored entirely from
 * existing blocks; this decorator only adds page-level scaffolding.
 * @param {Document} doc The document
 */
export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  // Hook for the template CSS to tighten rhythm around a full-bleed benefit panel.
  main.querySelectorAll(':scope > .section.full-bleed:has(.panel)').forEach((section) => {
    section.classList.add('procedure-panel-section');
  });
}
