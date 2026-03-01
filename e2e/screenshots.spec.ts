import { test, expect } from '@playwright/test';
import path from 'path';

// Use the saved authentication state
test.use({ storageState: path.join(__dirname, '../.auth/user.json') });

test.describe('Take screenshots of all pages', () => {
  test('screenshot checklist overview page', async ({ page }) => {
    // Navigate to checklist overview
    await page.goto('/checklist');

    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra wait for animations

    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/checklist-overview.png',
      fullPage: true,
    });

    console.log('✓ Screenshot saved: checklist-overview.png');
  });

  test('screenshot individual checklist page', async ({ page }) => {
    // Navigate to checklist overview first
    await page.goto('/checklist');
    await page.waitForLoadState('networkidle');

    // Click on the first checklist (if any exist)
    const firstChecklist = page
      .locator('[class*="checklist-overview-card"], [class*="Card"]')
      .first();

    const exists = (await firstChecklist.count()) > 0;
    if (exists) {
      await firstChecklist.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/checklist-detail.png',
        fullPage: true,
      });

      console.log('✓ Screenshot saved: checklist-detail.png');
    } else {
      console.log('⚠ No checklists found, creating one for screenshot...');

      // Click the FAB button to create a checklist
      const fabButton = page.locator('button[aria-label*="checklist"], button:has(svg)').last();
      await fabButton.click();
      await page.waitForTimeout(500);

      // Fill in checklist name
      const nameInput = page.locator('input[id="checklist-name"]');
      await nameInput.fill('Test Checklist');

      // Click create button
      const createButton = page.locator('button:has-text("Create")');
      await createButton.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Now click the checklist
      const newChecklist = page.locator('[class*="Card"]').first();
      await newChecklist.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/checklist-detail.png',
        fullPage: true,
      });

      console.log('✓ Screenshot saved: checklist-detail.png');
    }
  });

  test('screenshot login page (logged out state)', async ({ page, context }) => {
    // Clear cookies to see login page
    await context.clearCookies();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'screenshots/login-page.png',
      fullPage: true,
    });

    console.log('✓ Screenshot saved: login-page.png');
  });
});
