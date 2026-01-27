import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, currentQuestionIndex, currentSectionIndex } = body;

    if (!attemptId || currentQuestionIndex === undefined || currentQuestionIndex === null) {
      return NextResponse.json(
        { error: 'attemptId and currentQuestionIndex required' },
        { status: 400 }
      );
    }

    if (typeof currentQuestionIndex !== 'number' || Number.isNaN(currentQuestionIndex)) {
      return NextResponse.json({ error: 'currentQuestionIndex must be a number' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('id, status, current_section_index, question_ids')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 400 });
    }

    const totalQuestions = attempt.question_ids?.length || 0;
    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'Attempt has no questions' }, { status: 400 });
    }

    if (currentQuestionIndex < 0 || currentQuestionIndex >= totalQuestions) {
      return NextResponse.json({ error: 'currentQuestionIndex out of range' }, { status: 400 });
    }

    if (currentSectionIndex !== undefined && currentSectionIndex > attempt.current_section_index) {
      return NextResponse.json(
        { error: 'Cannot update position for future section' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({ current_question_index: currentQuestionIndex })
      .eq('id', attemptId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating test position:', updateError);
      return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in test/position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
