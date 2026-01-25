import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, filters } = body;

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Create test attempt
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        template_id: templateId || null,
        filters: filters || {},
        status: 'in_progress',
        started_at: serverTime,
        server_start_time: serverTime,
        current_section_index: 0,
        current_question_index: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test attempt:', error);
      return NextResponse.json({ error: 'Failed to create test attempt' }, { status: 500 });
    }

    return NextResponse.json({
      attemptId: attempt.id,
      serverTime,
      attempt
    });
  } catch (error) {
    console.error('Error in test/start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
