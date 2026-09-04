/* eslint-disable */
/* global WebImporter */

/**
 * Shared no-op parser (NOT template-specific — keep at the parsers/ root).
 *
 * Two purposes:
 *  1. Satisfies the bulk-import validator, which requires the top-level
 *     tools/importer/parsers/ directory to contain at least one .js file
 *     (it reads that directory non-recursively, so template subfolders like
 *     parsers/sa-resources/ do not count). This placeholder guarantees the
 *     requirement is met regardless of which template subfolders exist.
 *  2. Serves any all-default-content template (e.g. legal-page) that has no
 *     blocks to parse. It is intentionally not registered in any import script
 *     and performs no work.
 */
export default function parse() {}
