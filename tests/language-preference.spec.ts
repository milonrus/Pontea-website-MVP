import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test('first-time visitor sees gateway with browser-based suggestion', async ({ page }) => {
  await page.context().clearCookies();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8' });
  await page.goto('/');

  await expect(page.getByText(/Suggested language:/i)).toBeVisible();
  await expect(page.getByText(/Русский/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /English/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Русский/i })).toBeVisible();
});

test('root redirects to /ru when pontea_lang=ru', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'ru',
      url: baseURL
    }
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/ru$/);
});

test('root redirects to /en when pontea_lang=en', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'en',
      url: baseURL
    }
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
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

test('switcher maps paired route /ru/thank-you -> /en/thank-you', async ({ page }) => {
  await page.goto('/ru/thank-you');
  await page
    .locator('nav[aria-label="Language selector"]')
    .getByRole('link', { name: 'EN' })
    .click();

  await expect(page).toHaveURL(/\/en\/thank-you$/);
});

test('switcher falls back on unpaired route /ru/assessment -> /en', async ({ page }) => {
  await page.goto('/ru/assessment');
  await page
    .locator('nav[aria-label="Language selector"]')
    .getByRole('link', { name: 'EN' })
    .click();

  await expect(page).toHaveURL(/\/en$/);
});

