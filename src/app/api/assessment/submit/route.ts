import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PREFIX_REGEX = /^\+.+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      consentPersonalData,
      consentAt,
      answers,
      domainResults,
      weakestDomains,
      studyPlan,
      roadmapOutput,
    } = body;

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

    const parsedConsentAt = typeof consentAt === 'string' ? new Date(consentAt) : null;
    const normalizedConsentAt =
      parsedConsentAt && !Number.isNaN(parsedConsentAt.getTime())
        ? parsedConsentAt.toISOString()
        : '';

    const isPayloadValid =
      normalizedName.length > 0 &&
      EMAIL_REGEX.test(normalizedEmail) &&
      PHONE_PREFIX_REGEX.test(normalizedPhone) &&
      consentPersonalData === true &&
      normalizedConsentAt.length > 0 &&
      Array.isArray(answers) &&
      Array.isArray(domainResults) &&
      Array.isArray(weakestDomains) &&
      Array.isArray(studyPlan);

    if (!isPayloadValid) {
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
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        consent_personal_data: true,
        consent_at: normalizedConsentAt,
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

    const resultsUrl = `https://pontea.school/ru/results/${shareToken}`;
    const compactDomainResults = Array.isArray(domainResults)
      ? domainResults.map((result: any) => ({
          domainLabel: result?.domainLabel,
          score: result?.score,
          selfAssessmentScore: result?.selfAssessmentScore,
        }))
      : [];

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
            name: normalizedName,
            phone: normalizedPhone,
            email: normalizedEmail,
            consentPersonalData: true,
            consentAt: normalizedConsentAt,
            domainResults: compactDomainResults,
            url: resultsUrl,
            resultsUrl,
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
