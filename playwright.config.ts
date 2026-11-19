import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the production build (npm run build && vite preview).
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    viewport: { width: 1360, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
