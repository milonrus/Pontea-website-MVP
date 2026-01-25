import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

// GET - List questions with pagination and filters
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' });

    if (subjectId) query = query.eq('subject_id', subjectId);
    if (topicId) query = query.eq('topic_id', topicId);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (search) query = query.ilike('question_text', `%${search}%`);

    const { data: questions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in admin/questions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new question
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
    const {
      subjectId,
      topicId,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      tags,
      questionImageUrl,
      explanationImageUrl
    } = body;

    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        subject_id: subjectId,
        topic_id: topicId,
        question_text: questionText,
        options,
        correct_answer: correctAnswer,
        explanation,
        difficulty: difficulty || 'medium',
        tags: tags || [],
        question_image_url: questionImageUrl,
        explanation_image_url: explanationImageUrl,
        created_by: user.id,
        is_active: true,
        stats: { totalAttempts: 0, correctCount: 0, totalTimeSpent: 0 }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error in admin/questions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a question
export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {};
    if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
    if (updates.topicId !== undefined) dbUpdates.topic_id = updates.topicId;
    if (updates.questionText !== undefined) dbUpdates.question_text = updates.questionText;
    if (updates.options !== undefined) dbUpdates.options = updates.options;
    if (updates.correctAnswer !== undefined) dbUpdates.correct_answer = updates.correctAnswer;
    if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.questionImageUrl !== undefined) dbUpdates.question_image_url = updates.questionImageUrl;
    if (updates.explanationImageUrl !== undefined) dbUpdates.explanation_image_url = updates.explanationImageUrl;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    dbUpdates.updated_at = new Date().toISOString();

    const { data: question, error } = await supabase
      .from('questions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating question:', error);
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error in admin/questions PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a question
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin/questions DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
