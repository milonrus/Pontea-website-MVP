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

    // Calculate overall remaining time
    let remainingTime = null;
    if (attempt.time_limit_seconds && attempt.server_start_time) {
      const startTime = new Date(attempt.server_start_time).getTime();
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, attempt.time_limit_seconds * 1000 - elapsed);
    }

    // Sort attempt_sections by section_index
    const sortedSections = (attempt.attempt_sections || [])
      .sort((a: any, b: any) => a.section_index - b.section_index);

    // Calculate section-specific remaining time
    let sectionRemainingTime = null;
    const currentSectionIndex = attempt.current_section_index || 0;
    const currentSection = sortedSections.find(
      (s: any) => s.section_index === currentSectionIndex
    );

    if (currentSection?.started_at && currentSection?.time_limit_seconds) {
      const sectionStartTime = new Date(currentSection.started_at).getTime();
      const sectionElapsed = Date.now() - sectionStartTime;
      sectionRemainingTime = Math.max(0, currentSection.time_limit_seconds * 1000 - sectionElapsed);
    }

    // Get completed sections
    const completedSections = sortedSections
      .filter((s: any) => s.status === 'completed')
      .map((s: any) => s.section_index);

    // Build section config with question indices
    let questionIndex = 0;
    const sectionConfig = sortedSections.map((section: any) => {
      const questionCount = section.question_count || 0;
      const startIndex = questionIndex;
      const endIndex = startIndex + questionCount - 1;
      questionIndex = endIndex + 1;

      return {
        index: section.section_index,
        name: section.name || `Section ${section.section_index + 1}`,
        questionStartIndex: startIndex,
        questionEndIndex: Math.max(startIndex, endIndex),
        timeLimitSeconds: section.time_limit_seconds,
        questionCount,
        status: section.status,
        startedAt: section.started_at,
        completedAt: section.completed_at
      };
    });

    // Transform attempt_questions to include questionId (camelCase)
    const transformedQuestions = (attempt.attempt_questions || []).map((q: any) => ({
      id: q.id,
      attemptId: q.attempt_id,
      questionId: q.question_id,
      sectionIndex: q.section_index,
      selectedAnswer: typeof q.selected_answer === 'string' ? q.selected_answer.toLowerCase() : q.selected_answer,
      isCorrect: q.is_correct,
      timeSpent: q.time_spent || 0,
      answeredAt: q.answered_at
    }));

    return NextResponse.json({
      serverTime,
      remainingTime,
      sectionRemainingTime,
      attempt,
      questions: transformedQuestions,
      sections: sortedSections,
      sectionConfig,
      completedSections,
      currentSectionTimeLimit: currentSection?.time_limit_seconds || null,
      totalQuestions: attempt.question_ids?.length || 0
    });
  } catch (error) {
    console.error('Error in test/resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
