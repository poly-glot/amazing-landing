// @ts-check
import { test, expect } from '@playwright/test';

async function waitForAppReady(page) {
  await page.waitForFunction(
    () => {
      const loader = document.querySelector('#main-loader');
      return !loader || loader.style.display === 'none';
    },
    {},
    { timeout: 15000 },
  );
  await page.waitForTimeout(1000);
}

test.describe('2026 Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2026/mobile/index.html');
    await waitForAppReady(page);
  });

  test('landing page loads and is interactable', async ({ page }) => {
    await expect(page.locator('#page-landing .site-logo')).toBeVisible();
    await expect(page.locator('.landing-introduction .landing-heading')).toBeVisible();

    const startBtn = page.locator('#page-landing .next-question');
    await expect(startBtn).toBeVisible();

    const productItems = await page.locator('#page-landing .landing-item').count();
    expect(productItems).toBe(4);
  });

  test('tapping Start navigates to age questions', async ({ page }) => {
    await page.locator('#page-landing .next-question').tap();
    await page.waitForTimeout(1500);

    await expect(page.locator('#page-questions-age')).toBeVisible();

    const questionLinks = await page.locator('#page-questions-age .question-link').count();
    expect(questionLinks).toBeGreaterThan(0);
  });

  test('selecting age enables Next and progresses to skin', async ({ page }) => {
    await page.locator('#page-landing .next-question').tap();
    await page.waitForTimeout(1500);

    await page.locator('#page-questions-age .question-link').nth(1).tap();
    await page.waitForTimeout(500);

    await expect(page.locator('#page-questions-age .question-link').nth(1)).toHaveClass(/active/);

    await page.locator('#page-questions-age .next-question').tap();
    await page.waitForTimeout(1500);

    await expect(page.locator('#page-questions-skin')).toBeVisible();
  });

  test('full quiz flow reaches results', async ({ page }) => {
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

    // Concerns (2 selections)
    await page.locator('#page-questions-concern .question-link').nth(0).tap();
    await page.waitForTimeout(300);
    await page.locator('#page-questions-concern .question-link').nth(2).tap();
    await page.waitForTimeout(500);
    await page.locator('#page-questions-concern .next-question').tap();
    await page.waitForTimeout(2000);

    await expect(page.locator('#page-questions-results')).toBeVisible();
  });
});
