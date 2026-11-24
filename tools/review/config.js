/*
 * Review tool: what this copy of the tool reviews. The one file that differs between the
 * branches that carry the tool: the client review of the migrated pages (branch
 * client-review-v3, merged into main) and the standard-pages review (standardise-v3, design
 * switches on). Everything else is shared code.
 *
 * Client review (this branch): the pages on main at their final paths (/us/en/…), however they
 * were authored, compared with snapshots of the source pages (www.stryker.com); feedback only:
 * page status, page comments and pinned QA notes with their chats. No design panel, no as-is
 * comparison.
 */
export const REVIEW = {
  // the review's space in the review backend: its entries and invitations are its own
  space: 'main',
  title: 'Migrated pages review',
  // the page under review: at its final path on this host (the workspace preview proxies those
  // paths to the main branch's content)
  base: { label: 'Migrated', prefix: '', localPrefix: '' },
  // what it is compared with, the first one by default: src = the source page's snapshot, live
  // = a live copy of the source page rendered now by the backend
  // (as = the as-is copy under /rs, standard-pages review only)
  compare: ['src', 'live'],
  // the design panel (variants, widths, backgrounds, text sets, groups): standard pages only
  design: false,
  // the widths offered, the first one by default (tablet 860: source and EDS both in their
  // tablet layouts, the source from 841px, EDS from 600px to 900px)
  widths: [
    { vp: 1440, label: 'Desktop' },
    { vp: 860, label: 'Tablet' },
    { vp: 375, label: 'Phone' },
  ],
  mode: 'side',
  // the pages: the migration scope table and the published pages, through the backend (scope),
  // else the site's query index, else a pages.json
  pages: { scope: true, index: '/us/en/query-index.json' },
  // the snapshot tiles of the source pages: in Document Authoring through the branch preview
  // (a folder of this review's own), locally the capture folder (a git-ignored link)
  snapshots: { preview: '/review-snapshots-main', local: './snapshots' },
  // the pages' documents in Document Authoring, opened by the AOE team to edit (the DA editor
  // of the site's content source; the page path is added, index pages as …/index)
  edit: 'https://da.live/edit#/strykerenterprise/stryker-com',
  // where the tool runs for reviewers (links in the summary)
  toolHost: 'main--stryker-com--strykerenterprise.aem.page',
  // the review backend (App Builder web actions, Stage workspace), shared by both reviews
  // (the review's backend, App Builder workspace Production since 24 Nov 2026; Stage before)
  backend: 'https://892544-strykerstdreview.adobeioruntime.net/api/v1/web/std-review',
};

/** the browser storage keys of this review (std keeps the names it had: std-review-…) */
export const storageKey = (name) => `${REVIEW.space}-review-${name}`;
