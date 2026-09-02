/* Stroke Awareness Landing template — page-level scaffolding only; the page is built from existing self-decorating blocks. Body class is added by loadTemplate; CSS is scoped to it. */
/** @param {Document} doc The document */
export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  // hook the resources fragment section so the template CSS can add its closing vertical rhythm
  main.querySelectorAll(':scope > .section:has(.fragment)').forEach((section) => {
    section.classList.add('stroke-resources-section');
  });
}
