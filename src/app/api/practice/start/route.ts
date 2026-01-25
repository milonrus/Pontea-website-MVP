import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subjectId, topicId, difficulty, count = 10 } = body;

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Build query for questions
    let query = supabase
      .from('questions')
      .select('id')
      .eq('is_active', true);

    if (subjectId && subjectId !== 'all') {
      query = query.eq('subject_id', subjectId);
    }
    if (topicId) {
      query = query.eq('topic_id', topicId);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: questions, error: questionsError } = await query.limit(count * 3); // Get extra for randomization

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found matching filters' }, { status: 404 });
    }

    // Randomize and limit to count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selectedQuestionIds = shuffled.slice(0, count).map(q => q.id);

    // Create practice session
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        filters: { subjectId, topicId, difficulty, count },
        question_ids: selectedQuestionIds,
        status: 'in_progress',
        started_at: serverTime,
        current_index: 0,
        correct_count: 0,
        total_time_spent: 0
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating practice session:', sessionError);
      return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      serverTime,
      questionIds: selectedQuestionIds,
      session
    });
  } catch (error) {
    console.error('Error in practice/start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
