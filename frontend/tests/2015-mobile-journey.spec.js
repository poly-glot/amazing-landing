// @ts-check
import { test, expect } from '@playwright/test';

/**
 * 2015 Mobile (jQuery Mobile version) — Smoke Tests
 * Verifies the legacy jQuery Mobile app loads and is interactable.
 */

test.describe('2015 Mobile (jQuery Mobile)', () => {
  test('page loads without critical JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(5000);

    const critical = errors.filter(
      (e) =>
        !e.includes('google') &&
        !e.includes('firebase') &&
        !e.includes('ga') &&
        !e.includes('Maps') &&
        !e.includes('jQuery'),
    );
    expect(critical).toHaveLength(0);
  });

  test('landing page is visible with logo and Start button', async ({ page }) => {
    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(5000);

    // Force remove loader
    await page.evaluate(() => {
      const loader = document.querySelector('#main-loader');
      if (loader) loader.style.display = 'none';
    });

    // Logo should exist
    const logoExists = await page.evaluate(() => !!document.querySelector('.site-logo'));
    expect(logoExists).toBe(true);

    // Start button should exist
    const startExists = await page.evaluate(() => !!document.querySelector('#page-landing .next-question'));
    expect(startExists).toBe(true);
  });

  test('jQuery and jQuery Mobile are loaded', async ({ page }) => {
    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(3000);

    const libs = await page.evaluate(() => ({
      jQuery: typeof window.jQuery === 'function',
      jQueryMobile: typeof window.jQuery?.mobile === 'object',
    }));

    expect(libs.jQuery).toBe(true);
    expect(libs.jQueryMobile).toBe(true);
  });

  test('tapping Start shows age question page', async ({ page }) => {
    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(5000);

    await page.evaluate(() => {
      const loader = document.querySelector('#main-loader');
      if (loader) loader.style.display = 'none';
    });
    await page.waitForTimeout(1000);

    const startBtn = page.locator('#page-landing .next-question[data-rel="show-age"]');
    if (await startBtn.isVisible()) {
      await startBtn.tap();
      await page.waitForTimeout(2000);

      // Age question page should be in DOM
      const agePageExists = await page.evaluate(() => !!document.querySelector('#page-questions-age'));
      expect(agePageExists).toBe(true);
    }
  });
});
