import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

// GET - Get single template with sections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    const { data: template, error } = await supabase
      .from('test_templates')
      .select(`
        *,
        template_sections(*)
      `)
      .eq('id', id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      template: {
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
          }))
      }
    });
  } catch (error) {
    console.error('Error in admin/templates/[id] GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
    const { name, description, timeLimitSeconds, isActive, sections } = body;

    // Update template
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (timeLimitSeconds !== undefined) updateData.time_limit_seconds = timeLimitSeconds;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error: templateError } = await supabase
      .from('test_templates')
      .update(updateData)
      .eq('id', id);

    if (templateError) {
      console.error('Error updating template:', templateError);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    // Update sections if provided
    if (sections !== undefined) {
      // Delete existing sections
      await supabase
        .from('template_sections')
        .delete()
        .eq('template_id', id);

      // Insert new sections
      if (sections.length > 0) {
        const sectionsToInsert = sections.map((section: any, index: number) => ({
          template_id: id,
          section_index: index,
          name: section.name || `Section ${index + 1}`,
          time_limit_seconds: section.timeLimitSeconds || null,
          question_ids: section.questionIds || []
        }));

        const { error: sectionsError } = await supabase
          .from('template_sections')
          .insert(sectionsToInsert);

        if (sectionsError) {
          console.error('Error updating sections:', sectionsError);
          return NextResponse.json({ error: 'Failed to update sections' }, { status: 500 });
        }
      }
    }

    // Fetch updated template
    const { data: template } = await supabase
      .from('test_templates')
      .select(`
        *,
        template_sections(*)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      template: {
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
            sectionIndex: s.section_index,
            name: s.name,
            timeLimitSeconds: s.time_limit_seconds,
            questionIds: s.question_ids || []
          }))
      }
    });
  } catch (error) {
    console.error('Error in admin/templates/[id] PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // Check if template is used by any attempts
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('id')
      .eq('template_id', id)
      .limit(1);

    if (attempts && attempts.length > 0) {
      // Just deactivate instead of delete
      await supabase
        .from('test_templates')
        .update({ is_active: false })
        .eq('id', id);

      return NextResponse.json({
        success: true,
        message: 'Template deactivated (has existing attempts)'
      });
    }

    // Delete template (sections will cascade)
    const { error } = await supabase
      .from('test_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin/templates/[id] DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
