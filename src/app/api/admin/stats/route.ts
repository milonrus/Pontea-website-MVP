import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

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

    // Get counts for various entities
    const [
      { count: totalUsers },
      { count: totalQuestions },
      { count: activeQuestions },
      { count: totalTestAttempts },
      { count: completedTestAttempts },
      { count: totalPracticeSessions },
      { count: completedPracticeSessions }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('test_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('test_attempts').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('practice_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('practice_sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed')
    ]);

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      { count: newUsersWeek },
      { count: testAttemptsWeek },
      { count: practiceSessionsWeek }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      supabase.from('test_attempts').select('*', { count: 'exact', head: true })
        .gte('started_at', weekAgo.toISOString()),
      supabase.from('practice_sessions').select('*', { count: 'exact', head: true })
        .gte('started_at', weekAgo.toISOString())
    ]);

    // Get questions by subject
    const { data: questionsBySubject } = await supabase
      .from('questions')
      .select('subject_id')
      .eq('is_active', true);

    const subjectCounts: Record<string, number> = {};
    questionsBySubject?.forEach(q => {
      const subjectId = q.subject_id || 'unknown';
      subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1;
    });

    // Get average scores for completed tests
    const { data: completedTests } = await supabase
      .from('test_attempts')
      .select('percentage_score')
      .eq('status', 'completed')
      .not('percentage_score', 'is', null);

    const avgTestScore = completedTests && completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, t) => sum + (t.percentage_score || 0), 0) / completedTests.length)
      : 0;

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalQuestions: totalQuestions || 0,
        activeQuestions: activeQuestions || 0,
        totalTestAttempts: totalTestAttempts || 0,
        completedTestAttempts: completedTestAttempts || 0,
        totalPracticeSessions: totalPracticeSessions || 0,
        completedPracticeSessions: completedPracticeSessions || 0,
        avgTestScore
      },
      weeklyActivity: {
        newUsers: newUsersWeek || 0,
        testAttempts: testAttemptsWeek || 0,
        practiceSessions: practiceSessionsWeek || 0
      },
      questionsBySubject: subjectCounts
    });
  } catch (error) {
    console.error('Error in admin/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
