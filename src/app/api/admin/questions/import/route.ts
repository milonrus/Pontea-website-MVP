import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions array required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const questionsToInsert = questions.map(q => ({
      subject_id: q.subjectId,
      topic_id: q.topicId,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      tags: q.tags || [],
      question_image_url: q.questionImageUrl || null,
      explanation_image_url: q.explanationImageUrl || null,
      created_by: user.id,
      created_at: now,
      is_active: true,
      stats: { totalAttempts: 0, correctCount: 0, totalTimeSpent: 0 }
    }));

    const { data: insertedQuestions, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (error) {
      console.error('Error importing questions:', error);
      return NextResponse.json({ error: 'Failed to import questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: insertedQuestions?.length || 0,
      questions: insertedQuestions
    });
  } catch (error) {
    console.error('Error in admin/questions/import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
