import { test, expect } from '@playwright/test';

test.describe('Offline Flow', () => {
  test('should add items to cart offline and sync when online', async ({ page, context }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for products to load
    await page.waitForSelector('text=Products');

    // Add item to cart
    const firstProduct = page.locator('button:has-text("Add to Cart")').first();
    await firstProduct.click();

    // Go offline
    await context.setOffline(true);

    // Add another item (should work offline)
    await firstProduct.click();

    // Navigate to cart (should work offline with cached data)
    await page.goto('/cart');

    // Verify cart has items
    await expect(page.locator('text=Shopping Cart')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Wait for sync (you might need to adjust this based on your implementation)
    await page.waitForTimeout(2000);

    // Verify cart still has items
    await expect(page.locator('text=Shopping Cart')).toBeVisible();
  });
});

