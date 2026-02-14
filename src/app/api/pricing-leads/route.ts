import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  MAX_WEBHOOK_ATTEMPTS,
  deliverWebhookWithRetries,
  validateAndNormalizeLeadPayload,
} from './shared';

const DEFAULT_PAYMENT_INTENT_WEBHOOK_URL =
  'https://shumiha.app.n8n.cloud/webhook/475ee6a9-aa1a-40f3-b080-f5790f023441';

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

    const { data: lead, error: insertError } = await supabase
      .from('pricing_leads')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError || !lead) {
      console.error('Failed to create pricing lead:', insertError);
      return NextResponse.json(
        { error: 'Failed to save pricing lead' },
        { status: 500 }
      );
    }

    if (payload.leadType === 'rub_intent') {
      const paymentIntentWebhookUrl =
        process.env.PRICING_PAYMENT_INTENT_WEBHOOK_URL || DEFAULT_PAYMENT_INTENT_WEBHOOK_URL;
      const webhookResult = await deliverWebhookWithRetries(
        lead,
        MAX_WEBHOOK_ATTEMPTS,
        paymentIntentWebhookUrl,
        'PRICING_PAYMENT_INTENT_WEBHOOK_URL'
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
      });
    }

    const webhookResult = await deliverWebhookWithRetries(lead);

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
    });
  } catch (error) {
    console.error('Pricing lead submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
