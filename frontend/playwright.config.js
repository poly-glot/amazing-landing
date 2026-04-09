import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: '2026-desktop',
      testMatch: /2026-desktop/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: '2026-mobile',
      testMatch: /2026-mobile/,
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: '2015-desktop',
      testMatch: /2015-desktop/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: '2015-mobile',
      testMatch: /2015-mobile/,
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  webServer: {
    command: 'npx vite --port 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
