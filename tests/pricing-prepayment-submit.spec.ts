import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

type Locale = 'ru' | 'en';

interface ScenarioConfig {
  locale: Locale;
  pricingPath: string;
  openModalButtonLabel: string;
  modalTitle: string;
  eurOptionLabel: RegExp;
  proceedButtonLabel: string;
  successTitle: string;
  expectedInvoicePath: string;
}

interface EurRequestRow {
  id: string;
  lead_type: string;
  plan_id: string;
  currency: string | null;
  requested_amount_eur: number | null;
  client_id: string | null;
  invoice_order_number: number | null;
  webhook_status: string;
  webhook_last_error: string | null;
  page_path: string;
  created_at: string;
}

const loadDotEnvLocal = (): Record<string, string> => {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const out: Record<string, string> = {};
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (key.length > 0 && value.length > 0) {
      out[key] = value;
    }
  }

  return out;
};

const DOT_ENV_LOCAL = loadDotEnvLocal();
const RUN_FULL_E2E = process.env.RUN_PREPAYMENT_FULL_E2E === '1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DOT_ENV_LOCAL.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || DOT_ENV_LOCAL.SUPABASE_SERVICE_ROLE_KEY;
const REQUIRED_ENV_IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const makePhone = () => {
  const randomTenDigits = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
  return `+1${randomTenDigits}`;
};

const makeScenarioConfig = (locale: Locale): ScenarioConfig =>
  locale === 'ru'
    ? {
        locale,
        pricingPath: '/ru/#pricing-cards',
        openModalButtonLabel: 'Зафиксировать цену за €100',
        modalTitle: 'Выберите способ оплаты',
        eurOptionLabel: /Карты зарубежного банка \(EUR\)/i,
        proceedButtonLabel: 'Перейти к оформлению',
        successTitle: 'Спасибо, заявка получена',
        expectedInvoicePath: '/ru/invoice-request/',
      }
    : {
        locale,
        pricingPath: '/#pricing-cards',
        openModalButtonLabel: 'Lock price for EUR 100',
        modalTitle: 'Choose payment method',
        eurOptionLabel: /Foreign bank card \(EUR\)/i,
        proceedButtonLabel: 'Continue to checkout',
        successTitle: 'Thank you, your application was received',
        expectedInvoicePath: '/invoice-request/',
      };

const safeCountByClientId = async (
  supabase: SupabaseClient,
  table: string,
  clientId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (error) {
    console.warn(`[pricing-prepayment-submit] Failed to count rows in ${table}: ${error.message}`);
    return 0;
  }

  return count ?? 0;
};

const cleanupScenarioRows = async (
  supabase: SupabaseClient,
  leadId: string | null,
  clientId: string | null
) => {
  if (leadId) {
    const { error } = await supabase.from('eur_requests').delete().eq('id', leadId);
    if (error) {
      console.warn(`[pricing-prepayment-submit] Failed to cleanup eur_requests row ${leadId}: ${error.message}`);
    }
  }

  if (!clientId) {
    return;
  }

  const [eurCount, consultationCount, assessmentCount] = await Promise.all([
    safeCountByClientId(supabase, 'eur_requests', clientId),
    safeCountByClientId(supabase, 'consultation_requests', clientId),
    safeCountByClientId(supabase, 'assessment_results', clientId),
  ]);

  if (eurCount > 0 || consultationCount > 0 || assessmentCount > 0) {
    return;
  }

  const { error: contactsError } = await supabase
    .from('client_contacts')
    .delete()
    .eq('client_id', clientId);
  if (contactsError) {
    console.warn(`[pricing-prepayment-submit] Failed to cleanup client_contacts for ${clientId}: ${contactsError.message}`);
  }

  const { error: leadError } = await supabase.from('leads').delete().eq('id', clientId);
  if (leadError) {
    console.warn(`[pricing-prepayment-submit] Failed to cleanup leads row ${clientId}: ${leadError.message}`);
  }
};

const fillAndSubmitInvoiceForm = async (
  page: Page,
  email: string,
  phone: string,
  submitLabel: string
) => {
  await page.locator('#lead-full-name').fill('Ivan Tester');
  await page.locator('#lead-phone-eur').fill(phone);
  await page.locator('#lead-email').fill(email);
  await page.locator('#lead-contract-country').fill('Italy');
  await page.locator('#lead-contract-city').fill('Milan');
  await page.locator('#lead-contract-postal-code').fill('20121');
  await page.locator('#lead-contract-address').fill('Via Roma 1');

  const consentCheckboxes = page.locator('form input[type="checkbox"]');
  await consentCheckboxes.nth(0).check();
  await consentCheckboxes.nth(1).check();

  await page.getByRole('button', { name: submitLabel }).click();
};

