import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  MAX_WEBHOOK_ATTEMPTS,
  deliverWebhookWithRetries,
  validateAndNormalizeLeadPayload,
} from './shared';
const PRICING_PAYMENT_INTENT_WEBHOOK_ENV = 'PRICING_PAYMENT_INTENT_WEBHOOK_URL';
const PRICING_EUR_INVOICE_WEBHOOK_ENV = 'PRICING_EUR_INVOICE_WEBHOOK_URL';
const PRICING_MENTORSHIP_APPLICATION_WEBHOOK_ENV = 'PRICING_MENTORSHIP_APPLICATION_WEBHOOK_URL';

const BACKWARD_COMPAT_OPTIONAL_COLUMNS = [
  'consent_offer',
  'contract_country',
  'contract_city',
  'contract_postal_code',
  'contract_address',
] as const;

type CompatibilityColumn = (typeof BACKWARD_COMPAT_OPTIONAL_COLUMNS)[number];
const ORDER_NUMBER_SCHEMA_ERROR_TOKENS = [
  'invoice_order_number',
  'invoice_order_counter',
  'assign_invoice_order_number',
  'trg_assign_invoice_order_number',
] as const;
const ORDER_NUMBER_SCHEMA_REQUIRED_MESSAGE = 'schema migration required';

const getErrorText = (error: unknown): string =>
  [
    (error as { message?: string } | null)?.message,
    (error as { details?: string } | null)?.details,
    (error as { hint?: string } | null)?.hint,
  ]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .toLowerCase();

const getSchemaRequiredErrorMessage = (detail: string) =>
  process.env.NODE_ENV === 'production'
    ? ORDER_NUMBER_SCHEMA_REQUIRED_MESSAGE
    : `${ORDER_NUMBER_SCHEMA_REQUIRED_MESSAGE}: ${detail}`;

const getMissingColumnNames = (error: unknown): CompatibilityColumn[] => {
  const text = getErrorText(error);

  return BACKWARD_COMPAT_OPTIONAL_COLUMNS.filter((columnName) => text.includes(columnName));
};

const hasOrderNumberSchemaError = (error: unknown) => {
  const text = getErrorText(error);
  return ORDER_NUMBER_SCHEMA_ERROR_TOKENS.some((token) => text.includes(token));
};

const omitColumns = <T extends Record<string, any>>(payload: T, columns: CompatibilityColumn[]) => {
  const next = { ...payload };
  columns.forEach((columnName) => {
    delete next[columnName];
  });
  return next;
};

const extractOrderNumber = (lead: Record<string, any>): number | null =>
  typeof lead.invoice_order_number === 'number' ? lead.invoice_order_number : null;

async function ensureInvoiceOrderSchemaReady(supabase: any): Promise<string | null> {
  const columnCheck = await supabase
    .from('pricing_leads')
    .select('invoice_order_number')
    .limit(1);

  if (columnCheck.error) {
    return columnCheck.error.message || 'invoice_order_number column is not accessible';
  }

  const counterCheck = await supabase
    .from('invoice_order_counter')
    .select('last_value')
    .eq('singleton', true)
    .maybeSingle();

  if (counterCheck.error) {
    return counterCheck.error.message || 'invoice_order_counter is not accessible';
  }

  if (!counterCheck.data || typeof counterCheck.data.last_value !== 'number') {
    return 'invoice_order_counter row is missing';
  }

  return null;
}

