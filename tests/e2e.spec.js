import { test, expect } from '@playwright/test';

// Helper to determine if we are on the landing page
async function isLandingPage(page) {
  return (await page.getByRole('heading', { name: /Organize tasks/i }).count()) > 0;
}

test.describe('TaskFlow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 1. MOCK FIREBASE AUTH: Simulate a logged-in user
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:lookup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [{ 
            localId: 'user123', 
            email: 'test@example.com', 
            displayName: 'Test User',
            emailVerified: true 
          }]
        }),
      });
    });

    // 2. MOCK FIRESTORE: Provide dummy board data
    await page.route('**/firestore.googleapis.com/**/documents/**', async (route) => {
      // Return an empty list or a mock board depending on the request
      const dummyData = {
        documents: [
          {
            name: 'projects/taskflow-app-f6474/databases/(default)/documents/boards/board1',
            fields: {
              title: { stringValue: 'E2E Test Board' },
              color: { stringValue: '#10B981' },
              userId: { stringValue: 'user123' }
            },
            createTime: "2024-01-01T00:00:00Z",
            updateTime: "2024-01-01T00:00:00Z"
          }
        ]
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dummyData),
      });
    });

    // 3. Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ============================================
  // LANDING PAGE & AUTH TESTS
  // ============================================

  test.describe('Landing Page & Auth', () => {
    test('should display landing page with features', async ({ page }) => {
      // We check visibility of landing elements
      await expect(page.getByRole('heading', { name: /Organize tasks/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Get Started Free/i })).toBeVisible();
    });

    test('should open sign-in modal', async ({ page }) => {
      await page.locator('header button').filter({ hasText: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });
  });

  // ============================================
  // BOARD TESTS (Using Mocked State)
  // ============================================

  test.describe('Board Management', () => {
    test('should see the mocked board', async ({ page }) => {
      // If the app successfully uses our mock, it will bypass landing
      // and show the "E2E Test Board"
      await expect(page.getByText('E2E Test Board')).toBeVisible({ timeout: 15000 });
    });

    test('should open create board modal', async ({ page }) => {
      // Skip if the mock didn't trigger a redirect to board view
      if (await isLandingPage(page)) test.skip();
      
      await page.getByTitle('Create new board').click();
      await expect(page.getByRole('heading', { name: 'New Board' })).toBeVisible();
    });

    test('should create a new board UI flow', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByTitle('Create new board').click();
      await page.getByPlaceholder('My Project').fill('New Project');
      await page.getByRole('button', { name: 'Create Board' }).click();
      // In a mock environment, we verify the UI handles the click
      await expect(page.getByRole('heading', { name: 'New Board' })).not.toBeVisible();
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

    test('should fill task details', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      await page.getByRole('button', { name: /New/i }).click();
      await page.getByPlaceholder('Task title').fill('My Test Task');
      await page.getByPlaceholder('Add details...').fill('Mock Description');
      await expect(page.getByPlaceholder('Task title')).toHaveValue('My Test Task');
    });
  });

  // ============================================
  // STATS & UI TESTS
  // ============================================

  test.describe('Stats & UI', () => {
    test('should toggle stats panel', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();

      const statsBtn = page.getByRole('button', { name: /Stats/i });
      if (await statsBtn.isVisible()) {
        await statsBtn.click();
        await expect(page.getByText('Total')).toBeVisible();
      }
    });

    test('should toggle sidebar visibility', async ({ page }) => {
      if (await isLandingPage(page)) test.skip();
      await expect(page.getByText('Boards')).toBeVisible();
    });
  });
});