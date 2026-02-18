import { test, expect } from '@playwright/test';

test.describe('TaskFlow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should create a new task', async ({ page }) => {
    await page.click('button:has-text("New")');
    await page.fill('input[placeholder="Task title"]', 'Test Task');
    await page.fill('textarea[placeholder="Add details..."]', 'Test Description');
    await page.click('button:has-text("Create Task")');
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    const body = page.locator('body');
    await page.click('button[aria-label="Toggle theme"]');
    await expect(body).toHaveClass(/dark/);
  });

  test('should search tasks', async ({ page }) => {
    await page.fill('input[placeholder="Search..."]', 'test');
    await page.waitForTimeout(500);
  });
});
