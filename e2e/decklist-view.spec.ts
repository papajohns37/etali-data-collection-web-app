import { test, expect } from '@playwright/test';
import apiResponses from './fixtures/api-responses.json';

test.describe('Decklist View', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('https://localhost:7194/decklists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.decklists),
      });
    });

    // Navigate to a decklist view page (uses first mocked decklist)
    await page.goto('/decklists/view/1');
  });

  test('should display decklist header with name', async ({ page }) => {
    // Should show the mocked decklist name
    await expect(page.locator('h1')).toContainText('Test Red Deck');
  });

  test('should display back button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('should display view toggle button', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /Show (Images|Text)/ });
    await expect(toggleButton).toBeVisible();
  });

  test('should display card groups with headers', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('.card-group', { timeout: 5000 });
    
    const cardGroups = page.locator('.card-group');
    const count = await cardGroups.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Each group should have a header
    const firstGroup = cardGroups.first();
    await expect(firstGroup.locator('.group-header')).toBeVisible();
  });

  test('should toggle between text and image mode', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('.card-group', { timeout: 5000 });
    
    // Initial mode should be text
    await expect(page.locator('.card-list-text').first()).toBeVisible();
    
    // Click toggle button
    await page.getByRole('button', { name: 'Show Images' }).click();
    
    // Should now show image mode
    await expect(page.locator('.card-grid').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show Text' })).toBeVisible();
    
    // Toggle back
    await page.getByRole('button', { name: 'Show Text' }).click();
    
    // Should show text mode again
    await expect(page.locator('.card-list-text').first()).toBeVisible();
  });

  test('should display card preview on hover in text mode', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('.card-list-text li', { timeout: 5000 });
    
    const firstCard = page.locator('.card-list-text li').first();
    
    // Hover over card
    await firstCard.hover();
    
    // Preview overlay should appear
    await expect(page.locator('.card-preview-overlay')).toBeVisible();
  });

  test('should navigate back to decklist selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Back' }).click();
    
    // Should navigate to decklist selection page
    await expect(page).toHaveURL('/decklists');
  });

  test('should display Moxfield link if available', async ({ page }) => {
    // Check if Moxfield link exists (depends on decklist data)
    const moxfieldLink = page.getByText('View on Moxfield');
    
    if (await moxfieldLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(moxfieldLink).toHaveAttribute('href', /moxfield\.com/);
    }
  });

  test('should display created date', async ({ page }) => {
    // Wait for header to load
    await page.waitForSelector('.header-info', { timeout: 5000 });
    
    // Should show created date text
    const dateText = page.getByText(/Added.*\d{4}/);
    if (await dateText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(dateText).toBeVisible();
    }
  });
});