async function findRecentDuplicateLeadId(supabase: any, phone: string): Promise<string | null> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('pricing_leads')
    .select('id')
    .eq('phone', phone)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Failed to lookup duplicate pricing lead:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0].id;
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { payload, error } = validateAndNormalizeLeadPayload(body);

    if (error || !payload) {
      return NextResponse.json(
        { error: error || 'Invalid payload' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const isEurLead = payload.leadType === 'eur_application';
    if (isEurLead) {
      const schemaError = await ensureInvoiceOrderSchemaReady(supabase);
      if (schemaError) {
        return NextResponse.json(
          { error: getSchemaRequiredErrorMessage(schemaError) },
          { status: 500 }
        );
      }
    }

    const duplicateLeadId = await findRecentDuplicateLeadId(supabase, payload.phone);
    const now = new Date().toISOString();

    const insertPayload = {
      lead_type: payload.leadType,
      status: 'captured',
      plan_id: payload.planId,
      currency: payload.currency,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      payer_type: payload.payerType,
      messenger_type: payload.messengerType,
      messenger_handle: payload.messengerHandle,
      comment: payload.comment,
      contract_country: payload.contractCountry,
      contract_city: payload.contractCity,
      contract_postal_code: payload.contractPostalCode,
      contract_address: payload.contractAddress,
      consent_offer: payload.consentOffer,
      consent_personal_data: payload.consentPersonalData,
      consent_marketing: payload.consentMarketing,
      cta_label: payload.ctaLabel,
      page_path: payload.pagePath,
      referrer: payload.referrer,
      utm_source: payload.utmSource,
      utm_medium: payload.utmMedium,
      utm_campaign: payload.utmCampaign,
      utm_term: payload.utmTerm,
      utm_content: payload.utmContent,
      is_duplicate: !!duplicateLeadId,
      duplicate_of: duplicateLeadId,
      webhook_attempts: 0,
      webhook_last_error: null,
      webhook_delivered_at: null,
      created_at: now,
      updated_at: now,
    };

    let { data: lead, error: insertError } = await supabase
      .from('pricing_leads')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      const missingColumns = getMissingColumnNames(insertError);

      if (missingColumns.length > 0) {
        const fallbackPayload = omitColumns(insertPayload, missingColumns);
        const retryInsert = await supabase
          .from('pricing_leads')
          .insert(fallbackPayload)
          .select('*')
          .single();

        lead = retryInsert.data;
        insertError = retryInsert.error;
      }
    }

    if (insertError && isEurLead && hasOrderNumberSchemaError(insertError)) {
      return NextResponse.json(
        {
          error: getSchemaRequiredErrorMessage(
            insertError.message || 'failed to assign invoice order number'
          ),
        },
        { status: 500 }
      );
    }

    if (insertError || !lead) {
      console.error('Failed to create pricing lead:', insertError);
      const responseError =
        isEurLead && hasOrderNumberSchemaError(insertError)
          ? getSchemaRequiredErrorMessage(insertError?.message || 'failed to assign invoice order number')
          : process.env.NODE_ENV === 'production'
            ? 'Failed to save pricing lead'
            : `Failed to save pricing lead: ${insertError?.message || 'unknown database error'}`;
      return NextResponse.json(
        { error: responseError },
        { status: 500 }
      );
    }

    const orderNumber = extractOrderNumber(lead);
    if (isEurLead && orderNumber === null) {
      const { error: cleanupError } = await supabase
        .from('pricing_leads')
        .delete()
        .eq('id', lead.id);

      if (cleanupError) {
        console.error('Failed to cleanup eur lead without order number:', cleanupError);
      }

      return NextResponse.json(
        {
          error: getSchemaRequiredErrorMessage(
            'invoice_order_number was not assigned by trigger'
          ),
        },
        { status: 500 }
      );
    }

    if (payload.leadType === 'rub_intent') {
      const webhookResult = await deliverWebhookWithRetries(
        lead,
        MAX_WEBHOOK_ATTEMPTS,
        PRICING_PAYMENT_INTENT_WEBHOOK_ENV
      );

      const rubWebhookStatusUpdate = webhookResult.delivered
        ? {
            status: 'webhook_delivered',
            webhook_attempts: webhookResult.attempts,
            webhook_last_error: null,
            webhook_delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            status: 'failed_webhook',
            webhook_attempts: webhookResult.attempts,
            webhook_last_error: webhookResult.lastError,
            webhook_delivered_at: null,
            updated_at: new Date().toISOString(),
          };

      const { error: rubUpdateError } = await supabase
        .from('pricing_leads')
        .update(rubWebhookStatusUpdate)
        .eq('id', lead.id);

      if (rubUpdateError) {
        console.error('Failed to update rub_intent webhook status:', rubUpdateError);
      }

      return NextResponse.json({
        success: true,
        leadId: lead.id,
        orderNumber,
      });
    }

    const webhookEnvName =
      payload.leadType === 'eur_application'
        ? PRICING_EUR_INVOICE_WEBHOOK_ENV
        : PRICING_MENTORSHIP_APPLICATION_WEBHOOK_ENV;
    const webhookResult = await deliverWebhookWithRetries(
      lead,
      MAX_WEBHOOK_ATTEMPTS,
      webhookEnvName
    );

    if (!webhookResult.delivered) {
      const { error: updateError } = await supabase
        .from('pricing_leads')
        .update({
          status: 'failed_webhook',
          webhook_attempts: webhookResult.attempts,
          webhook_last_error: webhookResult.lastError,
          webhook_delivered_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error('Failed to set failed_webhook status:', updateError);
      }

      return NextResponse.json(
        {
          error: 'Заявка сохранена, но не удалось отправить уведомление. Нажмите "Повторить отправку".',
          leadId: lead.id,
          orderNumber,
        },
        { status: 502 }
      );
    }

    const { error: deliveredUpdateError } = await supabase
      .from('pricing_leads')
      .update({
        status: 'webhook_delivered',
        webhook_attempts: webhookResult.attempts,
        webhook_last_error: null,
        webhook_delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    if (deliveredUpdateError) {
      console.error('Failed to set webhook_delivered status:', deliveredUpdateError);
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      orderNumber,
    });
  } catch (error) {
    console.error('Pricing lead submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
