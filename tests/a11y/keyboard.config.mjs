/**
 * Keyboard test configuration. Usage and all options:
 *   npm run test:a11y:keyboard -- --help
 *
 * pairs — the pages to compare when no URL is passed. Each pair is tested on both sites.
 *   name   — short id used in test titles and result file names
 *   eds    — EDS path (joined with --base-url, default http://localhost:3000)
 *            or a full URL
 *   source — full URL of the original page
 *   One pair can be passed instead: npm run test:a11y:keyboard -- <source-url> <eds-url>
 *   (one URL alone is tested as an EDS page, without comparison)
 *
 * viewports — every page is tested once per viewport (--viewport desktop to pick one).
 *
 * workers — pages tested in parallel (--workers / A11Y_WORKERS). Each worker starts
 *   its own browser: fit it to the machine or CI runner, and use fewer workers
 *   against a local dev server than against a hosted preview.
 *
 * sourceConcurrency — most pages open at the same time on one source host
 *   (--source-concurrency / A11Y_SOURCE_CONCURRENCY). Keeps load on a live site low.
 *
 * cookieBanner — optional per-site override { banner, dismiss } (CSS selectors).
 *   Without it, common consent banners (OneTrust, Cookiebot, TrustArc) are detected.
 */
export default {
  pairs: [
    {
      name: 'ivs-home',
      eds: '/us/en/ivs/',
      source: 'https://patients.stryker.com/us/en/ivs/index.html',
    },
    {
      name: 'ent-home',
      eds: '/us/en/ent/',
      source: 'https://patients.stryker.com/us/en/ent/index.html',
    },
  ],
  viewports: [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ],
  workers: 2,
  sourceConcurrency: 2,
  // Tab presses before the walk stops (pages with more stops report "limit reached")
  maxTabs: 250,
  // the same element focused this many presses in a row counts as a trap
  trapRepeat: 3,
  // tab order moving up the page by more than this share of the viewport height is
  // reported as a jump against the visual order (warning)
  visualJumpRatio: 0.5,
  // most instances tested per component type (menus, accordions, tabs, ...)
  maxPerComponent: 6,
  // most form fields tested per page
  maxFormFields: 20,
  // how long a carousel is watched for autoplay
  autoplayWaitMs: 7000,
  // per-page test timeout (one page = one site at one viewport)
  testTimeoutMs: 300000,
  navigationTimeoutMs: 45000,
  // how long to wait for a consent banner to appear after load
  cookieBannerWaitMs: 3000,
  // results of every run, one folder per run (git-ignored; see tests/a11y/RESULTS.md)
  resultsRoot: 'a11y-results/keyboard',
  // Playwright's own working folder (emptied at the start of each run)
  playwrightOutputDir: 'test-results/keyboard',
  cookieBanner: {
    // 'patients.stryker.com': { banner: '#onetrust-banner-sdk', dismiss: '#onetrust-reject-all-handler' },
  },
};
