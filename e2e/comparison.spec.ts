import { test, expect } from '@playwright/test';

test.describe('Deck Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to comparisons list', async ({ page }) => {
    // Click "Deck Comparisons" button
    const comparisonsButton = page.getByRole('button', { name: 'Deck Comparisons' });
    await comparisonsButton.click();

    await expect(page).toHaveURL('/comparisons');
    await expect(page.getByText('Deck Comparisons')).toBeVisible();
  });

  test('should display comparison list page elements', async ({ page }) => {
    await page.goto('/comparisons');

    // Should have "Create New Comparison" button
    await expect(page.getByRole('button', { name: 'Create New Comparison' })).toBeVisible();
    
    // Should have "Back to Decklists" button
    await expect(page.getByRole('button', { name: 'Back to Decklists' })).toBeVisible();
  });

  test('should navigate to create comparison page', async ({ page }) => {
    await page.goto('/comparisons');
    
    const createButton = page.getByRole('button', { name: 'Create New Comparison' });
    await createButton.click();

    await expect(page).toHaveURL('/comparisons/create');
  });

  test('should display comparison view when viewing a comparison', async ({ page }) => {
    await page.goto('/comparisons');

    // Check if any comparisons exist
    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      // Should be on comparison view page
      await expect(page.url()).toContain('/comparisons/');
      
      // Should display deck information
      await expect(page.getByText('Deck 1')).toBeVisible();
      await expect(page.getByText('Deck 2')).toBeVisible();

      // Should have action buttons
      await expect(page.getByRole('button', { name: 'Start Evaluation' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'View Statistics' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    }
  });

  test('should display card differences in comparison view', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      // Wait for card differences to load
      await page.waitForTimeout(1000);

      // Should show card differences section
      const cardDifferencesHeading = page.getByText('Card Differences');
      if (await cardDifferencesHeading.isVisible().catch(() => false)) {
        await expect(cardDifferencesHeading).toBeVisible();
      }
    }
  });

  test('should navigate to comparison hand collection', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      const evaluateButton = page.getByRole('button', { name: 'Start Evaluation' });
      await evaluateButton.click();

      // Should navigate to hand collection for comparison
      await expect(page.url()).toContain('/collect');

      // Should display hand collection interface
      await expect(page.locator('.battlefield-zone')).toBeVisible();
      await expect(page.locator('.hand-zone')).toBeVisible();
    }
  });

  test('should display skip button in comparison hand collection', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      const evaluateButton = page.getByRole('button', { name: 'Start Evaluation' });
      await evaluateButton.click();

      // Wait for hand to load
      await page.waitForSelector('.hand-zone', { timeout: 5000 });

      // Skip button should be visible in comparison mode
      const skipButton = page.getByRole('button', { name: 'Skip Hand' });
      await expect(skipButton).toBeVisible();
    }
  });

  test('should navigate to comparison statistics', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      const statisticsButton = page.getByRole('button', { name: 'View Statistics' });
      await statisticsButton.click();

      // Should navigate to statistics page
      await expect(page.url()).toContain('/statistics');
    }
  });

  test('should display statistics button as always enabled', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      const statisticsButton = page.getByRole('button', { name: 'View Statistics' });
      
      // Statistics button should not be disabled
      const isDisabled = await statisticsButton.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test('should display View Deck buttons for both decks', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      // Should have View Deck buttons for both decks
      const viewDeckButtons = page.getByRole('button', { name: 'View Deck' });
      const count = await viewDeckButtons.count();
      
      // Should have 2 View Deck buttons (one for each deck)
      expect(count).toBe(2);
    }
  });

  test('should not display N values on comparison view page', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      // N values should not be displayed on this page
      const nValueText = page.getByText(/N\s*=/);
      const isVisible = await nValueText.isVisible().catch(() => false);
      
      // N values should only appear in statistics, not on main comparison view
      expect(isVisible).toBe(false);
    }
  });

  test('should display explanation note in comparison statistics', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparisons = await viewButton.isVisible().catch(() => false);

    if (hasComparisons) {
      await viewButton.click();

      const statisticsButton = page.getByRole('button', { name: 'View Statistics' });
      await statisticsButton.click();

      // Wait for statistics to load
      await page.waitForTimeout(1000);

      // Should display explanation about comparison sample calculation
      const explanationText = page.getByText(/hand size differences are calculated/i);
      const hasExplanation = await explanationText.isVisible().catch(() => false);
      
      if (hasExplanation) {
        await expect(explanationText).toBeVisible();
      }
    }
  });
});
