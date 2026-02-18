const hasText = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getOptionalServerEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return hasText(value) ? value : undefined;
};

const getServerEnvInt = (
  name: string,
  defaultValue: number,
  options?: { min?: number; max?: number }
): number => {
  const raw = process.env[name];
  if (!hasText(raw)) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  if (typeof options?.min === 'number' && parsed < options.min) {
    throw new Error(`Environment variable ${name} must be >= ${options.min}`);
  }

  if (typeof options?.max === 'number' && parsed > options.max) {
    throw new Error(`Environment variable ${name} must be <= ${options.max}`);
  }

  return parsed;
};

const LEAD_TYPES = ['eur_application', 'eur_prepayment_application', 'mentorship_application'] as const;
const PLAN_IDS = ['foundation', 'advanced', 'mentorship', 'universal'] as const;
const CURRENCIES = ['EUR'] as const;
const PAYER_TYPES = ['individual', 'legal_entity'] as const;

const EUR_PRICE_BY_PLAN: Record<PlanId, number> = {
  foundation: 790,
  advanced: 1390,
  mentorship: 3190,
  universal: 100,
};

export const MAX_WEBHOOK_ATTEMPTS = getServerEnvInt('PRICING_WEBHOOK_MAX_ATTEMPTS', 3, { min: 1 });
const WEBHOOK_TIMEOUT_MS = getServerEnvInt('WEBHOOK_TIMEOUT_MS', 5000, { min: 1000 });

export type LeadType = (typeof LEAD_TYPES)[number];
export type PlanId = (typeof PLAN_IDS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type PayerType = (typeof PAYER_TYPES)[number];

export interface NormalizedPricingLeadPayload {
  leadType: LeadType;
  planId: PlanId;
  currency: Currency | null;
  requestedAmountEur: number | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  payerType: PayerType | null;
  comment: string | null;
  contractCountry: string | null;
  contractCity: string | null;
  contractPostalCode: string | null;
  contractAddress: string | null;
  consentOffer: boolean;
  consentPersonalData: boolean;
  consentMarketing: boolean;
  pagePath: string;
}

export interface WebhookDeliveryResult {
  delivered: boolean;
  attempts: number;
  lastError: string | null;
}

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s-]{0,15}$/;

const hasValue = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeText = (value: unknown): string | null => {
  if (!hasValue(value)) {
    return null;
  }

  return value.trim();
};

const isLeadType = (value: unknown): value is LeadType =>
  typeof value === 'string' && LEAD_TYPES.includes(value as LeadType);

const isPlanId = (value: unknown): value is PlanId =>
  typeof value === 'string' && PLAN_IDS.includes(value as PlanId);

const isCurrency = (value: unknown): value is Currency =>
  typeof value === 'string' && CURRENCIES.includes(value as Currency);

const isPayerType = (value: unknown): value is PayerType =>
  typeof value === 'string' && PAYER_TYPES.includes(value as PayerType);

const parseInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }

  return null;
};

