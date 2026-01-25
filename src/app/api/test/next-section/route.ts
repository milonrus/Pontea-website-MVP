import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, sectionTimeLimit } = body;

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const serverTime = new Date().toISOString();

    // Get current attempt with sections
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*, attempt_sections(*)')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 400 });
    }

    // Mark current section as completed
    const currentSectionIndex = attempt.current_section_index || 0;
    await supabase
      .from('attempt_sections')
      .upsert({
        attempt_id: attemptId,
        section_index: currentSectionIndex,
        completed_at: serverTime,
        status: 'completed'
      }, {
        onConflict: 'attempt_id,section_index'
      });

    // Move to next section
    const nextSectionIndex = currentSectionIndex + 1;

    // Create new section record with started_at
    const { error: newSectionError } = await supabase
      .from('attempt_sections')
      .insert({
        attempt_id: attemptId,
        section_index: nextSectionIndex,
        started_at: serverTime,
        status: 'in_progress',
        time_limit_seconds: sectionTimeLimit || null
      });

    if (newSectionError) {
      console.error('Error creating new section record:', newSectionError);
      // Continue - section tracking is not critical
    }

    const { data: updatedAttempt, error: updateError } = await supabase
      .from('test_attempts')
      .update({
        current_section_index: nextSectionIndex,
        current_question_index: 0
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      console.error('Error advancing section:', updateError);
      return NextResponse.json({ error: 'Failed to advance section' }, { status: 500 });
    }

    // Calculate section remaining time
    let sectionRemainingTime = null;
    if (sectionTimeLimit) {
      sectionRemainingTime = sectionTimeLimit * 1000; // Fresh start = full time
    }

    // Get completed sections
    const completedSections = (attempt.attempt_sections || [])
      .filter((s: any) => s.status === 'completed')
      .map((s: any) => s.section_index);
    completedSections.push(currentSectionIndex); // Add the section we just completed

    return NextResponse.json({
      success: true,
      serverTime,
      currentSectionIndex: nextSectionIndex,
      attempt: updatedAttempt,
      sectionRemainingTime,
      completedSections
    });
  } catch (error) {
    console.error('Error in test/next-section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
