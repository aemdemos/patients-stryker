/* eslint-disable import/prefer-default-export */
/*
 * Node-side page capture: launch Chromium, load a page, run the in-browser
 * extractor, return text runs with computed-style fingerprints.
 *
 * Reuses the Playwright install from the excat content-import skill (same one
 * the importer uses) so the tool needs no extra dependency locally.
 */

import { extractRunsInBrowser } from './extract.js';

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
    const runs = await page.evaluate(extractRunsInBrowser, { minLength });
    return runs;
  } finally {
    await context.close();
  }
}
