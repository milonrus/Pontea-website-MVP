const LEAD_TYPES = ['rub_intent', 'eur_application', 'mentorship_application'] as const;
const PLAN_IDS = ['foundation', 'advanced', 'mentorship'] as const;
const CURRENCIES = ['RUB', 'EUR'] as const;
const PAYER_TYPES = ['individual', 'legal_entity'] as const;
const MESSENGER_TYPES = ['telegram', 'whatsapp'] as const;

const EUR_PRICE_BY_PLAN: Record<PlanId, number> = {
  foundation: 890,
  advanced: 1490,
  mentorship: 3490,
};

const RUB_PRICE_BY_PLAN: Record<PlanId, number> = {
  foundation: 82000,
  advanced: 137000,
  mentorship: 321000,
};

export const MAX_WEBHOOK_ATTEMPTS = 3;
const DEFAULT_PRICING_LEAD_WEBHOOK_URL =
  'https://shumiha.app.n8n.cloud/webhook/ab0e94db-b8ed-40f7-aa3f-2d0b55200c38';

export type LeadType = (typeof LEAD_TYPES)[number];
export type PlanId = (typeof PLAN_IDS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type PayerType = (typeof PAYER_TYPES)[number];
export type MessengerType = (typeof MESSENGER_TYPES)[number];

export interface NormalizedPricingLeadPayload {
  leadType: LeadType;
  planId: PlanId;
  currency: Currency | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  payerType: PayerType | null;
  messengerType: MessengerType | null;
  messengerHandle: string | null;
  comment: string | null;
  contractCountry: string | null;
  contractCity: string | null;
  contractPostalCode: string | null;
  contractAddress: string | null;
  consentOffer: boolean;
  consentPersonalData: boolean;
  consentMarketing: boolean;
  ctaLabel: string;
  pagePath: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
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

const isMessengerType = (value: unknown): value is MessengerType =>
  typeof value === 'string' && MESSENGER_TYPES.includes(value as MessengerType);

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

  const ctaLabel = normalizeText(source.ctaLabel);
  if (!ctaLabel) {
    return { payload: null, error: 'ctaLabel is required' };
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
  const payerTypeRaw = source.payerType;
  const messengerTypeRaw = source.messengerType;
  const messengerHandle = normalizeText(source.messengerHandle);

  let payerType: PayerType | null = null;
  if (payerTypeRaw !== undefined && payerTypeRaw !== null) {
    if (!isPayerType(payerTypeRaw)) {
      return { payload: null, error: 'Invalid payerType' };
    }

    payerType = payerTypeRaw;
  }

  let messengerType: MessengerType | null = null;
  if (messengerTypeRaw !== undefined && messengerTypeRaw !== null && messengerTypeRaw !== '') {
    if (!isMessengerType(messengerTypeRaw)) {
      return { payload: null, error: 'Invalid messengerType' };
    }

    messengerType = messengerTypeRaw;
  }

  if (messengerHandle && !messengerType) {
    return { payload: null, error: 'messengerType is required when messengerHandle is provided' };
  }

  const comment = normalizeText(source.comment);
  const contractCountry = normalizeText(source.contractCountry);
  const contractCity = normalizeText(source.contractCity);
  const contractPostalCode = normalizeText(source.contractPostalCode);
  const contractAddress = normalizeText(source.contractAddress);
  const referrer = normalizeText(source.referrer);
  const utmSource = normalizeText(source.utmSource);
  const utmMedium = normalizeText(source.utmMedium);
  const utmCampaign = normalizeText(source.utmCampaign);
  const utmTerm = normalizeText(source.utmTerm);
  const utmContent = normalizeText(source.utmContent);
  const currency = isCurrency(source.currency) ? source.currency : null;

  if (source.leadType === 'rub_intent') {
    if (source.planId !== 'foundation' && source.planId !== 'advanced') {
      return { payload: null, error: 'rub_intent supports only foundation and advanced' };
    }

    if (currency !== 'RUB') {
      return { payload: null, error: 'rub_intent currency must be RUB' };
    }
  }

  if (source.leadType === 'eur_application') {
    if (source.planId !== 'foundation' && source.planId !== 'advanced') {
      return { payload: null, error: 'eur_application supports only foundation and advanced' };
    }

    if (currency !== 'EUR') {
      return { payload: null, error: 'eur_application currency must be EUR' };
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
      return { payload: null, error: 'consentOffer must be true for eur_application' };
    }
  }

  if (source.leadType === 'mentorship_application') {
    if (source.planId !== 'mentorship') {
      return { payload: null, error: 'mentorship_application requires mentorship plan' };
    }

    if (currency !== null) {
      return { payload: null, error: 'mentorship_application currency must be null' };
    }
  }

  return {
    payload: {
      leadType: source.leadType,
      planId: source.planId,
      currency,
      firstName,
      lastName,
      email,
      phone,
      payerType,
      messengerType,
      messengerHandle,
      comment,
      contractCountry,
      contractCity,
      contractPostalCode,
      contractAddress,
      consentOffer,
      consentPersonalData,
      consentMarketing,
      ctaLabel,
      pagePath,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    },
    error: null,
  };
}

export function buildWebhookPayload(lead: Record<string, any>) {
  const event =
    lead.lead_type === 'rub_intent'
      ? 'pricing_payment_intent'
      : 'pricing_lead_submitted';
  const planId = isPlanId(lead.plan_id) ? lead.plan_id : null;
  const price =
    planId && lead.currency === 'EUR'
      ? EUR_PRICE_BY_PLAN[planId]
      : planId && lead.currency === 'RUB'
        ? RUB_PRICE_BY_PLAN[planId]
        : null;
  const orderNumber =
    lead.lead_type === 'eur_application' && typeof lead.invoice_order_number === 'number'
      ? lead.invoice_order_number
      : null;

  return {
    event,
    leadId: lead.id,
    orderNumber,
    price,
    leadType: lead.lead_type,
    status: lead.status,
    planId: lead.plan_id,
    currency: lead.currency,
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    payerType: lead.payer_type,
    messengerType: lead.messenger_type,
    messengerHandle: lead.messenger_handle,
    comment: lead.comment,
    contractCountry: lead.contract_country,
    contractCity: lead.contract_city,
    contractPostalCode: lead.contract_postal_code,
    contractAddress: lead.contract_address,
    consentOffer: lead.consent_offer,
    consentPersonalData: lead.consent_personal_data,
    consentMarketing: lead.consent_marketing,
    ctaLabel: lead.cta_label,
    pagePath: lead.page_path,
    referrer: lead.referrer,
    utmSource: lead.utm_source,
    utmMedium: lead.utm_medium,
    utmCampaign: lead.utm_campaign,
    utmTerm: lead.utm_term,
    utmContent: lead.utm_content,
    isDuplicate: lead.is_duplicate,
    duplicateOf: lead.duplicate_of,
    submittedAt: lead.created_at,
  };
}

export async function deliverWebhookWithRetries(
  lead: Record<string, any>,
  maxAttempts: number = MAX_WEBHOOK_ATTEMPTS,
  webhookUrlOverride?: string,
  webhookEnvName: string = 'PRICING_LEAD_WEBHOOK_URL'
): Promise<WebhookDeliveryResult> {
  const webhookUrl =
    webhookUrlOverride ||
    process.env.PRICING_LEAD_WEBHOOK_URL ||
    DEFAULT_PRICING_LEAD_WEBHOOK_URL;

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
        signal: AbortSignal.timeout(5000),
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
