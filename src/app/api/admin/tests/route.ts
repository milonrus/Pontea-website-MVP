import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

// GET - List test templates
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

    const { data: templates, error } = await supabase
      .from('test_templates')
      .select(`
        *,
        test_sections(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching test templates:', error);
      return NextResponse.json({ error: 'Failed to fetch test templates' }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in admin/tests GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new test template
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
    const { name, description, totalTimeMinutes, sections, isActive } = body;

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('test_templates')
      .insert({
        name,
        description,
        total_time_minutes: totalTimeMinutes,
        is_active: isActive !== false,
        created_by: user.id
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating test template:', templateError);
      return NextResponse.json({ error: 'Failed to create test template' }, { status: 500 });
    }

    // Create sections if provided
    if (sections && sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        template_id: template.id,
        name: section.name,
        description: section.description,
        time_limit_minutes: section.timeLimitMinutes,
        question_count: section.questionCount,
        subject_id: section.subjectId,
        difficulty_distribution: section.difficultyDistribution,
        order_index: index
      }));

      const { error: sectionsError } = await supabase
        .from('test_sections')
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error('Error creating test sections:', sectionsError);
        // Don't fail the whole operation, template was created
      }
    }

    // Fetch complete template with sections
    const { data: completeTemplate } = await supabase
      .from('test_templates')
      .select(`
        *,
        test_sections(*)
      `)
      .eq('id', template.id)
      .single();

    return NextResponse.json({ template: completeTemplate });
  } catch (error) {
    console.error('Error in admin/tests POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a test template
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
    const { id, name, description, totalTimeMinutes, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (totalTimeMinutes !== undefined) updates.total_time_minutes = totalTimeMinutes;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: template, error } = await supabase
      .from('test_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating test template:', error);
      return NextResponse.json({ error: 'Failed to update test template' }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in admin/tests PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a test template
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
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // Delete sections first (cascade)
    await supabase
      .from('test_sections')
      .delete()
      .eq('template_id', id);

    // Delete template
    const { error } = await supabase
      .from('test_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting test template:', error);
      return NextResponse.json({ error: 'Failed to delete test template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin/tests DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
