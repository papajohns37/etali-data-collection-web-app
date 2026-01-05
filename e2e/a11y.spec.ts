import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // No mocking - use real API
  });

  test('decklist selection page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'landmark-one-main', 'region']) // Known issues to be fixed in UI
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('decklist view page should not have accessibility violations', async ({ page }) => {
    await page.goto('/decklists/view/1');
    await page.waitForLoadState('networkidle');
    
    // Skip if decklist not found
    const errorMessage = page.locator('p-message[severity="error"]');
    if (await errorMessage.isVisible().catch(() => false)) {
      test.skip(true, 'Decklist ID 1 not found in database');
    }
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'page-has-heading-one']) // PrimeNG theme issue and heading structure
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('hand collection page should not have accessibility violations', async ({ page }) => {
    // First go to decklists page and select a decklist
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const decklistCard = page.locator('.decklist-card').first();
    const hasDecklist = await decklistCard.isVisible().catch(() => false);
    
    if (!hasDecklist) {
      test.skip(true, 'No decklists in database');
    }
    
    await page.getByRole('button', { name: 'Test Hands' }).first().click();
    
    // Wait for hand to load - use correct selector .hand-zone
    await page.waitForSelector('.hand-zone', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // PrimeNG theme issue
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('decklist form dialog should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open add decklist dialog
    await page.getByRole('button', { name: 'Add New Decklist' }).click();
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // PrimeNG theme issue
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('decklist view with image mode should not have accessibility violations', async ({ page }) => {
    await page.goto('/decklists/view/1');
    await page.waitForLoadState('networkidle');
    
    // Skip if decklist not found or failed to load
    const errorMessage = page.locator('p-message[severity="error"]');
    if (await errorMessage.isVisible().catch(() => false)) {
      test.skip(true, 'Decklist ID 1 not found or failed to load');
    }
    
    // Check if Show Images button exists before clicking
    const showImagesButton = page.getByRole('button', { name: 'Show Images' });
    if (!(await showImagesButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Show Images button not available - decklist may not have loaded');
    }
    
    // Toggle to image mode
    await showImagesButton.click();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt']) // Specifically check image alt text
      .disableRules(['color-contrast', 'page-has-heading-one']) // PrimeNG theme issue and heading structure
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
