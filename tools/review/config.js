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
  pages: { scope: true, index: '/us/en/query-index.json', scopeTable: '/review/migration-scope.json' },
  // the snapshot tiles of the source pages: in Document Authoring through the branch preview
  // (a folder of this review's own), locally the capture folder (a git-ignored link)
  snapshots: { preview: '/review-snapshots-main', local: './snapshots' },
  // the pages' documents in Document Authoring, opened by the AOE team to edit (the DA editor
  // of the site's content source; the page path is added, index pages as …/index)
  edit: 'https://da.live/edit#/strykerenterprise/stryker-com',
  // where the tool runs for reviewers (links in the summary)
  toolHost: 'main--stryker-com--strykerenterprise.aem.page',
  // the review backend: `backend` and `backendEnv`, chosen below (by host)
};

// The review backend (App Builder web actions, shared by both reviews; backend/target.mjs):
// Production for the real review (the reviews' branch previews and main), Stage, the test
// workspace (test data), everywhere else: feature-branch previews, the local preview.
// ?backend=stage|production chooses (kept in this browser for this host; the host's own choice
// again clears it; so does an invitation link that names no backend: a Stage invitation's link
// names Stage, the live review's names none); outside a browser Stage (the backend tests take
// their address from backend/target.mjs, like their admin calls).
const BACKENDS = {
  production: 'https://892544-strykerstdreview.adobeioruntime.net/api/v1/web/std-review',
  stage: 'https://892544-strykerstdreview-stage.adobeioruntime.net/api/v1/web/std-review',
};
const LIVE_HOSTS = /^(main|client-review-v3|standardise-v3)--stryker-com--strykerenterprise\.aem\.(page|live)$/;
const BACKEND_KEY = 'review-backend';

function backendEnv() {
  if (typeof window === 'undefined') return 'stage';
  const w = window;
  const own = LIVE_HOSTS.test(w.location.hostname) ? 'production' : 'stage';
  const params = new URLSearchParams(w.location.search);
  const asked = params.get('backend') || (params.get('invite') ? own : null);
  try {
    if (asked === own) w.localStorage.removeItem(BACKEND_KEY);
    else if (BACKENDS[asked]) w.localStorage.setItem(BACKEND_KEY, asked);
    const kept = w.localStorage.getItem(BACKEND_KEY);
    if (BACKENDS[kept]) return kept;
  } catch (e) {
    if (BACKENDS[asked]) return asked;
  }
  return own;
}
REVIEW.backendEnv = backendEnv();
REVIEW.backend = BACKENDS[REVIEW.backendEnv];

// on Stage, a label on every page of the tool (test data, not the real review)
if (typeof document !== 'undefined' && REVIEW.backendEnv === 'stage') {
  const label = () => {
    const el = document.createElement('div');
    el.className = 'review-backend-label';
    el.textContent = LIVE_HOSTS.test(window.location.hostname)
      ? 'Stage backend: test data (?backend=production to switch back)'
      : 'Stage backend: test data';
    el.style.cssText = 'position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:9999;'
      + 'padding:2px 10px;border-radius:10px;font:12px/1.5 sans-serif;color:#fff;background:#b35c00;'
      + 'pointer-events:none;opacity:0.9';
    document.body.append(el);
  };
  if (document.body) label();
  else document.addEventListener('DOMContentLoaded', label);
}

/** the browser storage keys of this review (std keeps the names it had: std-review-…) */
export const storageKey = (name) => `${REVIEW.space}-review-${name}`;
