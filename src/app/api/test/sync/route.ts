import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Get current attempt state
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (error || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Calculate remaining time if there's a time limit
    let remainingTime = null;
    if (attempt.time_limit_seconds && attempt.server_start_time) {
      const startTime = new Date(attempt.server_start_time).getTime();
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, attempt.time_limit_seconds * 1000 - elapsed);
    }

    return NextResponse.json({
      serverTime,
      remainingTime,
      currentSectionIndex: attempt.current_section_index,
      currentQuestionIndex: attempt.current_question_index,
      status: attempt.status
    });
  } catch (error) {
    console.error('Error in test/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
