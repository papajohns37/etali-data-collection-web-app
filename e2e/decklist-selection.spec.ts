import { test, expect } from '@playwright/test';
import apiResponses from './fixtures/api-responses.json';

test.describe('Decklist Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('https://localhost:7194/decklists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.decklists),
      });
    });

    await page.goto('/');
  });

  test('should display decklist selection page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Select a Decklist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New Decklist' })).toBeVisible();
  });

  test('should show empty state when no decklists exist', async ({ page }) => {
    // Override the default mock with empty array
    await page.route('https://localhost:7194/decklists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    await page.goto('/');
    
    // Should show empty state message
    await expect(page.locator('.decklist-card')).toHaveCount(0);
    // The page should still show the header and add button
    await expect(page.getByRole('heading', { name: 'Select a Decklist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New Decklist' })).toBeVisible();
  });

  test('should display decklists when they exist', async ({ page }) => {
    // With mocked API, we should always have 2 decklists
    const decklistCards = page.locator('.decklist-card');
    await expect(decklistCards).toHaveCount(2);

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
    await viewButton.click();
    
    // Should navigate to decklist view page with ID 1
    await expect(page).toHaveURL(/\/decklists\/view\/1/);
  });

  test('should navigate to hand collection when clicking Test Hands', async ({ page }) => {
    // Mock random hand API
    await page.route('https://localhost:7194/hand*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.randomHand),
      });
    });

    const testHandsButton = page.getByRole('button', { name: 'Test Hands' }).first();
    await testHandsButton.click();
    
    // Should navigate to hand collection page
    await expect(page).toHaveURL(/\/hand-collection/);
  });

  test('should navigate to statistics when clicking Statistics', async ({ page }) => {
    // Mock statistics API
    await page.route('https://localhost:7194/decklists/*/statistics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.statistics),
      });
    });

    const statsButton = page.getByRole('button', { name: 'Statistics' }).first();
    await statsButton.click();
    
    // Should navigate to statistics page with ID 1
    await expect(page).toHaveURL(/\/decklists\/1\/statistics/);
  });
});
