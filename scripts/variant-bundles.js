/*
 * Bundled block variants (at most 3 variants per block, the variant-only rule of corp
 * long-page-detail, 2026-11-17): one authored name stands for variants used together, so the
 * block's CSS for the parts applies. Called by the blocks that author bundle names (Columns,
 * Hero Corp) at the start of their decoration, so a block renders the same on any page, in a
 * fragment and in the Block Library; a section style of the same name is left alone.
 *
 * `faculty`: jr45's grey faculty boxes; `chapter-labels`: TEACH's "Chapter N:" labels;
 * `gray-cards`: CLOUT's grey evidence cards with plain Bold labels; `course-cards`: the Mako
 * refreshers course cards (their action links 21px, columns-corp.css); `product-intro`: nse
 * product rows, the Egyptienne copy with a 2vw title; `product-details`: an nse product's intro
 * beside a grey box of 14px details; `event-cards`: neurosurgical events, a 21px Egyptienne
 * subtitle under each title; `gold-lead-copy`: SKILL NeuroElite, a gold lead bar over 17.5px
 * copy; `gold-headline-first`: spine resources, a gold box of 1.5vw copy beside the row's other
 * cell. `*-serif-copy`: a copy size with the Egyptienne copy.
 */
const VARIANT_BUNDLES = {
  'large-serif-copy': ['large-copy', 'serif'],
  'xlarge-serif-copy': ['xlarge-copy', 'serif'],
  'headline-serif-copy': ['headline-copy', 'serif'],
  faculty: ['gray-last', 'large-subtitles', 'plain-bold'],
  'chapter-labels': ['label-bold', 'plain-bold'],
  'gray-cards': ['gray-all', 'plain-bold'],
  'course-cards': ['large-titles', 'large-subtitles', 'large-copy'],
  'product-intro': ['serif'],
  'product-details': ['gray-last', 'plain-bold'],
  'event-cards': ['large-subtitles'],
  'gold-lead-copy': ['gold-lead', 'large-copy'],
  'gold-headline-first': ['gold-first'],
};

/**
 * Adds the variants a block's bundle names stand for (no-op for blocks without one).
 * @param {Element} block The block element
 */
export default function expandVariantBundles(block) {
  Object.entries(VARIANT_BUNDLES).forEach(([bundle, parts]) => {
    if (block.classList.contains(bundle)) block.classList.add(...parts);
  });
}
