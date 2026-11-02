/*
 * The fragment documents of stryker.com modals (approved 2026-10-30): content that the source
 * shows in a modal and that no page or XF holds (the ProCare tile's modal, added by the product
 * template per business unit) is one shared fragment document per distinct modal, under
 * /us/en/fragments/modals/. A link to it (blocks/modal) opens it in a modal.
 */

/** A name as the importer saves documents (WebImporter.FileUtils.sanitizeFilename). */
const documentName = (name) => String(name).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

/**
 * The fragment path of a ProCare modal, from its title ("ProCare for acute care equipment" →
 * /us/en/fragments/modals/procare/acute-care-equipment).
 * @param {string} title the modal title
 * @returns {string|null}
 */
export default function procareModalPath(title) {
  const name = documentName(String(title || '').trim().replace(/^ProCare\s+(for\s+)?/i, ''));
  return name ? `/us/en/fragments/modals/procare/${name}` : null;
}
