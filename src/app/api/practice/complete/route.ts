import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    // Get all answers for final stats
    const { data: answers } = await supabase
      .from('practice_answers')
      .select('*')
      .eq('session_id', sessionId);

    const totalQuestions = session.question_ids?.length || 0;
    const answeredCount = answers?.length || 0;
    const correctCount = answers?.filter(a => a.is_correct).length || 0;
    const totalTimeSpent = answers?.reduce((sum, a) => sum + (a.time_spent || 0), 0) || 0;

    // Update session as completed
    const { data: updatedSession, error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        status: 'completed',
        completed_at: serverTime,
        correct_count: correctCount,
        total_time_spent: totalTimeSpent
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing session:', updateError);
      return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
    }

    const percentageScore = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      serverTime,
      stats: {
        totalQuestions,
        answeredCount,
        correctCount,
        percentageScore,
        totalTimeSpent
      },
      session: updatedSession
    });
  } catch (error) {
    console.error('Error in practice/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
