// @ts-check
import { test, expect } from '@playwright/test';

async function waitForAppReady(page) {
  await page.waitForFunction(() => !document.querySelector('#main-loader'), {}, { timeout: 15000 });
}

test.describe('2026 Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/2026/desktop/index.html');
    await waitForAppReady(page);
    await page.waitForTimeout(4000);
  });

  test('landing page loads and is interactable', async ({ page }) => {
    await expect(page.locator('#main-logo')).toBeVisible();
    await expect(page.locator('.page-landing .landing-introduction')).toBeVisible();

    const ctaBtn = page.locator('.page-landing .two-lines-button');
    await expect(ctaBtn).toBeVisible();
  });

  test('clicking Start navigates to questions', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);

    await expect(page.locator('.page-questions')).toHaveClass(/page-current/);
    await expect(page.locator('.page-landing')).toHaveClass(/hidden/);

    const titleText = await page.locator('.page-questions .section-title-text').innerHTML();
    expect(titleText).toContain('age group');
  });

  test('age selection enables Next and progresses to skin step', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);

    await page.locator('.page-questions .question-item-container-4').click();
    await page.waitForTimeout(600);

    await expect(page.locator('.page-questions .question-item-container-4')).toHaveClass(/active/);

    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);

    const step2Title = await page.locator('.page-questions .section-title-text').innerHTML();
    expect(step2Title).toContain('describe your skin');
  });

  test('full 3-step quiz flow reaches results', async ({ page }) => {
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(2500);

    // Step 1: age
    await page.locator('.page-questions .question-item-container-4').click();
    await page.waitForTimeout(600);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);

    // Step 2: skin
    await page.locator('.page-questions .question-item-container-6').click();
    await page.waitForTimeout(600);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);

    // Step 3: concerns (2 selections)
    await page.locator('.page-questions .question-item-container-1').click();
    await page.waitForTimeout(300);
    await page.locator('.page-questions .question-item-container-7').click();
    await page.waitForTimeout(600);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(5000);

    await expect(page.locator('.page-results')).toHaveClass(/page-current/);

    const formVisible = await page.locator('#customer-information-form').isVisible();
    expect(formVisible).toBe(true);
  });
});
