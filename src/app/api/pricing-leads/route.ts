import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  MAX_WEBHOOK_ATTEMPTS,
  deliverWebhookWithRetries,
  validateAndNormalizeLeadPayload,
} from './shared';

const PRICING_EUR_INVOICE_WEBHOOK_ENV = 'PRICING_EUR_INVOICE_WEBHOOK_URL';
const PRICING_MENTORSHIP_APPLICATION_WEBHOOK_ENV = 'PRICING_MENTORSHIP_APPLICATION_WEBHOOK_URL';
const EUR_REQUESTS_TABLE = 'eur_requests';
const CONSULTATION_REQUESTS_TABLE = 'consultation_requests';

const ORDER_NUMBER_SCHEMA_ERROR_TOKENS = [
  'eur_requests',
  'invoice_order_number',
  'invoice_order_counter',
  'assign_invoice_order_number',
  'trg_assign_invoice_order_number',
] as const;
const EUR_PREPAYMENT_SCHEMA_ERROR_TOKENS = [
  'pricing_leads_flow_check',
  'eur_requests_flow_v2_check',
  'eur_requests_flow_v3_check',
  'eur_requests_plan_id_v2_check',
  'eur_requests_plan_id_v3_check',
  'eur_requests_client_id_required_for_scoped_types',
  'pricing_leads_client_id_required_for_scoped_types',
  'trg_crm_assign_client_pricing_leads',
  'crm_resolve_or_create_client',
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

const hasOrderNumberSchemaError = (error: unknown) => {
  const text = getErrorText(error);
  return ORDER_NUMBER_SCHEMA_ERROR_TOKENS.some((token) => text.includes(token));
};

const hasEurPrepaymentSchemaError = (error: unknown) => {
  const text = getErrorText(error);
  return EUR_PREPAYMENT_SCHEMA_ERROR_TOKENS.some((token) => text.includes(token));
};

const extractOrderNumber = (lead: Record<string, any>): number | null =>
  typeof lead.invoice_order_number === 'number' ? lead.invoice_order_number : null;

const extractClientId = (lead: Record<string, any>): string | null => {
  if (typeof lead.client_id !== 'string') {
    return null;
  }

  const trimmed = lead.client_id.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function ensureInvoiceOrderSchemaReady(supabase: any): Promise<string | null> {
  const columnCheck = await supabase
    .from(EUR_REQUESTS_TABLE)
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

    const rawLeadType =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>).leadType
        : null;
    if (rawLeadType === 'rub_intent') {
      return NextResponse.json(
        { error: 'rub_intent disabled' },
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

    const isEurRequestLead =
      payload.leadType === 'eur_application'
      || payload.leadType === 'eur_prepayment_application';
    const requiresInvoiceOrderNumber = isEurRequestLead;
    const targetTable = isEurRequestLead ? EUR_REQUESTS_TABLE : CONSULTATION_REQUESTS_TABLE;
    if (requiresInvoiceOrderNumber) {
      const schemaError = await ensureInvoiceOrderSchemaReady(supabase);
      if (schemaError) {
        return NextResponse.json(
          { error: getSchemaRequiredErrorMessage(schemaError) },
          { status: 500 }
        );
      }
    }

    const now = new Date().toISOString();

    const commonInsertPayload = {
      lead_type: payload.leadType,
      webhook_status: 'captured',
      plan_id: payload.planId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      comment: payload.comment,
      page_path: payload.pagePath,
      webhook_attempts: 0,
      webhook_last_error: null,
      webhook_delivered_at: null,
      created_at: now,
      updated_at: now,
    };

    const insertPayload = isEurRequestLead
      ? {
          ...commonInsertPayload,
          currency: payload.currency,
          payer_type: payload.payerType,
          contract_country: payload.contractCountry,
          contract_city: payload.contractCity,
          contract_postal_code: payload.contractPostalCode,
          contract_address: payload.contractAddress,
        }
      : commonInsertPayload;

    const { data: lead, error: insertError } = await supabase
      .from(targetTable)
      .insert(insertPayload)
      .select('*')
      .single();
    const hasEurSchemaInsertError =
      isEurRequestLead
      && (hasEurPrepaymentSchemaError(insertError)
        || (requiresInvoiceOrderNumber && hasOrderNumberSchemaError(insertError)));

    if (insertError && hasEurSchemaInsertError) {
      return NextResponse.json(
        {
          error: getSchemaRequiredErrorMessage(
            insertError.message || 'eur request schema is outdated'
          ),
        },
        { status: 500 }
      );
    }

    if (insertError || !lead) {
      console.error(`Failed to create lead in ${targetTable}:`, insertError);
      const responseError =
        hasEurSchemaInsertError
          ? getSchemaRequiredErrorMessage(insertError?.message || 'eur request schema is outdated')
          : process.env.NODE_ENV === 'production'
            ? 'Failed to save lead'
            : `Failed to save lead: ${insertError?.message || 'unknown database error'}`;
      return NextResponse.json(
        { error: responseError },
        { status: 500 }
      );
    }

    const orderNumber = extractOrderNumber(lead);
    if (requiresInvoiceOrderNumber && orderNumber === null) {
      const { error: cleanupError } = await supabase
        .from(targetTable)
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

    const clientId = extractClientId(lead);
    if (isEurRequestLead && clientId === null) {
      const { error: cleanupError } = await supabase
        .from(targetTable)
        .delete()
        .eq('id', lead.id);

      if (cleanupError) {
        console.error('Failed to cleanup eur lead without client_id:', cleanupError);
      }

      return NextResponse.json(
        {
          error: getSchemaRequiredErrorMessage(
            'client_id was not assigned by CRM trigger'
          ),
        },
        { status: 500 }
      );
    }

    const webhookEnvName =
      payload.leadType === 'eur_application' || payload.leadType === 'eur_prepayment_application'
        ? PRICING_EUR_INVOICE_WEBHOOK_ENV
        : PRICING_MENTORSHIP_APPLICATION_WEBHOOK_ENV;
    const webhookResult = await deliverWebhookWithRetries(
      lead,
      MAX_WEBHOOK_ATTEMPTS,
      webhookEnvName
    );

    if (!webhookResult.delivered) {
      const { error: updateError } = await supabase
        .from(targetTable)
        .update({
          webhook_status: 'failed_webhook',
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
      .from(targetTable)
      .update({
        webhook_status: 'webhook_delivered',
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
