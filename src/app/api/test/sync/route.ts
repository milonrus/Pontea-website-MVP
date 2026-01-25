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

    // Get current attempt state with sections
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .select('*, attempt_sections(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (error || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Calculate overall remaining time if there's a time limit
    let remainingTime = null;
    if (attempt.time_limit_seconds && attempt.server_start_time) {
      const startTime = new Date(attempt.server_start_time).getTime();
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, attempt.time_limit_seconds * 1000 - elapsed);
    }

    // Calculate section-specific remaining time
    let sectionRemainingTime = null;
    const currentSectionIndex = attempt.current_section_index || 0;
    const currentSection = (attempt.attempt_sections || []).find(
      (s: any) => s.section_index === currentSectionIndex
    );

    if (currentSection?.started_at && currentSection?.time_limit_seconds) {
      const sectionStartTime = new Date(currentSection.started_at).getTime();
      const sectionElapsed = Date.now() - sectionStartTime;
      sectionRemainingTime = Math.max(0, currentSection.time_limit_seconds * 1000 - sectionElapsed);
    }

    // Get completed sections
    const completedSections = (attempt.attempt_sections || [])
      .filter((s: any) => s.status === 'completed')
      .map((s: any) => s.section_index);

    return NextResponse.json({
      serverTime,
      remainingTime,
      sectionRemainingTime,
      currentSectionIndex: attempt.current_section_index,
      currentQuestionIndex: attempt.current_question_index,
      status: attempt.status,
      completedSections
    });
  } catch (error) {
    console.error('Error in test/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
