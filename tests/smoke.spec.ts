import { test, expect } from '@playwright/test';

test('root shows language gateway when no language cookie is set', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /Choose your language/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /English/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Русский/i })).toBeVisible();
});

test('public RU and EN mirrored routes are reachable', async ({ request }) => {
  const paths = [
    '/en',
    '/ru',
    '/en/assessment',
    '/ru/assessment',
    '/en/for-parents',
    '/ru/for-parents',
    '/en/refund',
    '/ru/refund',
    '/en/legal',
    '/ru/legal',
    '/en/legal/consent',
    '/ru/legal/consent',
    '/en/arched-prep-course',
    '/ru/arched-prep-course',
    '/en/thank-you',
    '/ru/thank-you',
    '/en/results',
    '/ru/results',
  ];

  for (const path of paths) {
    const response = await request.get(path, { failOnStatusCode: false });
    expect(response.status(), `Path failed: ${path}`).toBeLessThan(400);
  }
});

test('results fallback redirects to locale assessment when no saved results exist', async ({ page }) => {
  await page.goto('/en');
  await page.evaluate(() => localStorage.removeItem('pontea_results_v2'));
  await page.goto('/en/results');
  await expect(page).toHaveURL(/\/en\/assessment$/, { timeout: 15_000 });

  await page.goto('/ru');
  await page.evaluate(() => localStorage.removeItem('pontea_results_v2'));
  await page.goto('/ru/results');
  await expect(page).toHaveURL(/\/ru\/assessment$/, { timeout: 15_000 });
});

test('language switcher keeps mirrored path on localized content pages', async ({ page }) => {
  await page.goto('/en/refund');

  const switcher = page.locator('nav[aria-label="Language selector"]');
  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole('link', { name: 'RU' })).toHaveAttribute('href', '/ru/refund');
});

test('sitemap includes mirrored EN/RU hreflang pairs and excludes retired pages', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();

  expect(xml).toContain('<loc>https://pontea.school/en</loc>');
  expect(xml).toContain('<loc>https://pontea.school/ru</loc>');
  expect(xml).toContain('hreflang="en" href="https://pontea.school/en"');
  expect(xml).toContain('hreflang="ru" href="https://pontea.school/ru"');
  expect(xml).toContain('hreflang="x-default" href="https://pontea.school/en"');

  expect(xml).not.toContain('/consultation');
  expect(xml).not.toContain('/methodology');
});

test('robots disallows private EN/RU result and thank-you pages', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const robots = await response.text();

  expect(robots).toContain('Disallow: /en/results');
  expect(robots).toContain('Disallow: /ru/results');
  expect(robots).toContain('Disallow: /en/thank-you');
  expect(robots).toContain('Disallow: /ru/thank-you');
});
