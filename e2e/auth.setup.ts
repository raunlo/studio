import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page, context }) => {
  // Navigate to the app
  await page.goto('/');

  // Wait for Google login button and click it
  console.log('Please complete the Google login manually in the browser...');

  // Wait for the login button using test ID
  const loginButton = page.getByTestId('google-login-button');
  await expect(loginButton).toBeVisible({ timeout: 10000 });

  // Click login button - this will redirect to Google OAuth
  await loginButton.click();

  // Wait for user to complete OAuth flow and be redirected to /checklist
  // This might take a while as the user needs to login manually
  await page.waitForURL('**/checklist', { timeout: 120000 }); // 2 minutes timeout

  console.log('Authentication successful! Saving session...');

  // Save signed-in state
  await context.storageState({ path: authFile });
});
