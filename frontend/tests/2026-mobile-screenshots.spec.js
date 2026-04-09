// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const OUT = path.resolve('screenshots/new');

test.describe('2026 Mobile — Screenshot Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2026/mobile/index.html');
    await page.waitForFunction(() => !document.querySelector('#main-loader'), {}, { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('01 landing page', async ({ page }) => {
    await page.screenshot({ path: `${OUT}/2026-mobile-01-landing.png` });
  });

  test('02 quiz age step', async ({ page }) => {
    const startBtn = page.locator('.page-landing .two-lines-button, .page-landing .start-button').first();
    await startBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/2026-mobile-02-quiz-age.png` });
  });

  test('03 results — product image uses unified asset path', async ({ page }) => {
    // Landing → Age
    await page.locator('#page-landing .next-question').tap();
    await page.waitForTimeout(1500);
    // Age
    await page.locator('#page-questions-age .question-link').nth(2).tap();
    await page.waitForTimeout(500);
    await page.locator('#page-questions-age .next-question').tap();
    await page.waitForTimeout(1500);
    // Skin
    await page.locator('#page-questions-skin .question-link').first().tap();
    await page.waitForTimeout(500);
    await page.locator('#page-questions-skin .next-question').tap();
    await page.waitForTimeout(1500);
    // Concerns (2)
    await page.locator('#page-questions-concern .question-link').nth(0).tap();
    await page.waitForTimeout(300);
    await page.locator('#page-questions-concern .question-link').nth(2).tap();
    await page.waitForTimeout(500);
    await page.locator('#page-questions-concern .next-question').tap();
    await page.waitForTimeout(3000);

    await expect(page.locator('#page-questions-results')).toBeVisible();
    await page.screenshot({ path: `${OUT}/2026-mobile-03-results.png` });

    const productImg = page.locator('#page-questions-results .product-image img').first();
    if (await productImg.count() > 0) {
      await expect(productImg).toHaveAttribute('src', /^\/assets\/images\/products\/product-/);
      const src = await productImg.getAttribute('src');
      const status = await page.evaluate(s => fetch(s).then(r => r.status), src);
      expect(status).toBe(200);
    }
  });
});
