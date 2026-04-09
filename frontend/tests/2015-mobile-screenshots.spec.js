// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const OUT = path.resolve('screenshots/new');

test.describe('2015 Mobile — Screenshot Regression', () => {
  test('01 landing page', async ({ page }) => {
    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${OUT}/2015-mobile-01-landing.png` });
  });

  test('02 age questions after start', async ({ page }) => {
    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(4000);
    const startBtn = page.locator('a.start-button, .page-landing .two-lines-button').first();
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: `${OUT}/2015-mobile-02-quiz.png` });
  });

  test('03 no failed image requests from /assets/ paths', async ({ page }) => {
    const imgErrors = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/assets/images/') && resp.status() >= 400) {
        imgErrors.push(`${resp.status()} ${resp.url()}`);
      }
    });
    await page.goto('/2015/mobile/index.html');
    await page.waitForTimeout(3000);
    expect(imgErrors, `Failed image requests: ${imgErrors.join(', ')}`).toHaveLength(0);
  });
});
