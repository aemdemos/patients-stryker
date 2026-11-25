/*
 * Review tool: keeping an open page up to date (since 25 Nov 2026). The backend can't push
 * (App Builder web actions hold no connection open), so a page asks again every EVERY_MS while
 * its tab is visible, at once when the tab is shown again, never two at a time; a hidden tab asks
 * nothing. Each check is one small backend call (~0.05 GB-s): for 10 people 8 hours a day ~6% of
 * the App Builder pack (backend README, "Cost").
 */
export const EVERY_MS = 15000;

/** run `refresh` every EVERY_MS while the page is visible (and when it is shown again); → stop() */
export function keepFresh(refresh, { every = EVERY_MS } = {}) {
  let running = false;
  let timer = 0;
  const run = async () => {
    if (running || document.visibilityState !== 'visible') return;
    running = true;
    try {
      await refresh();
    } catch (e) {
      // (a failed check: the next one tries again)
    } finally {
      running = false;
    }
  };
  const schedule = () => {
    window.clearInterval(timer);
    timer = window.setInterval(run, every);
  };
  const onShow = () => {
    if (document.visibilityState === 'visible') {
      run();
      schedule();
    } else window.clearInterval(timer);
  };
  document.addEventListener('visibilitychange', onShow);
  schedule();
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onShow);
  };
}
