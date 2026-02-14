import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { deliverWebhookWithRetries } from '../shared';

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

    const { data: lead, error: fetchError } = await supabase
      .from('pricing_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (lead.lead_type === 'rub_intent') {
      return NextResponse.json(
        { error: 'Webhook retry is not supported for rub_intent' },
        { status: 400 }
      );
    }

    if (lead.status === 'webhook_delivered') {
      return NextResponse.json({
        success: true,
        leadId: lead.id,
        alreadyDelivered: true,
      });
    }

    const webhookResult = await deliverWebhookWithRetries(lead);
    const previousAttempts = typeof lead.webhook_attempts === 'number' ? lead.webhook_attempts : 0;
    const totalAttempts = previousAttempts + webhookResult.attempts;

    if (!webhookResult.delivered) {
      const { error: updateError } = await supabase
        .from('pricing_leads')
        .update({
          status: 'failed_webhook',
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
        },
        { status: 502 }
      );
    }

    const { error: deliveredUpdateError } = await supabase
      .from('pricing_leads')
      .update({
        status: 'webhook_delivered',
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
    });
  } catch (error) {
    console.error('Retry webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
