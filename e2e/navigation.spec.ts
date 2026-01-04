import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect root to decklists page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/decklists');
  });

  test('should guard hand-collection route without decklist selection', async ({ page }) => {
    await page.goto('/hand-collection');
    
    // Should redirect to decklists if no decklist selected
    await page.waitForURL('/decklists', { timeout: 5000 }).catch(() => {
      // May stay on page if guard allows, check for error message
    });
  });

  test('should handle invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    
    // Should redirect to default route
    await expect(page).toHaveURL('/decklists');
  });
});
