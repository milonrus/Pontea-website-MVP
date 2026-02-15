import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test('root redirects to /ru even when cookie is en', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'en',
      url: baseURL
    }
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/ru$/);
});

test('visiting /en redirects to /ru', async ({ page }) => {
  await page.goto('/en');
  await expect(page).toHaveURL(/\/ru$/);
});

test('visiting /en/thank-you redirects to /ru/thank-you', async ({ page }) => {
  await page.goto('/en/thank-you');
  await expect(page).toHaveURL(/\/ru\/thank-you$/);
});

test('visiting /en/* fallback redirects to /ru', async ({ page }) => {
  await page.goto('/en/some-random-path');
  await expect(page).toHaveURL(/\/ru$/);
});

test('visiting /consultation redirects to /ru', async ({ page }) => {
  await page.goto('/consultation');
  await expect(page).toHaveURL(/\/ru$/);
});

test('visiting /methodology redirects to /ru', async ({ page }) => {
  await page.goto('/methodology');
  await expect(page).toHaveURL(/\/ru$/);
});

test('visiting /ru sets language cookie to ru', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/ru');

  const cookies = await page.context().cookies();
  const languageCookie = cookies.find((cookie) => cookie.name === 'pontea_lang');
  expect(languageCookie?.value).toBe('ru');
});

test('language switcher is hidden on /ru page', async ({ page }) => {
  await page.goto('/ru');
  await expect(page.locator('nav[aria-label="Language selector"]')).toHaveCount(0);
});

test('language switcher is hidden on /ru/thank-you page', async ({ page }) => {
  await page.goto('/ru/thank-you');
  await expect(page.locator('nav[aria-label="Language selector"]')).toHaveCount(0);
});
