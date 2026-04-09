// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const OUT = path.resolve('screenshots/new');

test.describe('2015 Desktop — Screenshot Regression', () => {
  test('01 landing page', async ({ page }) => {
    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(4000);
    await page.evaluate(() => {
      const loader = document.querySelector('#main-loader');
      if (loader) loader.style.display = 'none';
    });
    await page.screenshot({ path: `${OUT}/2015-desktop-01-landing.png` });
  });

  test('02 quiz visible after start', async ({ page }) => {
    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(4000);
    await page.evaluate(() => {
      const loader = document.querySelector('#main-loader');
      if (loader) loader.style.display = 'none';
    });
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/2015-desktop-02-quiz.png` });
  });

  test('03 no failed image requests from /assets/ paths', async ({ page }) => {
    const imgErrors = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/assets/images/') && resp.status() >= 400) {
        imgErrors.push(`${resp.status()} ${resp.url()}`);
      }
    });
    await page.goto('/2015/desktop/index.html');
    await page.waitForTimeout(3000);
    expect(imgErrors, `Failed image requests: ${imgErrors.join(', ')}`).toHaveLength(0);
  });
});
