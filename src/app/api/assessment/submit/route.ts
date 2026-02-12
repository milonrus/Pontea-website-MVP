import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, answers, domainResults, weakestDomains, studyPlan, roadmapOutput } = body;

    if (!email || !answers || !domainResults || !weakestDomains || !studyPlan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const shareToken = crypto.randomBytes(8).toString('base64url');

    const supabase = createServerClient();

    const { error: dbError } = await supabase
      .from('assessment_results')
      .insert({
        share_token: shareToken,
        email,
        answers,
        domain_results: domainResults,
        weakest_domains: weakestDomains,
        study_plan: studyPlan,
        roadmap_output: roadmapOutput ?? null,
        version: 3,
      });

    if (dbError) {
      console.error('Failed to insert assessment result:', dbError);
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ token: shareToken });

    // Fire webhook to N8N after response is ready (fire-and-forget)
    try {
      void fetch(
        'https://shumiha.app.n8n.cloud/webhook/f501c972-35ca-4300-83bf-dca634f20fb2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version: 3,
            email,
            answers,
            domainResults,
            weakestDomains,
            studyPlan,
            roadmapOutput,
            submittedAt: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        }
      ).catch((err) => console.error('Failed to send results to webhook:', err));
    } catch {
      // ignore webhook errors entirely
    }

    return response;
  } catch (err) {
    console.error('Assessment submit error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
