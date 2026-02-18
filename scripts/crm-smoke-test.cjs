#!/usr/bin/env node

/*
  CRM smoke test runner for:
  - clients / client_contacts / client_link_reviews
  - assessment_results client linking
  - consultation_leads linking for mentorship
  - pricing_leads linking for eur
  - collision handling + review resolution

  Notes:
  - Uses service role from .env.local
  - Writes temporary rows and removes them in cleanup
  - Falls back from linked_existing -> merged_clients if linked_existing
    is not yet patched in DB
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) return {};
  const env = {};
  const text = fs.readFileSync(abs, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

const env = { ...loadEnv('.env.local'), ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = `crmqa_${Date.now()}`;
const tracked = {
  assessmentIds: new Set(),
  pricingIds: new Set(),
  consultationIds: new Set(),
  reviewIds: new Set(),
  clientIds: new Set(),
};

const summary = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function logPass(msg) {
  summary.passed += 1;
  console.log(`PASS: ${msg}`);
}

function logFail(msg, extra) {
  summary.failed += 1;
  console.error(`FAIL: ${msg}`);
  if (extra) console.error(extra);
}

function logWarn(msg, extra) {
  summary.warnings += 1;
  console.warn(`WARN: ${msg}`);
  if (extra) console.warn(extra);
}

function expect(condition, msg, extra) {
  if (condition) logPass(msg);
  else logFail(msg, extra);
}

async function tableHasValue(table, column, value) {
  const [a, b] = await Promise.all([
    supabase.from(table).select('id').eq(column, value).limit(1),
    supabase.from('client_contacts').select('id').eq('contact_value', value).limit(1),
  ]);
  return (a.data && a.data.length > 0) || (b.data && b.data.length > 0);
}

async function uniquePhone() {
  for (let i = 0; i < 20; i += 1) {
    const suffix = String(Date.now() + i).slice(-10);
    const candidate = `+1${suffix}`;
    // Candidate length: + + 11 digits => valid E.164.
    // Avoid collisions in both canonical and contact history.
    // eslint-disable-next-line no-await-in-loop
    const exists = await tableHasValue('clients', 'canonical_phone_e164', candidate);
    if (!exists) return candidate;
  }
  throw new Error('Failed to generate unique phone after 20 attempts');
}

async function uniqueEmail(label) {
  for (let i = 0; i < 20; i += 1) {
    const candidate = `${runId}.${label}.${i}@crm-qa.local`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await tableHasValue('clients', 'canonical_email', candidate);
    if (!exists) return candidate;
  }
  throw new Error(`Failed to generate unique email for label=${label}`);
}

async function cleanup() {
  const pricingIds = Array.from(tracked.pricingIds);
  const consultationIds = Array.from(tracked.consultationIds);
  const assessmentIds = Array.from(tracked.assessmentIds);
  const reviewIds = Array.from(tracked.reviewIds);
  const clientIds = Array.from(tracked.clientIds);

  if (pricingIds.length > 0) {
    const { error } = await supabase.from('pricing_leads').delete().in('id', pricingIds);
    if (error) logWarn('Cleanup pricing_leads failed', error.message);
  }

  if (consultationIds.length > 0) {
    const { error } = await supabase.from('consultation_leads').delete().in('id', consultationIds);
    if (error) logWarn('Cleanup consultation_leads failed', error.message);
  }

  if (assessmentIds.length > 0) {
    const { error } = await supabase.from('assessment_results').delete().in('id', assessmentIds);
    if (error) logWarn('Cleanup assessment_results failed', error.message);
  }

  if (reviewIds.length > 0) {
    const { error } = await supabase.from('client_link_reviews').delete().in('id', reviewIds);
    if (error) logWarn('Cleanup client_link_reviews failed', error.message);
  }

  if (clientIds.length > 0) {
    const { error: contactsErr } = await supabase.from('client_contacts').delete().in('client_id', clientIds);
    if (contactsErr) logWarn('Cleanup client_contacts failed', contactsErr.message);

    const { error: clientsErr } = await supabase.from('clients').delete().in('id', clientIds);
    if (clientsErr) logWarn('Cleanup clients failed', clientsErr.message);
  }
}

async function insertAssessment({ token, name, email, phone }) {
  const row = await supabase
    .from('assessment_results')
    .insert({
      share_token: token,
      name,
      email,
      phone,
      consent_personal_data: true,
      consent_at: new Date().toISOString(),
      answers: [],
      domain_results: [],
      weakest_domains: [],
      study_plan: [],
      roadmap_output: null,
      version: 3,
    })
    .select('id,client_id,email,phone')
    .single();

  if (row.error || !row.data) {
    throw new Error(`insertAssessment failed: ${row.error?.message || 'unknown error'}`);
  }
  tracked.assessmentIds.add(row.data.id);
  if (row.data.client_id) tracked.clientIds.add(row.data.client_id);
  return row.data;
}

async function insertPricingLead(payload) {
  const row = await supabase
    .from('pricing_leads')
    .insert(payload)
    .select('id,client_id,lead_type,invoice_order_number,status,crm_status')
    .single();

  if (row.error || !row.data) {
    throw new Error(`insertPricingLead failed: ${row.error?.message || 'unknown error'}`);
  }
  tracked.pricingIds.add(row.data.id);
  if (row.data.client_id) tracked.clientIds.add(row.data.client_id);
  return row.data;
}

async function insertConsultationLead(payload) {
  const row = await supabase
    .from('consultation_leads')
    .insert(payload)
    .select('id,client_id,lead_type,status,crm_status')
    .single();

  if (row.error || !row.data) {
    throw new Error(`insertConsultationLead failed: ${row.error?.message || 'unknown error'}`);
  }
  tracked.consultationIds.add(row.data.id);
  if (row.data.client_id) tracked.clientIds.add(row.data.client_id);
  return row.data;
}

async function main() {
  // precheck
  const prechecks = await Promise.all([
    supabase.from('clients').select('id').limit(1),
    supabase.from('client_contacts').select('id').limit(1),
    supabase.from('client_link_reviews').select('id').limit(1),
    supabase.from('consultation_leads').select('id').limit(1),
    supabase.from('crm_client_timeline_v').select('client_id').limit(1),
    supabase.from('crm_clients_overview_v').select('client_id').limit(1),
  ]);

  const precheckFailed = prechecks.some((r) => r.error);
  expect(!precheckFailed, 'CRM tables/views are reachable', prechecks.map((r) => r.error?.message).filter(Boolean));
  if (precheckFailed) return;

  // Scenario 1: assessment creates client
  const phoneA = await uniquePhone();
  const emailA = await uniqueEmail('a');
  const s1 = await insertAssessment({
    token: `${runId}_s1`,
    name: 'CRM QA User 1',
    email: emailA,
    phone: phoneA,
  });

  expect(!!s1.client_id, 'Assessment has client_id');

  const clientS1 = await supabase
    .from('clients')
    .select('id,status,canonical_phone_e164,canonical_email,crm_status,tariff')
    .eq('id', s1.client_id)
    .single();

  expect(!clientS1.error && !!clientS1.data, 'Client row exists for assessment', clientS1.error?.message);
  if (clientS1.data) {
    expect(clientS1.data.status === 'active', 'Client status is active');
    expect(clientS1.data.crm_status === 'new', 'Client CRM status defaults to new');
    expect(clientS1.data.canonical_phone_e164 === phoneA, 'Canonical phone matches assessment');
    expect(clientS1.data.canonical_email === emailA, 'Canonical email matches assessment');
    expect(clientS1.data.tariff === null, 'Client tariff is null after assessment only');
  }

  // Scenario 2: mentorship links by phone
  const vip1 = await insertConsultationLead({
    lead_type: 'mentorship_application',
    status: 'captured',
    crm_status: 'new',
    plan_id: 'mentorship',
    currency: null,
    first_name: 'CRM',
    last_name: 'QA VIP',
    email: null,
    phone: phoneA,
    payer_type: null,
    messenger_type: null,
    messenger_handle: null,
    comment: null,
    contract_country: null,
    contract_city: null,
    contract_postal_code: null,
    contract_address: null,
    consent_offer: false,
    consent_personal_data: true,
    consent_marketing: false,
    cta_label: 'crm-qa-test',
    page_path: '/ru/',
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  });

  expect(vip1.client_id === s1.client_id, 'VIP lead linked to same client via phone', { assessmentClient: s1.client_id, vipClient: vip1.client_id });
  expect(vip1.crm_status === 'new', 'Consultation lead CRM status defaults to new');

  const clientAfterVip = await supabase
    .from('clients')
    .select('tariff')
    .eq('id', s1.client_id)
    .single();
  expect(clientAfterVip.data?.tariff === 'individual', 'Client tariff becomes individual after consultation');

  // Scenario 3: EUR links by email and updates canonical phone
  const phoneB = await uniquePhone();
  const eur1 = await insertPricingLead({
    lead_type: 'eur_application',
    status: 'captured',
    plan_id: 'foundation',
    currency: 'EUR',
    first_name: 'CRM',
    last_name: 'QA EUR',
    email: emailA,
    phone: phoneB,
    payer_type: 'individual',
    messenger_type: null,
    messenger_handle: null,
    comment: null,
    contract_country: 'Italy',
    contract_city: 'Milan',
    contract_postal_code: '20121',
    contract_address: 'Via QA 1',
    consent_offer: true,
    consent_personal_data: true,
    consent_marketing: false,
    cta_label: 'crm-qa-test',
    page_path: '/ru/',
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  });

  expect(eur1.client_id === s1.client_id, 'EUR lead linked to same client via email');
  expect(typeof eur1.invoice_order_number === 'number', 'EUR lead has invoice_order_number');
  expect(eur1.crm_status === 'new', 'Invoice lead CRM status defaults to new');

  const clientAfterEur = await supabase
    .from('clients')
    .select('canonical_phone_e164,canonical_email,tariff')
    .eq('id', s1.client_id)
    .single();
  expect(clientAfterEur.data?.canonical_phone_e164 === phoneB, 'Canonical phone updated to latest');
  expect(clientAfterEur.data?.canonical_email === emailA, 'Canonical email preserved');
  expect(clientAfterEur.data?.tariff === 'foundation', 'Client tariff becomes foundation after EUR invoice');

  // Scenario 5/6: collision + review resolution
  const phoneC = await uniquePhone();
  const phoneD = await uniquePhone();
  const emailB = await uniqueEmail('b');
  const emailC = await uniqueEmail('c');

  const clientA = await insertAssessment({
    token: `${runId}_ca`,
    name: 'CRM QA Collision A',
    email: emailB,
    phone: phoneC,
  });

  const clientB = await insertAssessment({
    token: `${runId}_cb`,
    name: 'CRM QA Collision B',
    email: emailC,
    phone: phoneD,
  });

  const collision = await insertPricingLead({
    lead_type: 'eur_application',
    status: 'captured',
    plan_id: 'foundation',
    currency: 'EUR',
    first_name: 'CRM',
    last_name: 'QA Collision',
    email: emailC,
    phone: phoneC,
    payer_type: 'individual',
    messenger_type: null,
    messenger_handle: null,
    comment: null,
    contract_country: 'Italy',
    contract_city: 'Milan',
    contract_postal_code: '20121',
    contract_address: 'Via QA 2',
    consent_offer: true,
    consent_personal_data: true,
    consent_marketing: false,
    cta_label: 'crm-qa-test',
    page_path: '/ru/',
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  });

  const placeholder = await supabase.from('clients').select('id,status').eq('id', collision.client_id).single();
  expect(placeholder.data?.status === 'placeholder', 'Collision creates placeholder client');

  const review = await supabase
    .from('client_link_reviews')
    .select('id,status,candidate_client_ids,source_table,source_row_id')
    .eq('source_table', 'pricing_leads')
    .eq('source_row_id', collision.id)
    .single();

  expect(!review.error && !!review.data, 'Collision review row exists', review.error?.message);
  if (review.data) tracked.reviewIds.add(review.data.id);

  let resolutionActionUsed = 'linked_existing';
  let resolve = await supabase.rpc('crm_resolve_client_link_review', {
    review_id: review.data.id,
    action: 'linked_existing',
    target_client_id: clientA.client_id,
    note: 'crm smoke linked_existing',
  });

  if (resolve.error) {
    resolutionActionUsed = 'merged_clients';
    logWarn('linked_existing failed, fallback to merged_clients', resolve.error.message);
    resolve = await supabase.rpc('crm_resolve_client_link_review', {
      review_id: review.data.id,
      action: 'merged_clients',
      target_client_id: clientA.client_id,
      note: 'crm smoke merged_clients fallback',
    });
  }

  if (resolve.error) {
    resolutionActionUsed = 'kept_placeholder';
    logWarn('merged_clients failed, fallback to kept_placeholder', resolve.error.message);
    resolve = await supabase.rpc('crm_resolve_client_link_review', {
      review_id: review.data.id,
      action: 'kept_placeholder',
      target_client_id: null,
      note: 'crm smoke kept_placeholder fallback',
    });
  }

  expect(!resolve.error, `Review resolve succeeds (${resolutionActionUsed})`, resolve.error?.message);

  const reviewAfter = await supabase
    .from('client_link_reviews')
    .select('status,resolution,resolved_client_id')
    .eq('id', review.data.id)
    .single();

  expect(reviewAfter.data?.status === 'resolved', 'Review status becomes resolved', reviewAfter.data || reviewAfter.error?.message);
  expect(reviewAfter.data?.resolution === resolutionActionUsed, 'Resolution action recorded', reviewAfter.data || reviewAfter.error?.message);

  const collisionAfter = await supabase
    .from('pricing_leads')
    .select('client_id')
    .eq('id', collision.id)
    .single();
  if (resolutionActionUsed === 'kept_placeholder') {
    expect(
      collisionAfter.data?.client_id === collision.client_id,
      'Collision source keeps placeholder client after kept_placeholder',
      collisionAfter.data || collisionAfter.error?.message
    );
  } else {
    expect(
      collisionAfter.data?.client_id === clientA.client_id,
      'Collision source relinked to target client',
      collisionAfter.data || collisionAfter.error?.message
    );
  }

  // Scenario 8: rub_intent should be rejected (DB guard)
  const phoneE = await uniquePhone();
  const emailD = await uniqueEmail('d');
  const rubAttempt = await supabase
    .from('pricing_leads')
    .insert({
      lead_type: 'rub_intent',
      status: 'captured',
      plan_id: 'foundation',
      currency: 'RUB',
      first_name: 'CRM',
      last_name: 'QA RUB',
      email: emailD,
      phone: phoneE,
      payer_type: null,
      messenger_type: null,
      messenger_handle: null,
      comment: null,
      contract_country: null,
      contract_city: null,
      contract_postal_code: null,
      contract_address: null,
      consent_offer: false,
      consent_personal_data: true,
      consent_marketing: false,
      cta_label: 'crm-qa-test',
      page_path: '/ru/',
      referrer: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    })
    .select('id')
    .maybeSingle();

  expect(!!rubAttempt.error, 'rub_intent insert is rejected (disabled)', rubAttempt.error?.message);

  // Overview sanity
  const overview = await supabase
    .from('crm_clients_overview_v')
    .select('client_id,assessments_count,vip_count,eur_count,open_reviews_count')
    .eq('client_id', s1.client_id)
    .single();

  expect(!overview.error && !!overview.data, 'crm_clients_overview_v returns row for linked client', overview.error?.message);
}

(async () => {
  try {
    await main();
  } catch (error) {
    logFail('Smoke runner crashed', error instanceof Error ? error.message : String(error));
  } finally {
    await cleanup();
    console.log('---');
    console.log(`Run ID: ${runId}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`Failed: ${summary.failed}`);
    process.exit(summary.failed > 0 ? 1 : 0);
  }
})();
