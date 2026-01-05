import { test, expect } from '@playwright/test';

test.describe('Browser Back Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate back from decklist view to decklists list', async ({ page }) => {
    await page.goto('/decklists');

    // Click on "View Details" for first decklist if available
    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    const hasDecklist = await viewButton.isVisible().catch(() => false);

    if (hasDecklist) {
      await viewButton.click();
      await page.waitForURL(/\/decklists\/view\/\d+/);

      // Click Back button
      const backButton = page.getByRole('button', { name: 'Back' });
      await backButton.click();

      // Should return to decklists list
      await expect(page).toHaveURL('/decklists');
    }
  });

  test('should navigate back from comparison view to comparisons list', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparison = await viewButton.isVisible().catch(() => false);

    if (hasComparison) {
      await viewButton.click();
      await page.waitForURL(/\/comparisons\/\d+$/);

      // Click Back button
      const backButton = page.getByRole('button', { name: 'Back' });
      await backButton.click();

      // Should return to comparisons list
      await expect(page).toHaveURL('/comparisons');
    }
  });

  test('should navigate back from comparison statistics to comparison view', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparison = await viewButton.isVisible().catch(() => false);

    if (hasComparison) {
      await viewButton.click();
      const comparisonUrl = page.url();

      const statisticsButton = page.getByRole('button', { name: 'View Statistics' });
      await statisticsButton.click();
      await page.waitForURL(/\/statistics$/);

      // Click Back button
      const backButton = page.getByRole('button', { name: 'Back' });
      await backButton.click();

      // Should return to comparison view (not comparisons list)
      await expect(page).toHaveURL(comparisonUrl);
    }
  });

  test('should navigate back from comparison hand collection to comparison view', async ({ page }) => {
    await page.goto('/comparisons');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparison = await viewButton.isVisible().catch(() => false);

    if (hasComparison) {
      await viewButton.click();
      const comparisonUrl = page.url();

      const evaluateButton = page.getByRole('button', { name: 'Start Evaluation' });
      await evaluateButton.click();
      await page.waitForURL(/\/collect$/);

      // Click Back button
      const backButton = page.getByRole('button', { name: 'Back' });
      await backButton.click();

      // Should return to comparison view
      await expect(page).toHaveURL(comparisonUrl);
    }
  });

  test('should navigate back from decklist view when coming from comparison', async ({ page }) => {
    await page.goto('/comparisons');

    const viewComparisonButton = page.getByRole('button', { name: 'View' }).first();
    const hasComparison = await viewComparisonButton.isVisible().catch(() => false);

    if (hasComparison) {
      await viewComparisonButton.click();
      const comparisonUrl = page.url();

      // Click "View Deck" button (first one for Deck 1)
      const viewDeckButton = page.getByRole('button', { name: 'View Deck' }).first();
      await viewDeckButton.click();
      await page.waitForURL(/\/decklists\/view\/\d+/);

      // Click Back button on decklist view
      const backButton = page.getByRole('button', { name: 'Back' });
      await backButton.click();

      // Should return to comparison view (not decklists list)
      await expect(page).toHaveURL(comparisonUrl);
    }
  });

  test('should navigate back from deck statistics to decklist view', async ({ page }) => {
    await page.goto('/decklists');

    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    const hasDecklist = await viewButton.isVisible().catch(() => false);

    if (hasDecklist) {
      await viewButton.click();
      const decklistUrl = page.url();

      // Navigate to statistics
      const statisticsButton = page.getByRole('button', { name: 'View Statistics' });
      if (await statisticsButton.isVisible().catch(() => false)) {
        await statisticsButton.click();
        await page.waitForURL(/\/statistics$/);

        // Click Back button
        const backButton = page.getByRole('button', { name: 'Back' });
        await backButton.click();

        // Should return to decklist view
        await expect(page).toHaveURL(decklistUrl);
      }
    }
  });

  test('should navigate back from hand collection to decklists', async ({ page }) => {
    await page.goto('/decklists');

    const testHandsButton = page.getByRole('button', { name: 'Test Hands' }).first();
    const hasDecklist = await testHandsButton.isVisible().catch(() => false);

    if (hasDecklist) {
      await testHandsButton.click();
      await page.waitForURL('/hand-collection');

      // Click Back button
      const backButton = page.getByRole('button', { name: 'Back to Decklists' });
      await backButton.click();

      // Should return to decklists
      await expect(page).toHaveURL('/decklists');
    }
  });

  test('should navigate back from deck compare to decklist view', async ({ page }) => {
    await page.goto('/decklists');

    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    const hasDecklist = await viewButton.isVisible().catch(() => false);

    if (hasDecklist) {
      await viewButton.click();
      const decklistUrl = page.url();

      // Navigate to compare
      const compareButton = page.getByRole('button', { name: 'Compare' });
      if (await compareButton.isVisible().catch(() => false)) {
        await compareButton.click();
        await page.waitForURL(/\/compare$/);

        // Click Back button
        const backButton = page.getByRole('button', { name: 'Back' });
        await backButton.click();

        // Should return to decklist view
        await expect(page).toHaveURL(decklistUrl);
      }
    }
  });

  test('should use browser back button correctly', async ({ page }) => {
    await page.goto('/decklists');

    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    const hasDecklist = await viewButton.isVisible().catch(() => false);

    if (hasDecklist) {
      await viewButton.click();
      await page.waitForURL(/\/decklists\/view\/\d+/);

      // Use browser's back button
      await page.goBack();

      // Should be back at decklists list
      await expect(page).toHaveURL('/decklists');

      // Use browser's forward button
      await page.goForward();

      // Should be back at decklist view
      await expect(page.url()).toMatch(/\/decklists\/view\/\d+/);
    }
  });

  test('should maintain navigation history through multiple pages', async ({ page }) => {
    await page.goto('/decklists');

    const viewButton = page.getByRole('button', { name: 'View Details' }).first();
    const hasDecklist = await viewButton.isVisible().catch(() => false);

    if (hasDecklist) {
      // Navigate: decklists -> decklist view -> statistics
      await viewButton.click();
      await page.waitForURL(/\/decklists\/view\/\d+/);
      const decklistUrl = page.url();

      const statisticsButton = page.getByRole('button', { name: 'View Statistics' });
      if (await statisticsButton.isVisible().catch(() => false)) {
        await statisticsButton.click();
        await page.waitForURL(/\/statistics$/);

        // Navigate back twice using back buttons
        let backButton = page.getByRole('button', { name: 'Back' });
        await backButton.click();
        await expect(page).toHaveURL(decklistUrl);

        backButton = page.getByRole('button', { name: 'Back' });
        await backButton.click();
        await expect(page).toHaveURL('/decklists');
      }
    }
  });
});
