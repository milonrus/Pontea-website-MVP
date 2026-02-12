import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /PONTEA/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /English/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Русский/i })).toBeVisible();
});
