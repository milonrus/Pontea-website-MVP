#!/usr/bin/env node

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
const baseUrl = env.NEXT_PUBLIC_APP_URL || env.APP_URL || 'http://localhost:3000';
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makePhone = () => {
  const randomTenDigits = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
  return `+1${randomTenDigits}`;
};

async function cleanup(leadId, clientId) {
  if (leadId) {
    const { error } = await supabase.from('eur_requests').delete().eq('id', leadId);
    if (error) {
      console.warn(`WARN: cleanup eur_requests failed for ${leadId}: ${error.message}`);
    }
  }

  if (!clientId) {
    return;
  }

  const [eurCountRes, consultationCountRes, assessmentCountRes] = await Promise.all([
    supabase.from('eur_requests').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('consultation_requests').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('assessment_results').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
  ]);

  const eurCount = eurCountRes.count || 0;
  const consultationCount = consultationCountRes.count || 0;
  const assessmentCount = assessmentCountRes.count || 0;

  if (eurCount > 0 || consultationCount > 0 || assessmentCount > 0) {
    return;
  }

  const { error: contactsError } = await supabase.from('client_contacts').delete().eq('client_id', clientId);
  if (contactsError) {
    console.warn(`WARN: cleanup client_contacts failed for ${clientId}: ${contactsError.message}`);
  }

  const { error: leadError } = await supabase.from('leads').delete().eq('id', clientId);
  if (leadError) {
    console.warn(`WARN: cleanup leads failed for ${clientId}: ${leadError.message}`);
  }
}

async function waitForLeadDelivered(leadId, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let lastSeen = null;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('eur_requests')
      .select('id,lead_type,plan_id,currency,requested_amount_eur,client_id,invoice_order_number,webhook_status,webhook_last_error,created_at')
      .eq('id', leadId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch eur_requests row ${leadId}: ${error.message}`);
    }

    if (data) {
      lastSeen = data;
      if (data.webhook_status === 'webhook_delivered') {
        return data;
      }
    }

    await wait(2000);
  }

  throw new Error(`Timeout waiting webhook_delivered for ${leadId}. Last seen: ${JSON.stringify(lastSeen)}`);
}

async function main() {
  const marker = `E2E PREPAYMENT API ${Date.now()}`;
  const email = `e2e.prepayment.api.${Date.now()}@pontea.school`;
  const phone = makePhone();

  let createdLeadId = null;
  let createdClientId = null;

  try {
    const response = await fetch(`${baseUrl}/api/pricing-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadType: 'eur_prepayment_application',
        planId: 'universal',
        currency: 'EUR',
        requestedAmountEur: 100,
        firstName: 'E2E',
        lastName: marker,
        email,
        phone,
        payerType: 'individual',
        comment: null,
        contractCountry: 'Italy',
        contractCity: 'Milan',
        contractPostalCode: '20121',
        contractAddress: 'Via Roma 1',
        consentOffer: true,
        consentPersonalData: true,
        consentMarketing: false,
        pagePath: '/invoice-request/',
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`Submit failed: HTTP ${response.status} ${JSON.stringify(data)}`);
    }

    if (!data || typeof data.leadId !== 'string' || data.leadId.trim().length === 0) {
      throw new Error(`Submit succeeded but leadId is missing: ${JSON.stringify(data)}`);
    }

    createdLeadId = data.leadId;

    const lead = await waitForLeadDelivered(createdLeadId);
    createdClientId = lead.client_id;

    if (lead.lead_type !== 'eur_prepayment_application') {
      throw new Error(`Unexpected lead_type: ${lead.lead_type}`);
    }

    if (lead.plan_id !== 'universal') {
      throw new Error(`Unexpected plan_id: ${lead.plan_id}`);
    }

    if (lead.currency !== 'EUR') {
      throw new Error(`Unexpected currency: ${lead.currency}`);
    }

    if (lead.requested_amount_eur !== 100) {
      throw new Error(`Unexpected requested_amount_eur: ${lead.requested_amount_eur}`);
    }

    if (!lead.client_id) {
      throw new Error('client_id is null for eur_prepayment_application');
    }

    if (typeof lead.invoice_order_number !== 'number') {
      throw new Error(`invoice_order_number is missing for eur_prepayment_application: ${lead.invoice_order_number}`);
    }

    const { data: client, error: clientError } = await supabase
      .from('leads')
      .select('id,tariff')
      .eq('id', lead.client_id)
      .maybeSingle();

    if (clientError) {
      throw new Error(`Failed to fetch linked client ${lead.client_id}: ${clientError.message}`);
    }

    if (!client) {
      throw new Error(`Linked client was not found: ${lead.client_id}`);
    }

    if (client.tariff !== null) {
      throw new Error(`Tariff must remain null for prepayment, got: ${client.tariff}`);
    }

    console.log('PASS: EUR prepayment API smoke completed.');
    console.log(`Lead ID: ${lead.id}`);
    console.log(`Client ID: ${lead.client_id}`);
    console.log(`Invoice Number: ${lead.invoice_order_number}`);
    console.log(`Marker: ${marker}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
  } finally {
    await cleanup(createdLeadId, createdClientId);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('FAIL: EUR prepayment API smoke failed.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
