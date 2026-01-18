import { test } from '@playwright/test';

// Skip the auth setup for this test
test.use({ storageState: { cookies: [], origins: [] } });

test('take screenshots', async ({ page }) => {
  // Login page screenshot
  await page.goto('http://app.dailychexly.local.com:9002/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-login.png', fullPage: true });

  // Login via dev endpoint
  await page.goto('http://api.dailychexly.local.com:8080/api/v1/auth/dev/login');
  await page.waitForTimeout(2000);

  // Checklist overview page screenshot
  await page.goto('http://app.dailychexly.local.com:9002/checklist');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-overview.png', fullPage: true });
});
