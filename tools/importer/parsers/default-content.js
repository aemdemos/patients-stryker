/* eslint-disable */
/* global WebImporter */

/**
 * No-op parser.
 *
 * The legal-page template is 100% default content (heading, paragraphs,
 * lists) and has no blocks. This placeholder exists only to satisfy the
 * bulk-import validator, which requires at least one parser file. It is
 * intentionally not registered in any import script and performs no work.
 */
export default function parse() {}
