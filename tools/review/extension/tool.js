/*
 * On the review tool's pages: says the extension is there (the tool then offers Compare with:
 * Live, the real stryker.com page). Nothing else.
 */
document.documentElement.dataset.reviewLive = window.chrome?.runtime?.getManifest?.()?.version || '1';
