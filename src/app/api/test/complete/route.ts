import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';
import { calculateScore } from '@/lib/test/scoring';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Verify attempt belongs to user
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status === 'completed') {
      return NextResponse.json({ error: 'Attempt already completed' }, { status: 400 });
    }

    // Get all answers for scoring
    const { data: answers } = await supabase
      .from('attempt_questions')
      .select('*')
      .eq('attempt_id', attemptId);

    // Use actual total from attempt.question_ids (handles missing rows from unanswered questions)
    const totalQuestions = attempt.question_ids?.length || 0;

    // Convert DB format to AttemptQuestion format for calculateScore function
    const convertedAnswers = (answers || []).map((answer: any) => ({
      id: answer.id,
      attemptId: answer.attempt_id,
      questionId: answer.question_id,
      selectedAnswer: answer.selected_answer,
      isCorrect: answer.is_correct,
      timeSpent: answer.time_spent || 0
    }));

    // Calculate score using the proper scoring function (accounts for unanswered questions)
    const scoreResult = calculateScore(convertedAnswers, totalQuestions);

    // Calculate total time spent
    const totalTimeSpent = answers?.reduce((sum, a) => sum + (a.time_spent || 0), 0) || 0;

    // Update attempt as completed
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('test_attempts')
      .update({
        status: 'completed',
        completed_at: serverTime,
        score: scoreResult.raw,
        percentage_score: scoreResult.percentage,
        correct_count: scoreResult.correct,
        incorrect_count: scoreResult.incorrect,
        unanswered_count: scoreResult.unanswered,
        total_time_spent: totalTimeSpent
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing attempt:', updateError);
      return NextResponse.json({ error: 'Failed to complete attempt' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      serverTime,
      score: {
        raw: scoreResult.raw,
        percentage: scoreResult.percentage,
        correct: scoreResult.correct,
        incorrect: scoreResult.incorrect,
        unanswered: scoreResult.unanswered,
        total: totalQuestions
      },
      attempt: updatedAttempt
    });
  } catch (error) {
    console.error('Error in test/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
