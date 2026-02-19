import { test, expect } from '@playwright/test';

test.describe('TaskFlow Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // We keep the mocks to prevent the app from hanging on real network calls
    await page.route('**/identitytoolkit.googleapis.com/**', route => route.fulfill({ status: 200, body: '{}' }));
    await page.route('**/firestore.googleapis.com/**', route => route.fulfill({ status: 200, body: '{}' }));
    
    await page.goto('/');
  });

  test('Application should load and show title', async ({ page }) => {
    // Check for the most basic thing: the page title or the main App container
    await expect(page).toHaveTitle(/TaskFlow/i); 
  });

});