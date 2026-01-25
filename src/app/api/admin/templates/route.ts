import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

// GET - List all templates
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

    // Get all templates with their sections
    const { data: templates, error } = await supabase
      .from('test_templates')
      .select(`
        *,
        template_sections(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Transform and add computed fields
    const transformedTemplates = templates?.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      timeLimitSeconds: template.time_limit_seconds,
      isActive: template.is_active,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      sections: (template.template_sections || [])
        .sort((a: any, b: any) => a.section_index - b.section_index)
        .map((s: any) => ({
          id: s.id,
          templateId: s.template_id,
          sectionIndex: s.section_index,
          name: s.name,
          timeLimitSeconds: s.time_limit_seconds,
          questionIds: s.question_ids || [],
          createdAt: s.created_at
        })),
      sectionCount: template.template_sections?.length || 0,
      totalQuestions: (template.template_sections || []).reduce(
        (sum: number, s: any) => sum + (s.question_ids?.length || 0), 0
      )
    }));

    return NextResponse.json({ templates: transformedTemplates });
  } catch (error) {
    console.error('Error in admin/templates GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new template
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
    const { name, description, timeLimitSeconds, sections } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('test_templates')
      .insert({
        name,
        description: description || null,
        time_limit_seconds: timeLimitSeconds || null,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    // Create sections if provided
    if (sections && sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        template_id: template.id,
        section_index: index,
        name: section.name || `Section ${index + 1}`,
        time_limit_seconds: section.timeLimitSeconds || null,
        question_ids: section.questionIds || []
      }));

      const { error: sectionsError } = await supabase
        .from('template_sections')
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error('Error creating sections:', sectionsError);
        // Delete the template if sections failed
        await supabase.from('test_templates').delete().eq('id', template.id);
        return NextResponse.json({ error: 'Failed to create sections' }, { status: 500 });
      }
    }

    // Fetch the complete template with sections
    const { data: completeTemplate } = await supabase
      .from('test_templates')
      .select(`
        *,
        template_sections(*)
      `)
      .eq('id', template.id)
      .single();

    return NextResponse.json({
      template: {
        id: completeTemplate.id,
        name: completeTemplate.name,
        description: completeTemplate.description,
        timeLimitSeconds: completeTemplate.time_limit_seconds,
        isActive: completeTemplate.is_active,
        createdBy: completeTemplate.created_by,
        createdAt: completeTemplate.created_at,
        sections: (completeTemplate.template_sections || []).map((s: any) => ({
          id: s.id,
          sectionIndex: s.section_index,
          name: s.name,
          timeLimitSeconds: s.time_limit_seconds,
          questionIds: s.question_ids || []
        }))
      }
    });
  } catch (error) {
    console.error('Error in admin/templates POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
