import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, questionId, selectedAnswer, timeSpent } = body;

    if (!sessionId || !questionId) {
      return NextResponse.json({ error: 'sessionId and questionId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Verify session belongs to user and is in progress
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: 'Session is not in progress' }, { status: 400 });
    }

    const normalizedSelectedAnswer = typeof selectedAnswer === 'string' && selectedAnswer.trim()
      ? selectedAnswer.trim().toLowerCase()
      : null;

    // Get the question to check the answer
    const { data: question } = await supabase
      .from('questions')
      .select('correct_answer, explanation')
      .eq('id', questionId)
      .single();

    const normalizedCorrectAnswer = typeof question?.correct_answer === 'string' && question.correct_answer.trim()
      ? question.correct_answer.trim().toLowerCase()
      : null;
    const isCorrect = normalizedSelectedAnswer !== null
      && normalizedCorrectAnswer !== null
      && normalizedCorrectAnswer === normalizedSelectedAnswer;

    // Save the answer
    const timeSpentValue = Number.isFinite(Number(timeSpent)) ? Math.round(Number(timeSpent)) : 0;
    const { error: answerError } = await supabase
      .from('practice_answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: normalizedSelectedAnswer,
        is_correct: isCorrect,
        time_spent: timeSpentValue,
        answered_at: serverTime
      }, {
        onConflict: 'session_id,question_id'
      });

    if (answerError) {
      console.error('Error saving answer:', answerError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    // Update session progress
    const newCorrectCount = session.correct_count + (isCorrect ? 1 : 0);
    const newTimeSpent = session.total_time_spent + (timeSpent || 0);
    const newIndex = session.current_index + 1;

    await supabase
      .from('practice_sessions')
      .update({
        current_index: newIndex,
        correct_count: newCorrectCount,
        total_time_spent: newTimeSpent
      })
      .eq('id', sessionId);

    return NextResponse.json({
      success: true,
      serverTime,
      isCorrect,
      correctAnswer: question?.correct_answer,
      explanation: question?.explanation
    });
  } catch (error) {
    console.error('Error in practice/answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
