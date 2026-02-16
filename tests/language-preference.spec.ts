import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test('root stays on / when language cookie is en', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'en',
      url: baseURL,
    },
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
});

test('root redirects to /ru/ when language cookie is ru', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'ru',
      url: baseURL,
    },
  ]);

  await page.goto('/');
  await expect(page).toHaveURL(/\/ru\/$/);
});

test('root RU cookie redirect is temporary and user-specific', async () => {
  const response = await fetch(`${baseURL}/`, {
    headers: {
      Cookie: 'pontea_lang=ru'
    },
    redirect: 'manual'
  });

  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('/ru/');
  expect(response.headers.get('cache-control')).toContain('private');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('vary')).toContain('Cookie');
});

test('deep EN paths are not forced to RU even with RU cookie', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'ru',
      url: baseURL,
    },
  ]);

  await page.goto('/assessment/');
  await expect(page).toHaveURL(/\/assessment\/$/);
});

test('RU paths stay RU even with EN cookie (URL intent wins)', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pontea_lang',
      value: 'en',
      url: baseURL,
    },
  ]);

  await page.goto('/ru/assessment/');
  await expect(page).toHaveURL(/\/ru\/assessment\/$/);
});

test('legacy /en removed routes still redirect to EN-root equivalents first', async () => {
  const legacyPaths = [
    '/en/for-parents/',
    '/en/refund/',
  ];

  for (const path of legacyPaths) {
    const response = await fetch(`${baseURL}${path}`, {
      redirect: 'manual'
    });

    expect(response.status).toBeGreaterThanOrEqual(301);
    expect(response.status).toBeLessThan(309);
    expect(response.headers.get('location')).toBe(path.replace('/en', ''));
  }
});

test('legacy /en removed routes end in 404 after redirect', async ({ request }) => {
  const legacyPaths = [
    '/en/for-parents/',
    '/en/refund/',
  ];

  for (const path of legacyPaths) {
    const response = await request.get(path, { failOnStatusCode: false });
    expect(response.status()).toBe(404);
  }
});

test('legacy /en/ root redirects permanently to /', async () => {
  const response = await fetch(`${baseURL}/en/`, {
    redirect: 'manual'
  });

  expect(response.status).toBeGreaterThanOrEqual(301);
  expect(response.status).toBeLessThan(309);
  expect(response.headers.get('location')).toBe('/');
});

test('language switcher keeps mirrored path for assessment page', async ({ page }) => {
  await page.goto('/assessment/');
  const toggle = page.getByRole('button', { name: 'Open language menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.getByRole('menu', { name: 'Language selector' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Русский' })).toHaveAttribute(
    'href',
    '/ru/assessment/'
  );
});

test('language switcher keeps mirrored path for thank-you page', async ({ page }) => {
  await page.goto('/ru/thank-you/');
  const toggle = page.getByRole('button', { name: 'Open language menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.getByRole('menu', { name: 'Language selector' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'English' })).toHaveAttribute(
    'href',
    '/thank-you/'
  );
});

test('language switcher uses explicit override for RU -> EN homepage', async ({ page }) => {
  await page.goto('/ru/');
  const toggle = page.getByRole('button', { name: 'Open language menu' }).first();
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.getByRole('menu', { name: 'Language selector' }).first();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'English' })).toHaveAttribute(
    'href',
    '/?lang=en'
  );
});

test('root lang override query sets RU preference and strips the query', async () => {
  const response = await fetch(`${baseURL}/?lang=ru`, {
    redirect: 'manual'
  });

  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('/ru/');
  expect(response.headers.get('set-cookie')).toContain('pontea_lang=ru');
});

test('root lang override query sets EN preference and strips the query', async () => {
  const response = await fetch(`${baseURL}/?lang=en`, {
    redirect: 'manual'
  });

  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('/');
  expect(response.headers.get('set-cookie')).toContain('pontea_lang=en');
});

test('accept-language header does not force redirect on root', async () => {
  const response = await fetch(`${baseURL}/`, {
    headers: {
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
    },
    redirect: 'manual'
  });

  expect(response.status).toBe(200);
  expect(response.headers.get('location')).toBeNull();
});

test.describe('RU browser suggestion banner on root', () => {
  test.use({ locale: 'ru-RU' });

  test('shows a non-forcing Russian suggestion on EN root', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');

    const banner = page.getByRole('region', { name: 'Language suggestion' });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link', { name: 'Switch to Russian' })).toHaveAttribute('href', '/ru/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('dismiss keeps EN and hides suggestion on reload', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');

    const banner = page.getByRole('region', { name: 'Language suggestion' });
    await expect(banner).toBeVisible();

    await banner.getByRole('button', { name: 'Stay in English' }).click();
    await expect(page.getByRole('region', { name: 'Language suggestion' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('region', { name: 'Language suggestion' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });
});

test('visiting /ru/ sets language cookie to ru', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/ru/');

  const cookies = await page.context().cookies();
  const languageCookie = cookies.find((cookie) => cookie.name === 'pontea_lang');
  expect(languageCookie?.value).toBe('ru');
});

test('visiting /assessment/ sets language cookie to en', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/assessment/');

  const cookies = await page.context().cookies();
  const languageCookie = cookies.find((cookie) => cookie.name === 'pontea_lang');
  expect(languageCookie?.value).toBe('en');
});

test('english legal placeholder doc is available on EN-root path', async ({ page }) => {
  await page.goto('/legal/consent/');
  await expect(page.getByText('This document will be updated soon.')).toBeVisible();
});
