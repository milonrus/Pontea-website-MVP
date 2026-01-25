import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

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

    // Calculate score with +1/-0.25/0 scoring
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const totalQuestions = answers?.length || 0;

    answers?.forEach(answer => {
      if (answer.selected_answer === null) {
        unansweredCount++;
      } else if (answer.is_correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    // Score: +1 for correct, -0.25 for incorrect, 0 for unanswered
    const rawScore = correctCount - (incorrectCount * 0.25);
    const maxScore = totalQuestions;
    const percentageScore = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

    // Calculate total time spent
    const totalTimeSpent = answers?.reduce((sum, a) => sum + (a.time_spent || 0), 0) || 0;

    // Update attempt as completed
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('test_attempts')
      .update({
        status: 'completed',
        completed_at: serverTime,
        score: rawScore,
        percentage_score: percentageScore,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
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
        raw: rawScore,
        percentage: percentageScore,
        correct: correctCount,
        incorrect: incorrectCount,
        unanswered: unansweredCount,
        total: totalQuestions
      },
      attempt: updatedAttempt
    });
  } catch (error) {
    console.error('Error in test/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
