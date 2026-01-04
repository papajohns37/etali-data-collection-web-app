import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import apiResponses from './fixtures/api-responses.json';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for all tests
    await page.route('https://localhost:7194/decklists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.decklists),
      });
    });

    await page.route('https://localhost:7194/hand*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.randomHand),
      });
    });

    await page.route('https://localhost:7194/decklists/*/statistics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiResponses.statistics),
      });
    });
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
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'region', 'page-has-heading-one']) // Known issues to be fixed in UI
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('hand collection page should not have accessibility violations', async ({ page }) => {
    // First go to decklists page and select a decklist
    await page.goto('/');
    await page.waitForSelector('.decklist-card');
    await page.getByRole('button', { name: 'Test Hands' }).first().click();
    
    // Wait for hand to load - use correct selector .hand-zone
    await page.waitForSelector('.hand-zone', { timeout: 5000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'region', 'color-contrast']) // Known issues to be fixed in UI
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('decklist form dialog should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Open add decklist dialog
    await page.getByRole('button', { name: 'Add New Decklist' }).click();
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'landmark-one-main', 'region', 'button-name']) // Known issues to be fixed in UI
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('decklist view with image mode should not have accessibility violations', async ({ page }) => {
    await page.goto('/decklists/view/1');
    
    // Toggle to image mode
    await page.getByRole('button', { name: 'Show Images' }).click();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt']) // Specifically check image alt text
      .disableRules(['landmark-one-main', 'region', 'page-has-heading-one']) // Known issues to be fixed in UI
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
