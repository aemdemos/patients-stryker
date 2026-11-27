import { defineConfig } from '@playwright/test';
import keyboard from './tests/a11y/keyboard.config.mjs';

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 30000,
  reporter: './tests/a11y/a11y.reporter.js',
  use: {
    browserName: 'chromium',
    headless: true,
    ignoreHTTPSErrors: true,
  },
  // axe: sequential — avoids race conditions on localhost.
  // keyboard (run-keyboard.js): pages run in parallel, see workers in keyboard.config.mjs
  workers: process.env.A11Y_KEYBOARD_RUN === '1' ? keyboard.workers : 1,
  projects: [
    // axe-core scan: npm run test:a11y
    {
      name: 'axe',
      testMatch: 'a11y.test.js',
      outputDir: 'test-results/axe',
    },
    // keyboard tests: npm run test:a11y:keyboard (sets workers and reporter)
    {
      name: 'keyboard',
      testMatch: 'keyboard.test.js',
      fullyParallel: true,
      timeout: keyboard.testTimeoutMs,
      outputDir: keyboard.playwrightOutputDir,
    },
  ],
});
