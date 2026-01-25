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

    // Get attempt with all related data
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select(`
        *,
        attempt_questions(*),
        attempt_sections(*)
      `)
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Calculate remaining time
    let remainingTime = null;
    if (attempt.time_limit_seconds && attempt.server_start_time) {
      const startTime = new Date(attempt.server_start_time).getTime();
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, attempt.time_limit_seconds * 1000 - elapsed);
    }

    return NextResponse.json({
      serverTime,
      remainingTime,
      attempt,
      questions: attempt.attempt_questions || [],
      sections: attempt.attempt_sections || []
    });
  } catch (error) {
    console.error('Error in test/resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