const pollLeadByEmailUntilDelivered = async (
  supabase: SupabaseClient,
  email: string,
  timeoutMs = 120_000
): Promise<EurRequestRow> => {
  const deadline = Date.now() + timeoutMs;
  let lastSeenRow: EurRequestRow | null = null;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('eur_requests')
      .select('id,lead_type,plan_id,currency,requested_amount_eur,client_id,invoice_order_number,webhook_status,webhook_last_error,page_path,created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<EurRequestRow>();

    if (error) {
      throw new Error(`Failed to fetch eur_requests row for ${email}: ${error.message}`);
    }

    if (data) {
      lastSeenRow = data;
      if (data.webhook_status === 'webhook_delivered') {
        return data;
      }
    }

    await wait(2_000);
  }

  throw new Error(
    `Timed out waiting for webhook_delivered. email=${email}, lastSeen=${JSON.stringify(lastSeenRow)}`
  );
};

const runScenario = async (page: Page, supabase: SupabaseClient, locale: Locale) => {
  const config = makeScenarioConfig(locale);
  const email = `e2e.prepayment.${locale}.${Date.now()}@pontea.school`;
  const phone = makePhone();

  let createdLeadId: string | null = null;
  let createdClientId: string | null = null;

  try {
    await page.goto(config.pricingPath);

    const openModalButton = page.getByRole('button', { name: config.openModalButtonLabel });
    await expect(openModalButton).toBeVisible({ timeout: 20_000 });
    await openModalButton.click();
    await expect(page.getByRole('heading', { name: config.modalTitle })).toBeVisible();

    await page.getByRole('button', { name: config.eurOptionLabel }).click();
    await page.getByRole('button', { name: config.proceedButtonLabel }).click();

    await expect(page).toHaveURL(new RegExp(`${config.expectedInvoicePath}\\?mode=prepayment`));

    const submitLabel = locale === 'ru' ? 'Отправить заявку' : 'Submit application';
    await fillAndSubmitInvoiceForm(page, email, phone, submitLabel);

    const submitOutcome = await Promise.race([
      page
        .getByRole('heading', { name: config.successTitle })
        .waitFor({ state: 'visible', timeout: 45_000 })
        .then(() => 'success' as const),
      page
        .getByText(/schema migration required/i)
        .waitFor({ state: 'visible', timeout: 45_000 })
        .then(() => 'schema_required' as const),
    ]);

    if (submitOutcome === 'schema_required') {
      throw new Error('Form submission failed with schema migration required. Apply latest DB migration.');
    }

    const lead = await pollLeadByEmailUntilDelivered(supabase, email);
    createdLeadId = lead.id;
    createdClientId = lead.client_id;

    expect(lead.lead_type).toBe('eur_prepayment_application');
    expect(lead.plan_id).toBe('universal');
    expect(lead.currency).toBe('EUR');
    expect(lead.requested_amount_eur).toBe(100);
    expect(lead.webhook_status).toBe('webhook_delivered');
    expect(lead.client_id).not.toBeNull();
    expect(typeof lead.invoice_order_number).toBe('number');
    expect(lead.page_path).toBe(config.expectedInvoicePath);

    const { data: client, error: clientError } = await supabase
      .from('leads')
      .select('id,tariff')
      .eq('id', lead.client_id)
      .maybeSingle<{ id: string; tariff: string | null }>();

    if (clientError) {
      throw new Error(`Failed to load linked client: ${clientError.message}`);
    }

    expect(client).not.toBeNull();
    expect(client?.tariff ?? null).toBeNull();

    console.log(
      `[pricing-prepayment-submit] locale=${locale} leadId=${lead.id} clientId=${lead.client_id} invoice=${lead.invoice_order_number} email=${email} phone=${phone}`
    );
  } finally {
    await cleanupScenarioRows(supabase, createdLeadId, createdClientId);
  }
};

test.describe('pricing prepayment submit full flow', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test.skip(!RUN_FULL_E2E, 'Set RUN_PREPAYMENT_FULL_E2E=1 to run live DB/webhook flow.');
  test.skip(
    !REQUIRED_ENV_IS_CONFIGURED,
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for DB assertions.'
  );

  const supabase = REQUIRED_ENV_IS_CONFIGURED
    ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

  test('RU: submit EUR prepayment from pricing modal and persist delivered lead', async ({ page }) => {
    await runScenario(page, supabase!, 'ru');
  });

  test('EN: submit EUR prepayment from pricing modal and persist delivered lead', async ({ page }) => {
    await runScenario(page, supabase!, 'en');
  });
});
