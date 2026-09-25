/* eslint-disable import/prefer-default-export, no-await-in-loop, no-restricted-syntax */
/*
 * Node-side page capture: launch Chromium, load a page, run the in-browser
 * extractor, return text runs with computed-style fingerprints.
 *
 * Reuses the Playwright install from the excat content-import skill (same one
 * the importer uses) so the tool needs no extra dependency locally.
 */

import { extractRunsInBrowser, extractContentBoxesInBrowser, extractBoundaryAnchorsInBrowser } from './extract.js';

// Nudge lazy/late layout (fonts, deferred images, decoration) to settle before
// measuring geometry: scroll the whole page then return to top.
async function settleLayout(page, settleMs) {
  try { await page.waitForFunction(() => document.fonts?.status === 'loaded', { timeout: 5000 }); } catch { /* ignore */ }
  try {
    await page.evaluate(async () => {
      const step = 600;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => { setTimeout(r, 40); });
      }
      window.scrollTo(0, 0);
    });
  } catch { /* ignore */ }
  await page.waitForTimeout(settleMs);
}

/**
 * @param {import('playwright').Browser} browser
 * @param {string} url
 * @param {object} opts { waitUntil, minLength, settleMs }
 * @returns {Promise<Array>} text runs
 */
export async function captureRuns(browser, url, opts = {}) {
  const {
    waitUntil = 'networkidle',
    minLength = 2,
    settleMs = 800,
    timeoutMs = 45000,
    blockClasses = [],
    variantClasses = [],
  } = opts;
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  try {
    try {
      await page.goto(url, { waitUntil, timeout: timeoutMs });
    } catch {
      // networkidle can hang on martech-heavy pages; fall back.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    }
    // Let fonts + late decoration (decorateFootnotes, buttons) settle.
    try { await page.waitForFunction(() => document.fonts?.status === 'loaded', { timeout: 5000 }); } catch { /* ignore */ }
    await page.waitForTimeout(settleMs);
    const runs = await page.evaluate(extractRunsInBrowser, {
      minLength, blockClasses, variantClasses,
    });
    return runs;
  } finally {
    await context.close();
  }
}

/**
 * Read a migrated page's `template` and `theme` metadata from its rendered
 * <head>. EDS merges a page's own metadata block AND any root/folder metadata
 * sheet into <meta> tags, so reading the rendered page catches the template/theme
 * regardless of where it was authored. Used to auto-detect the fix target:
 * a page WITH a template → template CSS scoped `body.<template>`; a singleton
 * with only a theme → `styles/themes.css` scoped `body.<theme>`.
 *
 * @returns {Promise<{template:string, theme:string}>}
 */
export async function captureMeta(browser, url, opts = {}) {
  const { waitUntil = 'domcontentloaded', timeoutMs = 45000 } = opts;
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil, timeout: timeoutMs });
    return await page.evaluate(() => {
      const get = (n) => (document.querySelector(`meta[name="${n}"]`) || {}).content || '';
      return { template: get('template'), theme: get('theme') };
    });
  } catch {
    return { template: '', theme: '' };
  } finally {
    await context.close();
  }
}

/**
 * Capture text runs (with absolute page geometry) AND content boxes at each
 * requested breakpoint width. Used by the spacing validator.
 *
 * @param {import('playwright').Browser} browser
 * @param {string} url
 * @param {object} opts { minLength, settleMs, timeoutMs, breakpoints:[px,...] }
 * @returns {Promise<Object>} map of breakpoint width -> { runs, contentBoxes }
 */
export async function captureGeometry(browser, url, opts = {}) {
  const {
    waitUntil = 'networkidle',
    minLength = 2,
    settleMs = 900,
    timeoutMs = 45000,
    breakpoints = [390, 1200],
    blockClasses = [],
    variantClasses = [],
  } = opts;
  const out = {};
  for (const width of breakpoints) {
    const context = await browser.newContext({ bypassCSP: true, viewport: { width, height: 900 } });
    const page = await context.newPage();
    try {
      try {
        await page.goto(url, { waitUntil, timeout: timeoutMs });
      } catch {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      }
      await settleLayout(page, settleMs);
      const runs = await page.evaluate(extractRunsInBrowser, {
        minLength, blockClasses, variantClasses,
      });
      const contentBoxes = await page.evaluate(extractContentBoxesInBrowser);
      const boundaries = await page.evaluate(extractBoundaryAnchorsInBrowser);
      out[width] = { runs, contentBoxes, boundaries };
    } finally {
      await context.close();
    }
  }
  return out;
}
