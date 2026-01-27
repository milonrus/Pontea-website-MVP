import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, questionId, selectedAnswer, timeSpent, questionSectionIndex } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: 'attemptId and questionId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Verify attempt belongs to user and is in progress
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*, attempt_sections(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 400 });
    }

    // Check section locking - reject answers for completed sections
    if (questionSectionIndex !== undefined) {
      const currentSectionIndex = attempt.current_section_index || 0;
      const completedSections = (attempt.attempt_sections || [])
        .filter((s: any) => s.status === 'completed')
        .map((s: any) => s.section_index);

      if (completedSections.includes(questionSectionIndex)) {
        return NextResponse.json(
          { error: 'Cannot submit answer for completed section' },
          { status: 400 }
        );
      }

      // Also reject if question is from a future section
      if (questionSectionIndex > currentSectionIndex) {
        return NextResponse.json(
          { error: 'Cannot submit answer for future section' },
          { status: 400 }
        );
      }
    }

    const normalizedSelectedAnswer = typeof selectedAnswer === 'string' && selectedAnswer.trim()
      ? selectedAnswer.trim().toUpperCase()
      : null;

    // Get the question to check the answer
    const { data: question } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single();

    const normalizedCorrectAnswer = typeof question?.correct_answer === 'string' && question.correct_answer.trim()
      ? question.correct_answer.trim().toUpperCase()
      : null;
    const isCorrect = normalizedSelectedAnswer !== null
      && normalizedCorrectAnswer !== null
      && normalizedCorrectAnswer === normalizedSelectedAnswer;

    const parsedTimeSpent = typeof timeSpent === 'number' ? timeSpent : Number(timeSpent);
    const safeTimeSpent = Number.isFinite(parsedTimeSpent)
      ? Math.round(parsedTimeSpent)
      : 0;

    // Save or update the answer
    const { data: answer, error: answerError } = await supabase
      .from('attempt_questions')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer: normalizedSelectedAnswer,
        is_correct: isCorrect,
        time_spent: safeTimeSpent,
        answered_at: serverTime
      }, {
        onConflict: 'attempt_id,question_id'
      })
      .select()
      .single();

    if (answerError) {
      console.error('Error saving answer:', answerError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      serverTime,
      isCorrect
    });
  } catch (error) {
    console.error('Error in test/answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
