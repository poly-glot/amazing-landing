// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const S = path.join(process.cwd(), '..', 'screenshots');
const BASE = 'http://localhost:8080';

test.describe('Admin Portal Screenshots', () => {
  test.use({ viewport: { width: 1280, height: 900 }, baseURL: BASE });

  test('capture full admin experience', async ({ page, context }) => {
    // ─── 1. LOGIN ──────────────────────────────────────────────
    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${S}/admin-01-login.png`, fullPage: true });

    // Try changed password first, fallback to seed password
    await page.fill('input[name="email"]', 'admin@azadi.com');
    await page.fill('input[name="password"]', 'NewSecurePass123!');
    await page.screenshot({ path: `${S}/admin-02-login-filled.png`, fullPage: true });
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(1500);

    let currentUrl = page.url();
    console.log('After login:', currentUrl);

    // If login failed (wrong password), try seed password
    if (currentUrl.includes('/login')) {
      await page.fill('input[name="email"]', 'admin@azadi.com');
      await page.fill('input[name="password"]', 'changeme123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForTimeout(1500);
      currentUrl = page.url();
      console.log('After seed password login:', currentUrl);
    }

    // Handle forced password change
    if (currentUrl.includes('/change-password')) {
      await page.screenshot({ path: `${S}/admin-03-change-password.png`, fullPage: true });

      const currentPwField = page.locator('input[name="current_password"]');
      if (await currentPwField.isVisible()) {
        await currentPwField.fill('changeme123');
      }
      await page.fill('input[name="new_password"]', 'NewSecurePass123!');
      await page.fill('input[name="confirm_password"]', 'NewSecurePass123!');
      await page.screenshot({ path: `${S}/admin-04-change-password-filled.png`, fullPage: true });
      await page.getByRole('button', { name: 'Update Password' }).click();
      await page.waitForTimeout(1500);
      currentUrl = page.url();
      console.log('After password change:', currentUrl);

      // Re-login with new password if redirected to login
      if (currentUrl.includes('/login')) {
        await page.fill('input[name="email"]', 'admin@azadi.com');
        await page.fill('input[name="password"]', 'NewSecurePass123!');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForTimeout(1500);
      }
    }

    console.log('Navigating admin at:', page.url());

    // ─── 2. DASHBOARD ──────────────────────────────────────────
    await page.goto('/admin');
    await page.waitForTimeout(2000); // Extra time for Tailwind CDN to load
    await page.screenshot({ path: `${S}/admin-05-dashboard.png`, fullPage: true });
    console.log('Dashboard URL:', page.url());

    // ─── 3. STORES ─────────────────────────────────────────────
    await page.goto('/admin/stores');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-06-stores-list.png`, fullPage: true });

    // ─── 4. STORE FORM ─────────────────────────────────────────
    await page.goto('/admin/stores/new');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-07-store-form.png`, fullPage: true });

    // ─── 5. PROMOTIONS ─────────────────────────────────────────
    await page.goto('/admin/promotions');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-08-promotions-list.png`, fullPage: true });

    // ─── 6. PROMOTION FORM ─────────────────────────────────────
    await page.goto('/admin/promotions/new');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-09-promotion-form.png`, fullPage: true });

    // ─── 7. CREATE A SUBMISSION VIA API ────────────────────────
    const submitRes = await page.request.post(`${BASE}/api/v1/survey/customer`, {
      form: {
        firstname: 'Jane', lastname: 'Smith', email: 'jane@example.com',
        subscribe: 'true', accept_terms: 'true', age: '35-45', skin: 'Dry',
        concern_1: 'Dark spots/Uneven skin tone', concern_2: 'Fine lines and wrinkles',
        product: 'Bloom', store_id: '5629499534213120', address: 'London, UK',
        country: 'GB', lat: '51.5074', lng: '-0.1278', promotion_link: 'default',
      },
    });
    const submitData = await submitRes.json();
    console.log('Created submission:', submitData);

    let emailPreviewUrl = '';
    if (submitData.submission_id) {
      const emailRes = await page.request.post(`${BASE}/api/v1/survey/email`, {
        form: { submission_id: String(submitData.submission_id) },
      });
      const emailData = await emailRes.json();
      console.log('Email result:', emailData);
      emailPreviewUrl = emailData.email_preview_url || '';
    }

    // ─── 8. SUBMISSIONS LIST ───────────────────────────────────
    await page.goto('/admin/submissions');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-10-submissions-list.png`, fullPage: true });

    // ─── 9. SUBMISSION DETAIL ──────────────────────────────────
    const viewLink = page.locator('a[href*="/admin/submissions/"]').first();
    if (await viewLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewLink.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${S}/admin-11-submission-detail.png`, fullPage: true });
    }

    // ─── 10. EMAIL PREVIEW ─────────────────────────────────────
    if (emailPreviewUrl) {
      await page.goto(emailPreviewUrl);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${S}/admin-12-email-preview.png`, fullPage: true });
    }

    // ─── 11. PRODUCTS LIST ─────────────────────────────────────
    await page.goto('/admin/products');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-13-products-list.png`, fullPage: true });

    // ─── 12. NEW PRODUCT FORM ──────────────────────────────────
    await page.goto('/admin/products/new');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-14-product-form.png`, fullPage: true });

    // ─── 13. QUESTIONS — create age group via form ─────────────
    await page.goto('/admin/questions/new');
    await page.waitForTimeout(500);
    await page.fill('input[name="age_name"]', '35-45');
    await page.getByRole('button', { name: 'Create & configure' }).click();
    await page.waitForTimeout(2000);
    console.log('After create URL:', page.url());

    // Navigate explicitly to the edit page in case redirect failed
    if (!page.url().includes('/edit')) {
      await page.goto('/admin/questions/35-45/edit');
      await page.waitForTimeout(1500);
    }

    // Fill in skin types
    await page.fill('input[name="skin_types"]', 'Dry, Normal, Oily/Combination, Mature');

    // Fill first concern row
    const concernInputs = await page.locator('input[name="concern_text"]');
    await concernInputs.first().fill('Dark spots/Uneven skin tone');
    const productSelects = await page.locator('select[name="concern_product"]');
    await productSelects.first().selectOption('Bloom');

    // Add more concerns
    await page.getByRole('button', { name: '+ Add concern' }).click();
    await page.waitForTimeout(300);
    const allConcerns = await page.locator('input[name="concern_text"]');
    await allConcerns.nth(1).fill('Fine lines and wrinkles');
    const allProducts = await page.locator('select[name="concern_product"]');
    await allProducts.nth(1).selectOption('Rise');

    await page.getByRole('button', { name: '+ Add concern' }).click();
    await page.waitForTimeout(300);
    await allConcerns.nth(2).fill('Comfort and nourishment');
    await allProducts.nth(2).selectOption('Bloom');

    await page.getByRole('button', { name: '+ Add concern' }).click();
    await page.waitForTimeout(300);
    await allConcerns.nth(3).fill('Sensitivity');
    await allProducts.nth(3).selectOption('Silk');

    // Set priority
    const prioritySelects = await page.locator('select[name="priority"]');
    if (await prioritySelects.count() >= 4) {
      await prioritySelects.nth(0).selectOption('Bloom');
      await prioritySelects.nth(1).selectOption('Rise');
      await prioritySelects.nth(2).selectOption('Glow');
      await prioritySelects.nth(3).selectOption('Silk');
    }

    await page.screenshot({ path: `${S}/admin-15a-question-edit.png`, fullPage: true });

    // Save
    await page.getByRole('button', { name: 'Save age group' }).click();
    await page.waitForTimeout(1500);

    // Questions overview with saved data
    await page.goto('/admin/questions');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-15-questions.png`, fullPage: true });

    // ─── 14. USERS ─────────────────────────────────────────────
    await page.goto('/admin/users');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/admin-16-users-list.png`, fullPage: true });

    // ─── 15. TEST CSV EXPORT ───────────────────────────────────
    const csvRes = await page.request.get(`${BASE}/admin/submissions/export`);
    console.log('CSV export status:', csvRes.status());
    console.log('CSV content-type:', csvRes.headers()['content-type']);
    const csvBody = await csvRes.text();
    console.log('CSV first line:', csvBody.split('\\n')[0]);

    // ─── 16. TEST PRODUCTS API CACHE ───────────────────────────
    const prodRes = await page.request.get(`${BASE}/api/v1/survey/products`);
    console.log('Products API cache-control:', prodRes.headers()['cache-control']);

    console.log('=== Admin screenshots complete ===');
  });
});
