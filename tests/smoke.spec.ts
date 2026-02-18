import { test, expect } from '@playwright/test';

test('root is the English homepage (no gateway)', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /Online school/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Choose your language/i })).toHaveCount(0);
});

test('public EN-root and RU mirrored routes are reachable', async ({ request }) => {
  test.setTimeout(120_000);

  const paths = [
    '/',
    '/ru/',
    '/assessment/',
    '/ru/assessment/',
    '/legal/',
    '/ru/legal/',
    '/legal/consent/',
    '/ru/legal/consent/',
    '/arched-prep-course/',
    '/ru/arched-prep-course/',
    '/thank-you/',
    '/ru/thank-you/',
    '/invoice-request/',
    '/ru/invoice-request/',
    '/results/',
    '/ru/results/',
  ];

  for (const path of paths) {
    const response = await request.get(path, { failOnStatusCode: false });
    expect(response.status(), `Path failed: ${path}`).toBeLessThan(400);
  }
});

test('removed for-parents and refund routes return 404 in both locales', async ({ request }) => {
  const removedPaths = [
    '/for-parents/',
    '/ru/for-parents/',
    '/refund/',
    '/ru/refund/',
  ];

  for (const path of removedPaths) {
    const response = await request.get(path, { failOnStatusCode: false });
    expect(response.status(), `Removed path should 404: ${path}`).toBe(404);
  }
});

test('results fallback redirects to locale assessment when no saved results exist', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('pontea_results_v2'));
  await page.goto('/results/');
  await expect(page).toHaveURL(/\/assessment\/$/, { timeout: 15_000 });

  await page.goto('/ru/');
  await page.evaluate(() => localStorage.removeItem('pontea_results_v2'));
  await page.goto('/ru/results/');
  await expect(page).toHaveURL(/\/ru\/assessment\/$/, { timeout: 15_000 });
});

test('language switcher keeps mirrored path on localized content pages', async ({ page }) => {
  await page.goto('/assessment/');

  const toggle = page.getByRole('button', { name: 'Open language menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.getByRole('menu', { name: 'Language selector' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Русский' })).toHaveAttribute('href', '/ru/assessment/');
});

test('language switcher keeps mirrored invoice-request path and plan query', async ({ page }) => {
  await page.goto('/invoice-request/?plan=foundation');

  const toggle = page.getByRole('button', { name: 'Open language menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.getByRole('menu', { name: 'Language selector' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Русский' })).toHaveAttribute(
    'href',
    '/ru/invoice-request/?plan=foundation'
  );
});

test('language switcher keeps mirrored invoice-request prepayment mode query', async ({ page }) => {
  await page.goto('/invoice-request/?mode=prepayment');

  const toggle = page.getByRole('button', { name: 'Open language menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const menu = page.getByRole('menu', { name: 'Language selector' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Русский' })).toHaveAttribute(
    'href',
    '/ru/invoice-request/?mode=prepayment'
  );
});

test('invoice-request normalizes missing or invalid plan to advanced and keeps other query params', async ({ page }) => {
  await page.goto('/invoice-request/');

  await expect.poll(() => {
    const currentUrl = new URL(page.url());
    return currentUrl.searchParams.get('plan');
  }).toBe('advanced');

  await page.goto('/invoice-request/?plan=unknown&utm_source=x');

  await expect.poll(() => {
    const currentUrl = new URL(page.url());
    return `${currentUrl.searchParams.get('plan')}:${currentUrl.searchParams.get('utm_source')}`;
  }).toBe('advanced:x');

  await page.goto('/ru/invoice-request/');

  await expect.poll(() => {
    const currentUrl = new URL(page.url());
    return currentUrl.searchParams.get('plan');
  }).toBe('advanced');
});