export function validateAndNormalizeLeadPayload(body: unknown): {
  payload: NormalizedPricingLeadPayload | null;
  error: string | null;
} {
  if (!body || typeof body !== 'object') {
    return { payload: null, error: 'Invalid request body' };
  }

  const source = body as Record<string, unknown>;

  if (!isLeadType(source.leadType)) {
    return { payload: null, error: 'Invalid leadType' };
  }

  if (!isPlanId(source.planId)) {
    return { payload: null, error: 'Invalid planId' };
  }

  if (source.currency !== null && source.currency !== undefined && !isCurrency(source.currency)) {
    return { payload: null, error: 'Invalid currency' };
  }

  const firstName = normalizeText(source.firstName);
  if (!firstName || firstName.length < 2) {
    return { payload: null, error: 'firstName is required' };
  }

  const phone = normalizeText(source.phone);
  if (!phone || !E164_PHONE_REGEX.test(phone)) {
    return { payload: null, error: 'phone must be in E.164 format' };
  }

  const pagePath = normalizeText(source.pagePath);
  if (!pagePath) {
    return { payload: null, error: 'pagePath is required' };
  }

  const consentPersonalData = source.consentPersonalData === true;
  if (!consentPersonalData) {
    return { payload: null, error: 'consentPersonalData must be true' };
  }

  const consentMarketing = source.consentMarketing === true;
  const consentOffer = source.consentOffer === true;

  const lastName = normalizeText(source.lastName);
  const email = normalizeText(source.email);
  const comment = normalizeText(source.comment);
  const contractCountry = normalizeText(source.contractCountry);
  const contractCity = normalizeText(source.contractCity);
  const contractPostalCode = normalizeText(source.contractPostalCode);
  const contractAddress = normalizeText(source.contractAddress);
  const currency = isCurrency(source.currency) ? source.currency : null;
  const hasRequestedAmountEur = source.requestedAmountEur !== undefined && source.requestedAmountEur !== null;
  const requestedAmountEur = hasRequestedAmountEur
    ? parseInteger(source.requestedAmountEur)
    : null;

  if (hasRequestedAmountEur && requestedAmountEur === null) {
    return { payload: null, error: 'requestedAmountEur must be an integer' };
  }

  let payerType: PayerType | null = null;
  if (source.payerType !== undefined && source.payerType !== null) {
    if (!isPayerType(source.payerType)) {
      return { payload: null, error: 'Invalid payerType' };
    }

    payerType = source.payerType;
  }

  if (source.leadType === 'eur_application' || source.leadType === 'eur_prepayment_application') {
    const isPrepaymentLead = source.leadType === 'eur_prepayment_application';
    if (
      source.planId !== 'foundation'
      && source.planId !== 'advanced'
      && source.planId !== 'mentorship'
    ) {
      if (!isPrepaymentLead) {
        return {
          payload: null,
          error: 'eur_application supports only foundation, advanced, and mentorship',
        };
      }
    }

    if (isPrepaymentLead && source.planId !== 'universal') {
      return { payload: null, error: 'eur_prepayment_application requires universal plan' };
    }

    if (currency !== 'EUR') {
      return {
        payload: null,
        error: `${source.leadType} currency must be EUR`,
      };
    }

    if (requestedAmountEur === null || requestedAmountEur < 1) {
      return { payload: null, error: 'requestedAmountEur must be >= 1 for EUR leads' };
    }

    if (!lastName || lastName.length < 2) {
      return { payload: null, error: 'lastName is required' };
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return { payload: null, error: 'email is required and must be valid' };
    }

    if (!payerType) {
      return { payload: null, error: 'payerType is required' };
    }

    if (!contractCountry) {
      return { payload: null, error: 'contractCountry is required' };
    }

    if (!contractCity) {
      return { payload: null, error: 'contractCity is required' };
    }

    if (!contractAddress) {
      return { payload: null, error: 'contractAddress is required' };
    }

    if (!contractPostalCode) {
      return { payload: null, error: 'contractPostalCode is required' };
    }

    if (!POSTAL_CODE_REGEX.test(contractPostalCode)) {
      return { payload: null, error: 'contractPostalCode format is invalid' };
    }

    if (!consentOffer) {
      return { payload: null, error: `consentOffer must be true for ${source.leadType}` };
    }
  }

  if (source.leadType === 'mentorship_application') {
    if (source.planId !== 'mentorship') {
      return { payload: null, error: 'mentorship_application requires mentorship plan' };
    }

    if (currency !== null) {
      return { payload: null, error: 'mentorship_application currency must be null' };
    }

    payerType = null;
  }

  return {
    payload: {
      leadType: source.leadType,
      planId: source.planId,
      currency,
      requestedAmountEur,
      firstName,
      lastName,
      email,
      phone,
      payerType,
      comment,
      contractCountry,
      contractCity,
      contractPostalCode,
      contractAddress,
      consentOffer,
      consentPersonalData,
      consentMarketing,
      pagePath,
    },
    error: null,
  };
}

export function buildWebhookPayload(lead: Record<string, any>) {
  const planId = isPlanId(lead.plan_id) ? lead.plan_id : null;
  const price = planId ? EUR_PRICE_BY_PLAN[planId] : null;
  const paymentKind = lead.lead_type === 'eur_prepayment_application'
    ? 'prepayment'
    : lead.lead_type === 'eur_application'
      ? 'full_payment'
      : null;
  const isEurPrepaymentLead = paymentKind === 'prepayment';
  const orderNumber =
    (lead.lead_type === 'eur_application' || lead.lead_type === 'eur_prepayment_application')
      && typeof lead.invoice_order_number === 'number'
      ? lead.invoice_order_number
      : null;

  return {
    event: 'pricing_lead_submitted',
    leadId: lead.id,
    orderNumber,
    price,
    requestedAmountEur:
      typeof lead.requested_amount_eur === 'number'
        ? lead.requested_amount_eur
        : null,
    leadType: lead.lead_type,
    webhookStatus: lead.webhook_status,
    planId: lead.plan_id,
    currency: lead.currency,
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    payerType: lead.payer_type,
    comment: lead.comment,
    contractCountry: lead.contract_country,
    contractCity: lead.contract_city,
    contractPostalCode: lead.contract_postal_code,
    contractAddress: lead.contract_address,
    pagePath: lead.page_path,
    paymentKind,
    prepaymentAmountEur: isEurPrepaymentLead ? 100 : null,
    prepaymentAmountRub: isEurPrepaymentLead ? 9000 : null,
    submittedAt: lead.created_at,
  };
}

export async function deliverWebhookWithRetries(
  lead: Record<string, any>,
  maxAttempts: number = MAX_WEBHOOK_ATTEMPTS,
  webhookEnvName: string,
  webhookUrlOverride?: string
): Promise<WebhookDeliveryResult> {
  const webhookUrl = webhookUrlOverride || getOptionalServerEnv(webhookEnvName);

  if (!webhookUrl) {
    return {
      delivered: false,
      attempts: 0,
      lastError: `${webhookEnvName} is not configured`,
    };
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildWebhookPayload(lead)),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });

      if (response.ok) {
        return {
          delivered: true,
          attempts: attempt,
          lastError: null,
        };
      }

      const errorBody = await response.text();
      lastError = `Webhook HTTP ${response.status}${errorBody ? `: ${errorBody}` : ''}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown webhook error';
    }
  }

  return {
    delivered: false,
    attempts: maxAttempts,
    lastError,
  };
}
