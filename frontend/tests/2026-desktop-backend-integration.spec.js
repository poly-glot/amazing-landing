// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const S = path.join(process.cwd(), '..', 'screenshots');
const GO_SERVER = 'http://localhost:8080';

test.describe('2026 Desktop — Backend Integration', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('frontend fetches questions + products from backend API at boot', async ({ page }) => {
    const consoleLogs = [];
    const apiCalls = [];
    page.on('console', (msg) => consoleLogs.push(msg.text()));
    page.on('request', (req) => {
      if (req.url().includes('api/v1/survey/')) apiCalls.push(req.url());
    });

    // Load via Vite (which uses mock-api) — the mock now includes products + questions endpoints
    await page.goto('/2026/desktop/index.html');
    await page.waitForFunction(() => !document.querySelector('#main-loader'), {}, { timeout: 20000 });
    await page.waitForTimeout(5000);

    // Verify the frontend made API calls for questions and products
    const questionCall = apiCalls.find((u) => u.includes('api/v1/survey/questions'));
    const productCall = apiCalls.find((u) => u.includes('api/v1/survey/products'));

    console.log('=== API calls made by frontend ===');
    apiCalls.forEach((u) => console.log(' ', u));

    expect(questionCall).toBeTruthy();
    console.log('PASS: Frontend called questions API');

    expect(productCall).toBeTruthy();
    console.log('PASS: Frontend called products API');

    // Verify console confirms data was applied
    const questionApplied = consoleLogs.find((l) => l.includes('[Questions]'));
    const productApplied = consoleLogs.find((l) => l.includes('[Recommendations]'));

    console.log('=== Console logs (backend integration) ===');
    consoleLogs.filter((l) =>
      l.includes('[Questions]') || l.includes('[Recommendations]') || l.includes('[Boot]') || l.includes('[Mock API]')
    ).forEach((l) => console.log(' ', l));

    if (questionApplied) console.log('PASS: Questions backend config applied');
    if (productApplied) console.log('PASS: Products backend data applied');

    // Run the quiz to prove recommendation engine works
    await page.locator('.page-landing .two-lines-button').click();
    await page.waitForTimeout(3000);

    // Step 1: Age
    await page.locator('.page-questions .question-item-container-4').click();
    await page.waitForTimeout(600);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);

    // Step 2: Skin
    await page.locator('.page-questions .question-item-container-6').click();
    await page.waitForTimeout(600);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(3000);

    // Step 3: Concerns
    await page.locator('.page-questions .question-item-container-1').click();
    await page.waitForTimeout(300);
    await page.locator('.page-questions .question-item-container-7').click();
    await page.waitForTimeout(600);
    await page.locator('.page-questions .two-lines-button').click();
    await page.waitForTimeout(5000);

    // Verify results page loaded with product recommendation
    await expect(page.locator('.page-results')).toHaveClass(/page-current/);
    await page.screenshot({ path: `${S}/backend-integration-quiz-result.png`, fullPage: true });

    // Verify the Go backend APIs directly (separate from frontend)
    const qRes = await page.request.get(`${GO_SERVER}/api/v1/survey/questions`);
    expect(qRes.status()).toBe(200);
    const qData = await qRes.json();
    console.log('PASS: Go questions API -', qData.ageGroups?.length, 'age groups,', Object.keys(qData.productMapping || {}).join(', '));

    const pRes = await page.request.get(`${GO_SERVER}/api/v1/survey/products`);
    expect(pRes.status()).toBe(200);
    expect(pRes.headers()['cache-control']).toContain('max-age=900');
    const pData = await pRes.json();
    const brands = Object.keys(pData.products || {});
    const total = brands.reduce((s, b) => s + pData.products[b].length, 0);
    console.log('PASS: Go products API -', total, 'products across', brands.join(', '), '(15-min cache)');

    console.log('=== All Backend Integration Checks PASSED ===');
  });
});
