import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

const mapAttempt = (attempt: any) => ({
  id: attempt.id,
  userId: attempt.user_id,
  templateId: attempt.template_id ?? undefined,
  filters: attempt.filters || {},
  status: attempt.status,
  startedAt: attempt.started_at,
  completedAt: attempt.completed_at ?? undefined,
  serverStartTime: attempt.server_start_time,
  timeLimitSeconds: attempt.time_limit_seconds ?? undefined,
  currentSectionIndex: attempt.current_section_index ?? 0,
  currentQuestionIndex: attempt.current_question_index ?? 0,
  score: attempt.score ?? undefined,
  percentageScore: attempt.percentage_score ?? undefined,
  correctCount: attempt.correct_count ?? undefined,
  incorrectCount: attempt.incorrect_count ?? undefined,
  unansweredCount: attempt.unanswered_count ?? undefined,
  totalTimeSpent: attempt.total_time_spent ?? undefined
});

const calculateTimeUsed = (startedAt?: string | null, completedAt?: string | null) => {
  if (!startedAt) return 0;
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const start = new Date(startedAt).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*, attempt_questions(*), attempt_sections(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const attemptQuestions = attempt.attempt_questions || [];
    const attemptSections = attempt.attempt_sections || [];
    const questionIds: string[] = (attempt.question_ids || []).length > 0
      ? (attempt.question_ids as string[])
      : (attemptQuestions.map((q: any) => q.question_id).filter(Boolean) as string[]);

    let questionRows: any[] = [];
    if (questionIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, question_image_url, options, correct_answer, explanation, explanation_image_url')
        .in('id', questionIds);

      if (questionsError) {
        return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
      }
      questionRows = questionsData || [];
    }

    const questionById = new Map(questionRows.map(q => [q.id, q]));
    const orderMap = new Map<string, number>(
      (questionIds || []).map((id: string, index: number) => [id, index])
    );

    const sectionIndexes = attemptSections.length > 0
      ? attemptSections.map((s: any) => s.section_index)
      : Array.from(new Set(attemptQuestions.map((q: any) => q.section_index ?? 0)));

    const sortedSectionIndexes = sectionIndexes
      .filter((index: number) => index !== undefined && index !== null)
      .sort((a: number, b: number) => a - b);

    const sections = sortedSectionIndexes.map((sectionIndex: number) => {
      const sectionRecord = attemptSections.find((s: any) => s.section_index === sectionIndex);
      const sectionQuestions = attemptQuestions
        .filter((q: any) => (q.section_index ?? 0) === sectionIndex)
        .sort((a: any, b: any) => {
          const aOrder = orderMap.get(String(a.question_id)) ?? 0;
          const bOrder = orderMap.get(String(b.question_id)) ?? 0;
          return aOrder - bOrder;
        });

      const questions = sectionQuestions.map((q: any) => {
        const question = questionById.get(q.question_id);
        return {
          questionId: q.question_id,
          questionText: question?.question_text || '',
          questionImageUrl: question?.question_image_url ?? null,
          options: question?.options || [],
          correctAnswer: question?.correct_answer || '',
          explanation: question?.explanation || '',
          explanationImageUrl: question?.explanation_image_url ?? null,
          selectedAnswer: typeof q.selected_answer === 'string' ? q.selected_answer.toLowerCase() : q.selected_answer ?? null,
          isCorrect: q.is_correct ?? null,
          timeSpent: q.time_spent || 0
        };
      });

      const correctCount = sectionQuestions.filter((q: any) => q.is_correct).length;
      const totalCount = sectionQuestions.length;
      const timeUsed = sectionRecord?.started_at
        ? calculateTimeUsed(sectionRecord?.started_at, sectionRecord?.completed_at || attempt.completed_at)
        : Math.round(sectionQuestions.reduce((sum: number, q: any) => sum + (q.time_spent || 0), 0));

      return {
        index: sectionIndex,
        name: sectionRecord?.name || `Section ${sectionIndex + 1}`,
        correctCount,
        totalCount,
        timeUsed,
        timeAllowed: sectionRecord?.time_limit_seconds ?? null,
        questions
      };
    });

    const totalQuestions = attemptQuestions.length;
    const totalCorrect = attemptQuestions.filter((q: any) => q.is_correct).length;
    const totalPercentage = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    return NextResponse.json({
      attempt: mapAttempt(attempt),
      sections,
      totalScore: {
        correct: totalCorrect,
        total: totalQuestions,
        percentage: totalPercentage
      }
    });
  } catch (error) {
    console.error('Error in test/results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
