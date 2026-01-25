import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

// GET - List active templates for students
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get active templates with their sections
    const { data: templates, error } = await supabase
      .from('test_templates')
      .select(`
        *,
        template_sections(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Transform and add computed fields (without exposing question IDs)
    const transformedTemplates = templates?.map(template => {
      const sections = (template.template_sections || [])
        .sort((a: any, b: any) => a.section_index - b.section_index);

      const totalQuestions = sections.reduce(
        (sum: number, s: any) => sum + (s.question_ids?.length || 0), 0
      );

      const totalSectionTime = sections.reduce(
        (sum: number, s: any) => sum + (s.time_limit_seconds || 0), 0
      );

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        timeLimitSeconds: template.time_limit_seconds,
        sectionCount: sections.length,
        totalQuestions,
        totalSectionTime,
        sections: sections.map((s: any) => ({
          name: s.name,
          questionCount: s.question_ids?.length || 0,
          timeLimitSeconds: s.time_limit_seconds
        }))
      };
    });

    return NextResponse.json({ templates: transformedTemplates });
  } catch (error) {
    console.error('Error in templates GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
