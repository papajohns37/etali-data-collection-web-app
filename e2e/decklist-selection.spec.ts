import { test, expect } from '@playwright/test';

test.describe('Decklist Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display decklist selection page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Select a Decklist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New Decklist' })).toBeVisible();
  });

  test('should show empty state when no decklists exist', async ({ page }) => {
    
    // Should show empty state message
    await expect(page.locator('.decklist-card')).toHaveCount(0);
    // The page should still show the header and add button
    await expect(page.getByRole('heading', { name: 'Select a Decklist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New Decklist' })).toBeVisible();
  });

  test('should display decklists when they exist', async ({ page }) => {
    // Check if any decklists exist
    const decklistCards = page.locator('.decklist-card');
    const count = await decklistCards.count();
    
    // Skip test if no decklists in database
    test.skip(count === 0, 'No decklists in database');
    
    await expect(decklistCards.count()).toBeGreaterThan(0);

    // Verify first decklist has expected buttons
    const firstCard = decklistCards.first();
    await expect(firstCard.getByRole('button', { name: 'View Decklist' })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: 'Test Hands' })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: 'Statistics' })).toBeVisible();
  });

  test('should open add decklist modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add New Decklist' }).click();
    
    // Wait for dialog to open and be visible
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 3000 });
    
    // Verify modal is visible by checking for dialog content
    // PrimeNG dialog headers may not have heading role, check for text content instead
    await expect(page.locator('[role="dialog"]')).toContainText('Add New Decklist');
  });

  test('should navigate to decklist view when clicking View Decklist', async ({ page }) => {
    const viewButton = page.getByRole('button', { name: 'View Decklist' }).first();
    const isVisible = await viewButton.isVisible().catch(() => false);
    
    test.skip(!isVisible, 'No decklists in database');
    
    await viewButton.click();
    
    // Should navigate to decklist view page
    await expect(page).toHaveURL(/\/decklists\/view\/\d+/);
  });

  test('should navigate to hand collection when clicking Test Hands', async ({ page }) => {
    const testHandsButton = page.getByRole('button', { name: 'Test Hands' }).first();
    const isVisible = await testHandsButton.isVisible().catch(() => false);
    
    test.skip(!isVisible, 'No decklists in database');
    
    await testHandsButton.click();
    
    // Should navigate to hand collection page
    await expect(page).toHaveURL(/\/hand-collection/);
  });

  test('should navigate to statistics when clicking Statistics', async ({ page }) => {
    const statsButton = page.getByRole('button', { name: 'Statistics' }).first();
    const isVisible = await statsButton.isVisible().catch(() => false);
    
    test.skip(!isVisible, 'No decklists in database');
    
    await statsButton.click();
    
    // Should navigate to statistics page
    await expect(page).toHaveURL(/\/decklists\/\d+\/statistics/);
  });
});
