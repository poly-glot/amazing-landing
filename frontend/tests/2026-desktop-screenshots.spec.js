// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const OUT = path.resolve('screenshots/new');

test.describe('2026 Desktop — Screenshot Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2026/desktop/index.html');
    await page.waitForFunction(() => !document.querySelector('#main-loader'), {}, { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('01 landing page', async ({ page }) => {
    await page.screenshot({ path: `${OUT}/2026-desktop-01-landing.png` });
  });

  test('02 quiz age step', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/2026-desktop-02-quiz-age.png` });
  });

  test('03 quiz skin step', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);
    await page.locator('.page-questions .question-item-container-4').click();
    await page.waitForTimeout(400);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/2026-desktop-03-quiz-skin.png` });
  });

  test('04 quiz concerns step', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);
    await page.locator('.page-questions .question-item-container-4').click();
    await page.waitForTimeout(400);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);
    await page.locator('.page-questions .question-item-container-6').click();
    await page.waitForTimeout(400);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/2026-desktop-04-quiz-concerns.png` });
  });

  test('05 results page — product image uses unified asset path', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);
    await page.locator('.page-questions .question-item-container-4').click();
    await page.waitForTimeout(400);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);
    await page.locator('.page-questions .question-item-container-6').click();
    await page.waitForTimeout(400);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);
    await page.locator('.page-questions .question-item-container-1').click();
    await page.waitForTimeout(300);
    await page.locator('.page-questions .question-item-container-7').click();
    await page.waitForTimeout(400);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(5000);

    await expect(page.locator('.page-results')).toHaveClass(/page-current/);
    await page.screenshot({ path: `${OUT}/2026-desktop-05-results.png` });

    // Verify product image loaded from unified /assets path
    const productImg = page.locator('.page-results .product-image img').first();
    await expect(productImg).toHaveAttribute('src', /^\/assets\/images\/products\/product-/);
    const status = await page.evaluate(src => fetch(src).then(r => r.status), await productImg.getAttribute('src'));
    expect(status).toBe(200);
  });
});
