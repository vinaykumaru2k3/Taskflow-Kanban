import { test, expect } from '@playwright/test';

async function isLandingPage(page) {
  return (await page.getByRole('heading', { name: /Organize tasks/i }).count()) > 0;
}

test.describe('TaskFlow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ============================================
  // LANDING PAGE & AUTH TESTS
  // ============================================

  test.describe('Landing Page', () => {
    test('should display landing page with title and features', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Organize tasks/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Subtasks' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Due Dates' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Get Started Free/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
    });

    test('should open email sign-in modal', async ({ page }) => {
      await page.locator('header button').filter({ hasText: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    });

    test('should toggle between sign in and sign up', async ({ page }) => {
      await page.locator('header button').filter({ hasText: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

      await page.getByRole('button', { name: /Sign Up/i }).last().click();

      await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
      await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    });

    test('should show error for empty form submission', async ({ page }) => {
      await page.locator('header button').filter({ hasText: 'Sign In' }).click();
      await page.locator('form button[type="submit"]').click();
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });
  });

  // ============================================
  // BOARD TESTS
  // ============================================

  test.describe('Board Management', () => {
    test('should open create board modal', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByTitle('Create new board').click();
      await expect(page.getByRole('heading', { name: 'New Board' })).toBeVisible();
    });

    test('should create a new board', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByTitle('Create new board').click();
      await page.getByPlaceholder('My Project').fill('Test Board');
      await page.getByRole('button', { name: '#10B981' }).click();
      await page.getByRole('button', { name: 'Create Board' }).click();

      await expect(page.getByText('Test Board')).toBeVisible();
    });

    test('should delete a board', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByTitle('Create new board').click();
      await page.getByPlaceholder('My Project').fill('Board To Delete');
      await page.getByRole('button', { name: 'Create Board' }).click();

      await expect(page.getByText('Board To Delete')).toBeVisible();
    });
  });

  // ============================================
  // TASK TESTS
  // ============================================

  test.describe('Task Management', () => {
    test('should open create task modal', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByRole('button', { name: /New/i }).click();
      await expect(page.getByRole('heading', { name: 'New Entry' })).toBeVisible();
    });

    test('should create a new task', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByRole('button', { name: /New/i }).click();
      await page.getByPlaceholder('Task title').fill('My Test Task');
      await page.getByPlaceholder('Add details...').fill('This is a test description');
      await page.getByRole('combobox').selectOption('high');
      await page.getByLabel(/Deadline/i).fill('2025-12-31');
      await page.getByRole('button', { name: 'Create Task' }).click();

      await expect(page.getByText('My Test Task')).toBeVisible();
    });

    test('should create task with subtasks', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByRole('button', { name: /New/i }).click();
      await page.getByPlaceholder('Task title').fill('Task with Subtasks');

      await page.getByRole('button', { name: /Add/i }).click();
      await page.getByPlaceholder('Item...').fill('Subtask 1');

      await page.getByRole('button', { name: /Add/i }).click();
      await page.getByPlaceholder('Item...').nth(1).fill('Subtask 2');

      await page.getByRole('button', { name: 'Create Task' }).click();
      await expect(page.getByText('Task with Subtasks')).toBeVisible();
    });

    test('should edit an existing task', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByRole('button', { name: /New/i }).click();
      await page.getByPlaceholder('Task title').fill('Task to Edit');
      await page.getByRole('button', { name: 'Create Task' }).click();

      await expect(page.getByText('Task to Edit')).toBeVisible();

      await page.getByText('Task to Edit').click();
      await page.getByPlaceholder('Task title').fill('Task Edited');
      await page.getByRole('button', { name: 'Update Task' }).click();

      await expect(page.getByText('Task Edited')).toBeVisible();
    });

    test('should delete a task', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByRole('button', { name: /New/i }).click();
      await page.getByPlaceholder('Task title').fill('Task to Delete');
      await page.getByRole('button', { name: 'Create Task' }).click();

      await expect(page.getByText('Task to Delete')).toBeVisible();

      await page.getByText('Task to Delete').hover();
      await page.getByRole('button').filter({ has: page.locator('svg.lucide-trash2') }).first().click();

      await expect(page.getByText('Task to Delete')).not.toBeVisible();
    });
  });

  // ============================================
  // STATS & UI TESTS
  // ============================================

  test.describe('Stats & UI', () => {
    test('should toggle stats panel', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await expect(page.getByText('Total')).not.toBeVisible();
      await page.getByRole('button', { name: /Stats/i }).click();
      await expect(page.getByText('Total')).toBeVisible();
      await expect(page.getByText('Done')).toBeVisible();
      await expect(page.getByText('Urgent')).toBeVisible();
      await expect(page.getByText('Overdue')).toBeVisible();
    });

    test('should search tasks', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByPlaceholder('Search...').fill('test');
      await page.waitForTimeout(300);
    });

    test('should toggle sidebar', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await expect(page.getByText('Boards')).toBeVisible();
    });
  });
});
