CREATE TABLE IF NOT EXISTS pricing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL CHECK (
    lead_type IN ('rub_intent', 'eur_application', 'mentorship_application')
  ),
  status TEXT NOT NULL DEFAULT 'captured' CHECK (
    status IN ('captured', 'webhook_delivered', 'failed_webhook')
  ),
  plan_id TEXT NOT NULL CHECK (
    plan_id IN ('foundation', 'advanced', 'mentorship')
  ),
  currency TEXT CHECK (
    currency IN ('RUB', 'EUR')
  ),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  payer_type TEXT CHECK (
    payer_type IN ('individual', 'legal_entity')
  ),
  messenger_type TEXT CHECK (
    messenger_type IN ('telegram', 'whatsapp')
  ),
  messenger_handle TEXT,
  comment TEXT,
  consent_personal_data BOOLEAN NOT NULL DEFAULT false,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  cta_label TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of UUID REFERENCES pricing_leads(id) ON DELETE SET NULL,
  webhook_attempts INTEGER NOT NULL DEFAULT 0,
  webhook_last_error TEXT,
  webhook_delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_leads_flow_check CHECK (
    (lead_type = 'rub_intent' AND plan_id IN ('foundation', 'advanced') AND currency = 'RUB')
    OR
    (lead_type = 'eur_application' AND plan_id IN ('foundation', 'advanced') AND currency = 'EUR')
    OR
    (lead_type = 'mentorship_application' AND plan_id = 'mentorship' AND currency IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_pricing_leads_created_at
  ON pricing_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pricing_leads_phone_created
  ON pricing_leads(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pricing_leads_status
  ON pricing_leads(status);

CREATE INDEX IF NOT EXISTS idx_pricing_leads_type
  ON pricing_leads(lead_type);

ALTER TABLE pricing_leads ENABLE ROW LEVEL SECURITY;
