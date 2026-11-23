/*
 * Review tool: what this copy of the tool reviews. The one file that differs between the
 * branches that carry the tool: the client review of the migrated pages (branch
 * client-review-v3, merged into main) and the standard-pages review (standardise-v3, design
 * switches on). Everything else is shared code.
 *
 * Standard-pages review (this branch): the standard pages under /std, compared with their as-is
 * version (/rs) or a snapshot of the source page (www.stryker.com); the design panel (the
 * page's blocks with their variants), comments, QA notes, page status.
 */
export const REVIEW = {
  // the review's space in the review backend: its entries and invitations are its own (std:
  // the keys of before, no prefix)
  space: 'std',
  title: 'Standard pages review',
  // the page under review: the standard page under /std (locally the imported documents under
  // /content/std)
  base: { label: 'Standard', prefix: '/std', localPrefix: '/content/std' },
  // what it is compared with, the first one by default: rs = the as-is copy under /rs, src = the
  // source page's snapshot, live = a live copy of the source page rendered now by the backend
  compare: ['rs', 'src', 'live'],
  // the design panel (variants, widths, backgrounds, text sets, groups)
  design: true,
  // the widths offered, the first one by default (the source snapshots have these two)
  widths: [
    { vp: 1440, label: 'Desktop' },
    { vp: 375, label: 'Phone' },
  ],
  mode: 'flip',
  // the pages: pages.json (the 672 standard pages, title, business unit, template); no
  // migration scope, no query index
  pages: {},
  // the snapshot tiles of the source pages: in Document Authoring through the branch preview,
  // locally the capture folder (a git-ignored link)
  snapshots: { preview: '/review-snapshots', local: './snapshots' },
  // the pages' documents in Document Authoring, opened by the AOE team to edit (the DA editor
  // of the site's content source; /std and the page path are added, index pages as …/index)
  edit: 'https://da.live/edit#/strykerenterprise/stryker-com',
  // where the tool runs for reviewers (links in the summary)
  toolHost: 'standardise-v3--stryker-com--strykerenterprise.aem.page',
  // the review backend (App Builder web actions, Stage workspace), shared by both reviews
  backend: 'https://892544-strykerstdreview-stage.adobeioruntime.net/api/v1/web/std-review',
};

/** the browser storage keys of this review (std keeps the names it had: std-review-…) */
export const storageKey = (name) => `${REVIEW.space}-review-${name}`;