test('invoice-request prepayment mode does not force plan normalization', async ({ page }) => {
  await page.goto('/invoice-request/?mode=prepayment&utm_source=x');

  await expect.poll(() => {
    const currentUrl = new URL(page.url());
    return `${currentUrl.searchParams.get('mode')}:${currentUrl.searchParams.get('plan')}:${currentUrl.searchParams.get('utm_source')}`;
  }).toBe('prepayment:null:x');

  await page.goto('/ru/invoice-request/?mode=prepayment');

  await expect.poll(() => {
    const currentUrl = new URL(page.url());
    return `${currentUrl.searchParams.get('mode')}:${currentUrl.searchParams.get('plan')}`;
  }).toBe('prepayment:null');
});

test('pricing prepayment strip opens currency modal with RUB and EUR options', async ({ page }) => {
  await page.goto('/ru/');

  const openModalButton = page.getByRole('button', { name: 'Зафиксировать цену за €100' });
  await expect(openModalButton).toBeVisible();
  await openModalButton.click();

  await expect(page.getByRole('heading', { name: 'Выберите способ оплаты' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Оплата картой РФ/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Карты зарубежного банка \(EUR\)/i })).toBeVisible();
  await expect(page.getByText(/Принимаю условия/i)).toHaveCount(0);
});

test('indexable pages expose hreflang, while noindex pages do not', async ({ request }) => {
  const assessmentResponse = await request.get('/assessment/');
  expect(assessmentResponse.status()).toBe(200);
  const assessmentHtml = await assessmentResponse.text();

  expect(assessmentHtml).toContain('hrefLang=\"en\"');
  expect(assessmentHtml).toContain('hrefLang=\"ru\"');
  expect(assessmentHtml).toContain('hrefLang=\"x-default\"');

  const resultsResponse = await request.get('/results/');
  expect(resultsResponse.status()).toBe(200);
  const resultsHtml = await resultsResponse.text();

  expect(resultsHtml).toContain('noindex');
  expect(resultsHtml).not.toContain('hrefLang=\"en\"');
  expect(resultsHtml).not.toContain('hrefLang=\"ru\"');
  expect(resultsHtml).not.toContain('hrefLang=\"x-default\"');
});

test('sitemap index references per-language sitemaps and excludes deleted pages', async ({ request }) => {
  const indexResponse = await request.get('/sitemap.xml');
  expect(indexResponse.status()).toBe(200);
  const indexXml = await indexResponse.text();

  expect(indexXml).toContain('<loc>https://pontea.school/sitemap-en.xml</loc>');
  expect(indexXml).toContain('<loc>https://pontea.school/sitemap-ru.xml</loc>');

  const enResponse = await request.get('/sitemap-en.xml');
  expect(enResponse.status()).toBe(200);
  const enXml = await enResponse.text();

  expect(enXml).toContain('<loc>https://pontea.school/</loc>');
  expect(enXml).toContain('<loc>https://pontea.school/assessment/</loc>');
  expect(enXml).not.toContain('/for-parents/');
  expect(enXml).not.toContain('/refund/');
  expect(enXml).not.toContain('/consultation/');
  expect(enXml).not.toContain('/methodology/');

  const ruResponse = await request.get('/sitemap-ru.xml');
  expect(ruResponse.status()).toBe(200);
  const ruXml = await ruResponse.text();

  expect(ruXml).toContain('<loc>https://pontea.school/ru/</loc>');
  expect(ruXml).toContain('<loc>https://pontea.school/ru/assessment/</loc>');
  expect(ruXml).not.toContain('/ru/for-parents/');
  expect(ruXml).not.toContain('/ru/refund/');
});

test('robots disallows private results and thank-you pages for EN root and RU', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  const robots = await response.text();

  expect(robots).toContain('Disallow: /results');
  expect(robots).toContain('Disallow: /ru/results');
  expect(robots).toContain('Disallow: /thank-you');
  expect(robots).toContain('Disallow: /ru/thank-you');
});

test('deleted consultation and methodology pages return 404', async ({ request }) => {
  const consultation = await request.get('/consultation/', { failOnStatusCode: false });
  const methodology = await request.get('/methodology/', { failOnStatusCode: false });

  expect(consultation.status()).toBe(404);
  expect(methodology.status()).toBe(404);
});
