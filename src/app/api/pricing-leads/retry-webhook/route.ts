import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { MAX_WEBHOOK_ATTEMPTS, deliverWebhookWithRetries } from '../shared';

const PRICING_EUR_INVOICE_WEBHOOK_ENV = 'PRICING_EUR_INVOICE_WEBHOOK_URL';
const PRICING_MENTORSHIP_APPLICATION_WEBHOOK_ENV = 'PRICING_MENTORSHIP_APPLICATION_WEBHOOK_URL';
const EUR_REQUESTS_TABLE = 'eur_requests';
const CONSULTATION_REQUESTS_TABLE = 'consultation_requests';

const extractOrderNumber = (lead: Record<string, any>): number | null =>
  typeof lead.invoice_order_number === 'number' ? lead.invoice_order_number : null;

type RetryLeadTable = typeof EUR_REQUESTS_TABLE | typeof CONSULTATION_REQUESTS_TABLE;

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

    const source = body as { leadId?: unknown };
    const leadId = typeof source.leadId === 'string' ? source.leadId.trim() : '';

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let table: RetryLeadTable = EUR_REQUESTS_TABLE;
    let lead: Record<string, any> | null = null;

    const pricingFetch = await supabase
      .from(EUR_REQUESTS_TABLE)
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (pricingFetch.error) {
      console.error('Failed to fetch pricing lead:', pricingFetch.error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (pricingFetch.data) {
      table = EUR_REQUESTS_TABLE;
      lead = pricingFetch.data as Record<string, any>;
    } else {
      const consultFetch = await supabase
        .from(CONSULTATION_REQUESTS_TABLE)
        .select('*')
        .eq('id', leadId)
        .maybeSingle();

      if (consultFetch.error) {
        console.error('Failed to fetch consultation lead:', consultFetch.error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }

      if (consultFetch.data) {
        table = CONSULTATION_REQUESTS_TABLE;
        lead = consultFetch.data as Record<string, any>;
      }
    }

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const orderNumber = extractOrderNumber(lead);

    if (lead.lead_type === 'rub_intent') {
      return NextResponse.json(
        { error: 'Webhook retry is not supported for rub_intent', orderNumber },
        { status: 400 }
      );
    }

    if (lead.webhook_status === 'webhook_delivered') {
      return NextResponse.json({
        success: true,
        leadId: lead.id,
        orderNumber,
        alreadyDelivered: true,
      });
    }

    const webhookEnvName =
      table === EUR_REQUESTS_TABLE
        ? PRICING_EUR_INVOICE_WEBHOOK_ENV
        : table === CONSULTATION_REQUESTS_TABLE
          ? PRICING_MENTORSHIP_APPLICATION_WEBHOOK_ENV
          : null;

    if (!webhookEnvName) {
      return NextResponse.json(
        { error: `Webhook retry is not supported for lead_type: ${lead.lead_type}` },
        { status: 400 }
      );
    }

    const webhookResult = await deliverWebhookWithRetries(
      lead,
      MAX_WEBHOOK_ATTEMPTS,
      webhookEnvName
    );
    const previousAttempts = typeof lead.webhook_attempts === 'number' ? lead.webhook_attempts : 0;
    const totalAttempts = previousAttempts + webhookResult.attempts;

    if (!webhookResult.delivered) {
      const { error: updateError } = await supabase
        .from(table)
        .update({
          webhook_status: 'failed_webhook',
          webhook_attempts: totalAttempts,
          webhook_last_error: webhookResult.lastError,
          webhook_delivered_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error('Failed to update retry failed_webhook status:', updateError);
      }

      return NextResponse.json(
        {
          error: 'Не удалось отправить webhook после повторной попытки.',
          leadId: lead.id,
          orderNumber,
        },
        { status: 502 }
      );
    }

    const { error: deliveredUpdateError } = await supabase
      .from(table)
      .update({
        webhook_status: 'webhook_delivered',
        webhook_attempts: totalAttempts,
        webhook_last_error: null,
        webhook_delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    if (deliveredUpdateError) {
      console.error('Failed to update retry webhook_delivered status:', deliveredUpdateError);
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      orderNumber,
    });
  } catch (error) {
    console.error('Retry webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
