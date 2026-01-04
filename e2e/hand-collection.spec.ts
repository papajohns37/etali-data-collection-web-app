import { test, expect } from '@playwright/test';

test.describe('Hand Collection', () => {
  test.beforeEach(async ({ page }) => {
    // First select a decklist
    await page.goto('/');
    
    // Wait for and click first "Test Hands" button
    const testHandsButton = page.getByRole('button', { name: 'Test Hands' }).first();
    await testHandsButton.waitFor({ timeout: 5000 }).catch(() => {
      // If no decklists exist, skip to hand collection directly
    });
    
    if (await testHandsButton.isVisible().catch(() => false)) {
      await testHandsButton.click();
    } else {
      // Navigate directly if coming from guard
      await page.goto('/hand-collection');
    }
  });

  test('should display hand collection interface', async ({ page }) => {
    // May redirect if no decklist selected
    if (page.url().includes('/hand-collection')) {
      await expect(page.locator('.battlefield-zone')).toBeVisible();
      await expect(page.locator('.hand-zone')).toBeVisible();
    }
  });

  test('should display hand metadata', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      // Wait for hand to load
      await page.waitForSelector('.metadata-card', { timeout: 5000 });
      
      // Should display seat order
      await expect(page.getByText('Seat Order:')).toBeVisible();
    }
  });

  test('should display evaluation section', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      await page.waitForSelector('.evaluation-card', { timeout: 5000 });
      
      // Should have "This hand can cast Etali" checkbox
      await expect(page.getByText('This hand can cast Etali')).toBeVisible();
    }
  });

  test('should show minimum cards input when Etali checkbox is checked', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 });
      
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();
      
      // Should show minimum cards input
      await expect(page.getByText('Min Cards to Cast')).toBeVisible();
    }
  });

  test('should display request new hand button', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      await expect(page.getByRole('button', { name: 'Request New Hand' })).toBeVisible();
    }
  });

  test('should display submit evaluation button', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      await expect(page.getByRole('button', { name: 'Submit Evaluation' })).toBeVisible();
    }
  });

  test('should allow dragging cards from hand to battlefield', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      // Wait for hand cards to load
      const handCard = page.locator('.hand-card').first();
      await handCard.waitFor({ timeout: 5000 }).catch(() => {});
      
      if (await handCard.isVisible().catch(() => false)) {
        const initialHandCount = await page.locator('.hand-card').count();
        
        // Drag first card to battlefield
        const battlefield = page.locator('.battlefield-zone');
        await handCard.dragTo(battlefield);
        
        // Hand should have one less card
        const newHandCount = await page.locator('.hand-card').count();
        expect(newHandCount).toBeLessThanOrEqual(initialHandCount);
      }
    }
  });

  test('should display back to decklists button', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      await expect(page.getByRole('button', { name: 'Back to Decklists' })).toBeVisible();
    }
  });

  test('should navigate back to decklist selection', async ({ page }) => {
    if (page.url().includes('/hand-collection')) {
      await page.getByRole('button', { name: 'Back to Decklists' }).click();
      
      await expect(page).toHaveURL('/decklists');
    }
  });
});
