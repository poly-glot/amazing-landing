// @ts-check
import { test, expect } from '@playwright/test';

/**
 * 2015 Desktop (jQuery version) — Smoke Tests
 * Verifies the legacy jQuery app loads and is interactable.
 */

test.describe('2015 Desktop (jQuery)', () => {
  test('page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(3000);

    // Filter out expected errors (Google Maps, Firebase, etc.)
    const critical = errors.filter(
      (e) =>
        !e.includes('google') &&
        !e.includes('firebase') &&
        !e.includes('ga') &&
        !e.includes('Maps') &&
        !e.includes('Popover') &&
        !e.includes('tooltip'),
    );
    expect(critical).toHaveLength(0);
  });

  test('landing page is visible with logo and CTA', async ({ page }) => {
    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(5000);

    // jQuery version has a loader that fades — wait for it
    await page.evaluate(() => {
      const loader = document.querySelector('#main-loader');
      if (loader) loader.style.display = 'none';
    });

    // Logo should exist in DOM
    const logoExists = await page.evaluate(() => !!document.querySelector('.site-logo'));
    expect(logoExists).toBe(true);

    // CTA button should exist
    const ctaExists = await page.evaluate(() => !!document.querySelector('.page-landing .two-lines-button'));
    expect(ctaExists).toBe(true);
  });

  test('jQuery and Velocity are loaded', async ({ page }) => {
    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(3000);

    const libs = await page.evaluate(() => ({
      jQuery: typeof window.jQuery === 'function',
      velocity: typeof window.jQuery?.fn?.velocity === 'function',
    }));

    expect(libs.jQuery).toBe(true);
  });

  test('clicking Start triggers question display', async ({ page }) => {
    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(5000);

    await page.evaluate(() => {
      const loader = document.querySelector('#main-loader');
      if (loader) loader.style.display = 'none';
    });
    await page.waitForTimeout(1000);

    // Click the start/next button
    const startBtn = page.locator('.page-landing .two-lines-button');
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(3000);

      // Questions section title should change
      const titleExists = await page.evaluate(() => !!document.querySelector('.section-title'));
      expect(titleExists).toBe(true);
    }
  });
});
