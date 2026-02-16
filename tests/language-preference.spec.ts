import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test('root redirects to /en when language cookie is en', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'en',
      url: baseURL,
    },
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});

test('root redirects to /ru when language cookie is ru', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'ru',
      url: baseURL,
    },
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/ru$/);
});

test('visiting /en stays on /en in multilingual mode', async ({ page }) => {
  await page.goto('/en');
  await expect(page).toHaveURL(/\/en$/);
});

test('language switcher keeps mirrored path for for-parents page', async ({ page }) => {
  await page.goto('/en/for-parents');
  const switcher = page.locator('nav[aria-label="Language selector"]');

  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole('link', { name: 'RU' })).toHaveAttribute('href', '/ru/for-parents');
});

test('language switcher keeps mirrored path for thank-you page', async ({ page }) => {
  await page.goto('/ru/thank-you');
  const switcher = page.locator('nav[aria-label="Language selector"]');

  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole('link', { name: 'EN' })).toHaveAttribute('href', '/en/thank-you');
});

test('visiting /ru sets language cookie to ru', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/ru');

  const cookies = await page.context().cookies();
  const languageCookie = cookies.find((cookie) => cookie.name === 'pontea_lang');
  expect(languageCookie?.value).toBe('ru');
});

test('visiting /en sets language cookie to en', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/en');

  const cookies = await page.context().cookies();
  const languageCookie = cookies.find((cookie) => cookie.name === 'pontea_lang');
  expect(languageCookie?.value).toBe('en');
});

test('english legal placeholder doc is available', async ({ page }) => {
  await page.goto('/en/legal/consent');
  await expect(page.getByText('This document will be updated soon.')).toBeVisible();
});
