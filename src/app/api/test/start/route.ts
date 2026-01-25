import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

interface TemplateSection {
  id: string;
  section_index: number;
  name: string;
  time_limit_seconds: number | null;
  question_ids: string[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, filters, timeLimitSeconds, sectionTimeLimits } = body;

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // If templateId provided, fetch template and create template-based test
    if (templateId) {
      // Fetch template with sections
      const { data: template, error: templateError } = await supabase
        .from('test_templates')
        .select(`
          *,
          template_sections(*)
        `)
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        console.error('Error fetching template:', templateError);
        return NextResponse.json({ error: 'Template not found or inactive' }, { status: 404 });
      }

      // Sort sections by index
      const sections: TemplateSection[] = (template.template_sections || [])
        .sort((a: any, b: any) => a.section_index - b.section_index);

      if (sections.length === 0) {
        return NextResponse.json({ error: 'Template has no sections' }, { status: 400 });
      }

      // Collect all question IDs from all sections
      const allQuestionIds: string[] = [];
      const questionSectionMap: Map<string, number> = new Map();

      sections.forEach((section, idx) => {
        (section.question_ids || []).forEach((qId: string) => {
          allQuestionIds.push(qId);
          questionSectionMap.set(qId, idx);
        });
      });

      if (allQuestionIds.length === 0) {
        return NextResponse.json({ error: 'Template has no questions' }, { status: 400 });
      }

      // Create test attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('test_attempts')
        .insert({
          user_id: user.id,
          template_id: templateId,
          filters: {},
          status: 'in_progress',
          started_at: serverTime,
          server_start_time: serverTime,
          current_section_index: 0,
          current_question_index: 0,
          time_limit_seconds: template.time_limit_seconds || null,
          question_ids: allQuestionIds
        })
        .select()
        .single();

      if (attemptError) {
        console.error('Error creating test attempt:', attemptError);
        return NextResponse.json({ error: 'Failed to create test attempt' }, { status: 500 });
      }

      // Create attempt_sections for all sections
      const attemptSections = sections.map((section, index) => ({
        attempt_id: attempt.id,
        section_index: index,
        name: section.name,
        time_limit_seconds: section.time_limit_seconds,
        question_count: section.question_ids?.length || 0,
        started_at: index === 0 ? serverTime : null,
        status: index === 0 ? 'in_progress' : 'pending'
      }));

      const { error: sectionsError } = await supabase
        .from('attempt_sections')
        .insert(attemptSections);

      if (sectionsError) {
        console.error('Error creating attempt sections:', sectionsError);
        // Don't fail - sections are for tracking
      }

      // Create attempt_questions for all questions
      const attemptQuestions = allQuestionIds.map((questionId, index) => ({
        attempt_id: attempt.id,
        question_id: questionId,
        section_index: questionSectionMap.get(questionId) || 0,
        time_spent: 0
      }));

      const { error: questionsError } = await supabase
        .from('attempt_questions')
        .insert(attemptQuestions);

      if (questionsError) {
        console.error('Error creating attempt questions:', questionsError);
        // Don't fail - questions will be created on answer
      }

      // Build section config for response
      let questionIndex = 0;
      const sectionConfig = sections.map((section, index) => {
        const startIndex = questionIndex;
        const endIndex = startIndex + (section.question_ids?.length || 0) - 1;
        questionIndex = endIndex + 1;

        return {
          index,
          name: section.name,
          questionStartIndex: startIndex,
          questionEndIndex: endIndex,
          timeLimitSeconds: section.time_limit_seconds,
          questionCount: section.question_ids?.length || 0
        };
      });

      // Calculate first section remaining time
      const firstSectionTimeLimit = sections[0]?.time_limit_seconds;
      let sectionRemainingTime = null;
      if (firstSectionTimeLimit) {
        sectionRemainingTime = firstSectionTimeLimit * 1000;
      }

      return NextResponse.json({
        attemptId: attempt.id,
        serverTime,
        attempt: {
          ...attempt,
          question_ids: allQuestionIds
        },
        sectionRemainingTime,
        currentSectionIndex: 0,
        sections: sectionConfig,
        totalQuestions: allQuestionIds.length
      });
    }

    // Non-template based test (legacy flow)
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        template_id: null,
        filters: filters || {},
        status: 'in_progress',
        started_at: serverTime,
        server_start_time: serverTime,
        current_section_index: 0,
        current_question_index: 0,
        time_limit_seconds: timeLimitSeconds || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test attempt:', error);
      return NextResponse.json({ error: 'Failed to create test attempt' }, { status: 500 });
    }

    // Create first section record with started_at
    const firstSectionTimeLimit = sectionTimeLimits?.[0] || null;
    const { error: sectionError } = await supabase
      .from('attempt_sections')
      .insert({
        attempt_id: attempt.id,
        section_index: 0,
        started_at: serverTime,
        status: 'in_progress',
        time_limit_seconds: firstSectionTimeLimit
      });

    if (sectionError) {
      console.error('Error creating section record:', sectionError);
      // Continue - section tracking is not critical
    }

    // Calculate section remaining time
    let sectionRemainingTime = null;
    if (firstSectionTimeLimit) {
      sectionRemainingTime = firstSectionTimeLimit * 1000; // Fresh start = full time
    }

    return NextResponse.json({
      attemptId: attempt.id,
      serverTime,
      attempt,
      sectionRemainingTime,
      currentSectionIndex: 0
    });
  } catch (error) {
    console.error('Error in test/start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
