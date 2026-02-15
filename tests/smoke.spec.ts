import { test, expect } from '@playwright/test';

test('root redirects to /ru and renders ru landing without EN selector', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/ru$/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('link', { name: /English/i })).toHaveCount(0);
  await expect(page.locator('nav[aria-label="Language selector"]')).toHaveCount(0);
});
